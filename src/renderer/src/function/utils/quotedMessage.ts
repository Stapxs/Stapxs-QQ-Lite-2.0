export type QuoteFailure = 'unavailable' | 'timeout'

export type QuotedMessage = {
    message_id: string | number
    message: any[]
    [key: string]: any
}

type QuoteSession = { id: string | number; type: string; selfId?: string | number }

export type QuoteEntry = {
    status: 'loading' | 'ready' | 'error'
    message?: QuotedMessage
    failure?: QuoteFailure
}

export class QuoteRequestError extends Error {
    failure: QuoteFailure

    constructor(failure: QuoteFailure) {
        super(failure)
        this.failure = failure
    }
}

function belongsToSession(raw: any, session: QuoteSession): boolean {
    if (raw.message_type !== (session.type === 'group' ? 'group' : 'private')) return false
    if (session.type === 'group') {
        // OneBot 11 get_msg does not require group_id; validate it when an adapter supplies it.
        return raw.group_id == null || String(raw.group_id) === String(session.id)
    }
    if (session.selfId == null) return true
    const peers = [raw.user_id, raw.target_id, raw.sender.user_id]
        .filter(value => value != null && String(value) !== String(session.selfId))
    return peers.every(value => String(value) === String(session.id))
}

function validateResponse(response: any, id: string, session: QuoteSession) {
    const raw = response?.data
    if (response?.status !== 'ok' || Number(response.retcode ?? 0) !== 0 ||
        !raw || String(raw.message_id) !== id || !raw.sender || raw.time == null ||
        !Number.isFinite(Number(raw.time)) || !belongsToSession(raw, session)) {
        throw new QuoteRequestError('unavailable')
    }
    return raw
}

export async function requestQuotedMessage(options: {
    id: string
    session: QuoteSession
    action: string
    call: (action: string, params: Record<string, unknown>, timeout: number) => Promise<any>
    normalize: (message: any) => Promise<any[]>
    isActive: () => boolean
}): Promise<QuotedMessage | null> {
    if (!options.isActive()) return null
    let response: any
    try {
        const numericId = Number(options.id)
        const messageId = /^-?\d+$/.test(options.id) && Number.isSafeInteger(numericId) ? numericId : options.id
        response = await options.call(options.action, { message_id: messageId }, 10000)
    } catch (error) {
        throw new QuoteRequestError(error instanceof Error && 'echo' in error ? 'timeout' : 'unavailable')
    }
    if (!options.isActive()) return null
    const raw = validateResponse(response, options.id, options.session)
    const messages = await options.normalize(raw)
    return options.isActive() ? messages[0] : null
}

type QuoteJob = {
    id: string
    generation: number
    resolve: (message: QuotedMessage | null) => void
    promise: Promise<QuotedMessage | null>
}

/** A bounded, session-scoped cache. It never inserts results into chat history. */
export class QuotedMessageLoader {
    readonly entries = new Map<string, QuoteEntry>()
    generation = 0
    private running = 0
    private readonly queue: QuoteJob[] = []
    private readonly pending = new Map<string, Promise<QuotedMessage | null>>()
    private readonly recalledInFlight = new Set<string>()
    private readonly request: (id: string, isActive: () => boolean) => Promise<QuotedMessage | null>
    private readonly changed: () => void
    private readonly limit: number

    constructor(
        request: (id: string, isActive: () => boolean) => Promise<QuotedMessage | null>,
        changed: () => void = () => {},
        limit = 128,
    ) {
        this.request = request
        this.changed = changed
        this.limit = limit
    }

    reset() {
        this.generation++
        this.entries.clear()
        this.pending.clear()
        this.recalledInFlight.clear()
        for (const job of this.queue.splice(0)) job.resolve(null)
        this.changed()
    }

