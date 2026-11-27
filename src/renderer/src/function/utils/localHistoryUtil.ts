/**
 * @FileDescription: 本地历史消息工具（Tauri 平台）
 * @Description:
 *   封装对 Tauri 后端 db_* 命令的调用，提供类型安全的本地 SQLite 历史消息读写接口。
 *   非 Tauri 平台调用时会静默 no-op / 返回空数组，不影响其他平台逻辑。
 */

import { backend } from '@renderer/runtime/backend'
import { getMsgRawTxt } from './msgUtil'
import { Logger } from '../base'
import { useSettingsStore } from '@renderer/state/settings'
import { useAuthStore } from '@renderer/state/auth'
import { normalizeForwardSegments, type HistoryChat } from './messageMedia'

const logger = new Logger()

// ── 类型定义（与 Rust MsgRecord 对应） ───────────────────────────

export interface LocalMsgRecord {
    /** Bot 侧的消息 ID */
    message_id: string
    /** 会话 ID（group_id 或 user_id） */
    chat_id: number
    /** 会话类型："group" | "private" */
    chat_type: string
    /** 发送者 user_id */
    sender_id: number
    /** 发送者昵称（card 优先，fallback nickname） */
    sender_name: string | null
    /** 消息序号（并非所有 Bot 都提供，可能为 null） */
    seq: number | null
    /** 消息时间戳（秒，Bot 原始值） */
    time: number
    /** JSON 序列化的 MsgItemElem[] 消息段数组 */
    message: string
    /** 纯文本摘要 */
    raw_message: string | null
    /** 是否已撤回 */
    revoked: boolean
}

export function isTauriHistoryAvailable(): boolean {
    const settingsStore = useSettingsStore()
    return backend.type === 'tauri' && settingsStore.sysConfig.enable_local_history === true
}

async function callDbRecordList(
    selfId: string | number,
    command: string,
    payload: Record<string, any>,
    errorTag: string,
): Promise<any[]> {
    if (!isTauriHistoryAvailable()) return []
    try {
        const records: LocalMsgRecord[] = await backend.call(
            undefined,
            command,
            true,
            { selfId: String(selfId), ...payload },
        )
        return (records ?? []).map(deserializeRecord)
    } catch (e) {
        logger.error(e as unknown as Error, errorTag)
        return []
    }
}

async function callDb(
    selfId: string | number,
    command: string,
    payload: Record<string, any>,
    fallback: any,
    errorTag: string,
): Promise<any> {
    if (!isTauriHistoryAvailable()) return fallback
    try {
        return await backend.call(
            undefined,
            command,
            true,
            { selfId: String(selfId), ...payload },
        )
    } catch (e) {
        logger.error(e as unknown as Error, errorTag)
        return fallback
    }
}

function serializeMsgSegments(segments: any[] | undefined): string {
    try {
        return JSON.stringify(segments ?? [])
    } catch {
        return '[]'
    }
}

function deserializeMsgSegments(serialized: string): any[] {
    try {
        const segments = JSON.parse(serialized)
        return Array.isArray(segments) ? segments : []
    } catch {
        return []
    }
}

function computeRawMessage(msg: any): string | null {
    try {
        return getMsgRawTxt(msg) || msg.raw_message || null
    } catch {
        return msg.raw_message ?? null
    }
}

export function getMessageHistoryChat(
    selfId: string | number,
    message: any,
    fallback?: HistoryChat,
): HistoryChat | undefined {
    if (!message) return
    const info = message.infoList
    const groupId = info?.group_id ?? message.group_id
    const targetId = info?.target_id ?? message.target_id
    const inferredType = groupId != null ? 'group' : 'private'
    const type = message.message_type ?? (groupId == null && targetId == null ? fallback?.type ?? inferredType : inferredType)
    if (type !== 'group' && type !== 'private') return
    const privateId = [targetId, info?.private_id, message.user_id, info?.sender]
        .find(id => id != null && String(id) !== String(selfId))
    const id = type === 'group' ? groupId ?? targetId : privateId
    if (id == null) return fallback?.type === type ? fallback : undefined
    const numberId = Number(id)
    if (Number.isSafeInteger(numberId) && numberId > 0) return { id: numberId, type }
    return undefined
}

