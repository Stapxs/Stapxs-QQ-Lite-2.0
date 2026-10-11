import app from '@renderer/main'
import FileDownloader from 'js-file-downloader'
import { v4 as uuid } from 'uuid'
import option from '@renderer/function/option'
import semver from 'semver'
import appInfo from '../../../../../package.json'
import Umami from '@stapxs/umami-logger-typescript'

import AboutPan from '@renderer/components/AboutPan.vue'
import UpdatePan from '@renderer/components/UpdatePan.vue'
import WelPan from '@renderer/components/WelPan.vue'
import MealHungryPan from '@renderer/components/notice-component/MealHungryPan.vue'

import { KeyboardInfo } from '@capacitor/keyboard'
import { LogType, Logger, PopInfo, PopType } from '@renderer/function/base'
import { Connector, login } from '@renderer/function/connect'
import { BaseChatInfoElem, MenuEventData } from '@renderer/function/elements/information'
import { useAuthStore } from '@renderer/state/auth'
import { useContactStore } from '@renderer/state/contact'
import { useChatStore } from '@renderer/state/chat'
import { useUIStore } from '@renderer/state/ui'
import { useSettingsStore } from '@renderer/state/settings'
import {
    hslToRgb,
    rgbToHsl,
} from '@renderer/function/utils/systemUtil'
import {
    markRaw,
    defineAsyncComponent,
    toRaw,
    nextTick,
    Directive,
    WatchHandle,
    onMounted,
    onUnmounted,
    ref,
    watchEffect,
    watch,
    shallowReactive,
    ShallowRef,
    shallowRef,
    Component,
    DirectiveBinding,
    Ref,
} from 'vue'
import { sendMsgRaw } from './msgUtil'
import { dbGetLatest } from './localHistoryUtil'
import { parseMsg } from '../sender'
import { Notify } from '../notify'

const popInfo = new PopInfo()
const logger = new Logger()

/**
 * 滚动到目标消息（不自动加载）
 * @param seqName DOM 名（chat-xx）
 */
export function scrollToMsg(seqName: string, showAnimation: boolean, showHighlight = true): boolean {
    const msg = document.getElementById(seqName)
    if (msg) {
        const pan = document.getElementById('msgPan')
        if (pan !== null) {
            if (showAnimation === false) {
                pan.style.scrollBehavior = 'unset'
            } else {
                pan.style.scrollBehavior = 'smooth'
            }
            pan.scrollTop = msg.offsetTop - msg.offsetHeight + 10
            pan.style.scrollBehavior = 'smooth'
            if (showHighlight) {
                msg.style.transition = 'background 1s'
                msg.style.background = 'rgba(0, 0, 0, 0.06)'
                setTimeout(() => {
                    msg.style.background = 'unset'
                    setTimeout(() => {
                        msg.style.transition = 'background .3s'
                    }, 1100)
                }, 3000)
            }
            return true
        }
    }
    return false
}

/**
 * 打开链接
 * @param url 链接
 * @param external 是否外部打开
 */
export function openLink(url: string) {
    // 判断是不是 Electron，是的话打开内嵌 iframe
    if (backend.isDesktop()) {
        const shell = window.electron?.shell
        if (shell) {
            shell.openExternal(url)
        } else {
            backend.call('', 'sys:openInBrowser', false, backend.unProxyUrl(url))
        }
    } else {
        window.open(url)
    }
}

/**
 * 加载历史消息
 * @param info 聊天基本信息
 */
export async function loadHistory(info: BaseChatInfoElem) {
    const authStore = useAuthStore()
    const chatStore = useChatStore()
    const settingsStore = useSettingsStore()
    chatStore.messageList = []
    // 本地有数据时立即显示，同时仍发网络请求以获取最新消息（避免遗漏）
    if (
        settingsStore.sysConfig.enable_local_history &&
        settingsStore.sysConfig.mixed_load_messages !== false
    ) {
        const localMsgs = await dbGetLatest(
            authStore.loginInfo.uin,
            info.id,
            20,
        )
        if (localMsgs.length > 0) {
            chatStore.messageList = localMsgs
        }
    }
    if (!loadHistoryMessage(info.id, info.type)) {
        new PopInfo().add(
            PopType.ERR,
            app.config.globalProperties.$t('加载历史消息失败'),
            false,
        )
    }
}
export function loadHistoryMessage(
    id: number,
    type: string,
    count = 20,
    echo = 'getChatHistoryFist',
) {
    const authStore = useAuthStore()
    const chatStore = useChatStore()
    let name: string
    const fullPage = authStore.jsonMap.message_list?.pagerType == 'full'
    if (authStore.jsonMap.message_list && type != 'group') {
        name = authStore.jsonMap.message_list.private_name
    } else {
        name = authStore.jsonMap.message_list.name
    }

    Connector.send(
        name ?? 'get_chat_history',
        {
            group_id: type == 'group' ? id : undefined,
            user_id: type != 'group' ? id : undefined,
            message_id: 0,
            count: fullPage ? chatStore.messageList.length + count : count,
        },
        echo,
    )
    return true
}

/**
 * 重新加载用户列表
 */
export function reloadUsers() {
    // 加载用户列表
    if (login.status) {
        const authStore = useAuthStore()
        const contactStore = useContactStore()
        contactStore.userList = []
        let friendName = 'get_friend_list'
        let groupName = 'get_group_list'
        if (authStore.jsonMap.user_list?.name) {
            friendName = authStore.jsonMap.user_list.name.split('|')[0]
            groupName = authStore.jsonMap.user_list.name.split('|')[1]
        } else if (
            authStore.jsonMap.friend_list?.name &&
            authStore.jsonMap.group_list?.name
        ) {
            friendName = authStore.jsonMap.friend_list.name
            groupName = authStore.jsonMap.group_list.name
        }
        Connector.send(friendName, {}, 'getFriendList')
        Connector.send(groupName, {}, 'getGroupList')
    }
}

/**
* 获取 Cookie
*/
export function reloadCookies(domain = 'qun.qq.com') {
    Connector.send(
        'get_cookies',
        { domain: domain },
        'getCookies_' + domain,
    )
}

/**
 * 通过用户和消息 ID 跳转到对应的消息
 * @param id
 * @param msgId
 */
export function jumpToChat(userId: string, msgId: string) {
    const chatStore = useChatStore()
    const contactStore = useContactStore()
    if (chatStore.chatInfo.show.id != Number(userId)) {
        const body = document.getElementById('user-' + userId)
        if (body === null) {
            // 从缓存列表里寻找这个 ID
            for (let i = 0; i < contactStore.userList.length; i++) {
                const item = contactStore.userList[i]
                const id =
                    item.user_id !== undefined ? item.user_id : item.group_id
                if (String(id) === userId) {
                    // 把它插入到显示列表的第一个
                    contactStore.showList?.unshift(item)
                    nextTick(() => {
                        const bodyNext = document.getElementById(
                            'user-' + userId,
                        )
                        if (bodyNext !== null) {
                            // 添加一个消息跳转标记
                            bodyNext.dataset.jump = msgId
                            // 然后点一下它触发聊天框切换
                            bodyNext.click()
                        }
                    })
                    break
                }
            }
        } else {
            body.click()
        }
    } else {
        // 当前聊天已经打开，是没有焦点触发的消息通知；直接滚动到消息。
        scrollToMsg(msgId, true)
    }
}

/**
 * 下载文件
 * @param url 文件链接
 * @param name 文件名
 * @param onprocess 下载进度回调
 * @param oncancel 下载取消回调
 * @returns 清理函数，用于移除监听器
 */
