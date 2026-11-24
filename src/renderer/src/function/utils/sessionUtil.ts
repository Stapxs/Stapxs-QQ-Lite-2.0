import type { Session } from '../elements/information'

export function getSessionId(item: Session) {
    const userId = Number(item.user_id)
    if (Number.isFinite(userId) && userId > 0) return userId
    const groupId = Number(item.group_id)
    if (Number.isFinite(groupId) && groupId > 0) return groupId
    return Number(item.user_id ?? item.group_id)
}

export function findSessionContact(
    contacts: Session[],
    sessionId: number,
) {
    return contacts.find((item) => {
        return getSessionId(item) === sessionId
    })
}

export function getMissingGroupPreviewSessions(
    contacts: Session[],
    knownSessions: ReadonlyMap<number, Session>,
) {
    return contacts.filter((item) => {
        const sessionId = getSessionId(item)
        return Boolean(item.group_id) &&
            Number.isFinite(sessionId) &&
            sessionId > 0 &&
            !item.time &&
            !item.raw_msg &&
            !knownSessions.has(sessionId)
    })
}

export function resolveIncomingSession(
    contacts: Session[],
    sessionId: number,
    isGroup: boolean,
    senderName?: string,
) {
    const contact = findSessionContact(contacts, sessionId)
    if (contact) return contact

    // 消息事件可能早于好友/群列表返回。先保留会话动态状态，列表加载后再合并真实资料。
    if (isGroup) {
        return {
            group_id: sessionId,
            group_name: String(sessionId),
        } as Session
    }
    return {
        user_id: sessionId,
        nickname: senderName || String(sessionId),
        remark: '',
    } as Session
}

const SESSION_STATE_KEYS = [
    'new_msg',
    'raw_msg',
    'raw_msg_base',
    'time',
    'always_top',
    'message_id',
    'highlight',
] as const

type SessionStateKey = (typeof SESSION_STATE_KEYS)[number]

function copyDefinedSessionState<K extends SessionStateKey>(
    contact: Session,
    currentSession: Session,
    key: K,
) {
    const value = currentSession[key]
    if (value !== undefined) {
        contact[key] = value
    }
}

export function mergeSessionState(
    contact: Session,
    currentSession: Session,
) {
    SESSION_STATE_KEYS.forEach((key) =>
        copyDefinedSessionState(contact, currentSession, key),
    )
    return contact
}

/**
 * 让真实联系人接管消息早到时创建的占位会话。
 * 返回 true 表示 Map 中的对象引用已替换，调用方需要重建派生会话列表。
 */
export function mergeEarlySessionContacts(
    contacts: Session[],
    sessions: Map<number, Session>,
) {
    let didMerge = false
    contacts.forEach((contact) => {
        const sessionId = getSessionId(contact)
        const currentSession = sessions.get(sessionId)
        if (currentSession && currentSession !== contact) {
            sessions.set(
                sessionId,
                mergeSessionState(contact, currentSession),
            )
            didMerge = true
        }
    })
    return didMerge
}

export function isSessionMenuTarget(item: unknown): item is Session {
    if (!item || typeof item !== 'object') return false
    const record = item as Record<string, unknown>
    if ('is_system_notice' in record && record.is_system_notice === true) return false
    if ('user_id' in record && Number(record.user_id) === -10000) return false
    const groupId = 'group_id' in record ? Number(record.group_id) : Number.NaN
    const userId = 'user_id' in record ? Number(record.user_id) : Number.NaN
    return (Number.isFinite(groupId) && groupId > 0) ||
        (Number.isFinite(userId) && userId > 0)
}

export function hasAccountSessionId(
    map: unknown,
    uin: number | string | undefined,
    sessionId: number | string,
): boolean {
    if (!map || typeof map !== 'object' || Array.isArray(map)) return false
    const accountKey = uin == null ? '' : String(uin)
    const targetId = Number(sessionId)
    if (!accountKey || !Number.isFinite(targetId) || targetId <= 0) return false
    const rawList = (map as Record<string, unknown>)[accountKey]
    return Array.isArray(rawList) && rawList.some((entry) => Number(entry) === targetId)
}

function cloneAccountSessionMap(map: unknown): Record<string, number[]> {
    const nextMap: Record<string, number[]> = {}
    if (!map || typeof map !== 'object' || Array.isArray(map)) {
        return nextMap
    }
    for (const [key, value] of Object.entries(map as Record<string, unknown>)) {
        if (Array.isArray(value)) {
            nextMap[key] = value
                .map(Number)
                .filter((num) => Number.isFinite(num) && num > 0)
        }
    }
    return nextMap
}

export function toggleAccountSessionId(
    map: unknown,
    uin: number | string | undefined,
    sessionId: number | string,
    enabled: boolean,
): Record<string, number[]> {
    const nextMap = cloneAccountSessionMap(map)
    const accountKey = uin == null ? '' : String(uin)
    const targetId = Number(sessionId)
    if (!accountKey || !Number.isFinite(targetId) || targetId <= 0) {
        return nextMap
    }

    const deduped = Array.from(new Set(nextMap[accountKey] ?? []))
    if (enabled) {
        if (!deduped.includes(targetId)) {
            deduped.push(targetId)
        }
        nextMap[accountKey] = deduped
    } else {
        nextMap[accountKey] = deduped.filter((num) => num !== targetId)
    }
    return nextMap
}