function deriveChatId(selfId: string | number, msgs: any[]): number | undefined {
    const firstMsg = msgs[0]
    let chatId: number | undefined = firstMsg?.infoList?.group_id ?? firstMsg?.infoList?.target_id
    if (chatId != null) return Number(chatId)

    for (const item of msgs) {
        if (item?.infoList?.sender != null && String(item.infoList.sender) !== String(selfId)) {
            chatId = Number(item.infoList.sender)
            break
        }
    }
    return chatId
}

export function ensureChatIdOnMsgs(selfId: string | number, msgs: any[]): any[] {
    const chatId = deriveChatId(selfId, msgs)
    if (chatId == null) return msgs

    return msgs.map((item: any) => {
        if (!item?.infoList) return item
        if (item.infoList.group_id != null || item.infoList.target_id != null) {
            return item
        }
        return {
            ...item,
            infoList: {
                ...item.infoList,
                target_id: chatId,
            },
        }
    })
}

// ── 辅助：将运行时消息对象转换为 LocalMsgRecord ──────────────────

/**
 * 将已经过 msgPreprocess 处理的消息对象转成可存入 DB 的 LocalMsgRecord。
 * 若必要字段缺失则返回 null，调用方需过滤掉 null。
 */
export function msgToRecord(msg: any): LocalMsgRecord | null {
    const messageId = msg?.message_id
    if (!messageId || msg.revoked) return null

    const chatId: number = msg.infoList?.group_id ?? msg.infoList?.target_id
    if (chatId == null) return null

    const chatType: string =
        msg.message_type ?? (msg.group_id != null ? 'group' : 'private')
    const senderId: number = msg.infoList?.sender
    if (senderId == null) return null

    const senderName: string | null =
        (msg.sender?.card && msg.sender.card !== '') ? msg.sender.card : (msg.sender?.nickname ?? null)

    const rawMessage = computeRawMessage(msg)
    const messageSerialized = serializeMsgSegments(msg.message)

    return {
        message_id: String(messageId),
        chat_id: Number(chatId),
        chat_type: chatType,
        sender_id: Number(senderId),
        sender_name: senderName,
        seq: msg.seq_id != null ? Number(msg.seq_id) : null,
        time: Number(msg.time),
        message: messageSerialized,
        raw_message: rawMessage,
        revoked: false,
    }
}

// ── 读写接口 ──────────────────────────────────────────────────────

/**
 * 批量保存消息。已有记录可以补全缺失的合并转发正文。
 *
 * @param selfId  当前登录账号 uin
 * @param msgs    已完成预处理的消息对象数组（来自 chatStore.messageList 或 newMsg）
 */
export async function dbSaveMessages(selfId: string | number, msgs: any[]): Promise<void> {
    if (!isTauriHistoryAvailable()) return

    const persistableMsgs = ensureChatIdOnMsgs(selfId, msgs)
    const records: LocalMsgRecord[] = persistableMsgs
        .map(msgToRecord)
        .filter((r): r is LocalMsgRecord => r !== null)

    if (records.length === 0) {
        logger.error(null, '[LocalHistory] dbSaveMessages: 没有有效消息可保存')
        return
    }

    try {
        await backend.call(undefined, 'db:saveMessages', true, {
            selfId: String(selfId),
            messages: records,
        })
    } catch (e) {
        logger.error(e as unknown as Error, '[LocalHistory] dbSaveMessages 失败')
    }
}

export async function saveMessagesWithSideEffects(selfId: string | number, msgs: any[]): Promise<void> {
    const settingsStore = useSettingsStore()
    const persistableMsgs = ensureChatIdOnMsgs(selfId, msgs)
    await dbSaveMessages(selfId, persistableMsgs)
    if (settingsStore.sysConfig.disable_local_history_image_cache === true) return
    cacheImagesFromMsgs(selfId, persistableMsgs).catch(() => {})
}

type HistoryImageCache = { urlHash: string, mimeType: string, data: string }
type HistoryImage = { src: string, cache?: HistoryImageCache }