export function downloadFile(
    url: string,
    name: string,
    onprocess: (event: ProgressEvent & { [key: string]: any }) => undefined,
    oncancel: (event: ProgressEvent & { [key: string]: any }) => undefined,
    oncomplete?: (mode: 'completed' | 'delegated') => void,
    onerror?: (error: Error) => void,
    taskId?: string,
): { cancel: () => void, cleanup: () => void } {
    if (document.location.protocol == 'https:') {
        // 判断下载文件 URL 的协议
        // PS：Chrome 不会对 http 下载的文件进行协议升级
        if (url.toLowerCase().startsWith('http:')) {
            url = 'https' + url.substring(url.indexOf('://'))
        }
    }
    if (backend.isWeb() || backend.type === 'capacitor') {
        const parsedUrl = new URL(url, document.location.href)
        if (
            ['http:', 'https:'].includes(parsedUrl.protocol) &&
            parsedUrl.origin !== document.location.origin
        ) {
            // 跨域 XHR 下载既需要 CORS，又会先把整个文件缓冲进内存。
            // 交给浏览器原生下载器可以流式落盘，也不会受应用超时影响。
            const link = document.createElement('a')
            link.href = url
            link.download = name
            link.rel = 'noopener'
            link.target = '_blank'
            link.style.display = 'none'
            document.body.appendChild(link)
            link.click()
            setTimeout(() => link.remove(), 0)
            oncomplete?.('delegated')
            return {
                cancel: () => undefined,
                cleanup: () => link.remove(),
            }
        }

        const downloader = new FileDownloader({
            url: url,
            autoStart: false,
            timeout: 0,
            process: onprocess,
            nameCallback: function () {
                return name
            },
        })
        let cancelled = false
        void downloader.start()
            .then(() => oncomplete?.('completed'))
            .catch((error) => {
                if (cancelled) {
                    oncancel({} as ProgressEvent)
                } else {
                    onerror?.(error instanceof Error? error: new Error(String(error)))
                }
            })
        return {
            cancel: () => {
                cancelled = true
                downloader.abort('Download cancelled')
            },
            cleanup: () => undefined,
        }
    } else {
        const nativeTaskId = taskId ?? uuid()
        const matchesTask = (data: any) => {
            return data?.taskId === nativeTaskId
        }
        let disposed = false
        let started = false
        let cancelRequested = false
        let listenerHandles: ReturnType<typeof backend.addListener>[] = []
        const cleanup = () => {
            if (disposed) return
            disposed = true
            listenerHandles.forEach((handle) => handle.remove())
        }
        // 创建命名回调函数以便后续移除
        const processCallback = (event: any, data: any) => {
            const payload = data || event.payload
            if (matchesTask(payload)) onprocess(payload)
        }
        const cancelCallback = (event: any, data: any) => {
            const payload = data || event.payload
            if (!matchesTask(payload)) return
            cleanup()
            oncancel(payload)
        }
        const completeCallback = (event: any, data: any) => {
            const payload = data || event.payload
            if (!matchesTask(payload)) return
            cleanup()
            oncomplete?.('completed')
        }
        const errorCallback = (event: any, data: any) => {
            const payload = data || event.payload
            if (!matchesTask(payload)) return
            const message = payload?.error || payload?.message || payload || '下载失败'
            cleanup()
            onerror?.(new Error(String(message)))
        }
        listenerHandles = [
            backend.addListener(undefined, 'sys:downloadBack', processCallback),
            backend.addListener(undefined, 'sys:downloadCancel', cancelCallback),
            backend.addListener(undefined, 'sys:downloadDone', completeCallback),
            backend.addListener(undefined, 'sys:downloadError', errorCallback),
        ]
        const startNativeDownload = () => {
            if (disposed || cancelRequested) return
            started = true
            void backend.call(undefined, 'sys:download', false, {
                downloadPath: url,
                fileName: name,
                taskId: nativeTaskId,
            })
        }
        if (backend.type === 'tauri') {
            void Promise.all(listenerHandles.map((handle) => handle.ready)).then((ready) => {
                if (disposed || cancelRequested) return
                if (ready.some((value) => !value)) {
                    cleanup()
                    onerror?.(new Error('下载监听器初始化失败'))
                    return
                }
                startNativeDownload()
            })
        } else {
            // Electron listeners are synchronous.
            startNativeDownload()
        }
        return {
            cancel: () => {
                cancelRequested = true
                if ((backend.type === 'electron' || backend.type === 'tauri') && started) {
                    void backend.call(undefined, 'sys:cancelDownload', false, {
                        taskId: nativeTaskId,
                    })
                }
            },
            cleanup,
        }
    }
}

/**
* Windows：获取加载系统主题色
* @param color 颜色
*/
export function updateWinColor(color: string, type: string) {
    if (type == 'windows') {
        const red = parseInt(color.substr(0, 2), 16)
        const green = parseInt(color.substr(2, 2), 16)
        const blue = parseInt(color.substr(4, 2), 16)
        // 平衡颜色亮度
        const hsl = rgbToHsl(red, green, blue)
        const media = window.matchMedia('(prefers-color-scheme: dark)')
        const autodark = option.get('opt_auto_dark')
        const dark = option.get('opt_dark')
        let min = 0.35
        let max = 0.9
        if (
            (autodark == true && media.matches) ||
            (autodark != true && dark == true)
        ) {
            min += (max - min) / 2
        } else {
            min = 0.35
            max -= (max - min) / 2
        }
        hsl[2] = min + hsl[2] * (max - min)
        const finalColor = hslToRgb(hsl[0], hsl[1], hsl[2])
        document.documentElement.style.setProperty(
            '--color-main',
            'rgb(' +
            finalColor[0] +
            ',' +
            finalColor[1] +
            ',' +
            finalColor[2] +
            ')',
        )
    } else if (type == 'macos') {
        document.documentElement.style.setProperty(
            '--color-main',
            '#' + color.substring(0, 6) + 'CF',
        )
    }
}
export async function loadWinColor() {
    const process = window.electron?.process
    let type = 'macos'
    if (process && process.platform == 'win32') {
        type = 'windows'
    }
    // 获取系统主题色
    updateWinColor(await backend.call(undefined, 'sys:getWinColor', true), type)
}

/**
* macOS：创建应用菜单
*/
export function createMenu() {
    const { $t } = app.config.globalProperties
    const contactStore = useContactStore()
    // MacOS：初始化菜单
    if (backend.isDesktop()) {
        // 初始化菜单
        const menuTitles = {} as { [key: string]: string }
        menuTitles.success = $t(
            '应用显示完成，应用初始化完成！欢迎使用 {name}！',
            {
                name: $t('Stapxs QQ Lite'),
            },
        )

        menuTitles.repo = import.meta.env.VITE_APP_REPO_NAME

        menuTitles.title = $t('Stapxs QQ Lite')
        menuTitles.about = $t('关于') + ' ' + $t('Stapxs QQ Lite')
        menuTitles.update = $t('检查更新…')
        menuTitles.hide = $t('隐藏') + ' ' + $t('Stapxs QQ Lite')
        menuTitles.hideOthers = $t('隐藏其他')
        menuTitles.unhide = $t('全部显示')
        menuTitles.quit = $t('退出') + ' ' + $t('Stapxs QQ Lite')

        menuTitles.close = $t('关闭窗口')

        menuTitles.edit = $t('编辑')
        menuTitles.undo = $t('撤销')
        menuTitles.redo = $t('重做')
        menuTitles.cut = $t('剪切')
        menuTitles.copy = $t('复制')
        menuTitles.paste = $t('粘贴')
        menuTitles.selectAll = $t('全选')

        menuTitles.account = $t('账户')
        menuTitles.login = $t('连接')
        menuTitles.logout = $t('登出')
        menuTitles.userList = $t('用户列表（{count}）', {
            count: contactStore.userList.length,
        })
        menuTitles.flushUser = $t('刷新列表…')

        menuTitles.help = $t('帮助')
        menuTitles.doc = $t('帮助文档')
        menuTitles.feedback = $t('在 Github 上反馈问题')
        menuTitles.license = $t('许可协议')

        backend.call(undefined, 'sys:createMenu', false,
            backend.type == 'tauri' ? { data: menuTitles } : menuTitles)
    }
}
export function updateMenu(config: { parent: string, id: string; action: string; value: string }) {
    // MacOS：更新菜单
    backend.call(undefined, 'sys:updateMenu', false, config)
}

/**
* Electron：注册系统 IPC
*/
export function createIpc() {
    const contactStore = useContactStore()
    const uiStore = useUIStore()
    // 服务发现
    backend.addListener(undefined, 'sys:serviceFound', (event, data) => {
        const info = data ?? event.payload
        setQuickLogin(info.address, info.port)
    })
    // bot 功能
    backend.addListener(undefined, 'bot:flushUser', () => {
        reloadUsers()
        popInfo.add(PopType.INFO, app.config.globalProperties.$t('刷新用户列表成功'))
    })
    backend.addListener(undefined, 'bot:logout', () => {
        option.remove('auto_connect')
        Connector.close()
    })
    backend.addListener(undefined, 'bot:quickReply', (event, data) => {
        const info = data ?? event.payload
        sendMsgRaw(info.id, info.type,
            parseMsg(info.content, [{ type: 'reply', id: String(info.msg) }], []), true)
        // 去消息列表内寻找，去除新消息标记
        const item = contactStore.baseOnMsgList.get(info.id)
        if (item) {
            if (item.new_msg) {
                item.new_msg = false
                contactStore.newMsgCount--
            }
            item.highlight = undefined
            contactStore.baseOnMsgList.set(Number(info.id), item)
        }
    })
    // 应用功能
    backend.addListener(undefined, 'app:about', () => {
        const popInfo = {
            title: app.config.globalProperties.$t('关于') + ' ' +
                app.config.globalProperties.$t('Stapxs QQ Lite'),
            template: markRaw(AboutPan),
            templateValue: {
                showUI: false
            },
            allowQuickClose: false,
        }
        uiStore.popBoxList.push(popInfo)
    })
    backend.addListener(undefined, 'sys:handleUri', (event, data) => {
        logger.info(JSON.stringify(data ?? event.payload))
    })
    backend.addListener(undefined, 'app:changeTab', (event, name) => {
        window.focus()
        document.getElementById('bar-' + (name ?? event.payload).toLowerCase())?.click()
    })
    backend.addListener(undefined, 'app:openLink', (event, link) => {
        openLink(link ?? event.payload)
    })
    backend.addListener(undefined, 'app:error', (event, text) => {
        new Logger().add(LogType.ERR, text ?? event.payload)
    })
    backend.addListener(undefined, 'app:jumpChat', (event, data) => {
        const info = data ?? event.payload
        jumpToChat(info.userId, info.msgId)
        new Notify().closeAll(info.userId)
    })
    // 后端连接模式
    backend.addListener(undefined, 'onebot:onopen', (event, data) => {
        const info = data ?? event.payload
        Connector.onopen(info.address, info.token)
    })
    backend.addListener(undefined, 'onebot:onmessage', (event, message) => {
        Connector.onmessage(message ?? event.payload)
    })
    backend.addListener(undefined, 'onebot:onclose', (event, data) => {
        const info = data ?? event.payload
        Connector.onclose(info.code, info.reason || info.message, info.address, info.token)
    })
}

