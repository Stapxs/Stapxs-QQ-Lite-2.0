/*
 * @FileDescription: 消息处理模块
 * @Author: Stapxs
 * @Date:
 *      2022/11/1
 *      2022/12/7
 *      2024/9/2
 * @Version:
 *      1.0 - 初始版本
 *      2.0 - 重构为 ts 版本，修改 Vue3 相关变更
 *      3.0 - 优化更优雅的代码结构
 * @Description: 此模块用于拆分和保存/处理 bot 返回的各类信息，整个运行时数据也保存在这儿。
 */
import qed from '@renderer/assets/qed.txt?raw'

import app from '@renderer/main'
import Option from './option'

import Umami from '@stapxs/umami-logger-typescript'

import {
    buildMsgList,
    getMsgData,
    parseMsgList,
    getMsgRawTxt,
    updateBaseOnMsgList,
    updateLastestHistory,
    sendMsgAppendInfo,
} from '@renderer/function/utils/msgUtil'
import {
    delay,
    getViewTime,
    randomNum,
} from '@renderer/function/utils/systemUtil'
import {
    reloadUsers,
    reloadCookies,
    updateMenu,
    loadJsonMap,
    sendIdentifyData,
    sendStatEvent,
} from '@renderer/function/utils/appUtil'
import { reactive, markRaw, nextTick } from 'vue'
import { PopInfo, PopType, Logger, LogType } from './base'
import { Connector, login, saveConnectionToHistory } from './connect'
import {
    GroupFileElem,
    GroupFileFolderElem,
    GroupMemberInfoElem,
    UserFriendElem,
    UserGroupElem,
    MsgItemElem,
    type Session,
} from './elements/information'
import { NotifyInfo } from './elements/system'
import { Notify } from './notify'
import { backend } from '@renderer/runtime/backend'
import { dbRevokeMessage, saveMessagesWithSideEffects } from './utils/localHistoryUtil'
import { addDownloadTask, completeUploadTask } from '@renderer/components/FileManager.vue'
import { refreshFavicon } from './favicon'
import { Img } from './model/img'
import { ensurePinyinLoaded, getPinyin, isPinyinReady } from './utils/pinyin'
import { useAuthStore } from '@renderer/state/auth'
import { useContactStore } from '@renderer/state/contact'
import { useChatStore } from '@renderer/state/chat'
import { useConnectionStore } from '@renderer/state/connection'
import { useStickerStore } from '@renderer/state/sticker'
import { useUIStore } from '@renderer/state/ui'
import { useSettingsStore } from '@renderer/state/settings'
import { useQzoneStore } from '@renderer/state/qzone'
import {
    getSessionId,
    getMissingGroupPreviewSessions,
    mergeEarlySessionContacts,
    resolveIncomingSession,
} from './utils/sessionUtil'

const popInfo = new PopInfo()
// eslint-disable-next-line
const msgPaths = import.meta.glob("@renderer/assets/pathMap/*.yaml", { eager: true })
// 取出包含 Lagrange.OneBot.yaml 的那条
const msgPathAt = Object.keys(msgPaths).find((item) => {
    return item.indexOf('Lagrange.OneBot.yaml') > 0
})
let msgPath = {} as { [key: string]: any }
if (msgPathAt != undefined) {
    msgPath = (msgPaths[msgPathAt] as any).default
}
// 其他 tag
let listLoadTimes = 0
const logger = new Logger()
let firstHeartbeatTime = -1
let heartbeatTime = -1
const MILLISECONDS_PER_SECOND = 1000
const META_EVENT_WATCHDOG = {
    // Give one missed heartbeat plus a small network/main-thread grace window before forcing a disconnect.
    timeoutMultiplier: 2,
    graceSeconds: 5,
}
let loginWaveTimer: any = null

export function setLoginWaveTimer(timer: any) {
    loginWaveTimer = timer
}

export function clearLoginWaveTimer() {
    if (loginWaveTimer !== null) {
        clearInterval(loginWaveTimer)
        loginWaveTimer = null
    }
}

const groupPreviewHydrator = (() => {
    const intervalMs = 150
    let queue: Session[] = []
    let timer: ReturnType<typeof setTimeout> | undefined

    function stop() {
        if (timer) clearTimeout(timer)
        timer = undefined
    }

    function tick() {
        timer = undefined
        const contactStore = useContactStore()
        const session = queue.shift()
        if (session) {
            const sessionId = getSessionId(session)
            if (
                Number.isFinite(sessionId) &&
                sessionId > 0 &&
                !session.time &&
                !session.raw_msg &&
                !contactStore.baseOnMsgList.has(sessionId)
            ) {
                // userList 与 baseOnMsgList 共享同一个会话对象；历史响应会原地补全预览。
                contactStore.baseOnMsgList.set(sessionId, session)
                updateLastestHistory(session)
            }
        }

        if (queue.length > 0) {
            timer = setTimeout(tick, intervalMs)
        }
    }

    function start() {
        if (!timer && queue.length > 0) tick()
    }

    return {
        scheduleMissingSessions() {
            const contactStore = useContactStore()
            const settingsStore = useSettingsStore()
            if (settingsStore.sysConfig.session_display_mode !== 'all') return

            const queuedIds = new Set(queue.map((item) => getSessionId(item)))
            getMissingGroupPreviewSessions(
                contactStore.userList,
                contactStore.baseOnMsgList,
            ).forEach((item) => {
                const sessionId = getSessionId(item)
                if (!queuedIds.has(sessionId)) {
                    queue.push(item)
                    queuedIds.add(sessionId)
                }
            })
            start()
        },
        reset() {
            stop()
            queue = []
        },
    }
})()

function resolveContactPinyinName(item: UserFriendElem | UserGroupElem) {
    if ((item as UserFriendElem).group_id) {
        return (item as UserFriendElem).group_name ?? ''
    }
    return `${(item as UserGroupElem).nickname ?? ''},${(item as UserGroupElem).remark ?? ''}`
}

function resolvePinyinFirstChar(value: string) {
    return getPinyin(value)
        .main
        .at(0)
        ?.substring(0, 1)
        .toUpperCase() ?? ' '
}

function sortContactListByPinyin<T extends UserFriendElem | UserGroupElem>(list: T[]) {
    list.sort((a, b) => {
        if (a.py_start && b.py_start) {
            return a.py_start.charCodeAt(0) - b.py_start.charCodeAt(0)
        }
        return 0
    })
}

function buildPinyinForContacts(
    list: (UserFriendElem | UserGroupElem)[],
    startIndex = 0,
    onDone?: () => void,
) {
    if (!isPinyinReady()) {
        onDone?.()
        return
    }

    const batchSize = 100
    const endIndex = Math.min(startIndex + batchSize, list.length)

    for (let index = startIndex; index < endIndex; index++) {
        const item = list[index]
        item.py_name = getPinyin(resolveContactPinyinName(item))
        item.py_start = item.py_name.main.at(0)?.substring(0, 1).toUpperCase() ?? ' '
    }

    if (endIndex >= list.length) {
        onDone?.()
        return
    }

    setTimeout(() => {
        buildPinyinForContacts(list, endIndex, onDone)
    }, 0)
}

function hydrateContactPinyinLater(list: (UserFriendElem | UserGroupElem)[]) {
    const contactStore = useContactStore()

    const applyHydration = () => {
        buildPinyinForContacts(list, 0, () => {
            sortContactListByPinyin(list)
            contactStore.userList = [...contactStore.userList]
        })
    }

    if (isPinyinReady()) {
        applyHydration()
        return
    }

    void ensurePinyinLoaded().then((loaded) => {
        if (!loaded) return
        applyHydration()
    })
}

function clearMetaEventWatchdog() {
    const connectionStore = useConnectionStore()
    if (connectionStore.metaEventWatchTimer) {
        clearTimeout(connectionStore.metaEventWatchTimer)
        connectionStore.metaEventWatchTimer = undefined
    }
    connectionStore.metaEventTimeoutTriggered = false
}

function refreshMetaEventWatchdog(intervalSeconds: number) {
    if (intervalSeconds <= 0) return

    const connectionStore = useConnectionStore()
    if (connectionStore.metaEventWatchTimer) {
        clearTimeout(connectionStore.metaEventWatchTimer)
    }

    const timeoutSeconds = Math.ceil(
        Math.max(
            intervalSeconds * META_EVENT_WATCHDOG.timeoutMultiplier,
            intervalSeconds + META_EVENT_WATCHDOG.graceSeconds,
        ),
    )

    connectionStore.metaEventTimeoutTriggered = false
    connectionStore.metaEventWatchTimer = setTimeout(() => {
        if (connectionStore.metaEventTimeoutTriggered) return
        connectionStore.metaEventTimeoutTriggered = true
        connectionStore.metaEventWatchTimer = undefined
        logger.add(LogType.WS, '心跳包超时，准备断开连接')
        Connector.forceDisconnect('心跳包超时')
    }, timeoutSeconds * MILLISECONDS_PER_SECOND)
}

function getObservedHeartbeatIntervalSeconds(msg: { [key: string]: any }) {
    const currentHeartbeatTimeSeconds = Number(msg.time)
    if (
        firstHeartbeatTime > 0 &&
        Number.isFinite(currentHeartbeatTimeSeconds) &&
        currentHeartbeatTimeSeconds > firstHeartbeatTime
    ) {
        return currentHeartbeatTimeSeconds - firstHeartbeatTime
    }

    return -1
}

