import app from '@/main'
import zh from '@/assets/l10n/zh-CN.json'
import FileDownloader from 'js-file-downloader'
import option, { remove } from '@/function/option'

import { Rule, Stylesheet, Declaration } from 'css'
import { PopInfo, PopType } from '@/function/base'
import { Connector, login } from '@/function/connect'
import { runtimeData } from '@/function/msg'
import { BaseChatInfoElem } from '@/function/elements/information'
import { hslToRgb, rgbToHsl } from '@/function/utils/systemUtil'
import AboutPan from '@/components/AboutPan.vue'

const popInfo = new PopInfo()

/**
 * 滚动到目标消息（不自动加载）
 * @param seqName DOM 名
 */
export function scrollToMsg (seqName: string, showAnimation: boolean): boolean {
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
            msg.style.transition = 'background 1s'
            msg.style.background = 'rgba(0, 0, 0, 0.06)'
            setTimeout(() => {
                msg.style.background = 'unset'
                setTimeout(() => {
                    msg.style.transition = 'background .3s'
                }, 1100)
            }, 3000)
            return true
        }
    }
    return false
}

/**
 * 打开链接
 * @param url 链接
 */
export function openLink(url: string) {
    // 判断是不是 Electron，是的话打开内嵌 iframe
    if(runtimeData.tags.isElectron) {
        const popInfo = {
            html: `<iframe src="${url}" class="view-iframe"></iframe>`,
            full: true,
            button: [
                {
                    text: app.config.globalProperties.$t('btn_open'),
                    fun: () => {
                        const electron = window.require('electron')
                        const shell = electron ? electron.shell : null
                        if (shell) {
                            shell.openExternal(url)
                        }
                        runtimeData.popBoxList.shift()
                    }
                },
                {
                    text: app.config.globalProperties.$t('btn_close'),
                    master: true,
                    fun: () => { runtimeData.popBoxList.shift() }
                }
            ]
        }
        runtimeData.popBoxList = []
        runtimeData.popBoxList.push(popInfo)
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
        new PopInfo().add(PopType.ERR, app.config.globalProperties.$t('pop_load_history_fail'), false)
    }
}
export function loadHistoryMessage(id: number, type: string, count = 20, echo = 'getChatHistoryFist') {
    let name
    if(runtimeData.jsonMap.message_list && type != "group") {
        name = runtimeData.jsonMap.message_list.private_name
    } else {
        name = runtimeData.jsonMap.message_list.name
    }

    Connector.send(
        name ?? 'get_chat_history',
        {
            message_type: runtimeData.jsonMap.message_list.message_type[type],
            group_id: type == "group" ? id : undefined,
            user_id: type != "group" ? id : undefined,
            message_seq: 0,
            message_id: 0,
            count: count
        },
        echo
    )
    return true
}

/**
 * 重新加载用户列表
 */
export function reloadUsers() {
    if (login.status) {
        runtimeData.userList = []
        Connector.send('get_friend_list', {}, 'getFriendList')
        Connector.send('get_group_list', {}, 'getGroupList')
        Connector.send('get_system_msg', {}, 'getSystemMsg')
        Connector.send('get_class_info', {}, "getClassInfo")
    }
}

/**
 * 初始化构建 UI Test 的范例数据
 */