/**
* Capacitor：初始化移动平台
*/
export async function loadMobile() {
    const { $t } = app.config.globalProperties
    // Capacitor：相关初始化
    if (backend.isMobile()) {
        // 注册回调监听
        backend.addListener('Onebot', 'onebot:event', (data) => {
            const msg = JSON.parse(data.data)
            switch (data.type) {
                case 'onopen': {
                    login.creating = false
                    Connector.onopen(login.address, login.token)
                    break
                }
                case 'onmessage': Connector.onmessage(data.data); break
                case 'onclose': {
                    login.creating = false
                    Connector.onclose(msg.code, msg.message, login.address, login.token)
                    break
                }
                case 'onerror': {
                    login.creating = false
                    popInfo.add(PopType.ERR, $t('连接失败') + ': ' + msg.type, false);
                    break
                }
                case 'onServiceFound': setQuickLogin(msg.address, msg.port); break
                default: break
            }
        })
        // initial-scale 缩放固定为 0.9
        const viewport = document.getElementById('viewport')
        if (viewport) {
            (viewport as any).content =
                'width=device-width, initial-scale=0.9, maximum-scale=5, user-scalable=0'
        }
        // 通知
        const permission = await backend.call('LocalNotifications', 'checkPermissions', true)
        const permissionStr = permission || permission.display
        if (permissionStr.indexOf('prompt') != -1) {
            await backend.call('LocalNotifications', 'requestPermissions', false)
        } else if (permissionStr.indexOf('denied') != -1) {
            logger.error(null, '通知权限已被拒绝')
            logger.system('开发者阁下为什么要拒绝通知权限的请求呢？')
        } else {
            logger.debug('通知权限已开启')
            // 注册通知类型
            backend.call('LocalNotifications', 'registerActionTypes', false, {
                types: [{
                    id: 'msgQuickReply',
                    actions: [{
                        id: 'REPLY_ACTION',
                        title: '快速回复',
                        requiresAuthentication: true,
                        input: true,
                        inputButtonTitle: '发送',
                        inputPlaceholder: '输入回复内容……'
                    }]
                }] as ActionType[]
            })
            // 注册相关事件
            backend.addListener('LocalNotifications', 'localNotificationActionPerformed', (info) => {
                const contactStore = useContactStore()
                const notification =
                    info.notification as LocalNotificationSchema
                if (info.actionId == 'tap') {
                    // PS：通知被点击后会自动被关闭，所以这里不需要处理
                    jumpToChat(notification.extra.userId,
                        notification.extra.msgId)
                } else if (info.actionId == 'REPLY_ACTION') {
                    // 快速回复
                    sendMsgRaw(
                        notification.extra.userId,
                        notification.extra.chatType,
                        parseMsg(info.inputValue ?? '', [{ type: 'reply', id: String(notification.extra.msgId) }], []),
                        true
                    )
                    // 去消息列表内寻找，去除新消息标记
                    const item = contactStore.baseOnMsgList.get(Number(notification.extra.userId))
                    if (item) {
                        if (item.new_msg) {
                            item.new_msg = false
                            contactStore.newMsgCount--
                        }
                        item.highlight = undefined
                        contactStore.baseOnMsgList.set(Number(notification.extra.userId), item)
                    }
                }
            })
        }
        // 键盘
        backend.call('Keyboard', 'setAccessoryBarVisible', false, { isVisible: false })
        backend.call('Keyboard', 'setResizeMode', false, { mode: 'none' })
        backend.addListener('Keyboard', 'keyboardWillShow', async (info: KeyboardInfo) => {
            const keyboardHeight = info.keyboardHeight

            // 调整输入框高度
            const sendMore = document.getElementById('send-more')
            if (sendMore && keyboardHeight > window.innerHeight / 3) {
                sendMore.style.paddingBottom = '105px'
            }

            const safeArea = await backend.call('SafeArea', 'getSafeArea', true)
            const tabBar = document.getElementsByTagName('ul')[0]
            // iOS 26 后键盘背景是半透明的，不能让 webview 调整高度，会漏出背景的黑色
            // 干脆把所有的 iOS 版本处理方法都改为内部避让
            if (backend.platform == 'ios') {
                const baseApp = document.getElementById('base-app')
                // 使用键盘高度减去底部安全区域，不添加额外偏移量
                // 避免硬编码的 +100 导致 WebView 定位错误，引发键盘焦点丢失
                const keyboardOffset = Math.max(0, keyboardHeight - safeArea.bottom)
                if (safeArea && baseApp) {
                    baseApp.style.setProperty('--safe-area-bottom', keyboardOffset + 'px')
                }
                // 调整菜单高度
                if (safeArea && tabBar) {
                    tabBar.style.setProperty('padding-bottom', keyboardOffset + 'px', 'important')
                }
            }

            // 调整整个 HTML 的高度
            // PS：仅用于解决 Android 在全屏沉浸式下键盘遮挡问题
            // const html = document.getElementsByTagName('html')[0]
            // if (html && backend.platform == 'android') {
            //     html.style.height = `calc(100% - ${keyboardHeight + safeArea.top}px)`
            // }
        })
        backend.addListener('Keyboard', 'keyboardWillHide', async () => {
            const sendMore = document.getElementById('send-more')
            if (sendMore) {
                sendMore.style.paddingBottom = 'var(--safe-area-bottom)'
            }
            if (backend.platform == 'ios') {
                const baseApp = document.getElementById('base-app')
                const safeArea = await backend.call('SafeArea', 'getSafeArea', true)
                if (safeArea && baseApp) {
                    baseApp.style.setProperty('--safe-area-bottom', safeArea.bottom + 'px')
                }

                const tabBar = document.getElementsByTagName('ul')[0]
                if (tabBar) {
                    tabBar.style.paddingBottom = ''
                }
            }
            // 调整整个 HTML 的高度
            // PS：仅用于解决 Android 在全屏沉浸式下键盘遮挡问题
            const html = document.getElementsByTagName('html')[0]
            if (html && backend.platform == 'android') {
                html.style.height = 'calc(100%)'
            }
        })
        // 状态栏（Android）
        backend.call('NavigationBar', 'setTransparency', false, { isTransparent: true })
        backend.call('StatusBar', 'setOverlaysWebView', false, { overlay: true })
        backend.call('StatusBar', 'setBackgroundColor', false, { color: '#ffffff00' })
    }
}

import horizontalCss from '@renderer/assets/css/append/mobile/append_mobile_horizontal.css?raw'
import verticalCss from '@renderer/assets/css/append/mobile/append_mobile_vertical.css?raw'
import { ActionType, LocalNotificationSchema } from '@capacitor/local-notifications'
import { backend } from '@renderer/runtime/backend'
import { NoticeBodyV3 } from '../elements/system'
import { wheelMask } from '../input'
import { addTooltip, TooltipController } from '../tooltip'
import { VueCompData } from '../elements/vueComp'
// import windowsCss from '@renderer/assets/css/append/mobile/append_windows.css?raw'
/**
* 装载补充样式
*/
export async function loadAppendStyle() {
    const platform = backend.platform
    logger.info('正在装载补充样式……')
    if (platform != undefined) {
        import(`@renderer/assets/css/append/append_${platform}.css`)
            .then(() => {
                logger.info(`${platform} 平台附加样式加载完成`)
            })
            .catch(() => {
                logger.info('未找到对应平台的附加样式：' + platform)
            })
    }

    // 添加手机端样式
    const updateCss = (appendCss = '') => {
        const cssStype = document.getElementById('mobile-css')

        const width = window.innerWidth
        const height = window.innerHeight
        if (cssStype) {
            if (width > 600) {
                cssStype.innerHTML = (width > height ? horizontalCss : (horizontalCss + verticalCss)) + appendCss
            } else {
                cssStype.innerHTML = horizontalCss + verticalCss + appendCss
            }
        }

        if (backend.isDesktop()) {
            backend.call(undefined, 'win:maximize', false)
            const topBar = document.getElementsByClassName('top-bar')[0] as HTMLElement
            if (topBar) {
                topBar.style.display = 'none'
            }
        }
    }
    if (backend.isMobile()) {
        const styleTag = document.createElement('style')
        styleTag.id = 'mobile-css'
        document.head.appendChild(styleTag)
        updateCss()
        // 屏幕旋转事件处理
        window.addEventListener('resize', () => {
            updateCss()
        })
    }

    // UI 2.0 附加样式
    if (backend.isDesktop()) {
        import('@renderer/assets/css/append/append_new.css').then(() => {
            logger.info('UI 2.0 附加样式加载完成')
        })
    }

    if (option.get('chat_more_blur')) {
        import('@renderer/assets/css/append/append_full_vibrancy.css').then(() => {
            logger.info('完全透明 UI 附加样式加载完成')
        })
    }

    // napcat 插件模式附加样式
    if (import.meta.env.VITE_NAPCAT) {
        import('@renderer/assets/css/append/append_full_vibrancy.css').then(() => {
            logger.info('完全透明 UI 附加样式加载完成')
        })
        import('@renderer/assets/css/append/append_napcat.css').then(() => {
            logger.info('napcat 插件模式附加样式加载完成')
        })
    }

    // 透明 UI 附加样式
    let subVersion = backend.release?.split(' ')?.[1]?.split('.') as any
    subVersion = subVersion ? Number(subVersion[2]) : 0
    if (backend.isDesktop() &&
        (platform == 'darwin' || (platform == 'win32' && subVersion > 22621))) {
        import('@renderer/assets/css/append/append_vibrancy.css').then(() => {
            logger.info('透明 UI 附加样式加载完成')
        })
    }
    if (backend.isDesktop() && platform == 'linux') {
        const gnomeExtInfo = await backend.call(undefined, 'sys:getGnomeExt', true)
        if (gnomeExtInfo) {
            gnomeExtInfo.then((info: any) => {
                if (
                    info['enable-all'] == 'true' ||
                    (info['whitelist'] != undefined &&
                        info['whitelist'].indexOf('stapxs-qq-lite')) > 0
                ) {
                    import(
                        '@renderer/assets/css/append/append_vibrancy.css'
                    ).then(() => {
                        logger.info('透明 UI 附加样式加载完成')
                    })
                    import(
                        '@renderer/assets/css/append/append_linux_vibrancy.css'
                    ).then(() => {
                        logger.info('Linux 透明 UI 附加样式加载完成')
                    })
                }
            })
        }
    }
}

