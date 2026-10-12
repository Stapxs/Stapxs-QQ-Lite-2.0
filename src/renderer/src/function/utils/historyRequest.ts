export type HistorySession = {
    id: string | number
    type: string
}

export type HistoryRequest = {
    generation: number
    id: string
    type: string
}

export function isSameHistorySession(first: HistorySession, second: HistorySession): boolean {
    return String(first.id) === String(second.id) && first.type === second.type
}

export function createHistoryRequestTracker() {
    let generation = 0
    let active: HistoryRequest | undefined

    return {
        begin(session: HistorySession): HistoryRequest {
            active = {
                generation: ++generation,
                id: String(session.id),
                type: session.type,
            }
            return active
        },
        current(): HistoryRequest | undefined {
            return active
        },
        isActive(
            requestGeneration: number | undefined,
            session: HistorySession,
        ): boolean {
            if (requestGeneration === undefined) return false
            return active?.generation === requestGeneration &&
                isSameHistorySession(active, session)
        },
    }
}

export function createHistoryEcho(
    handler: string,
    request: HistoryRequest,
    suffix?: string | number,
) {
    return suffix === undefined? `${handler}_${request.generation}`: `${handler}_${request.generation}_${suffix}`
}

export function getHistoryGeneration(echoList?: string[]): number | undefined {
    const value = Number(echoList?.[1])
    return Number.isSafeInteger(value) && value > 0 ? value : undefined
}

export const historyRequestTracker = createHistoryRequestTracker()
