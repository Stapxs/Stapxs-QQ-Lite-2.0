export type HistoryChat = { id: number, type: 'group' | 'private' }

type MessageRecall = {
    selfId: number | string
    chat: HistoryChat
    messageId: number | string
}

const recallListeners = new Set<(notice: MessageRecall) => void>()

export function onMessageRecall(listener: (notice: MessageRecall) => void) {
    recallListeners.add(listener)
    return () => { recallListeners.delete(listener) }
}

export function notifyMessageRecall(notice: MessageRecall) {
    for (const listener of recallListeners) listener(notice)
}

export function historyChatForView(view: { id: number, type: string }): HistoryChat | undefined {
    const id = Number(view.id)
    if (!Number.isSafeInteger(id) || id <= 0) return
    return { id, type: view.type === 'group' ? 'group' : 'private' }
}

export function sameHistoryChat(a: HistoryChat | undefined, b: HistoryChat | undefined) {
    return !!a && !!b && a.id === b.id && a.type === b.type
}

// Only active media requests subscribe. The app holds no history of recall notifications.
export function watchMediaRecall(
    selfId: number | string,
    chat: HistoryChat | undefined,
    message: { message_id?: number | string, revoked?: boolean },
) {
    if (!chat || message.message_id == null) return
    const messageId = String(message.message_id)
    return onMessageRecall((notice) => {
        if (String(notice.selfId) === String(selfId) && sameHistoryChat(chat, notice.chat) &&
            String(notice.messageId) === messageId) {
            message.revoked = true
        }
    })
}

export type ForwardSegment = {
    type: 'forward'
    id?: string | number
    content?: any[]
}

export function normalizeForwardSegments(segments: any[]) {
    for (const [index, segment] of segments.entries()) {
        if (segment?.type !== 'json') continue
        try {
            const card = typeof segment.data === 'string' ? JSON.parse(segment.data) : segment.data
            const id = card?.meta?.detail?.resid
            if (card?.app === 'com.tencent.multimsg' && id) segments[index] = { type: 'forward', id }
        } catch {
            // The JSON card renderer handles other card formats.
        }
    }
}

export function hasForwardContent(seg: any): seg is ForwardSegment & { content: any[] } {
    return seg?.type === 'forward' && Array.isArray(seg.content) &&
        seg.content.length > 0 && seg.content.every((node: any) => Array.isArray(node?.message))
}

export function fillMissingForwards(stored: any[], incoming: any[]) {
    if (!Array.isArray(stored) || !Array.isArray(incoming)) return
    incoming.forEach((segment, index) => {
        const previous = stored[index]
        if (hasForwardContent(segment) && previous?.type === 'forward' &&
            String(previous.id ?? '') === String(segment.id ?? '') && !hasForwardContent(previous)) {
            previous.content = segment.content
        }
    })
}