function getHeartbeatIntervalSeconds(msg: { [key: string]: any }) {
    // OneBot heartbeat `interval` is reported in milliseconds; `time` is a Unix timestamp in seconds.
    const reportedIntervalMilliseconds = Number(msg.interval)
    if (Number.isFinite(reportedIntervalMilliseconds) && reportedIntervalMilliseconds > 0) {
        return reportedIntervalMilliseconds / MILLISECONDS_PER_SECOND
    }

    return getObservedHeartbeatIntervalSeconds(msg)
}

export function dispatch(raw: string | { [k: string]: any }, echo?: string) {
    let msg: any;

    // 1) 如有需要先 parse
    if (typeof raw === 'string') {
        try {
            msg = JSON.parse(raw);
        } catch {
            if (!raw.includes('"meta_event_type":"heartbeat"')) {
                logger.add(LogType.WS, 'GET：' + raw);
            }
            return;
        }
    } else {
        msg = raw;
    }

    // 2) 決定 name/key
    const name = echo ? echo.split('_')[0] : msg.post_type === 'notice' ? msg.sub_type ?? msg.notice_type : msg.post_type;

    // 3) 安全調用 handler
    try {
        const fn = handlers[name];
        if (!fn) throw new Error(`No handler for "${name}"`);
        const metaArgs = echo ? echo.split('_') : undefined;
        fn(msg, metaArgs);
    } catch (e) {
        logger.error(e as Error, `跳转事件处理错误 - ${name}:\n${JSON.stringify(msg)}`);
    }
}

// ==============================================================
const noticeFunctions = {
    /**
     * 心跳包
     */
    meta_event: (_: string, msg: { [key: string]: any }) => {
        const connectionStore = useConnectionStore()
        if (firstHeartbeatTime == -1) {
            firstHeartbeatTime = 0
            connectionStore.heartbeatTime = 0
            clearMetaEventWatchdog()
            return
        }
        if (firstHeartbeatTime == 0) {
            firstHeartbeatTime = msg.time
            connectionStore.lastHeartbeatTime = msg.time
            clearMetaEventWatchdog()
            return
        }
        if (firstHeartbeatTime != -1 && heartbeatTime == -1) {
            // 计算心跳时间
            heartbeatTime = getHeartbeatIntervalSeconds(msg)
        }
        // 记录心跳状态
        if (heartbeatTime != -1) {
            connectionStore.heartbeatTime = heartbeatTime
            connectionStore.oldHeartbeatTime = connectionStore.lastHeartbeatTime
            connectionStore.lastHeartbeatTime = msg.time
            refreshMetaEventWatchdog(heartbeatTime)
        }
    },

    /**
     * 新消息
     */
    message_sent: newMsg,
    message: newMsg,

    /**
     * 请求
     */
    request: (_: string, msg: { [key: string]: any }) => {
        const contactStore = useContactStore()
        if (contactStore.systemNoticesList) {
            contactStore.systemNoticesList.push(msg)
        } else {
            contactStore.systemNoticesList = [msg]
        }
    },

    /**
     * 好友变动
     */
    friend: (_: string, msg: { [key: string]: any }) => {
        // 重新加载联系人列表
        reloadUsers()
        switch (msg.sub_type) {
            case 'increase': {
                // 添加系统通知
                new PopInfo().add(
                    PopType.INFO,
                    app.config.globalProperties.$t('添加好友 {name} 成功！', {
                        name: msg.nickname,
                    }),
                )
                break
            }
            case 'decrease': {
                // 输出日志（显示为红色字体）
                // eslint-disable-next-line no-console
                console.log(
                    '%c消失了一个好友：' +
                    msg.nickname +
                    '（' +
                    msg.user_id +
                    '）',
                    'color:red;',
                )
                break
            }
        }
    },

    /**
     * 消息撤回
     */
    group_recall: revokeMsg,
    friend_recall: revokeMsg,
    recall: revokeMsg,

    /**
     * 表情回应
     */
    group_msg_emoji_like: (_: string, msg: { [key: string]: any }) => {
        const chatStore = useChatStore()
        const msgId = msg.message_id
        const emojiList = msg.likes
        // 寻找消息
        chatStore.messageList.forEach((item, index) => {
            if (item.message_id === msgId) {
                chatStore.messageList[index].emoji_like = emojiList
            }
        })
    },

    /**
     * 群禁言
     */
    group_ban: (_: string, msg: { [key: string]: any }) => {
        const authStore = useAuthStore()
        const chatStore = useChatStore()
        const groupId = msg.group_id
        const userId = msg.user_id
        const status = msg.sub_type === 'ban' ? true : false
        const duration = msg.duration ?? 0 // 秒

        // 如果是自己，更新禁言时间
        if (
            userId == authStore.loginInfo.uin &&
            groupId == chatStore.chatInfo.show.id
        ) {
            if (status)
                chatStore.chatInfo.info.me_info.shut_up_timestamp =
                    (new Date().getTime() + duration * 1000) / 1000
            else chatStore.chatInfo.info.me_info.shut_up_timestamp = 0
        }

        // 只有在当前群才会显示
        if (groupId == chatStore.chatInfo.show.id)
            chatStore.messageList.push(msg)
    },

    /**
     * 踢人
     */
    kick: (_: string, msg: { [key: string]: any }) => {
        const chatStore = useChatStore()
        const groupId = msg.group_id
        if (groupId == chatStore.chatInfo.show.id) {
            // 稍微等一下再刷新成员列表
            delay(1000).then(() => {
                Connector.send(
                    'get_group_member_list',
                    { group_id: chatStore.chatInfo.show.id, no_cache: true },
                    'getGroupMemberList',
                )
                return delay(1000)
            }).then(() => {
                Connector.send(
                    'get_group_member_list',
                    { group_id: chatStore.chatInfo.show.id, no_cache: true },
                    'getGroupMemberList',
                )
            })
        }
    },

    /**
     * 戳一戳
     */
    poke: (_: string, msg: { [key: string]: any }) => {
        const { $t } = app.config.globalProperties
        const authStore = useAuthStore()
        const chatStore = useChatStore()

        const groupId = msg.group_id
        const userIds = [msg.user_id, msg.target_id]
        const info = msg.raw_info

        // 如果的当前打开的会话
        if (groupId == chatStore.chatInfo.show.id) {
            let str = ''
            const userInfo = [] as { txt: string; isMe: boolean }[]
            // 用户列表
            userIds.forEach((id) => {
                if (id == authStore.loginInfo.uin) {
                    userInfo.push({
                        txt: $t('你'),
                        isMe: true,
                    })
                } else {
                    // 到群成员列表中去找这个人
                    const user = chatStore.chatInfo.info.group_members.find(
                        (item) => {
                            return item.user_id == id
                        },
                    )
                    if (user)
                        userInfo.push({
                            txt: `<span>${user.nickname}</span>`,
                            isMe: false,
                        })
                }
            })
            // 遍历内容段
            let getQQTimes = 0
            info.forEach((item: any) => {
                switch (item.type) {
                    case 'img':
                        str += `<img src="${backend.proxyUrl(item.src)}"/>`
                        break
                    case 'nor':
                        str += item.txt
                        break
                    case 'qq': {
                        str += userInfo[getQQTimes].txt
                        getQQTimes++
                    }
                }
            })
            // 插入系统消息
            msg.str = str
            msg.pokeMe = userInfo[1].isMe
            chatStore.messageList.push(msg)
        }
    },

    approve: (_: string, msg: { [key: string]: any }) => {
        const { $t } = app.config.globalProperties
        const chatStore = useChatStore()

        const groupId = msg.group_id
        const userId = msg.user_id

        // 如果的当前打开的会话
        if (groupId == chatStore.chatInfo.show.id) {
            // 刷新群成员列表
            Connector.send(
                'get_group_member_list',
                { group_id: groupId, no_cache: true },
                'getGroupMemberList',
            )
            // 获取到用户信息
            const user = chatStore.chatInfo.info.group_members.find(
                (item) => {
                    return item.user_id == userId
                },
            )
            // 插入入群通知
            if (user) {
                const str = $t('{name} 加入了群聊', {
                    name: user.nickname,
                })
                msg.str = str
                chatStore.messageList.push(msg)
            }
        }
    },

    input_status: (_: string, msg: { [key: string]: any }) => {
        const { $t } = app.config.globalProperties
        const chatStore = useChatStore()
        const sender = msg.user_id
        if (chatStore.chatInfo.show.id == sender) {
            // 使用客户端返回的具体状态文本
            if (msg.status_text) {
                chatStore.chatInfo.show.appendInfo = $t(msg.status_text)
                setTimeout(() => {
                    chatStore.chatInfo.show.appendInfo = undefined
                }, 10000)
            } else {
                // 对方停止输入时，会有一个空的 input_status 消息
                chatStore.chatInfo.show.appendInfo = undefined
            }
        }
    },
} as { [key: string]: (name: string, msg: { [key: string]: any }) => void }