/**
* 初始化快速连接信息
* @param address 地址
* @param port 端口
*/
function setQuickLogin(address: string, port: number) {
    if (login.quickLogin != null)
        login.quickLogin.push({ address: address, port: port })
}

/**
* 检查更新
*/
export function checkUpdate() {
    const repoName = import.meta.env.VITE_APP_REPO_NAME
    // 获取最新的 release 信息
    const packageUrl =
        `https://api.github.com/repos/${repoName}/releases/latest`
    fetch(packageUrl).then((response) => {
        if (response.ok) {
            response.json().then((data) => {
                showUpadteLog(data)
            })
        }
    })
    localStorage.setItem('version', appInfo.version)
}

/**
* 展示更新弹窗
* @param data 更新数据
*/
function showUpadteLog(data: any) {
    const appVersion = appInfo.version // 当前版本
    const cacheVersion = localStorage.getItem('version') // 缓存版本
    // 这儿有两种情况：
    //    如果当前版本小于获取到的版本就是有更新
    //    如果缓存版本小于获取到的版本但是当前版本等于获取到的版本就是更新完成首次启动
    const latestVersion = data.tag_name.substring(1)

    if (semver.lt(appVersion, latestVersion)) {
        // 有更新
        showReleaseLog(data, false)
    }
    if (
        cacheVersion &&
        semver.eq(appVersion, latestVersion) &&
        semver.lt(cacheVersion, latestVersion)
    ) {
        // 更新完成首次启动
        showReleaseLog(data, true)
    }
}
function showReleaseLog(data: any, isUpdated: boolean) {
    const uiStore = useUIStore()
    const { $t } = app.config.globalProperties
    let msg = data.body
    // 处理 title，取开头到下一个 “\r\n” 之间的内容
    const title = msg.split('\r\n')[0].substring(1)
    // 处理 msg，取 “## 更新内容” 到下一个 “##” 之间的内容
    const start = msg.indexOf('## 更新内容\r\n')
    if (start != -1) {
        msg = msg.substring(start + 9)
        const end = msg.indexOf('##')
        if (end != -1) {
            msg = msg.substring(0, end)
        }
    }
    msg = title + '\r\n' + msg
    const info = {
        version:
            (isUpdated ? localStorage.getItem('version') + ' -> ' : '') +
            data.tag_name.substring(1),
        date: data.published_at,
        user: {
            name: data.author.login,
            avatar: data.author.avatar_url,
            url: data.author.html_url,
        },
        message: msg,
        updated: isUpdated,
    }
    const buttonGoUpdate = (!backend.isWeb()) ? [
        {
            text: $t('知道了'),
            fun: () => uiStore.popBoxList.shift(),
        },
        {
            text: $t('下载更新…'),
            master: true,
            fun: () => openLink(data.html_url),
        },
    ] : [
        {
            text: $t('查看…'),
            fun: () => openLink(data.html_url),
        },
        {
            text: $t('刷新页面'),
            master: true,
            fun: () => location.reload(),
        },
    ]
    const popInfo = {
        template: markRaw(UpdatePan),
        templateValue: toRaw(info),
        button: isUpdated ? [
            {
                text: $t('查看…'),
                fun: () => openLink(data.html_url),
            },
            {
                text: $t('知道了'),
                master: true,
                fun: () => {
                    uiStore.popBoxList.shift()
                },
            },
        ] : buttonGoUpdate,
    }
    uiStore.popBoxList.push(popInfo)
}

/**
 * 获取并展示最近5条更新记录
 */
export function showReleaseHistory() {
    const uiStore = useUIStore()
    const { $t } = app.config.globalProperties
    const repoName = import.meta.env.VITE_APP_REPO_NAME
    const packageUrl = `https://api.github.com/repos/${repoName}/releases?per_page=5`

    fetch(packageUrl).then((response) => {
        if (response.ok) {
            response.json().then((dataList: any[]) => {
                // 解析最近5条更新记录
                const releases = dataList.map((data) => {
                    let msg = data.body
                    const title = msg.split('\r\n')[0].substring(1)
                    const start = msg.indexOf('## 更新内容\r\n')
                    if (start != -1) {
                        msg = msg.substring(start + 9)
                        const end = msg.indexOf('##')
                        if (end != -1) {
                            msg = msg.substring(0, end)
                        }
                    }
                    msg = title + '\r\n' + msg

                    return {
                        version: data.tag_name.substring(1),
                        date: data.published_at,
                        user: {
                            name: data.author.login,
                            avatar: data.author.avatar_url,
                            url: data.author.html_url,
                        },
                        message: msg,
                        html_url: data.html_url,
                    }
                })

                const popInfo = {
                    title: $t('更新历史'),
                    template: markRaw(UpdatePan),
                    templateValue: toRaw({ releases }),
                    full: true,
                    button: [
                        {
                            text: $t('关闭'),
                            master: true,
                            fun: () => {
                                uiStore.popBoxList.shift()
                            },
                        },
                    ],
                }
                uiStore.popBoxList.push(popInfo)
            })
        } else {
            new PopInfo().add(
                PopType.ERR,
                $t('获取更新历史失败'),
                false,
            )
        }
    }).catch(() => {
        new PopInfo().add(
            PopType.ERR,
            $t('获取更新历史失败'),
            false,
        )
    })
}

/**
* 显示使用次数弹窗
*/
export function checkOpenTimes() {
    const uiStore = useUIStore()
    if (import.meta.env.DEV) return     // 开发环境不显示
    const { $t } = app.config.globalProperties
    const repoName = import.meta.env.VITE_APP_REPO_NAME
    const times = localStorage.getItem('times')
    if (times != null) {
        const getTimes = Number(times) + 1
        localStorage.setItem('times', getTimes.toString())
        if (getTimes % 20 == 0) {
            // 构建 HTML
            let html =
                '<div style="display:flex;flex-direction:column;padding:10px 5%;align-items:center;">'
            html +=
                '<svg style="height:2rem;fill:var(--color-font);margin-bottom:20px;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M16 0H144c5.3 0 10.3 2.7 13.3 7.1l81.1 121.6c-49.5 4.1-94 25.6-127.6 58.3L2.7 24.9C-.6 20-.9 13.7 1.9 8.5S10.1 0 16 0zM509.3 24.9L401.2 187.1c-33.5-32.7-78.1-54.2-127.6-58.3L354.7 7.1c3-4.5 8-7.1 13.3-7.1H496c5.9 0 11.3 3.2 14.1 8.5s2.5 11.5-.8 16.4zM432 336c0 97.2-78.8 176-176 176s-176-78.8-176-176s78.8-176 176-176s176 78.8 176 176zM264.4 241.1c-3.4-7-13.3-7-16.8 0l-22.4 45.4c-1.4 2.8-4 4.7-7 5.1L168 298.9c-7.7 1.1-10.7 10.5-5.2 16l36.3 35.4c2.2 2.2 3.2 5.2 2.7 8.3l-8.6 49.9c-1.3 7.6 6.7 13.5 13.6 9.9l44.8-23.6c2.7-1.4 6-1.4 8.7 0l44.8 23.6c6.9 3.6 14.9-2.2 13.6-9.9l-8.6-49.9c-.5-3 .5-6.1 2.7-8.3l36.3-35.4c5.6-5.4 2.5-14.8-5.2-16l-50.1-7.3c-3-.4-5.7-2.4-7-5.1l-22.4-45.4z"/></svg>'
            html += `<span>${$t('好耶！Stapxs QQ Lite 已经被打开 {times} 次了！', { times: getTimes })}</span>`
            html += `<span>${$t('真的不去点个 star 吗 ……')}</span>`
            html += '</div>'
            const popInfo = {
                title: $t('好耶'),
                svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path d="M316.9 18C311.6 7 300.4 0 288.1 0s-23.4 7-28.8 18L195 150.3 51.4 171.5c-12 1.8-22 10.2-25.7 21.7s-.7 24.2 7.9 32.7L137.8 329 113.2 474.7c-2 12 3 24.2 12.9 31.3s23 8 33.8 2.3l128.3-68.5 128.3 68.5c10.8 5.7 23.9 4.9 33.8-2.3s14.9-19.3 12.9-31.3L438.5 329 542.7 225.9c8.6-8.5 11.7-21.2 7.9-32.7s-13.7-19.9-25.7-21.7L381.2 150.3 316.9 18z"/></svg>',
                html: html,
                button: [
                    {
                        text: $t('不要'),
                        fun: () => {
                            uiStore.popBoxList.shift()
                        },
                    },
                    {
                        text: $t('好喔'),
                        master: true,
                        fun: () => {
                            openLink(
                                `https://github.com/${repoName}`,
                            )
                            uiStore.popBoxList.shift()
                        },
                    },
                ],
            }
            uiStore.popBoxList.push(popInfo)
        }
        if (getTimes % 50 == 0 && import.meta.env.VITE_APP_SPONSORS_URL) {
            const popInfo = {
                title: '',
                template: markRaw(MealHungryPan),
                templateValue: { times: getTimes },
                button: [
                    {
                        text: $t('打开…'),
                        fun: () => {
                            openLink(import.meta.env.VITE_APP_SPONSORS_URL)
                            uiStore.popBoxList.shift()
                        },
                    },
                    {
                        text: $t('好耶'),
                        master: true,
                        fun: () => {
                            uiStore.popBoxList.shift()
                        },
                    },
                ],
            }
            uiStore.popBoxList.push(popInfo)
        }
    } else {
        localStorage.setItem('times', '1')
    }
    // 使用引导
    const guide = localStorage.getItem('guide')
    const guideVersion = 1
    if (guide != guideVersion.toString()) {
        // 首次打开，显示首次打开引导信息
        const popInfo = {
            template: markRaw(WelPan),
            allowClose: false,
            button: [],
        }
        uiStore.popBoxList.push(popInfo)
        localStorage.setItem('guide', guideVersion.toString())
    }
}