export async function dbRefreshImageUrl(
    selfId: number | string,
    chat: HistoryChat,
    messageId: string,
    segmentIndex: number,
    previousUrl: string | undefined,
    url: string,
    cache?: HistoryImageCache,
): Promise<boolean | null> {
    return callDb(selfId, 'db:refreshImageUrl', {
        messageId, chatId: chat.id, chatType: chat.type,
        segmentIndex, previousUrl: previousUrl ?? null, url,
        cache: useSettingsStore().sysConfig.disable_local_history_image_cache === true ? null : cache ?? null,
    }, false, '[LocalHistory] dbRefreshImageUrl 失败')
}

export async function dbRepairStoredForward(
    selfId: number | string,
    chat: HistoryChat,
    messageId: string,
    segments: any[],
): Promise<boolean> {
    return callDb(selfId, 'db:repairStoredForward', {
        messageId, chatId: chat.id, chatType: chat.type, message: serializeMsgSegments(segments),
    }, false, '[LocalHistory] dbRepairStoredForward 失败')
}

/**
 * 获取某会话最新 n 条本地消息（正序，revoked 消息不包含）。
 *
 * @returns 消息段数组已反序列化的消息对象数组，出错或非 Tauri 返回空数组
 */
export async function dbGetLatest(
    selfId: string | number,
    chatId: number,
    n: number,
): Promise<any[]> {
    return callDbRecordList(selfId, 'db:getLatest', { chatId, n }, '[LocalHistory] dbGetLatest 失败')
}

/**
 * 获取锚点消息之前（更旧）的 n 条，不含锚点本身，正序返回。
 *
 * 典型用途：上拉加载更多历史。
 */
export async function dbGetBefore(
    selfId: string | number,
    chatId: number,
    messageId: string,
    n: number,
): Promise<any[]> {
    return callDbRecordList(selfId, 'db:getBefore', { chatId, messageId, n }, '[LocalHistory] dbGetBefore 失败')
}

/**
 * 获取某个时间戳之前（更旧）的 n 条消息，正序返回。
 */
export async function dbGetBeforeByTime(
    selfId: string | number,
    chatId: number,
    beforeTime: number,
    n: number,
): Promise<any[]> {
    return callDbRecordList(selfId, 'db:getBeforeByTime', { chatId, beforeTime, n }, '[LocalHistory] dbGetBeforeByTime 失败')
}

/**
 * 获取锚点消息之后（更新）的 n 条，不含锚点本身，正序返回。
 *
 * 典型用途：从指定消息位置向后展开查看。
 */
export async function dbGetAfter(
    selfId: string | number,
    chatId: number,
    messageId: string,
    n: number,
): Promise<any[]> {
    return callDbRecordList(selfId, 'db:getAfter', { chatId, messageId, n }, '[LocalHistory] dbGetAfter 失败')
}

/**
 * 将指定 message_id 在本地 DB 中标记为已撤回。
 *
 * @returns 是否命中（true = DB 中存在该消息并更新成功）
 */
export async function dbRevokeMessage(
    selfId: string | number,
    messageId: string,
): Promise<boolean> {
    return callDb(selfId, 'db:revokeMessage', { messageId }, false, '[LocalHistory] dbRevokeMessage 失败')
}

/**
 * 在指定会话的本地 DB 中按关键词搜索消息（对 raw_message 做 LIKE 匹配）。
 *
 * @returns 匹配消息列表（正序），出错或非 Tauri 返回空数组
 */
export async function dbSearchMessages(
    selfId: string | number,
    chatId: number,
    query: string,
): Promise<any[]> {
    if (!isTauriHistoryAvailable() || !query) return []
    return callDbRecordList(selfId, 'db:searchMessages', { chatId, query }, '[LocalHistory] dbSearchMessages 失败')
}

export async function dbGetStats(
    selfId: string | number,
): Promise<{ totalMessages: number; imageCount: number; imageCacheBytes: number; dbSizeBytes: number } | null> {
    return callDb(selfId, 'db:getStats', {}, null, '[LocalHistory] dbGetStats 失败')
}

/**
 * 计算 URL 的 SHA-256 十六进制摘要，用作图片缓存的唯一键。
 */