const msgFunctions = {
    /**
     * 修改群成员信息回调
     */
    updateGroupMemberInfo: () => {
        const { $t } = app.config.globalProperties
        const uiStore = useUIStore()
        const chatStore = useChatStore()
        const popInfo = {
            title: $t('操作'),
            html: `<span>${$t('正在确认操作……')}</span>`
        }
        uiStore.popBoxList.push(popInfo)
        // 稍微等一下再刷新成员列表
        delay(1000).then(() => {
            Connector.send(
                'get_group_member_list',
                { group_id: chatStore.chatInfo.show.id, no_cache: true },
                'getGroupMemberList',
            )
            return delay(1000)
        }).then(() => {
            Connector.send(
                'get_group_member_list',
                { group_id: chatStore.chatInfo.show.id, no_cache: true },
                'getGroupMemberList',
            )
            uiStore.popBoxList.shift()
        })
    },

    /**
     * 保存 Bot 信息
     */
    getVersionInfo: (_: string, msg: { [key: string]: any }) => {
        const data = getMsgData('version_info', msg, msgPath.version_info)[0]

        if (data) {
            // 如果 runtime 存在（即不是第一次连接），且 app_name 不同，重置 runtime
            const authStore = useAuthStore()
            resetRimtime(
                authStore.botInfo.app_name != data.app_name && !login.status,
            )

            authStore.botInfo = data
            if (Option.get('open_ga_bot') !== false) {
                const appVersion = data.app_version ? ',' + data.app_version : ''
                const appInfo = data.app_name ? data.app_name + appVersion : '（未知）'

                sendStatEvent('connect', { method: data.app_name })
                sendIdentifyData({ bot_version: appInfo })
            }
            if (!login.status) {
                // 尝试动态载入对应的 pathMap
                if (data.app_name !== undefined) {
                    const getMap = loadJsonMap(data.app_name)
                    if (getMap != null) msgPath = getMap
                }
                // 继续获取后续内容
                Connector.send('get_login_info', {}, 'getLoginInfo')
            }
        }
    },

    /**
     * 保存账号信息
     */
    getLoginInfo: (_: string, msg: { [key: string]: any }) => {
        const msgBody = getMsgData('login_info', msg, msgPath.login_info)
        if (msgBody) {
            const data = msgBody[0]
            const authStore = useAuthStore()

            // 如果 runtime 存在（即不是第一次连接），且 uin 不同，重置 runtime
            resetRimtime(authStore.loginInfo.uin != data.uin && !login.status)

            // 完成登陆初始化
            authStore.loginInfo = data
            login.status = true

            // 保存用户信息到连接历史
            saveConnectionToHistory(login.address, login.token, data.uin, data.nickname)

            // 显示账户菜单
            updateMenu({
                parent: 'account',
                id: 'userName',
                action: 'label',
                value: data.nickname,
            })
            const title = `${data.nickname} `
            if (backend.platform == 'web') {
                document.title = title + '- Stapxs QQ Lite'
            } else {
                document.title = title
                backend.call(undefined, 'win:setTitle', false, title)
            }
            // 结束登录页面的水波动画
            clearLoginWaveTimer()
            // 跳转标签卡
            const barMsg = document.getElementById('bar-msg')
            if (barMsg != null) barMsg.click()
            // 加载列表消息
            reloadUsers()
            reloadCookies()
            // 尝试加载 QZore 列表
            if (authStore.jsonMap.get_qzone_feed) {
                Connector.send(authStore.jsonMap.get_qzone_feed.name, {}, 'getQzoneFeed')
            }
        }
    },

    /**
     * 补充登录信息
     * @deprecated 此功能在 OICQ 后的 bot 中没有再实现，暂时保留
     */
    getMoreLoginInfo: (_: string, msg: { [key: string]: any }) => {
        const authStore = useAuthStore()
        authStore.loginInfo.info = msg.data.data.result.buddy.info_list[0]
    },

    /**
     * 保存好友列表
     */
    getGroupList: (_: string, msg: { [key: string]: any }) => {
        saveUser(msg, 'group')
    },
    getFriendList: (_: string, msg: { [key: string]: any }) => {
        saveUser(msg, 'friend')
    },

    /**
     * 保存分组信息（独立保存）
     */
    getFriendCategory: (_: string, msg: { [key: string]: any }) => {
        const contactStore = useContactStore()
        const list = getMsgData(
            'friend_category',
            msg,
            msgPath.friend_category,
        ) as {
            class_id: number
            class_name: string
            sort_id: number
            users: number[]
        }[]
        if (list != undefined) {
            saveClassInfo(list)
        }
        // 刷新用户列表的分类信息
        list.forEach((item) => {
            item.users.forEach((id) => {
                contactStore.userList.forEach((user) => {
                    if (user.user_id == id && user.class_id == undefined) {
                        user.class_id = item.class_id
                        user.class_name = item.class_name
                    }
                })
            })
        })
    },

    /**
     * 获取群成员信息
     */
    getUserInfoInGroup: (_: string, msg: { [key: string]: any }) => {
        const chatStore = useChatStore()
        const data = getMsgData(
            'group_member_info',
            msg,
            msgPath.group_member_info,
        )
        if (data && data[0]) {
            const info = data[0]
            // 单独判断下 shut_up_timestamp
            if (info.shut_up_timestamp * 1000 < Date.now()) {
                info.shut_up_timestamp = 0
            }
            chatStore.chatInfo.info.me_info = info
        }
    },

    /**
     * 保存群成员列表
     */
    getGroupMemberList: (_: string, msg: { [key: string]: any }) => {
        const chatStore = useChatStore()
        const data = msg.data as GroupMemberInfoElem[]
        const sortAndSaveMembers = () => {
            const adminList = data.filter((item: GroupMemberInfoElem) => {
                return item.role === 'admin'
            })
            adminList.sort((a, b) => {
                if (a.py_start && b.py_start) {
                    return a.py_start.charCodeAt(0) - b.py_start.charCodeAt(0)
                }
                return 0
            })
            const createrList = data.filter((item: GroupMemberInfoElem) => {
                return item.role === 'owner'
            })
            const memberList = data.filter((item: GroupMemberInfoElem) => {
                return item.role !== 'admin' && item.role !== 'owner'
            })
            memberList.sort((a, b) => {
                if (a.py_start && b.py_start) {
                    return a.py_start.charCodeAt(0) - b.py_start.charCodeAt(0)
                }
                return 0
            })
            chatStore.chatInfo.info.group_members = createrList.concat(adminList.concat(memberList))
        }

        data.forEach((item: any) => {
            let name: string
            if (item.card != undefined && item.card != '') {
                name = item.card
            } else if (item.nickname != undefined && item.nickname != '') {
                name = item.nickname
            } else {
                name = item.user_id.toString()
            }

            // 获取拼音首字母
            item.py_start = resolvePinyinFirstChar(name.substring(0, 1))
        })
        sortAndSaveMembers()

        if (!isPinyinReady()) {
            void ensurePinyinLoaded().then((loaded) => {
                if (!loaded) return
                data.forEach((item: any) => {
                    let name: string
                    if (item.card != undefined && item.card != '') {
                        name = item.card
                    } else if (item.nickname != undefined && item.nickname != '') {
                        name = item.nickname
                    } else {
                        name = item.user_id.toString()
                    }
                    item.py_start = resolvePinyinFirstChar(name.substring(0, 1))
                })
                sortAndSaveMembers()
            })
        }
    },

    /**
     * 保存聊天记录
     */
    getChatHistoryFist: (_: string, msg: { [key: string]: any }) => {
        const uiStore = useUIStore()
        if (msg.data === null) {
            new PopInfo().add(
                PopType.ERR,
                app.config.globalProperties.$t('获取历史记录失败'),
            )
            uiStore.loadHistoryFail = true
            return
        }
        // 无论是否有本地预填充，都以网络数据替换（保证最新消息不遗漏）
        saveMsg(msg)
    },
    getChatHistoryGapFill: (
        _: string,
        msg: { [key: string]: any },
        metaArgs?: string[],
    ) => {
        const authStore = useAuthStore()
        const chatStore = useChatStore()
        // echo 格式：getChatHistoryGapFill_<anchorMsgId>
        // anchorMsgId 是 gap 之后第一条消息的 message_id（插入点）
        const anchorMsgId = metaArgs?.[1]
        if (!anchorMsgId || msg.data === null) return
        const rawList = getMsgData('message_list', msg, msgPath.message_list)
        getMessageList(rawList)
            .then((list) => {
                if (!list || list.length === 0) return
                const inserted = insertHistorySegmentAtAnchor(
                    chatStore.messageList,
                    anchorMsgId,
                    list,
                )
                if (inserted.length === chatStore.messageList.length) return
                replaceMessageListInPlace(inserted)
                // 同步存入本地 DB，以便下次直接从本地加载
                saveMessagesWithSideEffects(authStore.loginInfo.uin, list)
            })
            .catch(() => {})
    },
    getChatHistory: (_: string, msg: { [key: string]: any }) => {
        const uiStore = useUIStore()
        if (msg.data === null) {
            new PopInfo().add(
                PopType.ERR,
                app.config.globalProperties.$t('获取历史记录失败'),
            )
            uiStore.loadHistoryFail = true
            uiStore.historyBeforeTime = undefined
            uiStore.nowGetHistory = false
            return
        }
        const pan = document.getElementById('msgPan')
        if (pan) {
            const oldScrollHeight = pan.scrollHeight
            saveMsg(msg, 'top').then(() => {
                nextTick(() => {
                    setTimeout(() => {
                        logger.debug(`滚动前高度：${oldScrollHeight}，当前高度：${pan.scrollHeight}，滚动位置：${pan.scrollHeight - oldScrollHeight}`)
                        pan.style.scrollBehavior = 'unset'
                        // 纠正滚动位置
                        pan.scrollTop = pan.scrollHeight - oldScrollHeight
                        pan.style.scrollBehavior = 'smooth'
                    }, 200);
                })
            })
        }
    },

    getChatHistoryOnMsg: (
        _: string,
        msg: { [key: string]: any },
        echoList: string[],
    ) => {
        const contactStore = useContactStore()
        const id = Number(echoList[1])
        if (id) {
            try {
                // 对消息进行一次格式化处理
                let list = getMsgData('message_list', msg, msgPath.message_list)
                if (list != undefined) {
                    list = parseMsgList(
                        list,
                        msgPath.message_list.type,
                        msgPath.message_value,
                    )
                    // 更新消息列表
                    const onmsg = contactStore.baseOnMsgList.get(Number(id))
                    if (onmsg && list[0]) {
                        Object.assign(onmsg, formatMessageData(list[0], Boolean(onmsg.group_id)))
                        contactStore.baseOnMsgList.set(id, onmsg)
                        updateBaseOnMsgList()
                    }
                }
            } catch (e) {
                // do nothing
            }
        }
    },

    /**
     * 发送消息后处理
     */
    sendMsgBack: (
        _: string,
        msg: { [key: string]: any },
        echoList: string[],
    ) => {
        const authStore = useAuthStore()
        const chatStore = useChatStore()
        if (msg.message_id == undefined) {
            msg.message_id = msg.data.message_id
        }
        if (echoList[1] == 'forward') {
            // PS：这儿写是写了转发成功，事实上不确定消息有没有真的发送出去（x
            popInfo.add(
                PopType.INFO,
                app.config.globalProperties.$t('消息已转发'),
            )
        } else if (echoList[1] == 'uuid') {
            const messageId = echoList[2]
            // 去 messagelist 里找到这条消息
            chatStore.messageList.forEach((item) => {
                if (item.message_id == messageId) {
                    item.message_id = msg.message_id
                    item.fake_msg = false
                    return
                }
            })
            // 请求消息内容
            // PS：其实有消息通知的情况下不需要再去主动获取了
            // 但是为了兼容没有开启自身消息通知的情况，还是保留了这个功能
            Connector.send(
                authStore.jsonMap.get_message.name ?? 'get_msg',
                { message_id: msg.message_id },
                'getSendMsg_' + msg.message_id,
            )
        }
    },
    sendFileBack: (
        _: string,
        msg: { [key: string]: any },
        echoList: string[],
    ) => {
        // 标记上传任务完成
        if (echoList[1] === 'task' && echoList[2] && echoList[3]) {
            const taskId = echoList[1] + '_' + echoList[2] + '_' + echoList[3]
            completeUploadTask(taskId)
        }
        const newEchoList = ['sendMsgBack', ...echoList.slice(4)]
        msgFunctions['sendMsgBack'](_, msg, newEchoList)
    },
    /**
     * 获取收藏表情
     */
    getRoamingStamp: (
        _: string,
        msg: { [key: string]: any },
        echoList: string[],
    ) => {
        const authStore = useAuthStore()
        const getCount = Number(echoList[1])
        const data = msg.data
        if (msgPath.roaming_stamp.reverse) {
            data.reverse()
        }
        const stickerStore = useStickerStore()
        const stickerCache = stickerStore.stickerCache ?? []
        if (stickerCache.length == 0) {
            stickerStore.stickerCache = data
        } else if (authStore.jsonMap.roaming_stamp.pagerType == 'full') {
            // 全量分页模式下不追加
            if (getCount > stickerCache.length + 48) {
                // 已经获取到所有内容了
                data.push('end')
            }
            stickerStore.stickerCache = data
        } else {
            stickerStore.stickerCache = stickerCache.concat(data)
        }
    },

    /**
     * 保存群补充信息
     * @deprecated 功能在后期更新中未被重构检查，可能存在问题
     */
    getMoreGroupInfo: (_: string, msg: { [key: string]: any }) => {
        const chatStore = useChatStore()
        chatStore.chatInfo.info.group_info = msg.data.data
    },

    /**
     * 保存好友补充信息
     * @deprecated 功能在后期更新中未被重构检查，可能存在问题
     */
    getMoreUserInfo: (_: string, msg: { [key: string]: any }) => {
        const chatStore = useChatStore()
        // chatStore.chatInfo.info.user_info =
        //     msg.data.data.result.buddy.info_list[0]
        const data = getMsgData('friend_info', msg, msgPath.friend_info)[0]
        data.regTime = new Date(data.reg_time).getTime()
        if (data) {
            chatStore.chatInfo.info.user_info = data
        }
    },

    /**
     * 获取群通知
     */
    getGroupNotices: (_: string, msg: { [key: string]: any }) => {
        const chatStore = useChatStore()
        const list = getMsgData('group_notices', msg, msgPath.group_notices)
        if (!list) return

        // 组装img信息
        let lastImg: Img | undefined
        for (const notice of list) {
            if (!notice.img_id || notice.img_id.length == 0) continue
            const img = markRaw(new Img(
                `https://p.qlogo.cn/gdynamic/${notice.img_id}/0/`
            ))
            if (lastImg) img.insertPrev(lastImg)
            notice.img = img
            lastImg = img
        }
        chatStore.chatInfo.info.group_notices = list
    },

    /**
     * 获取群文件列表
     */
    getGroupFiles: (_: string, msg: { [key: string]: any }) => {
        const chatStore = useChatStore()
        const list = getMsgData('group_files', msg, msgPath.group_files) as (GroupFileElem & GroupFileFolderElem)[]
        // 排序；文件夹在前，文件在后
        const folderList = list.filter((item) => {
            return item.folder_id
        })
        const fileList = list.filter((item) => {
            return item.file_id
        })
        // 对它们各自排序，文件夹按照 create_time 降序，文件按照 upload_time 降序
        folderList.sort((a, b) => {
            return b.create_time - a.create_time
        })
        fileList.sort((a, b) => {
            return b.upload_time - a.upload_time
        })
        // 合并
        chatStore.chatInfo.info.group_files = folderList.concat(fileList)
    },

    /**
     * 获取群文件文件夹文件
     */
    getGroupDirFiles: (_: string, msg: { [key: string]: any }, echoList: string[]) => {
        const chatStore = useChatStore()
        // TODO: 有分页

        // 默认使用主目录相同的结构，如果存在子目录结构的定义则使用子目录的结构
        let map = msgPath.group_files
        if (msgPath.group_folder_files.source) {
            map = msgPath.group_folder
        }
        const list = getMsgData('group_files', msg, map) as (GroupFileElem & GroupFileFolderElem)[]
        // 排序；文件夹在前，文件在后
        const folderList = list.filter((item) => {
            return item.folder_id
        })
        const fileList = list.filter((item) => {
            return item.file_id
        })
        // 对它们各自排序，文件夹按照 create_time 降序，文件按照 upload_time 降序
        folderList.sort((a, b) => {
            return b.create_time - a.create_time
        })
        fileList.sort((a, b) => {
            return b.upload_time - a.upload_time
        })
        // 寻找 item
        const folderId = echoList[1]
        const folder = chatStore.chatInfo.info.group_files.find((item) => {
            return item.folder_id == folderId
        })
        if (folder) {
            folder.items = fileList
        }
    },

    /**
     * 下载文件（聊天中）
     */
    downloadFile: (_: string, msg: { [key: string]: any }, echoList: string[]) => {
        const data = getMsgData('file_download', msg, msgPath.file_download)[0]
        const url = data.file_url

        const fileName = decodeURIComponent(atob(echoList[2]))
        const fileSize = data.file_size || 0

        // 使用文件传输管理器下载
        addDownloadTask({
            fileName,
            fileSize,
            filePath: '',
            url
        })
    },

    /**
     * 下载文件（群文件）
     */
    downloadGroupFile: (_: string, msg: { [key: string]: any }, echoList: string[]) => {
        const data = getMsgData('file_download', msg, msgPath.file_download)[0]
        const url = data.file_url

        const fileName = decodeURIComponent(atob(echoList[2]))
        const fileSize = data.file_size || 0

        // 使用文件传输管理器下载
        addDownloadTask({
            fileName,
            fileSize,
            filePath: '',
            url
        })
    },

    /**
     * 文件预览下载
     */
    loadFileBase: (
        _: string,
        msg: { [key: string]: any },
        echoList: string[],
    ) => {
        const chatStore = useChatStore()
        const data = getMsgData('file_download', msg, msgPath.file_download)[0]
        let url = data.file_url
        const msgId = echoList[1]
        const ext = echoList[2]
        if (url) {
            // 寻找消息
            const msg = chatStore.messageList.find((item) => {
                return item.message_id == msgId
            })
            if (msg) {
                if (document.location.protocol == 'https:') {
                    // 判断文件 URL 的协议
                    // PS：Chrome 不会对 http 文件进行协议升级
                    if (url.toLowerCase().startsWith('http:')) {
                        url = 'https' + url.substring(url.indexOf('://'))
                    }
                }
                msg.fileView.url = url
                msg.fileView.ext = ext
            }
        }
    },

    /**
     * 保存精华消息
     */
    getJin: (_: string, msg: { [key: string]: any }) => {
        const chatStore = useChatStore()
        const jinList = getMsgData('group_essence', msg, msgPath.group_essence)
        const is_end = getMsgData(
            'is_end',
            msg,
            msgPath.group_essence.is_end,
        ) ?? [true]
        if (jinList && is_end) {
            if (chatStore.chatInfo.info.jin_info.list.length == 0) {
                chatStore.chatInfo.info.jin_info.list = jinList
            } else {
                const now_page = chatStore.chatInfo.info.jin_info.pages ?? 0

                chatStore.chatInfo.info.jin_info.list =
                    chatStore.chatInfo.info.jin_info.list.concat(jinList)
                chatStore.chatInfo.info.jin_info.pages = now_page + 1
            }
            chatStore.chatInfo.info.jin_info.is_end = is_end[0]
        }
    },

    /**
     * 获取发送的消息（消息发送后处理）
     * @deprecated 功能已被遗弃，暂时保留方法
     */
    getSendMsg: (
        _: string,
        msg: { [key: string]: any },
        echoList: string[],
    ) => {
        const authStore = useAuthStore()
        const chatStore = useChatStore()
        const msgInfo = getMsgData('message_info', msg.data, msgPath.message_info)
        if (msgInfo) {
            const info = msgInfo[0]
            if (echoList[1] !== info.message_id.toString()) {
                // 返回的不是这条消息，重新请求
                setTimeout(() => {
                    Connector.send(
                        authStore.jsonMap.get_message.name ?? 'get_msg',
                        { message_id: echoList[1] },
                        'getSendMsg_' + echoList[1]
                    )
                }, 5000)
            } else {
                // 列表内最近的一条 fake_msg（倒序查找）
                let fakeMsg = null as any
                for (let i = chatStore.messageList.length - 1; i > 0; i--) {
                    const msg = chatStore.messageList[i]
                    if (msg.fake_msg != undefined && info.sender == authStore.loginInfo.uin) {
                        fakeMsg = msg
                        break
                    }
                }
                // 预发送消息刷新
                if (fakeMsg != null) {
                    // 将这条消息直接替换掉
                    const trueMsg = getMsgData(
                        'message_list',
                        buildMsgList([msg.data]),
                        msgPath.message_list,
                    )
                    getMessageList(trueMsg).then((trueMsg) => {
                        if (trueMsg?.length == 1) {
                            // 使用消息对象引用直接更新，避免索引问题
                            fakeMsg.message = trueMsg[0].message
                            fakeMsg.raw_message = trueMsg[0].raw_message
                            fakeMsg.time = trueMsg[0].time
                            fakeMsg.fake_msg = undefined
                            fakeMsg.revoke = false
                        }
                    })
                }
            }
        }
    },

    /**
     * 设置消息已读
     */
    readMemberMessage: (_: string, msg: { [key: string]: any }) => {
        const authStore = useAuthStore()
        const data = msg.data[0]
        const msgName = authStore.jsonMap.set_message_read.private_name
        let private_name = authStore.jsonMap.set_message_read.private_name
        if (!private_name) private_name = msgName
        if (data.group_id != undefined) {
            Connector.send(
                msgName,
                {
                    message_id: data.message_id,
                    group_id: data.group_id,
                },
                'setMessageRead',
            )
        } else {
            Connector.send(
                private_name,
                {
                    message_id: data.message_id,
                    user_id: data.self_id,
                },
                'setMessageRead',
            )
        }
        // 关闭所有通知
        new Notify().closeAll(data.group_id ?? data.self_id)
    },

    /**
     * 系统通知后处理
     */
    setFriendAdd: updateSysInfo,
    setGroupAdd: updateSysInfo,

    /**
     * 获取会话历史
     */
    getRecentContact: (_: string, data: any) => {
        const authStore = useAuthStore()
        const contactStore = useContactStore()
        const settingsStore = useSettingsStore()
        const list = getMsgData('recent_contact', data, msgPath.recent_contact)
        if (list != undefined) {
            // user_id: /peerUin
            // time: /msgTime
            // chat_type: /chatType
            // 过滤掉 chatType 不是 1 和 2 的
            let back = list.filter((item) => {
                return item.chat_type == 1 || item.chat_type == 2
            })
            // 排除掉在置顶列表里的
            const topList = settingsStore.sysConfig.top_info as {
                [key: string]: number[]
            } | null
            if (topList != null) {
                const top = topList[authStore.loginInfo.uin]
                if (top != undefined) {
                    back = back.filter((item) => {
                        return top.indexOf(Number(item.user_id)) == -1
                    })
                }
            }
            // 去重
            back = back.filter((item, index, arr) => {
                return (
                    arr.findIndex((item2) => {
                        return item2.user_id == item.user_id
                    }) == index
                )
            })
            back.forEach((item) => {
                // 去消息列表里找一下它
                const user = contactStore.userList.find((user) => {
                    return user.user_id == item.user_id || user.group_id == item.user_id
                })
                if (user) {
                    contactStore.baseOnMsgList.set(Number(item.user_id), user)
                    updateLastestHistory(user)
                }
            })
        }
        // “显示全部会话”会包含 recent_contact 之外的群；限流补取这些群的最后一条历史。
        groupPreviewHydrator.scheduleMissingSessions()
    },

    /**
     * 表情回应后处理
     */
    SendRespondBack: (
        _: string,
        __: { [key: string]: any },
        echoList: string[],
    ) => {
        const chatStore = useChatStore()
        const msgId = echoList[1]
        const id = Number(echoList[2])
        // 从消息列表中找到这条消息
        chatStore.messageList.forEach((item, index) => {
            if (item.message_id === msgId) {
                if (chatStore.messageList[index].emoji_like) {
                    // 寻找有没有 emoji_id 相同的
                    let hasAdd = false
                    chatStore.messageList[index].emoji_like.forEach(
                        (item: { emoji_id: number; count: number }) => {
                            if (item.emoji_id == id) {
                                item.count++
                                hasAdd = true
                            }
                        },
                    )
                    if (!hasAdd) {
                        chatStore.messageList[index].emoji_like.push({
                            emoji_id: id,
                            count: 1,
                        })
                    }
                } else {
                    chatStore.messageList[index].emoji_like = [
                        { emoji_id: id, count: 1 },
                    ]
                }
            }
        })
    },

    /**
     * 获取 cookie
     * @deprecated 暂时没用到他
     */
    getCookies: (
        _: string,
        msg: { [key: string]: any },
        echoList: string[],
    ) => {
        const authStore = useAuthStore()
        // 拆分 cookie
        const cookieObject = {} as { [key: string]: string }
        msg.data.cookies.split('; ').forEach((item: string) => {
            const key = item.split('=')[0]
            const value = item.split('=')[1]
            cookieObject[key] = value
        })
        // 计算 bkn
        const skey = cookieObject['skey'] || ''
        let hash = 5381

        for (let i = 0; i < skey.length; i++) {
            hash += (hash << 5) + skey.charCodeAt(i)
        }
        // 保存 cookie 和 bkn
        const domain = echoList[1]
        if (!authStore.loginInfo.webapi) authStore.loginInfo.webapi = {}
        if (!authStore.loginInfo.webapi[domain])
            authStore.loginInfo.webapi[domain] = {}
        authStore.loginInfo.webapi[domain].cookie = cookieObject
        authStore.loginInfo.webapi[domain].bkn = (
            hash & 0x7fffffff
        ).toString()
    },

    /**
     * 设置消息已读回调
     */
    setMessageRead() {
        // do nothing
    },

    /**
     * 获取 QQ 空间推送列表
     * @param _
     * @param msg
     */
    getQzoneFeed: (_: string, msg: { [key: string]: any }) => {
        const qzoneStore = useQzoneStore()
        const list = getMsgData('get_qzone_feed', msg, msgPath.get_qzone_feed)
        if (list) {
            qzoneStore.state.currentView = 'feed'
            qzoneStore.qzoneFeedList = list
        }
    },

    /**
     * 获取 QQ 空间“我的”列表
     * @param _
     * @param msg
     */
    getQzoneMsg: (_: string, msg: { [key: string]: any }) => {
        const qzoneStore = useQzoneStore()
        const list = getMsgData('get_qzone_msg', msg, msgPath.get_qzone_msg)
        if (list) {
            qzoneStore.state.currentView = 'my'
            if (qzoneStore.state.myPagePos === 0) {
                qzoneStore.qzoneFeedList = list
            } else {
                qzoneStore.qzoneFeedList = [
                    ...qzoneStore.qzoneFeedList,
                    ...list,
                ]
            }
            qzoneStore.state.myHasMore = list.length >= qzoneStore.state.myPageSize
        }
        qzoneStore.state.myLoading = false
    }
} as {
    [key: string]: (
        name: string,
        msg: { [key: string]: any },
        echoList?: string[],
    ) => void
}