/**
* 显示全局公告弹窗
*/
export function checkNotice() {
    const uiStore = useUIStore()
    let url = 'https://lib.stapxs.cn/download/stapxs-qq-lite/notice-config.json'
    if (import.meta.env.DEV) {
        url = 'notice_local.json'
    }
    const version = 3
    const fetchData = {
        time: new Date().getTime().toString(),
    } as Record<string, string>
    fetch(url + '?' + new URLSearchParams(fetchData).toString())
        .then((response) => response.json())
        .then((data) => {
            // 获取已显示过的公告 ID
            let noticeShow = [] as number[]
            const showId = localStorage.getItem('notice_show')
            if (showId) {
                noticeShow = showId.split(',').map((id: string) => parseInt(id))
            }
            // 解析公告列表
            data.forEach((notice: any) => {
                if (notice.version == version && (notice.client == import.meta.env.VITE_APP_CLIENT_TAG || notice.client == 'all')) {
                    const noticeBody = notice as NoticeBodyV3
                    // 当前时间戳（毫秒）
                    const now = new Date().getTime()
                    noticeBody.show_date.forEach((dateInterval: number[]) => {
                        if (dateInterval.length == 2) {
                            // 判断是否在时间区间内
                            if (now >= dateInterval[0] && now <= dateInterval[1]) {
                                noticeBody.is_show = true
                            }
                        }
                    })
                    if (noticeBody.is_important == true || (noticeBody.is_show && noticeBody.id && noticeShow.indexOf(noticeBody.id) < 0)) {
                        // 加载公告弹窗列表
                        for (let i = 0; i < noticeBody.pops.length; i++) {
                            // 添加弹窗
                            const info = noticeBody.pops[i]
                            let popInfo = null as any
                            const button = [
                                {
                                    text:
                                        /* eslint-disable */
                                        noticeBody.pops.length > 1 && i != noticeBody.pops.length - 1 ?
                                            app.config.globalProperties.$t('继续') :
                                            (info.button_text ? info.button_text : app.config.globalProperties.$t('确定')),
                                    /* eslint-enable */
                                    master: true,
                                    fun: () => {
                                        // 添加已读记录
                                        if (noticeShow.indexOf(noticeBody.id) < 0 && !noticeBody.is_important) {
                                            noticeShow.push(noticeBody.id)
                                        }
                                        localStorage.setItem(
                                            'notice_show',
                                            noticeShow.toString(),
                                        )
                                        // 关闭弹窗
                                        uiStore.popBoxList.shift()
                                    },
                                },
                            ]
                            if (info.link_url) {
                                button.unshift({
                                    text: app.config.globalProperties.$t('打开…'),
                                    master: false,
                                    fun: () => {
                                        if (info.link_url) {
                                            openLink(info.link_url)
                                        }
                                    }
                                })
                            }
                            if (info.html) {
                                popInfo = {
                                    title: info.title,
                                    html: info.html,
                                    button: button
                                }
                            } else if (info.template) {
                                popInfo = {
                                    title: info.title,
                                    template: markRaw(defineAsyncComponent(
                                        () => import(`@renderer/components/notice-component/${info.template}.vue`),
                                    )),
                                    templateValue: markRaw(info.template_data ? info.template_data : {}),
                                    button: button
                                }
                            } else {
                                logger.error(null, '未知的公告类型')
                            }
                            if (popInfo) {
                                uiStore.popBoxList.push(popInfo)
                            }
                        }
                    }
                }
            })
        })
}

/**
* TODO：后端代理请求模式（暂未使用）
* @param type 请求类型
* @param url 地址
* @param cookies Cookies
* @param data 数据
*/
export function BackendRequest(type: 'GET' | 'POST', url: string,
    cookies: string[], data: any = undefined) {
    backend.call(undefined, 'sys:requestHttp', false, {
        type: type,
        url: url,
        cookies: JSON.stringify(cookies),
        data: data,
    })
}

/**
* 加载数据解析映射表（JSON Path）
* @param name 配置名称
* @returns 映射表
*/
export function loadJsonMap(name: string) {
    let msgPath = undefined as { [key: string]: any } | undefined
    if (name !== undefined) {
        try {
            const msgPathList = import.meta.glob(
                '@renderer/assets/pathMap/*.yaml', { eager: true })
            const msgPathKey = Object.keys(msgPathList).find((key) => {
                return key.includes(name)
            })
            if (msgPathKey) {
                msgPath = (msgPathList[msgPathKey] as any).default
            }
            if (msgPath) {
                logger.system('开发者，请稍等一下（翻找），正在为阁下加载 ' + msgPath.name + ' 的服务映射表。')
                if (msgPath.redirect) {
                    // eslint-disable-next-line
                    const newMsgPathKey = Object.keys(msgPathList).find((key) => {
                        return key.includes(msgPath?.redirect)
                    })
                    let newMsgPath = undefined as
                        { [key: string]: any } | undefined
                    if (newMsgPathKey) {
                        newMsgPath = (msgPathList[newMsgPathKey] as any).default
                    }
                    // 合并映射表
                    if (newMsgPath) {
                        msgPath = {
                            ...newMsgPath,
                            ...msgPath,
                            name: msgPath.name,
                        }
                    }
                    logger.system('非常抱歉开发者，已帮阁下将映射表重定向加载为 ：' + msgPath?.name + ' （慌张）')
                }
            } else {
                logger.system('开发者，没有找到你需要的映射表……')
            }
            const authStore = useAuthStore()
            authStore.jsonMap = msgPath
        } catch (ex) {
            logger.system('很抱歉开发者，映射表加载失败 ……' + ex)
        }
    }
    return msgPath
}

/**
* UM：上报事件
* @param event 事件名
* @param data 数据
* @param saveLocal 是否额外保存到前端 localStorage
*/
export interface LocalStatEventRecord {
    event: string
    data: { [key: string]: any }
    time: number
}

export const LOCAL_STAT_EVENT_STORAGE_KEY = 'local_umami_stat_events'
const LOCAL_STAT_EVENT_MAX_COUNT = 500

function getBrowserLocalStatEvents(): LocalStatEventRecord[] {
    try {
        const storage = globalThis.localStorage
        const raw = storage.getItem(LOCAL_STAT_EVENT_STORAGE_KEY)
        if (!raw) return []
        const parsed = JSON.parse(raw)
        return Array.isArray(parsed) ? parsed : []
    } catch {
        return []
    }
}

function saveBrowserLocalStatEvent(record: LocalStatEventRecord): void {
    try {
        const storage = globalThis.localStorage
        const list = getBrowserLocalStatEvents()
        list.push(record)
        if (list.length > LOCAL_STAT_EVENT_MAX_COUNT) {
            list.splice(0, list.length - LOCAL_STAT_EVENT_MAX_COUNT)
        }
        storage.setItem(LOCAL_STAT_EVENT_STORAGE_KEY, JSON.stringify(list))
    } catch {
        // ignore local cache failures
    }
}

export function sendStatEvent(event: string, data: { [key: string]: any }, saveLocal = false) {
    if (saveLocal) {
        saveBrowserLocalStatEvent({
            event,
            data,
            time: Date.now(),
        })
    }

    if (!option.get('close_ga') && !import.meta.env.DEV) {
        Umami.trackEvent(event, data)
    }
}

/**
 * UM：上报会话数据
 * @param data 数据
 */
export function sendIdentifyData(data: { [key: string]: any }) {
    if (!option.get('close_ga') && !import.meta.env.DEV) {
        Umami.trackIdentify(data)
    }
}

/**
* 切换群组通知状态
* @param group_id 群组 ID
* @param open 是否开启通知
*/
export function changeGroupNotice(group_id: number, open: boolean) {
    const authStore = useAuthStore()
    const noticeInfo = option.get('notice_group') ?? {}
    const list = noticeInfo[authStore.loginInfo.uin]
    if (open) {
        if (list) {
            list.push(group_id)
        } else {
            noticeInfo[authStore.loginInfo.uin] = [group_id]
        }
        option.save('notice_group', noticeInfo)
    } else {
        if (list) {
            const index = list.indexOf(group_id)
            if (index >= 0) {
                list.splice(index, 1)
            }
        }
        option.save('notice_group', noticeInfo)
    }
}

/**
 * 是否应该自动聚焦输入框
 * @returns
 */
export function shouldAutoFocus(): boolean {
    // 桌面端
    if (backend.type !== 'web') {
        // 除了苹果的不知道啥东西,都可以
        if (['electron', 'tauri'].includes(backend.type)) {
            return true
        }
        return false
    }
    // web端
    else {
        // 移动端浏览器不自动聚焦
        if (/Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
            return false
        }
        return true
    }
}

/**
 * 判断是不是机器人
 * @param id 用户id
 * @returns
 */
export function isRobot(id: number | string): boolean {
    id = Number(id)
    if (id >= 4010000000 && id <= 4019999999) return true
    if (id >= 2854196301 && id <= 2854216399) return true
    if (id >= 3889000000 && id <= 3889999999) return true
    if (id === 66600000) return true
    return false
}