export async function hashUrl(url: string): Promise<string> {
    const data = new TextEncoder().encode(url)
    const buf = await crypto.subtle.digest('SHA-256', data)
    return Array.from(new Uint8Array(buf))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')
}

/**
 * 将图片缓存到本地加密数据库。
 * `data` 为 base64 编码的原始图片字节。
 */
export async function dbCacheImage(
    selfId: string | number,
    urlHash: string,
    mimeType: string,
    data: string,
): Promise<void> {
    if (!isTauriHistoryAvailable()) return

    try {
        await backend.call(undefined, 'db:cacheImage', true, {
            selfId: String(selfId),
            urlHash,
            mimeType,
            data,
        })
    } catch (e) {
        logger.error(e as unknown as Error, '[LocalHistory] dbCacheImage 失败')
    }
}

/**
 * 从本地数据库读取已缓存的图片。
 * 返回 `{ mimeType, data }` （data 为 base64），未缓存则返回 `null`。
 */
export async function dbGetImage(
    selfId: string | number,
    urlHash: string,
): Promise<{ mimeType: string; data: string } | null> {
    return callDb(selfId, 'db:getImage', { urlHash }, null, '[LocalHistory] dbGetImage 失败')
}

export interface DbClearImagesProgress {
    selfId: string
    total: number
    deleted: number
    batchDeleted: number
    progress: number
    done: boolean
}

export interface DbClearImagesResult {
    total: number
    deleted: number
    batches: number
}

export async function dbClearImages(
    selfId: string | number,
    onProgress?: (progress: DbClearImagesProgress) => void,
): Promise<DbClearImagesResult> {
    if (!isTauriHistoryAvailable()) {
        return { total: 0, deleted: 0, batches: 0 }
    }

    let unlisten: undefined | (() => void | Promise<void>)
    if (onProgress && backend.type === 'tauri') {
        const { listen } = await import('@tauri-apps/api/event')
        unlisten = await listen<DbClearImagesProgress>('db:clearImagesProgress', (event) => {
            const payload = event.payload
            if (!payload) return
            if (String(payload.selfId) !== String(selfId)) return
            onProgress(payload)
        })
    }

    try {
        const result = await callDb(
            selfId,
            'db:clearImages',
            {},
            { total: 0, deleted: 0, batches: 0 },
            '[LocalHistory] dbClearImages 失败',
        )
        return {
            total: Number(result?.total ?? 0),
            deleted: Number(result?.deleted ?? 0),
            batches: Number(result?.batches ?? 0),
        }
    } finally {
        if (unlisten) await unlisten()
    }
}

// ── 内部工具 ──────────────────────────────────────────────────────

/**
 * 遍历消息列表，将所有图片段下载并缓存到本地数据库。
 * 已缓存的图片（url_hash 命中）不会重复下载。
 */
async function cacheImagesFromMsgs(selfId: string | number, msgs: any[]): Promise<void> {
    if (!isTauriHistoryAvailable()) return
    const authStore = useAuthStore()
    for (const msg of msgs) {
        if (!Array.isArray(msg.message) || msg.revoked || !msg.message_id) continue
        const chat = getMessageHistoryChat(selfId, msg)
        if (!chat) continue
        for (const [index, seg] of msg.message.entries()) {
            if (String(authStore.loginInfo.uin) !== String(selfId)) return
            if (msg.revoked || seg?.type !== 'image' || typeof seg.url !== 'string') continue
            const url = seg.url
            const image = await loadHistoryImage(selfId, url)
            if (image?.cache && !msg.revoked && seg.url === url &&
                String(authStore.loginInfo.uin) === String(selfId)) {
                await dbRefreshImageUrl(selfId, chat, String(msg.message_id), index, url, url, image.cache)
            }
        }
    }
}

async function downloadImageViaProxy(url: string): Promise<{ mimeType: string; base64: string } | null> {
    const fetchUrl = backend.proxy ? `http://localhost:${backend.proxy}/assets?url=${encodeURIComponent(url)}` : url
    const resp = await fetch(fetchUrl, { signal: AbortSignal.timeout(8000) })
    if (!resp.ok) return null

    const mimeType = resp.headers.get('Content-Type')?.split(';')[0]?.trim() ?? 'image/jpeg'
    const buffer = await resp.arrayBuffer()
    const bytes = new Uint8Array(buffer)
    if (!bytes.length) return null
    let binary = ''
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i])
    const base64 = btoa(binary)
    return { mimeType, base64 }
}