const handlers: Record<string, (payload: any, metaArgs?: string[]) => void> = {
    ...(Object.entries(msgFunctions).reduce((acc, [key, fn]) => ({
        ...acc,
        [key]: (payload: any, metaArgs?: string[]) => fn(key, payload, metaArgs)
    }), {})),
    ...(Object.entries(noticeFunctions).reduce((acc, [key, fn]) => ({
        ...acc,
        [key]: (payload: any) => fn(key, payload)
    }), {}))
};

// ==========================================

function saveUser(msg: { [key: string]: any }, type: string) {
    const authStore = useAuthStore()
    const contactStore = useContactStore()
    const settingsStore = useSettingsStore()
    listLoadTimes++
    let list: any[] | undefined
    if (msgPath.user_list)
        list = getMsgData('user_list', msg, msgPath.user_list)
    else {
        switch (type) {
            case 'friend':
                list = getMsgData('friend_list', msg, msgPath.friend_list)
                if (list)
                    // 根据 user_id 去重
                    list = list.filter((item, index, arr) => {
                        return (
                            arr.findIndex((item2) => {
                                return item2.user_id == item.user_id
                            }) == index
                        )
                    })
                break
            case 'group':
                list = getMsgData('group_list', msg, msgPath.group_list)
                if (list)
                    // 根据 group_id 去重
                    list = list.filter((item, index, arr) => {
                        return (
                            arr.findIndex((item2) => {
                                return item2.group_id == item.group_id
                            }) == index
                        )
                    })
                break
        }
    }
    if (list != undefined) {
        const groupNames = {} as { [key: number]: string }
        list.forEach((item, index) => {
            if (item.group_name == null || item.group_name == undefined) {
                item.group_name = ''
            }
            if (list?.[index]) {
                list[index].py_name = { main: [], short: [] }
                list[index].py_start = ' '
            }
            // 构建分类
            if (type == 'friend') {
                if (item.class_id != undefined && item.class_name) {
                    if (typeof item.class_name == 'string') {
                        groupNames[item.class_id] = item.class_name
                    } else {
                        groupNames[item.class_id] = item.class_name[0]
                    }
                }
                delete item.group_name
            } else {
                delete item.class_id
                delete item.class_name
            }
        })
        if (Object.keys(groupNames).length > 0) {
            // 把 groupNames 处理为 { class_id: number, class_name: string }[]
            const groupNamesList = [] as {
                class_id: number
                class_name: string
            }[]
            for (const key in groupNames) {
                groupNamesList.push({
                    class_id: Number(key),
                    class_name: groupNames[key],
                })
            }
            saveClassInfo(groupNamesList)
        }
        if (isPinyinReady()) {
            buildPinyinForContacts(list)
        } else {
            hydrateContactPinyinLater(list)
        }
        sortContactListByPinyin(list)
        // 实时消息可能比联系人列表更早到达；用真实联系人资料接管临时会话，保留预览状态。
        const didMergeEarlySessions = mergeEarlySessionContacts(
            list,
            contactStore.baseOnMsgList,
        )
        contactStore.userList = contactStore.userList.concat(list)
        if (
            settingsStore.sysConfig.session_display_mode === 'all' ||
            didMergeEarlySessions
        ) {
            updateBaseOnMsgList()
        }
        // 刷新置顶列表
        const info = settingsStore.sysConfig.top_info as {
            [key: string]: number[]
        } | null
        if (info != null) {
            const topList = info[authStore.loginInfo.uin]
            if (topList !== undefined) {
                list.forEach((item) => {
                    const id = Number(
                        item.user_id ? item.user_id : item.group_id,
                    )
                    if (topList.indexOf(id) >= 0) {
                        item.always_top = true
                        // 判断它在不在消息列表里
                        if (contactStore.baseOnMsgList.get(id) == undefined) {
                            contactStore.baseOnMsgList.set(id, item)
                            // 给它获取一下最新的一条消息
                            // 给置顶的用户刷新最新一条的消息用于显示
                            contactStore.userList.forEach((item) => {
                                if (item.always_top) {
                                    updateLastestHistory(item)
                                }
                            })
                        }
                    }
                })
            }
        }
        // 更新菜单
        updateMenu({
            parent: 'account',
            id: 'userList',
            action: 'label',
            value: app.config.globalProperties.$t('用户列表（{count}）', {
                count: contactStore.userList.length,
            }),
        })
    }
    // 如果获取次数大于 0 并且是双数，刷新一下历史会话
    if (listLoadTimes > 0 && listLoadTimes % 2 == 0) {
        // 获取最近的会话
        if (authStore.jsonMap.recent_contact)
            Connector.send(
                authStore.jsonMap.recent_contact.name,
                {},
                'getRecentContact',
            )
    }
    // 如果是分离式的好友列表，继续获取分类信息
    if (type == 'friend' && authStore.jsonMap.friend_category) {
        Connector.send(
            authStore.jsonMap.friend_category.name,
            {},
            'getFriendCategory',
        )
    }
}

