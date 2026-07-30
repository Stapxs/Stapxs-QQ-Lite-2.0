import type { Session } from '../elements/information'

export function getSessionId(item: Session) {
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