//#region == use封装 ========================================
/**
 * 用来封装一个停留事件的处理, 支持传递额外上下文
 * 适用于鼠标或触摸事件，停留一段时间后触发
 * 例如：长按菜单,鼠标悬浮等
 * @param getPos 从事件里提取坐标的函数
 * @param continueTime 成功的持续时间
 * @param hooks 钩子函数 支持成功时,失败时,退出时
 * @returns {
 *   acceptStartEvent: (event: T, exArg?: E) => void, // 接受开始事件
 *   acceptUpdateEvent: (event: T) => void, // 接受更新事件
 *   acceptEndEvent: (event: T) => void // 接受结束事件
 * }
 */
export function useStayEvent<T extends Event, C>(
    getPos: (event: T) => { x: number, y: number } | void,
    hooks: {
        onFit?: ((eventData: MenuEventData, ctx: C) => void)
        | ((eventData: MenuEventData) => void)
        | ((ctx: C) => void)
        | (() => void)
        onLeave?: ((ctx: C) => void)
        | (() => void)
        onFail?: ((ctx: C) => void)
        | (() => void)
    },
    continueTime: number,
): {
    handle: (event: T, ctx?: C | undefined) => void,
    handleEnd: (event: T) => void,
} {
    // 表示结束
    let end: boolean = true
    // 表示是否符合条件
    let fit: boolean = false
    // 记录开始位置
    let startPos: { x: number, y: number } | undefined = undefined
    // settiemout
    let timeout: number
    // 开始时事件数据
    let startEventData: MenuEventData
    // 额外参数
    let ctx: C | undefined
    const handle = (event: T, _ctx?: C | undefined) => {
        if (end) _acceptStartEvent(event, _ctx)
        else _acceptUpdateEvent(event)
    }
    const handleEnd = (event: T) => {
        if (end) return
        _acceptEndEvent(event)
    }
    const _acceptStartEvent = (event: T, _ctx?: C | undefined) => {
        fit = false
        end = false
        ctx = _ctx
        startPos = getPos(event) as { x: number, y: number }
        if (!startPos) return
        startEventData = {
            x: startPos.x,
            y: startPos.y,
            target: event.target as HTMLElement,
        }
        timeout = setTimeout(() => {
            fit = true
            _callFit()
        }, continueTime) as unknown as number
    }
    const _acceptUpdateEvent = (event: T) => {
        if (end) return
        const pos = getPos(event)
        if (!pos) return
        if (!startPos) return
        // 位置改变
        if (Math.abs(pos.x - startPos.x) > 10 ||
            Math.abs(pos.y - startPos.y) > 10) {
            _setEnd()
        }
    }
    const _acceptEndEvent = (event: T) => {
        if (end) return
        _setEnd()
        if (getPos(event)) _acceptUpdateEvent(event)
    }
    // ==工具函数=====================================
    const _setEnd = () => {
        end = true
        if (fit) _callLeave()
        else _callFail()
        // 清除定时器
        clearTimeout(timeout)
    }
    const _callFit = () => {
        if (hooks.onFit?.length === 0) {
            (hooks.onFit as () => void)()
        } else if (hooks.onFit?.length === 1) {
            let arg
            if (ctx) arg = ctx
            else arg = startEventData;

            (hooks.onFit as (arg: MenuEventData | C) => void)(arg)
        } else if (hooks.onFit?.length === 2) {
            (hooks.onFit as (eventData: MenuEventData, ctx?: C) => void)(startEventData, ctx)
        }
    }
    const _callLeave = () => {
        if (hooks.onLeave?.length === 0) {
            (hooks.onLeave as () => void)()
        } else if (hooks.onLeave?.length === 1) {
            (hooks.onLeave as (ctx?: C) => void)(ctx)
        }
    }
    const _callFail = () => {
        if (hooks.onFail?.length === 0) {
            (hooks.onFail as () => void)()
        } else if (hooks.onFail?.length === 1) {
            (hooks.onFail as (ctx?: C) => void)(ctx)
        }
    }
    return {
        handle,
        handleEnd,
    }
}

/**
 * 使用事件监听器
 * @param target 目标dom
 * @param event 事件
 * @param callback 回调
 */
export function useEventListener<T extends keyof DocumentEventMap>(
    target: Document,
    event: T,
    callback: (event: DocumentEventMap[T]) => void) {
    // 如果你想的话，
    // 也可以用字符串形式的 CSS 选择器来寻找目标 DOM 元素
    onMounted(() => target.addEventListener(event, callback))
    onUnmounted(() => target.removeEventListener(event, callback))
}

let viewportUnitsCache: { vw: ShallowRef<number>, vh: ShallowRef<number> } | undefined
export function useViewportUnits(): { vw: ShallowRef<number>, vh: ShallowRef<number> } {
    if (viewportUnitsCache)
        return viewportUnitsCache

    const vw = shallowRef(window.innerWidth / 100)
    const vh = shallowRef(window.innerHeight / 100)

    const updateUnits = () => {
        vw.value = window.innerWidth / 100
        vh.value = window.innerHeight / 100
    }

    onMounted(() => {
        window.addEventListener('resize', updateUnits)
    })

    onUnmounted(() => {
        window.removeEventListener('resize', updateUnits)
    })

    viewportUnitsCache = { vw, vh }

    return { vw, vh }
}

/**
 * 添加一个按键监听，支持组合键，注意，不支持多普通键组合，如`a+b`
 * @param keys 按键
 * @param callback 回调，返回true则阻断事件传播
 */
export function useKeyboard(...args: [string, ...string[], () => boolean | undefined]) {
    if (args.length > 2) {
        const cb = args.at(-1) as () => boolean | undefined
        for (const key of args.slice(0, -1)) {
            if (typeof key !== 'string') continue
            useKeyboard(key, cb)
        }
        return
    }
    // 支持组合键，如 'ctrl+shift+alt+s' 或 'a+b+c'
    const keyList = args[0].toLowerCase().split('+').map(k => k.trim())
    const cb = args[1] as () => boolean | undefined
    const modifierKeys = ['ctrl', 'shift', 'alt', 'meta']

    useEventListener(document, 'keydown', (event) => {
        let allMatch = true

        for (const key of keyList) {
            if (modifierKeys.includes(key)) {
                if (!event[`${key}Key`]) {
                    allMatch = false
                    break
                }
            }
            // 普通键
            else if (event.key.toLowerCase() !== key) {
                allMatch = false
                break
            }
        }

        // 只在所有键都匹配时触发
        if (allMatch) {
            const re = cb()
            if (re) {
                event.preventDefault()
                event.stopPropagation()
            }
        }
    })
}


function localStorageGetItem(key: string): string | null {
    if (backend.type === 'electron') {
        return backend.callSync('opt:get', key)
    } else {
        // eslint-disable-next-line no-restricted-globals
        return localStorage.getItem(key)
    }
}

function localStorageSetItem(key: string, value: string): void {
    if (backend.type === 'electron') {
        backend.callSync('opt:store', { key, value })
    } else {
        // eslint-disable-next-line no-restricted-globals
        localStorage.setItem(key, value)
    }
}

/**
 * 使用 localStorage
 * @param key 保存的键值
 * @param defaultValue 默认值
 * @returns
 */
export function useLocalStorage<T>(key: string, defaultValue: T): Ref<T> {
    const parser = (data: string) => {
        return JSON.parse(data).value as T
    }
    const serializer = (data: T) => {
        return JSON.stringify({ value: data })
    }
    const storageData = localStorageGetItem(key)
    const data = ref<T>(storageData ? parser(storageData) : defaultValue)
    watch(
        data,
        (newValue) => {
            localStorageSetItem(key, serializer(newValue))
        },
        { deep: true },
    )
    return data as Ref<T>
}
//#endregion

//#region == v命令封装 ======================================
/**
 * 创建一个右键菜单指令
 * 用于闭包公用停留事件控制器
 * @returns
 */
function createVMenu(): Directive<HTMLElement, (event: MenuEventData) => void> {
    // 右键菜单事件数据类型
    type Binding = DirectiveBinding<(event: MenuEventData) => void> & { modifiers: { prevent?: boolean, stop?: boolean } }

    let activeMenu = false
    const activePenPointers = new Set<number>()

    const isPenTouchEvent = (event: TouchEvent) => {
        if (activePenPointers.size > 0) return true
        const touch = event.changedTouches[0] || event.touches[0]
        const touchType = (touch as Touch & { touchType?: string })?.touchType
        return touchType === 'stylus'
    }

    const recordPointerType = (event: PointerEvent, isStart: boolean) => {
        if (event.pointerType !== 'pen') return
        if (isStart) {
            activePenPointers.add(event.pointerId)
            activeMenu = false
        } else {
            activePenPointers.delete(event.pointerId)
        }
    }

    // 右键菜单事件数据类型
    const {
        handle: menuTouchHandle,
        handleEnd: menuTouchEnd,
    } = useStayEvent(
        (event: TouchEvent) => {
            if (event.touches.length > 0) {
                const touch = event.touches[0]
                return { x: touch.clientX, y: touch.clientY }
            }
            return undefined
        },
        {
            onFit: (data: MenuEventData, binding: Binding) => {
                // 触发右键菜单事件
                binding.value(data)
                activeMenu = true
            }
        },
        400,
    )

    // 创建指令
    return {
        mounted(el: HTMLElement, binding: Binding,) {
            // 创建变量
            const prevent = binding.modifiers.prevent || false
            const stop = binding.modifiers.stop || false
            const controller = new AbortController()
            const options = { signal: controller.signal }

            // 修复由于 touch 阻断 click 事件冒泡的问题
            let touchStartTime = 0

            // 添加监听
            el.addEventListener('contextmenu', (event) => {
                if (prevent) event.preventDefault()
                if (stop) event.stopPropagation()
                const data: MenuEventData = {
                    x: event.clientX,
                    y: event.clientY,
                    target: event.target as HTMLElement,
                }
                binding.value(data)
            }, options)
            el.addEventListener('touchstart', (event) => {
                if (isPenTouchEvent(event)) return
                menuTouchHandle(event, binding)
                touchStartTime = Date.now()
            }, options)
            el.addEventListener('touchmove', (event) => {
                if (isPenTouchEvent(event)) return
                if (prevent && activeMenu) event.preventDefault()
                if (stop && activeMenu) event.stopPropagation()
                menuTouchHandle(event, binding)
            }, options)
            el.addEventListener('touchend', (event) => {
                if (isPenTouchEvent(event)) {
                    activeMenu = false
                    return
                }
                if (prevent && activeMenu) event.preventDefault()
                if (stop && activeMenu) event.stopPropagation()
                menuTouchEnd(event)
                activeMenu = false
                // 快速点击则触发点击事件
                if (Date.now() - touchStartTime < 200)
                    event.target?.['click']?.()
            }, options)
            el.addEventListener('pointerdown', (event) => {
                recordPointerType(event, true)
            }, options)
            el.addEventListener('pointerup', (event) => {
                recordPointerType(event, false)
            }, options)
            el.addEventListener('pointercancel', (event) => {
                recordPointerType(event, false)
            }, options)

                // 绑定控制器
                ; (el as any)._vMenuController = controller
        },
        unmounted(el: HTMLElement) {
            const controller = (el as any)._vMenuController
            if (!controller) return

            controller.abort()
            delete (el as any)._vMenuController
        },
    }
}
/**
 * 创建一个右键菜单指令
 * @example v-menu="(data: MenuEventData) =>  打开菜单函数(data, 其他参数)"
 */