export function initUITest() {
    // 绕过登陆判定
    runtimeData.loginInfo.status = true
    runtimeData.loginInfo.info = { 'uin': 1111111111, 'lnick': '这只是测试用的数据', 'nick': '林小槐' }
    // 填充运行时数据
    // Vue.set(runtimeData, 'onChat', { "type": "group", "id": 1111111111, "name": "Stapxs QQ Lite 内测群", "avatar": "https://p.qlogo.cn/gh/1111111111/1111111111/0", "info": { "group": {}, "group_members": [{ "user_id": 2222222222, "nickname": "林小槐", "card": "", "level": 1, "role": "admin" }, { "user_id": 3333333333, "nickname": "HappyDay's  small ID", "card": "", "level": 1, "role": "member" }, { "user_id": 4444444444, "nickname": "晓狩", "card": "", "level": 1, "role": "member" }], "group_files": { "file_list": [{ "bus_id": 104, "create_time": 1669356711, "dead_time": 1670221311, "download_times": 2, "id": "/0d55f622-6c88-11ed-8d9f-5254001daf95", "md5": "8106ece97e5de9434d63faa991d8513f", "name": "901309905.mp4", "owner_name": "林小槐", "owner_uin": 2222222222, "parent_id": "/", "size": 161478663, "type": 1 }], "next_index": 0, "total_cnt": 1 }, "group_sub_files": {}, "user": {}, "me": { "group_id": 1111111111, "user_id": 2222222222, "nickname": "林小槐", "card": "", "level": 1, "role": "admin", "echo": "getUserInfoInGroup" }, "group_notices": { "feeds": [{ "u": 2222222222, "msg": { "text": "Stapxs QQ Lite 2.0 来辣，戳下面的链接去用用看 ……\nmemo 全新的 README（还有点感谢内容要写）\nsparkles 群公告支持（不支持图片）\nbug 修正在窄布局下，底栏被消息组件弹窗遮挡\nart 拆分 MsgBody 的部分方法便于之后的兼容复用\nsparkles 消息列表部分功能（打开自动添加到消息列表、新消息置顶、新消息提示、显示消息预览）\nbug 修正了好友列表搜索不支持备注的遗漏 \nhttps://stapxs.github.io/Stapxs-QQ-Lite-2.0/", "text_face": "Stapxs QQ Lite 2.0 来辣，戳下面的链接去用用看 ……\nmemo 全新的 README（还有点感谢内容要写）\nsparkles 群公告支持（不支持图片）\nbug 修正在窄布局下，底栏被消息组件弹窗遮挡\nart 拆分 MsgBody 的部分方法便于之后的兼容复用\nsparkles 消息列表部分功能（打开自动添加到消息列表、新消息置顶、新消息提示、显示消息预览）\nbug 修正了好友列表搜索不支持备注的遗漏 \nhttps://stapxs.github.io/Stapxs-QQ-Lite-2.0/", "title": "群公告" }, "read_num": 4, "is_read": 0 }] } } })
    // Vue.set(runtimeData, 'userList', [{ "user_id": 3333333333, "nickname": "晓狩", "sex": "male", "remark": "" }, { "group_id": 1000000000, "group_name": "DHW ∞ 行在", "owner_id": 2222222222 }])
    // Vue.set(runtimeData, 'onMsg', [{ "group_id": 1000000000, "group_name": "DHW ∞ 行在", "owner_id": 2222222222, "new_msg": false }, { "group_id": 1111111111, "group_name": "Stapxs QQ Lite 内测群", "owner_id": 2222222222, "new_msg": true }])
    // Vue.set(runtimeData, 'messageList', [{ "post_type": "message", "message_id": "E/1", "user_id": 2222222222, "time": 1669898020, "seq": 9706, "rand": 1560268290, "font": "微软雅黑", "message": [{ "type": "text", "text": "又遇到个见鬼的 BUG ……" }], "raw_message": "又遇到个见鬼的 BUG ……", "message_type": "group", "sender": { "user_id": 2222222222, "nickname": "林小槐", "card": "" }, "group_id": 1111111111, "atme": false, "atall": false }, { "post_type": "message", "message_id": "E/2", "user_id": 2222222222, "time": 1669898020, "seq": 9706, "rand": 1560268290, "font": "微软雅黑", "message": [{ "type": "text", "text": "https://github.com/Stapxs/Stapxs-QQ-Lite-2.0" }], "raw_message": "https://github.com/Stapxs/Stapxs-QQ-Lite-2.0", "message_type": "group", "sender": { "user_id": 2222222222, "nickname": "林小槐", "card": "" }, "group_id": 1111111111, "atme": false, "atall": false }, { "post_type": "message", "message_id": "E/3", "user_id": 2222222222, "time": 1669898020, "seq": 9706, "rand": 1560268290, "font": "微软雅黑", "message": [{ "type": "text", "text": "看看现在好没好" }], "raw_message": "看看现在好没好", "message_type": "group", "sender": { "user_id": 2222222222, "nickname": "林小槐", "card": "" }, "group_id": 1111111111, "atme": false, "atall": false }, { "post_type": "notice", "notice_type": "group", "group_id": 1111111111, "sub_type": "recall", "user_id": 2222222222, "operator_id": 2222222222, "message_id": "这个不重要", "self_id": 2222222222, "name": "林小槐", "time": 1669898020 }, { "post_type": "message", "message_id": "E/5", "user_id": 2222222222, "time": 1669943800, "seq": 114361, "rand": 3096699112, "font": "宋体", "message": [{ "type": "image", "file": "66cba6ff5b2364d27eb3d6ed4d2faeca92966-554-838.png", "url": "https://gchat.qpic.cn/gchatpic_new/1007028430/560932983-3133756386-66CBA6FF5B2364D27EB3D6ED4D2FAECA/0?term=2&is_origin=0", "asface": false }, { "type": "text", "text": " 像是这样翻译模式（UI 测试模式）应该就能用了 hummmm" }], "raw_message": "[图片] 像是这样翻译模式（UI 测试模式）应该就能用了 hummmm", "message_type": "group", "sender": { "user_id": 2222222222, "nickname": "林小槐 - Stapx_Steve", "card": "林小槐 - Stapx_Steve", "level": 1, "role": "admin" }, "group_id": 1111111111 }])
    // Vue.set(runtimeData, 'botInfo', { "app_name": "oicq2", "version": "2.3.1", "http_api": "1.1.0", "stat": { "start_time": 1669940663, "lost_times": 0, "recv_pkt_cnt": 30, "sent_pkt_cnt": 24, "lost_pkt_cnt": 0, "recv_msg_cnt": 1, "sent_msg_cnt": 0, "msg_cnt_per_min": 0, "remote_ip": "58.212.179.115", "remote_port": 8080 } })
    // Vue.set(runtimeData, 'loginInfo', { "uin": 2222222222, "status": "online", "nickname": "林小槐", "sex": "male" })
    // Vue.set(runtimeData, 'showData', [{ "group_id": 1000000000, "group_name": "DHW ∞ 行在", "owner_id": 2222222222 }, { "user_id": 3333333333, "nickname": "晓狩", "sex": "male", "remark": "" }])
    // Vue.set(runtimeData, 'mergeMessageList', [{ "user_id": 2222222222, "time": 1669942039, "nickname": "林小槐 - Stapx_Steve", "group_id": 1111111111, "message": [{ "type": "image", "file": "6b02169dd9cb486330e400fdebf8312a5310-290-290.jpg", "url": "https://gchat.qpic.cn/gchatpic_new/1007028430/560932983-2842238012-6B02169DD9CB486330E400FDEBF8312A/0?term=2&is_origin=0", "asface": true }], "raw_message": "[动画表情]", "sender": { "user_id": 2222222222, "nickname": "林小槐 - Stapx_Steve", "card": "林小槐 - Stapx_Steve" } }, { "time": 1669893493, "user_id": 2222222222, "nickname": "林小槐 - Stapx_Steve", "group_id": 1111111111, "message": [{ "type": "text", "text": "烦内" }], "raw_message": "烦内", "sender": { "user_id": 2222222222, "nickname": "林小槐 - Stapx_Steve", "card": "林小槐 - Stapx_Steve" } }])
    // Vue.set(runtimeData, 'stickers', [])
    // 输出所有的 popInfo
    popInfo.add(PopType.INFO, app.config.globalProperties.$t('pop_print_all_pop'), true)
    setTimeout(() => {
        const lang = zh
        const list = Object.keys(lang).filter((item) => { return item.startsWith('pop') })
        for (let i = 0; i < list.length; i++) {
            const item = list[i]
            setTimeout(() => {
                popInfo.add(PopType.INFO, app.config.globalProperties.$t(item, { code: 'test' }), true)
            }, 3000 * i)
        }
    }, 5000)
}