    load(messageId: string | number, retry = false): Promise<QuotedMessage | null> {
        const id = String(messageId)
        if (!id || id === 'undefined' || id === 'null') return Promise.resolve(null)
        const pending = this.pending.get(id)
        if (pending !== undefined) return pending
        const cached = this.entries.get(id)
        if (cached && (cached.status === 'ready' || !retry)) {
            // Refresh insertion order for LRU eviction.
            this.entries.delete(id)
            this.entries.set(id, cached)
            return Promise.resolve(cached.message ?? null)
        }
        let resolve!: QuoteJob['resolve']
        const promise = new Promise<QuotedMessage | null>(done => { resolve = done })
        this.pending.set(id, promise)
        this.entries.set(id, { status: 'loading' })
        this.queue.push({ id, generation: this.generation, resolve, promise })
        this.changed()
        this.drain()
        return promise
    }

    revoke(messageId: string | number) {
        const id = String(messageId)
        if (this.pending.has(id)) this.recalledInFlight.add(id)
        // Also remember recalls that arrive while the original request is in flight.
        this.entries.set(id, {
            status: 'ready',
            message: { message_id: id, revoke: true, message: [] },
        })
        this.trim()
        this.changed()
    }

    private trim() {
        for (const [id, entry] of this.entries) {
            if (this.entries.size <= this.limit) break
            if (entry.status !== 'loading') this.entries.delete(id)
        }
    }

    private drain() {
        while (this.running < 2 && this.queue.length > 0) {
            const job = this.queue.shift()!
            this.running++
            void this.run(job)
        }
    }

    private async run(job: QuoteJob) {
        const isActive = () => job.generation === this.generation
        let result: QuotedMessage | null = null
        try {
            // A queued request may have been recalled before it starts.
            if (this.recalledInFlight.has(job.id) || this.entries.get(job.id)?.message?.revoke) return
            const message = await this.request(job.id, isActive)
            if (!isActive()) return
            if (String(message?.message_id) !== job.id || !Array.isArray(message?.message)) {
                throw new QuoteRequestError('unavailable')
            }
            if (this.recalledInFlight.has(job.id) || this.entries.get(job.id)?.message?.revoke) return
            result = message
            this.entries.set(job.id, { status: 'ready', message })
        } catch (error) {
            if (isActive() && !this.recalledInFlight.has(job.id) && !this.entries.get(job.id)?.message?.revoke) {
                this.entries.set(job.id, {
                    status: 'error',
                    failure: error instanceof QuoteRequestError ? error.failure : 'unavailable',
                })
            }
        } finally {
            if (isActive()) {
                if (this.pending.get(job.id) === job.promise) this.pending.delete(job.id)
                this.recalledInFlight.delete(job.id)
                this.trim()
                this.changed()
            }
            job.resolve(result)
            this.running--
            this.drain()
        }
    }
}

/** Retain the existing compact media preview without rendering heavy attachments. */
export function quotePreviewMessage(message: QuotedMessage | undefined): QuotedMessage | null {
    if (!message || message.revoke) return null
    const fallbackTypes = new Set(['video', 'record', 'file', 'json', 'xml', 'forward'])
    if (message.message.some((segment: any) => fallbackTypes.has(segment.type))) return null
    let hasImage = false
    return {
        ...message,
        message: message.message.filter((segment: any) => {
            if (segment.type === 'reply') return false
            if (segment.type !== 'image' && segment.type !== 'mface') return true
            if (hasImage) return false
            hasImage = true
            return true
        }),
    }
}

/** A single click loads successive older pages, then the caller performs the existing jump. */
export async function loadHistoryToQuotedMessage(options: {
    isActive: () => boolean
    hasTarget: () => boolean
    boundary: () => string | undefined
    loadOlder: () => Promise<boolean>
    rendered: () => Promise<void>
}): Promise<'found' | 'unavailable' | 'cancelled'> {
    const visited = new Set<string>()
    await options.rendered()
    while (options.isActive()) {
        if (options.hasTarget()) return 'found'
        const boundary = options.boundary()
        if (!boundary || visited.has(boundary)) return 'unavailable'
        visited.add(boundary)
        const loaded = await options.loadOlder()
        await options.rendered()
        if (!options.isActive()) return 'cancelled'
        if (options.hasTarget()) return 'found'
        if (!loaded) return 'unavailable'
    }
    return 'cancelled'
}