async function decodeImageSource(mimeType: string, base64: string): Promise<string | undefined> {
    if (!base64) return
    // The old proxy stored some valid images with a text/html MIME type.
    const mime = mimeType.startsWith('image/') ? mimeType : 'image/jpeg'
    const src = `data:${mime};base64,${base64}`
    const image = new Image()
    image.src = src
    try {
        await image.decode()
        return src
    } catch {
        return undefined
    }
}

async function readCachedImageSrc(selfId: string | number, hash: string) {
    if (useSettingsStore().sysConfig.disable_local_history_image_cache === true) return undefined
    const cached = await dbGetImage(selfId, hash)
    return cached ? decodeImageSource(cached.mimeType, cached.data) : undefined
}

export async function getCachedImageSrc(selfId: string | number, url: string) {
    if (!isTauriHistoryAvailable() || !url) return
    return readCachedImageSrc(selfId, await hashUrl(url))
}

const pendingImageDownloads = new Map<string, Promise<HistoryImage | undefined>>()

export async function loadHistoryImage(selfId: string | number, url: string) {
    if (!isTauriHistoryAvailable() || !/^https?:\/\//i.test(url)) return
    const key = `${selfId}:${url}`
    const pending = pendingImageDownloads.get(key)
    if (pending) return pending
    const request = readOrDownloadHistoryImage(selfId, url).catch(() => undefined)
    pendingImageDownloads.set(key, request)
    try {
        return await request
    } finally {
        pendingImageDownloads.delete(key)
    }
}

async function readOrDownloadHistoryImage(selfId: string | number, url: string): Promise<HistoryImage | undefined> {
    const urlHash = await hashUrl(url)
    const existing = await readCachedImageSrc(selfId, urlHash)
    if (existing) return { src: existing }
    const downloaded = await downloadImageViaProxy(url)
    if (!downloaded) return

    const src = await decodeImageSource(downloaded.mimeType, downloaded.base64)
    if (!src) return
    return { src, cache: { urlHash, mimeType: downloaded.mimeType, data: downloaded.base64 } }
}

/**
 * 将 DB 返回的 LocalMsgRecord 还原为与 chatStore.messageList 兼容的消息对象。
 */
function deserializeRecord(record: LocalMsgRecord): any {
    const authStore = useAuthStore()
    const message = deserializeMsgSegments(record.message)
    normalizeForwardSegments(message)

    // 判断是否为自己发送的消息，还原 post_type
    const isSelf = record.sender_id === Number(authStore.loginInfo.uin)
    const postType = isSelf ? 'message_sent' : 'message'

    // 群消息：sender_name 来自 card，私聊来自 nickname
    const isGroup = record.chat_type === 'group'
    const sender = isGroup ? { user_id: record.sender_id, card: record.sender_name ?? '', nickname: record.sender_name ?? '' } : { user_id: record.sender_id, card: '', nickname: record.sender_name ?? '' }
    const infoList = {
        message_id: record.message_id,
        private_id: isGroup ? undefined : record.chat_id,
        group_id: isGroup ? record.chat_id : undefined,
        target_id: isGroup ? undefined : record.chat_id,
        sender: record.sender_id,
    }

    return {
        post_type: postType,
        message_id: record.message_id,
        message_type: record.chat_type,
        // 根据 chat_type 恢复对应的 id 字段
        ...(isGroup ? { group_id: record.chat_id } : { user_id: record.chat_id }),
        sender,
        time: record.time,
        message,
        infoList,
        raw_message: record.raw_message ?? '',
        revoked: record.revoked,
        // 消息序列号（并非所有 Bot 都提供，可为 null）
        ...(record.seq != null ? { message_seq: record.seq, seq_id: record.seq } : {}),
        // 标记来源为本地缓存，业务层可按需用此字段区分
        _from_local_db: true,
    }
}