export const vMenu: Directive<HTMLElement, (event: MenuEventData) => void, 'prevent' | 'stop'> = createVMenu()
/**
 * 挂在时如果设备支持,自动聚焦输入框
 */
export const vAutoFocus: Directive<HTMLInputElement | HTMLTextAreaElement, undefined> = {
    mounted(el: HTMLInputElement | HTMLTextAreaElement) {
        // 判断是否支持聚焦
        if (!shouldAutoFocus()) return

        // 检查元素是否可见
        const isVisible = () => {
            const style = window.getComputedStyle(el)
            return style.display !== 'none' &&
                style.visibility !== 'hidden' &&
                style.opacity !== '0'
        }

        if (!isVisible()) return

        el.focus()
    }
}

export interface SearchBinding<T extends object> {
    originList: Iterable<T>
    isSearch: boolean
    query: T[]
    forceUpdate?: number // 强制刷新
    match: (item: T, query: string) => boolean
}

/**
 * 生成一个 Search 指令
 */
export function createVSearch<T extends object>(): Directive<HTMLInputElement, SearchBinding<T>> {
    return {
        mounted(el, binding: DirectiveBinding<SearchBinding<T>>) {
            const controller = new AbortController()
            const queryTxt = ref('')

            el.addEventListener('input', () => {
                queryTxt.value = el.value.trim()
            }, { signal: controller.signal })

            const stopWatchEffect = watchEffect(() => {
                void binding.value.forceUpdate
                if (!queryTxt.value) {
                    binding.value.isSearch = false
                    binding.value.query = []
                } else {
                    binding.value.isSearch = true
                    binding.value.query = shallowReactive(Array.from(binding.value.originList)
                        .filter(item => binding.value.match(item, queryTxt.value)))
                }
            })
            const stopWatch = watch(() => binding.value.isSearch, (isSearch) => {
                if (!isSearch) {
                    binding.value.query = []
                }
            })
                ; (el as any)._vSearchController = controller
                ; (el as any)._vStopWatch = { stopWatch, stopWatchEffect }
        },
        unmounted(el) {
            const controller = (el as any)._vSearchController
            const stopWatch = (el as any)._vStopWatch
            if (controller) {
                controller.abort()
                delete (el as any)._vSearchController
            }
            if (stopWatch) {
                (stopWatch.stopWatch as WatchHandle).stop()
                    ; (stopWatch.stopWatchEffect as WatchHandle).stop()
                delete (el as any)._vStopWatch
            }
        }
    }
}
/**
 * 输入时在制定列表里搜索匹配的项
 * @example v-search="{
 *     originList: 制定的列表,
 *     isSearch: 当前是否在搜索,
 *     query: 搜索结果列表，
 * }"
 * @see createVSearch
 */
export const vSearch = createVSearch<any>()

/**
 * 是否隐藏元素
 * 如果值为 true，则隐藏元素（通过设置 opacity 为 0）
 * 如果值为 false，则显示元素（通过清除 opacity）
 * @example v-hide="true"
 */
export const vHide: Directive<HTMLElement, boolean> = {
    mounted(el: HTMLElement, binding: DirectiveBinding<boolean>) {
        if (binding.value)
            el.style.opacity = '0'

        else
            el.style.opacity = ''
    },
    updated(el: HTMLElement, binding: DirectiveBinding<boolean>) {
        if (binding.value)
            el.style.opacity = '0'

        else
            el.style.opacity = ''
    }
}

/**
 * 监听 Esc 键按下事件
 * 当按下 Esc 键时，执行绑定的函数
 * @example v-esc="退出函数"
 */
export const vEsc: Directive<HTMLElement, () => void> = {
    mounted(el: HTMLElement, binding: DirectiveBinding<() => void>) {
        const controller = new AbortController()
        const options = { signal: controller.signal }

        // 监听键盘事件
        const keydownHandler = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                event.stopPropagation()
                binding.value()
            }
        }
        document.addEventListener('keydown', keydownHandler, options)
            ; (el as any)._vEscController = controller
    },
    unmounted(el: HTMLElement) {
        const controller = (el as any)._vEscController

        if (!controller) return

        controller.abort()
        delete (el as any)._vEscController
    }
}

/**
 * v-move的选项
 */
export interface VMoveOptions<T extends HTMLElement> {
    beforeHook?: (el: T) => void
    moveHook?: (el: T, move: number) => void
    endHook?: (el: T) => void
    leftLimit?: {
        value: number,
        type: 'px' | '%'
    }
    rightLimit?: {
        value: number,
        type: 'px' | '%'
    }
    speedCondition?: {
        minMove: {
            value: number,
            type: 'px' | '%'
        }
        minSpeed: number
    },
    moveCondition?: {
        minMove: {
            value: number,
            type: 'px' | '%'
        }
    }
}

