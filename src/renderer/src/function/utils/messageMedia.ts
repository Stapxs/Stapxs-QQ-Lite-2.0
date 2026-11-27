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