/**
 * 下载文件
 * @param url 文件链接
 * @param process 下载中回调
 */
export function downloadFile (url: string, name: string, onprocess: (event: ProgressEvent & {[key: string]: any}) => undefined) {
    if(document.location.protocol == 'https:') {
        // 判断下载文件 URL 的协议
        // PS：Chrome 不会对 http 下载的文件进行协议升级
        if(url.toLowerCase().startsWith('http:')) {
            url = 'https' + url.substring(url.indexOf('://'))
        }
    }
    if(runtimeData.tags.isElectron) {
        new FileDownloader({
            url: url,
            autoStart: true,
            process: onprocess,
            nameCallback: function () {
                return name
            }
        }).catch(function (error) {
            if (error) {
                console.log(error)
            }
        })
    } else {
        if(runtimeData.reader) {
            runtimeData.reader.on('sys:downloadBack', (event, params) => {
                onprocess(params)
            })
            runtimeData.reader.send('sys:download', {
                downloadPath: url,
                fileName: name
            })
        }
    }
}

/**
 * 使用 gtk CSS 更新 Border Card UI 配色表
 * @param cssStr css 字符串
 */
function updateGTKTheme(cssStr: string) {
    if(option.get('log_level') == 'debug') {
        console.log(cssStr)
    }
    const css = window.require('css')
    let cssObj = undefined
    let color = '#000'
    // color-main
    color = cssStr.substring(cssStr.indexOf('@define-color theme_fg_color') + 29)
    color = color.substring(0, color.indexOf(';'))
    document.documentElement.style.setProperty('--color-main', color)
    // color-bg
    color = cssStr.substring(cssStr.indexOf('@define-color theme_bg_color') + 29)
    color = color.substring(0, color.indexOf(';'))
    document.documentElement.style.setProperty('--color-bg', color)
    document.documentElement.style.setProperty('--color-card', color)
    // color-card
    color = cssStr.substring(cssStr.indexOf('.context-menu {'))
    color = color.substring(0, color.indexOf('}') + 1)
    cssObj = css.parse(color, {silent: true}) as Stylesheet
    if(cssObj.stylesheet) {
        const colorGet = ((cssObj.stylesheet.rules[0] as Rule).declarations?.filter((item: Declaration) => {
            return item.property == 'background-color'
        })[0] as Declaration).value
        if(colorGet) {
            document.documentElement.style
                .setProperty('--color-card-1', colorGet)
        }
    }
    // color-card-1
    color = cssStr.substring(cssStr.indexOf('.context-menu .view:selected {'))
    color = color.substring(0, color.indexOf('}') + 1)
    cssObj = css.parse(color, {silent: true}) as Stylesheet
    if(cssObj.stylesheet) {
        const colorGet = ((cssObj.stylesheet.rules[0] as Rule).declarations?.filter((item: Declaration) => {
            return item.property == 'background-color'
        })[0] as Declaration).value
        if(colorGet) {
            document.documentElement.style
                .setProperty('--color-card-2', colorGet)
        }
    }
    // color-card-2
    // color = cssStr.substring(cssStr.indexOf('.context-menu menuitem:hover {'))
    // color = color.substring(0, color.indexOf('}') + 1)
    // cssObj = css.parse(color, {silent: true}) as Stylesheet
    // if(cssObj.stylesheet) {
    //     const colorGet = ((cssObj.stylesheet.rules[0] as Rule).declarations?.filter((item: Declaration) => {
    //         return item.property == 'background-color'
    //     })[0] as Declaration).value
    //     if(colorGet) {
    //         document.documentElement.style
    //             .setProperty('--color-card-2', colorGet)
    //     }
    // }
    // color-font
    color = cssStr.substring(cssStr.indexOf('@define-color theme_text_color') + 31)
    color = color.substring(0, color.indexOf(';'))
    document.documentElement.style.setProperty('--color-font', color)
    // color-font-1
    color = cssStr.substring(cssStr.indexOf('@define-color theme_unfocused_text_color') + 41)
    color = color.substring(0, color.indexOf(';'))
    document.documentElement.style.setProperty('--color-font-1', color)
    document.documentElement.style.setProperty('--color-font-2', color)
}