function saveClassInfo(
    list: { class_id: number; class_name: string; sort_id?: number }[],
) {
    const settingsStore = useSettingsStore()
    if (list[0].sort_id != undefined) {
        // 如果有 sort_id，按 sort_id 排序，从小到大
        list.sort((a, b) => {
            if (a.sort_id && b.sort_id) return a.sort_id - b.sort_id
            else return 0
        })
    } else {
        // 按 class_id 排序
        list.sort((a, b) => {
            return a.class_id - b.class_id
        })
    }

    settingsStore.classes = list
}

async function saveMsg(msg: any, append = undefined as undefined | string) {
    const uiStore = useUIStore()
    const authStore = useAuthStore()
    const chatStore = useChatStore()
    const contactStore = useContactStore()
    const settingsStore = useSettingsStore()
    let list = await normalizeMessagesFromPayload(msg)
    if (list != undefined) {
        const historyBeforeTime = Number(uiStore.historyBeforeTime)
        const hasHistoryBeforeTime = Number.isFinite(historyBeforeTime)

        // 检查消息是否是当前聊天的消息
        const firstMsg = list[0]
        const infoList = getMsgData(
            'message_info',
            firstMsg,
            msgPath.message_info,
        )
        if (infoList != undefined) {
            const info = infoList[0]
            const id = info.group_id ?? info.private_id
            if (id != undefined && id != chatStore.chatInfo.show.id) {
                return
            }
        }
        // 将消息中 message 字段为空数组的消息过滤掉
        list = list.filter((item: any) => {
            return item.message.length > 0
        })

        // 上拉历史时按时间戳作为边界（兼容增量/全量两种分页模式）。
        if (hasHistoryBeforeTime && append === 'top') {
            list = list.filter((item: any) => {
                const t = Number(item?.time)
                return Number.isFinite(t) && t <= historyBeforeTime
            })
        }

        // 处于上拉边界过滤时，若结果为空则保留当前列表，避免误清空。
        if (hasHistoryBeforeTime && append === 'top' && list.length < 1) {
            uiStore.historyBeforeTime = undefined
            uiStore.nowGetHistory = false
            return
        }

        // 保存到本地历史
        saveMessagesWithSideEffects(authStore.loginInfo.uin, list)
        // 如果分页不是增量的，就不使用追加
        if (
            append == 'top' &&
            authStore.jsonMap.message_list?.pagerType == 'full'
        ) {
            append = undefined
        }
        // 追加处理
        if (append != undefined) {
            // 没有更旧的消息能加载了，禁用允许加载标志
            if (list.length < 1) {
                uiStore.canLoadHistory = false
                uiStore.historyBeforeTime = undefined
                return
            }
            const merged = mergeMessagesByIdAndTime(chatStore.messageList, list)
            replaceMessageListInPlace(merged)
        } else {
            if (
                settingsStore.sysConfig.enable_local_history &&
                settingsStore.sysConfig.mixed_load_messages !== false
            ) {
                const merged = mergeMessagesByIdAndTime(chatStore.messageList, list)
                replaceMessageListInPlace(merged)
            } else {
                replaceMessageListInPlace(list)
            }
        }
        // 消息后处理
        // PS: 部分消息类型可能需要获取附加内容，在此处进行处理
        chatStore.messageList.forEach((item) => {
            sendMsgAppendInfo(item)
        })
        // 将最新消息同步到会话列表；通过会话 Map 更新以触发 shallowRef 列表刷新。
        const lastMsg =
            chatStore.messageList[chatStore.messageList.length - 1]
        if (lastMsg) {
            const user = contactStore.userList.find((item) => {
                return (
                    item.group_id == chatStore.chatInfo.show.id ||
                    item.user_id == chatStore.chatInfo.show.id
                )
            })
            const sessionId = Number(chatStore.chatInfo.show.id)
            const session = contactStore.baseOnMsgList.get(sessionId) ?? user
            if (session) {
                const preview = formatMessageData(
                    lastMsg,
                    chatStore.chatInfo.show.type == 'group',
                )
                if (user) Object.assign(user, preview)
                Object.assign(session, preview)
                contactStore.baseOnMsgList.set(sessionId, session)
                updateBaseOnMsgList()
            }
        }

        if (hasHistoryBeforeTime) {
            uiStore.historyBeforeTime = undefined
        }
    }
}

