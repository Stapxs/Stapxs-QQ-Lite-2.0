import app from '@renderer/main'
import FileDownloader from 'js-file-downloader'
import option from '@renderer/function/option'
import semver from 'semver'
import appInfo from '../../../../../package.json'
import Umami from '@stapxs/umami-logger-typescript'

import AboutPan from '@renderer/components/AboutPan.vue'
import UpdatePan from '@renderer/components/UpdatePan.vue'
import WelPan from '@renderer/components/WelPan.vue'

import { KeyboardInfo } from '@capacitor/keyboard'
import { LogType, Logger, PopInfo, PopType } from '@renderer/function/base'
import { Connector, login } from '@renderer/function/connect'
import { runtimeData } from '@renderer/function/msg'
import { BaseChatInfoElem, MenuEventData } from '@renderer/function/elements/information'
import {
    hslToRgb,
    rgbToHsl,
} from '@renderer/function/utils/systemUtil'
import {
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
} from 'vue'
import { sendMsgRaw } from './msgUtil'
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
            if(showHighlight) {
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
 */
export function openLink(url: string, external = false) {
    // 判断是不是 Electron，是的话打开内嵌 iframe
    if (backend.isDesktop()) {
        if (!external && !runtimeData.sysConfig.close_browser) {
            runtimeData.popBoxList = []
            url = backend.proxyUrl(url)
            const popInfo = {
                html: `<iframe src="${url}" class="view-iframe"></iframe>`,
                full: true,
                button: [
                    {
                        text: app.config.globalProperties.$t(
                            '请不要在内嵌页面中输入敏感信息，内嵌页面并不安全。',
                        ),
                        fun: () => undefined,
                    },
                    {
                        text: app.config.globalProperties.$t('打开…'),
                        fun: () => {
                            const shell = window.electron?.shell
                            if (shell) {
                                shell.openExternal(url)
                            } else {
                                backend.call('', 'sys:openInBrowser', false, backend.proxyUrl(url))
                            }
                            runtimeData.popBoxList.shift()
                        },
                    },
                    {
                        text: app.config.globalProperties.$t('关闭'),
                        master: true,
                        fun: () => {
                            runtimeData.popBoxList.shift()
                        },
                    },
                ],
            }
            runtimeData.popBoxList.push(popInfo)
        } else {
            const shell = window.electron?.shell
            if (shell) {
                shell.openExternal(url)
            } else {
                if(backend.proxy) {
                    url = decodeURIComponent(url.replace(`http://localhost:${backend.proxy}/proxy?url=`, ''))
                }
                backend.call('', 'sys:openInBrowser', false, url)
            }
        }
    } else {
        window.open(url)
    }
}

/**
 * 加载历史消息
 * @param info 聊天基本信息
 */
export function loadHistory(info: BaseChatInfoElem) {
    runtimeData.messageList = []
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
    let name: string
    const fullPage = runtimeData.jsonMap.message_list?.pagerType == 'full'
    if (runtimeData.jsonMap.message_list && type != 'group') {
        name = runtimeData.jsonMap.message_list.private_name
    } else {
        name = runtimeData.jsonMap.message_list.name
    }

    Connector.send(
        name ?? 'get_chat_history',
        {
            group_id: type == 'group' ? id : undefined,
            user_id: type != 'group' ? id : undefined,
            message_id: 0,
            count: fullPage ? runtimeData.messageList.length + count : count,
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
        runtimeData.userList = []
        let friendName = 'get_friend_list'
        let groupName = 'get_group_list'
        if (runtimeData.jsonMap.user_list?.name) {
            friendName = runtimeData.jsonMap.user_list.name.split('|')[0]
            groupName = runtimeData.jsonMap.user_list.name.split('|')[1]
        } else if (
            runtimeData.jsonMap.friend_list?.name &&
            runtimeData.jsonMap.group_list?.name
        ) {
            friendName = runtimeData.jsonMap.friend_list.name
            groupName = runtimeData.jsonMap.group_list.name
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
    if (runtimeData.chatInfo.show.id != Number(userId)) {
        const body = document.getElementById('user-' + userId)
        if (body === null) {
            // 从缓存列表里寻找这个 ID
            for (let i = 0; i < runtimeData.userList.length; i++) {
                const item = runtimeData.userList[i]
                const id =
                    item.user_id !== undefined ? item.user_id : item.group_id
                if (String(id) === userId) {
                    // 把它插入到显示列表的第一个
                    runtimeData.showList?.unshift(item)
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
 * @param process 下载中回调
 */
export function downloadFile(
    url: string,
    name: string,
    onprocess: (event: ProgressEvent & { [key: string]: any }) => undefined,
    oncancel: (event: ProgressEvent & { [key: string]: any }) => undefined,
) {
    if (document.location.protocol == 'https:') {
        // 判断下载文件 URL 的协议
        // PS：Chrome 不会对 http 下载的文件进行协议升级
        if (url.toLowerCase().startsWith('http:')) {
            url = 'https' + url.substring(url.indexOf('://'))
        }
    }
    if (backend.isWeb()) {
        try {
            new FileDownloader({
                url: url,
                autoStart: true,
                process: onprocess,
                nameCallback: function () {
                    return name
                },
            })
        } catch (e) {
            logger.error(e as Error, '下载文件失败')
        }
    } else {
        backend.addListener(undefined, 'sys:downloadBack', (event, data) => {
            onprocess(data || event.payload)
        })
        backend.addListener(undefined, 'sys:downloadCancel', (event, data) => {
            oncancel(data || event.payload)
        })
        backend.call(undefined, 'sys:download', false, {
            downloadPath: url,
            fileName: name,
        })
    }
}

/**
* Windows：获取加载系统主题色
* @param color 颜色
*/
export function updateWinColor(color: string) {
    const process = window.electron?.process
    if (process && process.platform == 'win32') {
        const red = parseInt(color.substr(0, 2), 16)
        const green = parseInt(color.substr(2, 2), 16)
        const blue = parseInt(color.substr(4, 2), 16)
        // 平衡颜色亮度
        const hsl = rgbToHsl(red, green, blue)
        const media = window.matchMedia('(prefers-color-scheme: dark)')
        const autodark = option.get('opt_auto_dark')
        const dark = option.get('opt_dark')
        if (
            (autodark == true && media.matches) ||
            (autodark != true && dark == true)
        ) {
            hsl[2] = 0.8
        } else {
            hsl[2] = 0.3
        }
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
    } else {
        document.documentElement.style.setProperty(
            '--color-main',
            '#' + color.substring(0, 6) + 'CF',
        )
    }
}
export async function loadWinColor() {
    // 获取系统主题色
    updateWinColor(await backend.call(undefined, 'sys:getWinColor', true))
}

/**
* macOS：创建应用菜单
*/
export function createMenu() {
    const { $t } = app.config.globalProperties
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
            count: runtimeData.userList.length,
        })
        menuTitles.flushUser = $t('刷新列表…')

        menuTitles.help = $t('帮助')
        menuTitles.doc = $t('帮助文档')
        menuTitles.feedback = $t('在 Github 上反馈问题')
        menuTitles.license = $t('许可协议')

        backend.call(undefined, 'sys:createMenu', false,
            backend.type == 'tauri' ? { data: menuTitles} : menuTitles)
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
        const item = runtimeData.baseOnMsgList.get(info.id)
        if(item) {
            item.new_msg = false
            item.highlight = undefined
            runtimeData.baseOnMsgList.set(Number(info.id), item)
        }
    })
    // 应用功能
    backend.addListener(undefined, 'app:about', () => {
            const popInfo = {
                title: app.config.globalProperties.$t('关于') + ' ' +
                        app.config.globalProperties.$t('Stapxs QQ Lite'),
                template: AboutPan,
                allowQuickClose: false,
            }
            runtimeData.popBoxList.push(popInfo)
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
    if(backend.isMobile()) {
        // 注册回调监听
        backend.addListener('Onebot', 'onebot:event', (data) => {
            const msg = JSON.parse(data.data)
            switch(data.type) {
                case 'onopen': Connector.onopen(login.address, login.token); break
                case 'onmessage': Connector.onmessage(data.data); break
                case 'onclose': Connector.onclose(msg.code, msg.message, login.address, login.token); break
                case 'onerror': {
                    login.creating = false
                    popInfo.add(PopType.ERR, $t('连接失败') + ': ' + msg.type, false);
                    break
                }
                case 'onServiceFound': setQuickLogin(msg.address, msg.port); break
                default: break
            }
        })
        // 通知
        const permission = await backend.call('LocalNotifications', 'checkPermissions', true)
        const permissionStr = permission || permission.display
        if(permissionStr.indexOf('prompt') != -1) {
            await backend.call('LocalNotifications', 'requestPermissions', false)
        } else if(permissionStr.indexOf('denied') != -1) {
            logger.error(null, '通知权限已被拒绝')
            logger.system('开发者阁下为什么要拒绝通知权限的请求呢？')
        } else {
            logger.debug('通知权限已开启')
            // 注册通知类型
            backend.call('LocalNotifications', 'registerActionTypes', false,{
                types:[{
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
                const notification =
                    info.notification as LocalNotificationSchema
                if(info.actionId == 'tap') {
                    // PS：通知被点击后会自动被关闭，所以这里不需要处理
                    jumpToChat(notification.extra.userId,
                        notification.extra.msgId)
                } else if(info.actionId == 'REPLY_ACTION') {
                    // 快速回复
                    sendMsgRaw(
                        notification.extra.userId,
                        notification.extra.chatType,
                        parseMsg( info.inputValue ?? '', [{ type: 'reply', id: String(notification.extra.msgId) }], []),
                        true
                    )
                    // 去消息列表内寻找，去除新消息标记
                    const item = runtimeData.baseOnMsgList.get(Number(notification.extra.userId))
                    if(item) {
                        item.new_msg = false
                        item.highlight = undefined
                        runtimeData.baseOnMsgList.set(Number(notification.extra.userId), item)
                    }
                }
            })
        }
        // 键盘
        backend.call('Keyboard', 'setAccessoryBarVisible', false, { isVisible: false })
        backend.addListener('Keyboard', 'keyboardWillShow', async (info: KeyboardInfo) => {
            const keyboardHeight = info.keyboardHeight

            // 调整输入框高度
            const sendMore = document.getElementById('send-more')
            if(sendMore && keyboardHeight > window.innerHeight / 3) {
                sendMore.style.paddingBottom = '10px'
            }

            const safeArea = await backend.call('SafeArea', 'getSafeArea', true)
            const tabBar = document.getElementsByTagName('ul')[0]
            // 如果键盘高度低于高度的 1/3 且是 iOS 设备
            // PS：这种情况下是物理键盘输入模式，它不是个完整键盘
            //     这种情况下比较头疼，不能让 vebview 调整高度会出现黑色区域
            if(backend.platform == 'ios' && keyboardHeight < window.innerHeight / 3) {
                // 修改 ResizeMode
                backend.call('Keyboard', 'setResizeMode', false, { mode: 'none' })
                // 这种情况下需要进行正常的底部避让，调整 --safe-area-bottom
                const baseApp = document.getElementById('base-app')
                if (safeArea && baseApp) {
                    baseApp.style.setProperty('--safe-area-bottom', (keyboardHeight - safeArea.bottom + 10) + 'px')
                }
                // 调整菜单高度
                if(safeArea && tabBar) {
                    tabBar.style.setProperty('padding-bottom', safeArea.bottom + 'px', 'important')
                }
            } else if (tabBar) {
                // 调整菜单高度
                tabBar.style.setProperty('padding-bottom', '10px', 'important')
            }

            // 调整整个 HTML 的高度
            // PS：仅用于解决 Android 在全屏沉浸式下键盘遮挡问题
            const html = document.getElementsByTagName('html')[0]
            if(html && backend.platform == 'android') {
                const safeArea = await backend.call('SafeArea', 'getSafeArea', true)
                html.style.height = `calc(100% - ${keyboardHeight + safeArea.top}px)`
            }
        })
        backend.addListener('Keyboard', 'keyboardWillHide', async () => {
            backend.call('Keyboard', 'setResizeMode', false, { mode: 'native' })
            const baseApp = document.getElementById('base-app')
            const safeArea = await backend.call('SafeArea', 'getSafeArea', true)
            if (safeArea && baseApp) {
                baseApp.style.setProperty('--safe-area-bottom', safeArea.bottom + 'px')
            }

            const tabBar = document.getElementsByTagName('ul')[0]
            if(tabBar) {
                tabBar.style.paddingBottom = ''
            }
            const sendMore = document.getElementById('send-more')
            if(sendMore) {
                sendMore.style.paddingBottom = 'var(--safe-area-bottom)'
            }
            // 调整整个 HTML 的高度
            // PS：仅用于解决 Android 在全屏沉浸式下键盘遮挡问题
            const html = document.getElementsByTagName('html')[0]
            if(html && backend.platform == 'android') {
                html.style.height = 'calc(100%)'
            }
        })
        // 状态栏（Android）
        backend.call('NavigationBar', 'setTransparency', false, { isTransparent: true })
        backend.call('StatusBar', 'setOverlaysWebView', false, { overlay: true })
        backend.call('StatusBar', 'setBackgroundColor', false, { color: '#ffffff00' })
    }
}

import { ActionType, LocalNotificationSchema } from '@capacitor/local-notifications'
import { backend } from '@renderer/runtime/backend'
// import windowsCss from '@renderer/assets/css/append/mobile/append_windows.css?raw'
/**
* 初始化快速连接信息
* @param address 地址
* @param port 端口
*/
function setQuickLogin(address: string, port: number) {
    if(login.quickLogin != null)
        login.quickLogin.push({ address: address, port: port })
}

/**
* 检查更新
*/
export function checkUpdate() {
    // 获取最新的 release 信息
    const packageUrl =
        'https://api.github.com/repos/stapxs/Stapxs-QQ-Lite-2.0/releases/latest'
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

    if (semver.lt(appVersion,latestVersion)) {
        // 有更新
        showReleaseLog(data, false)
    }
    if (
        cacheVersion &&
        semver.eq(appVersion,latestVersion) &&
        semver.lt(cacheVersion,latestVersion)
    ) {
        // 更新完成首次启动
        showReleaseLog(data, true)
    }
}
function showReleaseLog(data: any, isUpdated: boolean) {
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
                  fun: () => runtimeData.popBoxList.shift(),
              },
              {
                  text: $t('下载更新…'),
                  master: true,
                  fun: () => openLink(data.html_url, true),
              },
          ]: [
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
        template: UpdatePan,
        templateValue: toRaw(info),
        button: isUpdated? [
                  {
                      text: $t('查看…'),
                      fun: () => openLink(data.html_url, true),
                  },
                  {
                      text: $t('知道了'),
                      master: true,
                      fun: () => {
                          runtimeData.popBoxList.shift()
                      },
                  },
              ]: buttonGoUpdate,
    }
    runtimeData.popBoxList.push(popInfo)
}

/**
* 显示使用次数弹窗
*/
export function checkOpenTimes() {
    if (import.meta.env.DEV) return     // 开发环境不显示
    const { $t } = app.config.globalProperties
    const times = localStorage.getItem('times')
    if (times != null) {
        const getTimes = Number(times) + 1
        localStorage.setItem('times', getTimes.toString())
        if (getTimes % 50 == 0) {
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
                            runtimeData.popBoxList.shift()
                        },
                    },
                    {
                        text: $t('好喔'),
                        master: true,
                        fun: () => {
                            openLink(
                                'https://github.com/Stapxs/Stapxs-QQ-Lite-2.0',
                            )
                            runtimeData.popBoxList.shift()
                        },
                    },
                ],
            }
            runtimeData.popBoxList.push(popInfo)
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
            template: WelPan,
            allowClose: false,
            button: [],
        }
        runtimeData.popBoxList.push(popInfo)
        localStorage.setItem('guide', guideVersion.toString())
    }
}

/**
* 显示全局公告弹窗
*/
export function checkNotice() {
    const url =
        'https://lib.stapxs.cn/download/stapxs-qq-lite/notice-config.json'
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
                let isShowInDate = false
                if (!notice.show_date) {
                    isShowInDate = true
                } else if (
                    typeof notice.show_date == 'string' &&
                    new Date().toDateString() ===
                        new Date(notice.show_date).toDateString()
                ) {
                    isShowInDate = true
                } else if (typeof notice.show_date == 'object') {
                    notice.show_date.forEach((date: number) => {
                        if (
                            new Date().toDateString() ===
                            new Date(date).toDateString()
                        ) {
                            isShowInDate = true
                        }
                    })
                }
                if (
                    notice.version == 2 &&
                    noticeShow.indexOf(notice.id.toString()) < 0 &&
                    isShowInDate
                ) {
                    // 加载公告弹窗列表
                    for (let i = 0; i < notice.pops.length; i++) {
                        // 添加弹窗
                        const info = notice.pops[i]
                        const popInfo = {
                            title: info.title,
                            html: info.html ? info.html : '',
                            button: [
                                {
                                    text:
                                        notice.pops.length > 1 &&
                                        i != notice.pops.length - 1? app.config.globalProperties.$t(
                                                  '继续',
                                              ): app.config.globalProperties.$t(
                                                  '确定',
                                              ),
                                    master: true,
                                    fun: () => {
                                        // 添加已读记录
                                        if (noticeShow.indexOf(notice.id) < 0) {
                                            noticeShow.push(notice.id)
                                        }
                                        localStorage.setItem(
                                            'notice_show',
                                            noticeShow.toString(),
                                        )
                                        // 关闭弹窗
                                        runtimeData.popBoxList.shift()
                                    },
                                },
                            ],
                        }
                        runtimeData.popBoxList.push(popInfo)
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
            if(msgPath) {
                logger.system('开发者，请稍等一下（翻找），正在为阁下加载 ' + msgPath.name + ' 的服务映射表。')
                if (msgPath.redirect) {
                    // eslint-disable-next-line
                    const newMsgPathKey = Object.keys(msgPathList).find((key) => {
                        return key.includes(msgPath?.redirect)
                    })
                    let newMsgPath = undefined as
                            { [key: string]: any } | undefined
                    if(newMsgPathKey) {
                        newMsgPath = (msgPathList[newMsgPathKey] as any).default
                    }
                    // 合并映射表
                    Object.keys(msgPath).forEach((key) => {
                        if (newMsgPath && key != 'name' && newMsgPath[key]) {
                            if(msgPath)
                                newMsgPath[key] = msgPath[key]
                        }
                    })
                    msgPath = newMsgPath
                    logger.system('非常抱歉开发者，已帮阁下将映射表重定向加载为 ：' + msgPath?.name + ' （慌张）')
                }
            }
            runtimeData.jsonMap = msgPath
        } catch (ex) {
            logger.system('很抱歉开发者，映射表加载失败 ……' + ex)
        }
    }
    return msgPath
}

/**
* UM：统计事件统一上传方法
* @param event 事件名
* @param data 数据
*/
export function sendStatEvent(event: string, data: any) {
    if (!option.get('close_ga') && !import.meta.env.DEV) {
        Umami.trackEvent(event, data)
    }
}

/**
* 切换群组通知状态
* @param group_id 群组 ID
* @param open 是否开启通知
*/
export function changeGroupNotice(group_id: number, open: boolean) {
    const noticeInfo = option.get('notice_group') ?? {}
    const list = noticeInfo[runtimeData.loginInfo.uin]
    if(open) {
        if (list) {
            list.push(group_id)
        } else {
            noticeInfo[runtimeData.loginInfo.uin] = [group_id]
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
export function useStayEvent<T extends Event,C>(
    getPos: (event: T)=>{x: number, y: number} | void,
    hooks: {
        onFit?: ((eventData: MenuEventData, ctx: C)=>void)
              | ((eventData: MenuEventData)=>void)
              | ((ctx: C)=>void)
              | (()=>void)
        onLeave?: ((ctx: C)=>void)
                | (()=>void)
        onFail?: ((ctx: C)=>void)
               | (()=>void)
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
    let startPos: {x: number, y: number} | undefined = undefined
    // settiemout
    let timeout: number
    // 开始时事件数据
    let startEventData: MenuEventData
    // 额外参数
    let ctx: C | undefined
    const handle = (event: T, _ctx?: C|undefined) => {
        if (end) _acceptStartEvent(event, _ctx)
        else _acceptUpdateEvent(event)
    }
    const handleEnd = (event: T) => {
        if (end) return
        _acceptEndEvent(event)
    }
    const _acceptStartEvent = (event: T, _ctx?: C|undefined) => {
        fit = false
        end = false
        ctx = _ctx
        startPos = getPos(event) as {x: number, y: number}
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

            (hooks.onFit as (arg: MenuEventData|C) => void)(arg)
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
//#endregion

//#region == v命令封装 ======================================
/**
 * 创建一个右键菜单指令
 * 用于闭包公用停留事件控制器
 * @returns
 */
function createVMenu(): Directive<HTMLElement, (event: MenuEventData)=>void> {
    // 右键菜单事件数据类型
    type Binding = DirectiveBinding<(event: MenuEventData)=>void> & { modifiers: {prevent?: boolean, stop?: boolean} }

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
            }
        },
        400,
    )

    // 创建指令
    return {
        mounted( el: HTMLElement, binding: Binding, ) {
            // 创建变量
            const prevent = binding.modifiers.prevent || false
            const stop = binding.modifiers.stop || false
            const controller = new AbortController()
            const options = {signal: controller.signal}

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
                if (prevent) event.preventDefault()
                if (stop) event.stopPropagation()
                menuTouchHandle(event, binding)
                touchStartTime = Date.now()
            }, options)
            el.addEventListener('touchmove', (event) => {
                if (prevent) event.preventDefault()
                if (stop) event.stopPropagation()
                menuTouchHandle(event, binding)
            }, options)
            el.addEventListener('touchend', (event) => {
                if (prevent) event.preventDefault()
                if (stop) event.stopPropagation()
                menuTouchEnd(event)
				// 快速点击则触发点击事件
                if (Date.now() - touchStartTime < 200)
					event.target?.['click']?.()
            }, options)

            // 绑定控制器
            ;(el as any)._vMenuController = controller
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
export const vMenu: Directive<HTMLElement, (event: MenuEventData)=>void, 'prevent' | 'stop'> = createVMenu()
/**
 * 挂在时如果设备支持,自动聚焦输入框
 */
export const vAutoFocus: Directive<HTMLInputElement|HTMLTextAreaElement, undefined> = {
    mounted(el: HTMLInputElement|HTMLTextAreaElement) {
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
            ;(el as any)._vSearchController = controller
            ;(el as any)._vStopWatch = { stopWatch, stopWatchEffect }
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
                ;(stopWatch.stopWatchEffect as WatchHandle).stop()
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
//#endregion