/**
 * electron：加载系统主题适配
 */
export async function loadSystemThemeColor() {
    // 加载 GTK 主题适配（以及主题更新回调监听）
    if (runtimeData.reader) {
        // 主题更新回调
        runtimeData.reader.on('sys:updateGTKTheme', (event, params) => {
            if(option.get('opt_auto_gtk') == true) {
                console.log('GTK 主题已更新：' + params.name)
                updateGTKTheme(params.css)
            }
        })
        updateGTKTheme(await runtimeData.reader.invoke('sys:getGTKTheme'))
        
    }
}

export async function loadWinColor() {
    if (runtimeData.reader) {
        // 获取系统主题色
        updateWinColor(await runtimeData.reader.invoke('sys:getWinColor'))
        
    }
}

export function updateWinColor(info: any) {
    if(!info.err) {
        // 平衡颜色亮度
        const hsl = rgbToHsl(info.color[0], info.color[1], info.color[2])
        const media = window.matchMedia('(prefers-color-scheme: dark)')
        const autodark = option.get('opt_auto_dark')
        const dark = option.get('opt_dark')
        if((autodark == true && media.matches) || (autodark != true && dark == true)) {
            hsl[2] = 0.8
        } else {
            hsl[2] = 0.3
        }
        info.color = hslToRgb(hsl[0], hsl[1], hsl[2])
        document.documentElement.style.setProperty('--color-main', 'rgb(' + info.color[0] + ',' + info.color[1] + ',' + info.color[2] + ')')
    } else {
        runtimeData.sysConfig['opt_auto_win_color'] = false
        new PopInfo().add(PopType.ERR, app.config.globalProperties.$t('option_view_auto_win_color_tip_1') + info.err)
    }
}