async function normalizeMessagesFromPayload(payload: any): Promise<any[] | undefined> {
    const rawList = getMsgData('message_list', payload, msgPath.message_list)
    return getMessageList(rawList)
}

export async function normalizeMessagesForPreview(payload: any): Promise<any[]> {
    const authStore = useAuthStore()
    const map = authStore.jsonMap

    if (
        payload &&
        payload.post_type === 'message' &&
        Array.isArray(payload.message)
    ) {
        const directList = parseMsgList(
            [payload],
            map?.message_list?.type ?? '$',
            map?.message_value,
        )

        if (directList.length === 0) return []
        return Promise.all(directList.map(msgPreprocess))
    }

    if (!map?.message_list) return []

    let rawList = getMsgData('message_list', payload, map.message_list)
    if (rawList == undefined) {
        rawList = getMsgData(
            'message_list',
            buildMsgList([payload]),
            map.message_list,
        )
    }
    if (rawList == undefined) return []

    const list = parseMsgList(
        rawList,
        map.message_list.type,
        map.message_value,
    )
    if (list.length === 0) return []

    if (map.message_list.order === 'reverse') {
        list.reverse()
    }

    list.forEach((item: any) => {
        if (!item.post_type) {
            item.post_type = 'message'
        }
    })

    return Promise.all(list.map(msgPreprocess))
}

