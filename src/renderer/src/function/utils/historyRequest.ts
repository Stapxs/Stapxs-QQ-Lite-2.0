export type HistorySession = {
    id: string | number
    type: string
}

export type HistoryRequest = {
    generation: number
    id: string
    type: string
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
            requestGeneration: number,
            session: HistorySession,
        ): boolean {
            return active?.generation === requestGeneration &&
                active.id === String(session.id) &&
                active.type === session.type
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