export function createMenu() {
    const { $t } = app.config.globalProperties
    // MacOS：初始化菜单
    if (runtimeData.reader) {
        // 初始化菜单
        const menuTitles = {} as { [key: string]: string }
        menuTitles.success = $t('load_success', { name: $t('name')})

        menuTitles.title = $t('name')
        menuTitles.about = $t('menu_about') + ' ' + $t('name')
        menuTitles.update = $t('menu_update')
        menuTitles.hide = $t('menu_hide') + ' ' + $t('name')
        menuTitles.hideOthers = $t('menu_hide_others')
        menuTitles.unhide = $t('menu_unhide')
        menuTitles.quit = $t('menu_quit') + ' ' + $t('name')

        menuTitles.edit = $t('menu_edit')
        menuTitles.undo = $t('menu_undo')
        menuTitles.redo = $t('menu_redo')
        menuTitles.cut = $t('menu_cut')
        menuTitles.copy = $t('menu_copy')
        menuTitles.paste = $t('menu_paste')
        menuTitles.selectAll = $t('menu_select_all')

        menuTitles.account = $t('menu_account')
        menuTitles.userList = $t('menu_user_list', { count: runtimeData.userList.length })
        menuTitles.flushUser = $t('menu_flush_user')
        menuTitles.logout = $t('menu_logout')

        menuTitles.help = $t('menu_help')
        menuTitles.doc = $t('menu_doc')
        menuTitles.feedback = $t('menu_feedback')
        menuTitles.license = $t('menu_license')

        runtimeData.reader.send('sys:createMenu', menuTitles)
    }
}

export function updateMenu(config: {id: string, action: string, value: any}) {
    // MacOS：更新菜单
    if (runtimeData.reader) {
        runtimeData.reader.send('sys:updateMenu', config)
    }
}

export function createIpc() {
    if (runtimeData.reader) {
        runtimeData.reader.on('bot:flushUser', () => {
            reloadUsers()
            popInfo.add(PopType.INFO, app.config.globalProperties.$t('pop_reload_user_success'))
        })
        runtimeData.reader.on('bot:logout', () => {
            remove('auto_connect')
            Connector.close()
        })
        runtimeData.reader.on('app:about', () => {
            const popInfo = {
                title: app.config.globalProperties.$t('menu_about') + ' ' + app.config.globalProperties.$t('name'),
                template: AboutPan,
                allowQuickClose: false
            }
            runtimeData.popBoxList.push(popInfo)
        })
        runtimeData.reader.on('app:changeTab', (event, name) => {
            document.getElementById('bar-' + name.toLowerCase())?.click()
        })
        runtimeData.reader.on('app:openLink', (event, link) => {
            openLink(link)
        })
    }
}