function normalizeNewIncomingMessage(data: any): any[] {
    let list = getMsgData(
        'message_list',
        buildMsgList([data]),
        msgPath.message_list,
    )

    if (list == undefined) return []

    list = parseMsgList(
        list,
        msgPath.message_list.type,
        msgPath.message_value,
    )
    return list
}

function insertHistorySegmentAtAnchor(
    current: any[],
    anchorMsgId: string,
    segment: any[],
): any[] {
    const insertIdx = current.findIndex((m) => m.message_id === anchorMsgId)
    if (insertIdx === -1) return current

    const existingIds = new Set(current.map((m) => normalizeMessageId(m.message_id)))
    const newMsgs = segment.filter((m) => !existingIds.has(normalizeMessageId(m.message_id)))
    if (newMsgs.length === 0) return current

    const merged = [
        ...current.slice(0, insertIdx),
        ...newMsgs,
        ...current.slice(insertIdx),
    ]
    return mergeMessagesByIdAndTime([], merged)
}

function normalizeMessageId(id: unknown): string {
    if (id === null || id === undefined) return ''
    return String(id)
}

function getMessageTimestamp(msg: any): number {
    const t = Number(msg?.time)
    return Number.isFinite(t) ? t : 0
}

function buildFallbackMessageKey(msg: any): string {
    const seq = msg?.message_seq ?? msg?.seq_id ?? msg?.seq ?? ''
    const sender = msg?.sender?.user_id ?? msg?.user_id ?? msg?.sender_id ?? ''
    const ts = getMessageTimestamp(msg)
    return `${ts}|${sender}|${seq}`
}

function compareMessageOrder(a: any, b: any): number {
    const ta = getMessageTimestamp(a)
    const tb = getMessageTimestamp(b)
    if (ta !== tb) return ta - tb

    const sa = Number(a?.message_seq ?? a?.seq_id ?? a?.seq)
    const sb = Number(b?.message_seq ?? b?.seq_id ?? b?.seq)
    if (Number.isFinite(sa) && Number.isFinite(sb) && sa !== sb) {
        return sa - sb
    }

    const ia = normalizeMessageId(a?.message_id)
    const ib = normalizeMessageId(b?.message_id)
    if (ia === ib) return 0
    return ia.localeCompare(ib)
}

function getImageSegments(msg: any): any[] {
    if (!Array.isArray(msg?.message)) return []
    return msg.message.filter((seg: any) => seg?.type === 'image')
}

function hasImageMessage(msg: any): boolean {
    return getImageSegments(msg).length > 0
}

function hasResolvableImageSource(msg: any): boolean {
    const imgs = getImageSegments(msg)
    if (imgs.length === 0) return false
    return imgs.every((seg: any) => {
        const url = typeof seg?.url === 'string' ? seg.url : ''
        const file = typeof seg?.file === 'string' ? seg.file : ''
        if (url.length > 0) return true
        if (file.length > 0) return true
        return false
    })
}

function shouldReplaceDuplicateMessage(existing: any, incoming: any): boolean {
    const settingsStore = useSettingsStore()
    if (!hasImageMessage(incoming)) return false
    if (existing?._from_local_db !== true) return false

    // 关闭本地图片缓存时，在线同 id 图片消息应覆盖本地消息。
    if (settingsStore.sysConfig.disable_local_history_image_cache === true) {
        return true
    }

    // 图片缓存开启但本地消息图片字段不完整时，也允许在线覆盖修复。
    return !hasResolvableImageSource(existing) && hasResolvableImageSource(incoming)
}

function mergeMessagesByIdAndTime(current: any[], incoming: any[]): any[] {
    if (incoming.length === 0) return [...current]
    if (current.length === 0) {
        const firstPass = [...incoming]
        firstPass.sort(compareMessageOrder)
        return firstPass
    }

    const idSet = new Set<string>()
    const idIndexMap = new Map<string, number>()
    const fallbackSet = new Set<string>()
    const merged = [] as any[]

    for (const msg of current) {
        merged.push(msg)
        const id = normalizeMessageId(msg?.message_id)
        if (id) {
            idSet.add(id)
            idIndexMap.set(id, merged.length - 1)
        } else {
            fallbackSet.add(buildFallbackMessageKey(msg))
        }
    }

    for (const msg of incoming) {
        const id = normalizeMessageId(msg?.message_id)
        if (id) {
            if (idSet.has(id)) {
                const idx = idIndexMap.get(id)
                if (idx !== undefined && shouldReplaceDuplicateMessage(merged[idx], msg)) {
                    merged[idx] = msg
                }
                continue
            }
            idSet.add(id)
            merged.push(msg)
            idIndexMap.set(id, merged.length - 1)
            continue
        }

        const fallbackKey = buildFallbackMessageKey(msg)
        if (fallbackSet.has(fallbackKey)) continue
        fallbackSet.add(fallbackKey)
        merged.push(msg)
    }

    merged.sort(compareMessageOrder)
    return merged
}

function replaceMessageListInPlace(next: any[]) {
    const chatStore = useChatStore()
    chatStore.messageList.splice(0, chatStore.messageList.length, ...next)
}

export async function getMessageList(list: any[] | undefined) {
    if (!list) return undefined

    list = parseMsgList(
        list,
        msgPath.message_list.type,
        msgPath.message_value,
    )
    // 倒序处理
    if (msgPath.message_list.order === 'reverse') {
        list.reverse()
    }
    // 检查必要字段
    list.forEach((item: any) => {
        if (!item.post_type) {
            item.post_type = 'message'
        }
    })
    return Promise.all(list.map(msgPreprocess))
}

/**
 * 消息预处理
 * @param msg 要处理的消息
 */
async function msgPreprocess(msg: any): Promise<any> {
    //#region == json 合并转发 ============================
    if (msg.message.at(0)?.type === 'json') {
        try {
            const data = JSON.parse(msg.message.at(0).data)
            if (data['app'] === 'com.tencent.multimsg') {
                msg.message = [{
                    type: 'forward',
                    id: data['meta']['detail']['resid'],
                }]
            }
        } catch (e) {/**/ }
    }
    //#endregion

    //#region == 合并转发解析 ==============================
    if (msg.message.at(0)?.type === 'forward') {
        const forwardId = msg.message.at(0).id
        if (forwardId) {
            try {
                if (msg.message.at(0).content && msg.message.at(0).content.length > 0) {
                    // 如果 content 里已经有内容了就直接用 content 里的内容
                    const data = await getMessageList(msg.message.at(0).content)
                    if (data) msg.message.at(0).content = data
                } else {
                    // 否则调用接口获取
                    const originData = await Connector.callApi('forward_msg', { id: forwardId })
                    const data = await getMessageList(originData)
                    if (data) msg.message.at(0).content = data
                }
            } catch (e) {
                logger.error(e as unknown as Error, '合并转发解析失败')
            }
        } else {
            msg.message.at(0).content = []
        }
    }
    //#endregion

    //#region == lgr 商场表情 =============================
    // 过滤掉mface后面尾随的字符串
    const filter: any[] = []
    for (let id = 0; id < msg.message.length; id++) {
        const seg = msg.message[id]
        filter.push(seg)
        if (seg.type === 'mface') id++
    }
    msg.message = filter
    //#endregion
    return msg
}

function revokeMsg(_: string, msg: any) {
    const authStore = useAuthStore()
    const chatStore = useChatStore()
    // 清除通知
    const chatId = msg.notice_type.includes('group') ? msg.group_id : msg.user_id
    new Notify().closeAll(chatId)

    // 在本地 DB 中标记撤回
    const msgId = msg.message_id
    dbRevokeMessage(authStore.loginInfo.uin, String(msgId))

    // 寻找消息
    let msgGet = null as { [key: string]: any } | null
    let msgIndex!: number
    for (const [index, msg] of chatStore.messageList.entries()) {
        if (msg.message_id === msgId) {
            msgGet = msg
            msgIndex = index
        }
    }

    if (!msgGet) {
        logger.add(LogType.UI, '没有找到这条被撤回的消息')
        return
    }

    // 移除消息
    chatStore.messageList.splice(msgIndex, 1)

    if (msgGet.sender.user_id === authStore.loginInfo.uin)
        msg.originMsg = msgGet

    // 显示撤回提示
    const list = chatStore.messageList
    list.splice(msgIndex + 1, 0, msg)
}