function createVMove<T extends HTMLElement>(): Directive<T, VMoveOptions<T>> {
    return {
        mounted(el: T, binding: DirectiveBinding<VMoveOptions<T>>) {
            const options = binding.value

            const moveFlag = {
                _move: 0,
                get move() {
                    return this._move
                },
                set move(value: number) {
                    if (value < -getLimit('left')) value = -getLimit('left')
                    if (value > getLimit('right')) value = getLimit('right')
                    this._move = value
                },
                onScroll: 'none' as 'none' | 'touch' | 'wheel',
                lastTime: null as null | number,
                speedList: [] as number[],
                touchLast: null as null | TouchEvent,
            }
            const activePenPointers = new Set<number>()

            const isPenTouchEvent = (event: TouchEvent) => {
                if (activePenPointers.size > 0) return true
                const touch = event.changedTouches[0] || event.touches[0]
                const touchType = (touch as Touch & { touchType?: string })?.touchType
                return touchType === 'stylus'
            }

            const recordPointerType = (event: PointerEvent, isStart: boolean) => {
                if (event.pointerType !== 'pen') return
                if (isStart) {
                    activePenPointers.add(event.pointerId)
                    moveFlag.touchLast = null
                } else {
                    activePenPointers.delete(event.pointerId)
                }
            }

            const getPxValue = (option: { type: 'px' | '%', value: number }) => {
                if (option.type === 'px') return option.value
                return el.getBoundingClientRect().width * option.value / 100
            }
            const getLimit = (type: 'left' | 'right') => {
                const option: { type: 'px' | '%', value: number } = options?.[type + 'Limit']
                if (!option) return 0
                return getPxValue(option)
            }

            // 滚轮滑动
            const chatWheelEvent = (event: WheelEvent) => {
                const process = (event: WheelEvent) => {
                    // 正在触屏,不处理
                    if (moveFlag.onScroll === 'touch') return false
                    const x = event.deltaX
                    const y = event.deltaY
                    const absX = Math.abs(x)
                    const absY = Math.abs(y)
                    // 斜度过大
                    if (absY !== 0 && absX / absY < 2) return false
                    dispenseMove('wheel', -x / 3)
                    return true
                }
                if (!process(event)) return
                event.stopPropagation()
                event.preventDefault()
                // 创建遮罩
                // 由于在窗口移动中,窗口判定箱也在移动,当指针不再窗口外,事件就断了
                // 所以要创建一个不会动的全局遮罩来处理
                wheelMask(process, () => {
                    dispenseMove('wheel', 0, true)
                })
            }

            // 触屏开始
            const chatMoveStartEvent = (event: TouchEvent) => {
                if (moveFlag.onScroll === 'wheel') return
                if (isPenTouchEvent(event)) return
                // 触屏开始时，记录触摸点
                moveFlag.touchLast = event
            }

            // 触屏滑动
            const chatMoveEvent = (event: TouchEvent) => {
                if (moveFlag.onScroll === 'wheel') return
                if (isPenTouchEvent(event)) return
                if (!moveFlag.touchLast) return
                const touch = event.changedTouches[0]
                const lastTouch = moveFlag.touchLast.changedTouches[0]
                const deltaX = touch.clientX - lastTouch.clientX
                const deltaY = touch.clientY - lastTouch.clientY
                const absX = Math.abs(deltaX)
                const absY = Math.abs(deltaY)
                // 斜度过大
                if (absY !== 0 && absX / absY < 2) return
                event.stopPropagation()
                event.preventDefault()
                // 触屏移动
                moveFlag.touchLast = event
                dispenseMove('touch', deltaX)
            }

            // 触屏滑动结束
            const chatMoveEndEvent = (event: TouchEvent) => {
                if (moveFlag.onScroll === 'wheel') return
                if (isPenTouchEvent(event)) {
                    moveFlag.touchLast = null
                    return
                }
                const touch = event.changedTouches[0]
                const lastTouch = moveFlag.touchLast?.changedTouches[0]
                if (lastTouch) {
                    const deltaX = touch.clientX - lastTouch.clientX
                    const deltaY = touch.clientY - lastTouch.clientY
                    const absX = Math.abs(deltaX)
                    const absY = Math.abs(deltaY)
                    // 斜度过大
                    if (absY === 0 || absX / absY > 2) {
                        dispenseMove('touch', deltaX)
                    }
                }
                dispenseMove('touch', 0, true)
                moveFlag.touchLast = null
            }
            /**
             * 分发触屏/滚轮情况
             */
            const dispenseMove = (type: 'touch' | 'wheel', value: number, end: boolean = false) => {
                if (!end && moveFlag.onScroll === 'none') startMove(type, value)
                if (moveFlag.onScroll === 'none') return
                if (end) endMove()
                else keepMove(value)
            }

            /**
             * 开始窗口移动
             */
            const startMove = (type: 'touch' | 'wheel', value: number) => {
                // 记录 flag
                moveFlag.onScroll = type
                moveFlag.move = value
                moveFlag.lastTime = Date.now()

                // 执行前置钩子
                options?.beforeHook?.(el)
                // 执行移动钩子
                options?.moveHook?.(el, moveFlag.move)
            }
            /**
             * 保持窗口移动
             */
            const keepMove = (value: number) => {
                // 增加移动值
                moveFlag.move += value
                // 计算速度
                const nowDate = Date.now()
                if (!moveFlag.lastTime) return
                const deltaTime = nowDate - moveFlag.lastTime
                moveFlag.lastTime = nowDate
                moveFlag.speedList.push(value / deltaTime)

                // 执行移动钩子
                options?.moveHook?.(el, moveFlag.move)
            }
            /**
             * 结束窗口移动
             */
            const endMove = () => {
                // 保留自己要的数据
                const move = moveFlag.move
                const speedList = moveFlag.speedList

                // 移动距离判定
                if (
                    options?.moveCondition &&
                    Math.abs(move) >= getPxValue(options.moveCondition.minMove)
                ) {
                    if (move > 0)
                        el.dispatchEvent(new CustomEvent('v-move-right', { detail: move }))
                    else
                        el.dispatchEvent(new CustomEvent('v-move-left', { detail: move }))
                } else
                    // 速度判定
                    if (
                        options?.speedCondition &&
                        Math.abs(move) >= getPxValue(options.speedCondition.minMove)
                    ) {
                        const endSpeedList = speedList.toReversed().slice(0, 10)
                        let endSpeed = 0
                        for (const speed of endSpeedList) {
                            endSpeed += speed
                        }
                        endSpeed /= endSpeedList.length
                        if (Math.abs(endSpeed) > options.speedCondition.minSpeed) {
                            if (endSpeed > 0)
                                el.dispatchEvent(new CustomEvent('v-move-right', { detail: move }))
                            else
                                el.dispatchEvent(new CustomEvent('v-move-left', { detail: move }))
                        }
                    }

                // 执行结束钩子
                binding.value?.endHook?.(el)

                // 重置数据
                moveFlag.onScroll = 'none'
                moveFlag.lastTime = 0
                moveFlag.speedList = []
                moveFlag.move = 0
            }

            // 添加监听
            const controller = new AbortController()
            const listenerOptions = { signal: controller.signal }
            el.addEventListener('wheel', chatWheelEvent, { ...listenerOptions, passive: false })
            el.addEventListener('pointerdown', (event) => {
                recordPointerType(event, true)
            }, listenerOptions)
            el.addEventListener('pointerup', (event) => {
                recordPointerType(event, false)
            }, listenerOptions)
            el.addEventListener('pointercancel', (event) => {
                recordPointerType(event, false)
            }, listenerOptions)
            el.addEventListener('touchstart', chatMoveStartEvent, listenerOptions)
            el.addEventListener('touchmove', chatMoveEvent, listenerOptions)
            el.addEventListener('touchend', chatMoveEndEvent, listenerOptions)
                ; (el as any)._vMoveController = controller

        },
        unmounted(el: T) {
            const controller = (el as any)._vMoveController
            if (!controller) return

            controller.abort()
            delete (el as any)._vMoveController
        }
    }
}

function createVLongHover(): Directive<HTMLElement, undefined> {
    const {
        handle: userHoverHandle,
        handleEnd: userHoverEnd,
    } = useStayEvent((event: MouseEvent) => {
        return { x: event.clientX, y: event.clientY, }
    }, {
        onFit: (eventData, ctx: HTMLElement) => {
            ctx.dispatchEvent(new CustomEvent('v-long-hover', { detail: eventData }))
        },
        onLeave: (ctx: HTMLElement) => {
            ctx.dispatchEvent(new CustomEvent('v-long-hover-end'))
        }
    }, 495
    )
    return {
        mounted(el: HTMLElement) {
            const controller = new AbortController()
            const options = { signal: controller.signal }

            el.addEventListener('mouseenter', (event) => {
                userHoverHandle(event, el)
            }, options)
            el.addEventListener('mousemove', (event) => {
                userHoverHandle(event, el)
            }, options)
            el.addEventListener('mouseleave', (event) => {
                userHoverEnd(event)
            }, options)
                ; (el as any)._vLongHoverController = controller
        },
        unmounted(el: HTMLElement) {
            const controller = (el as any)._vLongHoverController
            if (!controller) return

            controller.abort()
            delete (el as any)._vLongHoverController
        }
    }
}

/**
 * 监听元素左滑动/右滑动事件
 * 当元素被左滑动时，触发 'v-move-left' 事件
 * 当元素被右滑动时，触发 'v-move-right' 事件
 * @example <dom v-move="{
 *     beforeHook: 开始移动前的钩子函数,
 *     moveHook: 移动中的钩子函数,
 *     endHook: 结束移动后的钩子函数,
 *     leftLimit: 左侧移动限制,
 *     rightLimit: 右侧移动限制,
 *     speedCondition: 根据速度判定是否触发移动事件的条件,
 *     moveCondition: 根据移动距离判定是否触发移动事件的条件,
 * }"
 * onV-move-left="(move) => 左滑动事件(move)"
 * onV-move-right="(move) => 右滑动事件(move)"
 * />
 */
export const vMove = createVMove<any>()

/**
 * 监听元素长时间悬停事件
 * 当元素被鼠标悬停超过一定时间后，触发 'v-long-hover' 事件
 * 当鼠标移出元素时，触发 'v-long-hover-end' 事件
 * @example <dom v-long-hover
 * onV-long-hover="(eventData) => 长悬停事件(eventData)"
 * onV-long-hover-end="() => 长悬停结束事件()"
 * />
 */
export const vLongHover = createVLongHover()

type VTooltipBinding<T extends Component> =
    | T
    | VueCompData<T>
    | (() => T | VueCompData<T>)
    | ((eventData: { x: number, y: number }) => T | VueCompData<T>)

function resolveBinding<T extends Component>(binding: VTooltipBinding<T>, eventData: { x: number, y: number }): VueCompData<T> {
    if (typeof binding === 'function') {
        // eslint-disable-next-line multiline-ternary
        const result = binding.length === 0
            // eslint-disable-next-line multiline-ternary
            ? (binding as () => T | VueCompData<T>)()
            : (binding as (eventData: { x: number, y: number }) => T | VueCompData<T>)(eventData)
        if ('comp' in result) return result
        return { comp: result } as VueCompData<T>
    } else if ('comp' in binding) {
        return binding
    } else {
        return { comp: binding, props: {} } as VueCompData<T>
    }
}

/**
 * 监听元素长时间悬停事件以显示提示工具
 * 当元素被鼠标悬停超过一定时间后，显示提示工具
 * 当鼠标移出元素时，关闭提示工具
 * @modifiers debug - 调试模式，启用后悬停结束时不会关闭提示工具
 * @example <dom v-tooltip="{
 *     comp: 提示组件,
 *     props: 传递给提示组件的属性,
 *     model: 传递给提示组件的 v-model 数据,
 *     emit: 传递给提示组件的事件,
 * }" />
 */
export const vTooltip = {
    mounted<T extends Component>(el: HTMLElement, binding: DirectiveBinding<VTooltipBinding<T>> & { modifiers: { debug?: boolean } }) {
        const controller = new AbortController()
        const options = { signal: controller.signal }
            ; (vLongHover as any).mounted(el)
            ; (el as any)._vTooltipController = controller

        let tooltip: TooltipController | undefined

        el.addEventListener('v-long-hover', (ev: Event) => {
            const event = ev as CustomEvent<{ x: number, y: number }>
            const detail = event.detail
            const compData = resolveBinding(binding.value, detail)
            tooltip = addTooltip(compData, { x: detail.x, y: detail.y })
        }, options)

        el.addEventListener('v-long-hover-end', () => {
            if (binding.modifiers?.debug) return
            tooltip?.close()
            tooltip = undefined
        }, options)
    },

    unmounted(el: HTMLElement) {
        (vLongHover as any).unmounted(el)
        const controller = (el as any)._vTooltipController
        if (!controller) return

        controller.abort()
        delete (el as any)._vTooltipController
    }
}

//#endregion