let qed_try_times = 0
function newMsg(_: string, data: any) {
    const { $t } = app.config.globalProperties
    const authStore = useAuthStore()
    const uiStore = useUIStore()
    const chatStore = useChatStore()
    const contactStore = useContactStore()
    const settingsStore = useSettingsStore()
    // 没有对频道的支持计划
    if (data.detail_type == 'guild') {
        return
    }

    const infoList = getMsgData('message_info', data, msgPath.message_info)
    if (infoList != undefined) {
        // 消息基础信息 ============================================
        const info = infoList[0]
        const id = info.group_id ?? info.private_id
        const loginId = authStore.loginInfo.uin
        const showId = chatStore.chatInfo.show.id
        const sender = info.sender
        // 在好友列表里找一下他
        const senderInfo = contactStore.userList.find((item) => {
            return item.user_id == sender
        })
        const isImportant = senderInfo?.class_id == 9999

        // 预发送消息填充 ============================================
        // 列表内最近的一条 fake_msg（倒序查找）
        let fakeMsg = null as any
        for (let i = chatStore.messageList.length - 1; i > 0; i--) {
            const msg = chatStore.messageList[i]
            if (msg.fake_msg != undefined && sender == loginId) {
                fakeMsg = msg
                break
            }
        }
        // 预发送消息刷新
        if (fakeMsg != null) {
            // 将这条消息直接替换掉
            const trueMsg = getMsgData(
                'message_list',
                buildMsgList([data]),
                msgPath.message_list,
            )
            getMessageList(trueMsg).then((trueMsg) => {
                if (trueMsg?.length == 1) {
                    // 使用消息对象引用直接更新，避免索引问题
                    fakeMsg.message = trueMsg[0].message
                    fakeMsg.raw_message = trueMsg[0].raw_message
                    fakeMsg.time = trueMsg[0].time
                    fakeMsg.fake_msg = undefined
                    fakeMsg.revoke = false
                }
            })
            // 移除最顶端的一条消息以被动刷新整个列表
            chatStore.messageList.shift()
            return
        }

        // 刷新 favicon
        refreshFavicon()



        // 对消息进行一次格式化处理
        const list = normalizeNewIncomingMessage(data)

        if (list.length > 0) {
            // 保存到本地历史
            saveMessagesWithSideEffects(authStore.loginInfo.uin, list)
            data = list[0]
        }

        // 显示消息 ============================================
        if (id === showId || info.target_id == showId) {
            // 如果有正在输入的提示，清除它
            chatStore.chatInfo.show.appendInfo = undefined
            // 保存消息
            saveMsg(buildMsgList([data]), 'bottom')
            // 抽个签
            const num = randomNum(0, 10000)
            if (num >= 400 && num <= 500) {
                logger.add(
                    LogType.INFO,
                    num.toString() + '，这只是个神秘的数字...',
                    undefined,
                    true,
                )
            }
            if (num === 495) {  // QED怎么能和芙兰无关？(◣_◢)吃我一发 QED [495年的波纹]
                const popInfo = {
                    html: qed,
                    button: [
                        {
                            text: '确定(O)',
                            fun: () => {
                                uiStore.popBoxList.shift()
                            },
                        },
                    ],
                }
                uiStore.popBoxList.push(popInfo)
                Umami.trackEvent('show_qed', { times: qed_try_times })
            }
            qed_try_times++
        }

        // 通知判定预处理 ============================================
        // 对于其他不在消息里标记 atme、atall 的处理
        if (data.atme == undefined || data.atall == undefined) {
            data.message.forEach((item: any) => {
                if (item.type == 'at' && item.qq == loginId) {
                    data.atme = true
                }
            })
        }
        // 临时会话名字的特殊处理
        if (data.sub_type === 'group') {
            data.sender.nickname = data.sender.user_id
        }
        // 检查群组有没有开启通知
        let isGroupNotice = false
        if (data.message_type === 'group') {
            const noticeInfo = Option.get('notice_group') ?? {}
            const list = noticeInfo[authStore.loginInfo.uin]
            if (list) {
                isGroupNotice = list.indexOf(id) >= 0
            }
        }

        const isGroupMessage = data.message_type === 'group'
        const isTempGroupMessage = data.sub_type === 'group'
        const groupNoticeType = settingsStore.sysConfig.group_notice_type
        const hasForcedGroupInnerNotice = data.atme || data.atall || isImportant || isGroupNotice
        const allowGroupInnerNotice = !isGroupMessage ||
            groupNoticeType !== 'none' ||
            hasForcedGroupInnerNotice
        const allowGroupSystemNotice = !isGroupMessage ||
            groupNoticeType === 'all' ||
            hasForcedGroupInnerNotice

        // 会话状态更新 ============================================
        const sessionId = Number(isTempGroupMessage ? sender : id)
        let session = contactStore.baseOnMsgList.get(sessionId)
        if (!session) {
            if (isTempGroupMessage) {
                session = {
                    user_id: sender,
                    nickname: app.config.globalProperties.$t('临时会话'),
                    remark: data.sender.user_id,
                    group_id: data.sender.group_id,
                    group_name: '',
                } as UserFriendElem & UserGroupElem
            } else {
                session = resolveIncomingSession(
                    contactStore.userList,
                    sessionId,
                    isGroupMessage,
                    data.sender?.nickname,
                )
            }
        }
        if (session) {
            Object.assign(session, formatMessageData(data, isGroupMessage))
            if (
                sender != loginId &&
                sender != 0 &&
                sessionId !== showId &&
                allowGroupInnerNotice
            ) {
                if (!session.new_msg) {
                    session.new_msg = true
                    contactStore.newMsgCount++
                }
            }
            if (sessionId !== showId && allowGroupInnerNotice) {
                if (data.atme) { session.highlight = $t('[有人@你]') }
                if (data.atall) { session.highlight = $t('[@全体]') }
                if (isImportant) { session.highlight = $t('[特別关心]') }
            }
            contactStore.baseOnMsgList.set(sessionId, session)
            updateBaseOnMsgList()
        }

        // 通知判定 ============================================
        if (
            sender != loginId &&
            sender != 0 &&
            allowGroupSystemNotice
        ) {
            logger.add(LogType.DEBUG, '通知判定：', {
                notShow: sessionId !== showId,
                notFocus: !document.hasFocus(),
                hidden: document.hidden,
                isImportant: isImportant
            })
            // (发送者没有被打开 || 窗口没有焦点 || 窗口被最小化 || 在特别关心列表里) 这些情况需要进行消息通知
            const forceGroupSystemNotice = isGroupMessage && groupNoticeType === 'all'
            const forceImportantNotice = isImportant ||
                (isGroupMessage && (data.atme || data.atall || isGroupNotice))
            if (
                forceGroupSystemNotice ||
                forceImportantNotice ||
                sessionId !== showId ||
                !document.hasFocus() ||
                document.hidden
            ) {
                // 准备消息内容
                let raw = getMsgRawTxt(data)
                raw = raw === '' ? data.raw_message : raw
                logger.add(LogType.INFO, '新消息通知：' + raw, undefined, true)
                if (data.group_name === undefined) {
                    // 检查消息内是否有群名，去列表里寻找
                    contactStore.userList.forEach((item) => {
                        if (item.group_id == data.group_id) {
                            data.group_name = item.group_name
                        }
                    })
                }
                const msgInfo = {
                    base_type: 'msg',

                    title: data.group_name ?? data.sender.nickname,
                    body:
                        data.message_type === 'group' ? data.sender.nickname + ':' + raw : raw,
                    tag: `${sessionId}/${data.message_id}`,
                    icon:
                        data.message_type === 'group' ? `https://p.qlogo.cn/gh/${id}/${id}/0` : `https://q1.qlogo.cn/g?b=qq&s=0&nk=${id}`,
                    image: undefined as any,
                    type: data.group_id ? 'group' : 'user',
                    is_important: isImportant,
                } as NotifyInfo
                data.message.forEach((item: MsgItemElem) => {
                    // 如果消息有图片，追加第一张图片
                    if (item.type === 'image' && msgInfo.image === undefined) {
                        msgInfo.image = item.url
                    }
                })
                // 发送消息
                if (Option.get('close_notice') !== true) {
                    new Notify().notify(msgInfo)
                }
            }
        }
    }
}

/**
 * 刷新系统通知和其他内容，给系统通知响应用的
 */
function updateSysInfo(
    _: string,
    __: { [key: string]: any },
    echoList: string[],
) {
    const contactStore = useContactStore()
    const flag = echoList[1]
    // 从系统通知列表里删除这条消息
    if (flag !== undefined) {
        const index = contactStore.systemNoticesList?.findIndex((item: any) => {
            return item.flag == flag
        })
        if (index !== -1) {
            contactStore.systemNoticesList?.splice(index, 1)
        }
    }
}

// ==============================================================

function formatMessageData(data: any, isGroup: boolean) {
    const name = data.sender?.card && data.sender.card !== '' ? data.sender.card : data.sender?.nickname

    return {
        message_id: data.message_id,
        raw_msg: isGroup && name ? `${name}: ${getMsgRawTxt(data)}` : getMsgRawTxt(data),
        time: getViewTime(Number(data.time)),
        raw_msg_base: getMsgRawTxt(data)
    }
}

// 重置 Runtime，但是保留应用设置之类已经加载好的应用内容
export function resetRimtime(resetAll = false) {
    firstHeartbeatTime = -1
    heartbeatTime = -1
    clearMetaEventWatchdog()
    groupPreviewHydrator.reset()
    if (resetAll) {
        // Reset auth store
        const authStore = useAuthStore()
        authStore.loginInfo = reactive({})
        authStore.botInfo = reactive({})
        // Reset contact store
        const contactStore = useContactStore()
        contactStore.userList = reactive([])
        contactStore.showList = reactive([])
        contactStore.systemNoticesList = reactive([])
        contactStore.baseOnMsgList = reactive(new Map())
        contactStore.onMsgList = reactive([])
        contactStore.groupAssistList = reactive([])
        // Reset chat store
        const chatStore = useChatStore()
        chatStore.chatInfo = reactive({
            show: { type: '', id: 0, name: '', avatar: '' },
            info: {
                group_info: {},
                user_info: {},
                me_info: {},
                group_members: [],
                group_files: {},
                group_sub_files: {},
                jin_info: { list: [] as { [key: string]: any }[], pages: 0 },
            },
        })
        chatStore.messageList = []
        // Reset connection store
        const connectionStore = useConnectionStore()
        connectionStore.heartbeatTime = -1
        connectionStore.oldHeartbeatTime = -1
        connectionStore.lastHeartbeatTime = -1
        connectionStore.backTimes = 0
    }
}
