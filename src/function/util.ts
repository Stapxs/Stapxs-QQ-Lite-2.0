/*
 * @FileDescription: 工具模块
 * @Author: Stapxs
 * @Date: 
 *      2022/08/02
 *      2022/12/07
 * @Version: 
 *      1.0 - 初始版本
 *      2.0 - 重构为 ts 版本，去除了部分方法
 * @Description: 一个平平无奇的工具类
*/

import app from '@/main'
import l10nConfig from '@/assets/l10n/_l10nconfig.json'
import zh from '@/assets/l10n/zh-CN.json'
import FileDownloader from 'js-file-downloader'
import option from './option'

import { Rule, Stylesheet, Declaration } from 'css'
import { Logger, PopInfo, PopType } from './base'
import { MsgIdInfoElem } from './elements/system'
import { runtimeData } from './msg'
import { BaseChatInfoElem } from './elements/information'
import { Connector } from './connect'

const logger = new Logger()
const popInfo = new PopInfo()

/**
 * 解析消息 ID
 * @param id 消息 ID
 * @returns 消息 ID 的内容
 */
export function parseMsgId(id: string): MsgIdInfoElem {
    if (id !== undefined && id !== null && id.length > 0) {
        const binaryString = window.atob(id)
        const bytes = new Uint8Array(binaryString.length)
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i)
        }
        const dv = new DataView(bytes.buffer, 0)
        if (id.length === 28) {
            return {
                gid: dv.getInt32(0),
                uid: dv.getInt32(4),
                seqid: dv.getInt32(8)
            }
        } else if (id.length === 24) {
            return {
                uid: dv.getInt32(0),
                seqid: dv.getInt32(4)
            }
        }
    }
    return {}
}

export function buildMsgIdInfo(buffer: any) {
    let binary = ''
    const bytes = new Uint8Array(buffer)
    const len = bytes.byteLength
    for (let i=0; i<len; i++) {
        binary += String.fromCharCode(bytes[i])
    }
    return window.btoa(binary)
  }

/**
 * 判断是不是链接
 * @param path 需要判断的字符串
 * @returns T / F
 */
export function isExternal(path: string): boolean {
    return /^(https?:|mailto:|tel:)/.test(path)
}

/**
 * 打开链接
 * @param url 链接
 */
export function openLink(url: string) {
    // 判断是不是 Electron，是的话打开内嵌 iframe
    if(runtimeData.tags.isElectron) {
        const popInfo = {
            html: `<iframe src="${url}" style="width: calc(100% + 80px);border: none;margin: -40px -40px -20px -40px;height: calc(100vh - 145px);border-radius: 7px;"></iframe>`,
            full: true,
            button: [
                {
                    text: app.config.globalProperties.$t('btn_open'),
                    fun: () => {
                        window.open(url)
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
        runtimeData.popBoxList.push(popInfo)
    } else {
        window.open(url)
    }
}

/**
 * 获取当前启用的语言的地区代码
 * @returns 符合规范的地区代码
 */
export function getTrueLang(): string {
    let back = 'zh-CN'
    l10nConfig.forEach((item) => {
        if (item.value === app.config.globalProperties.$i18n.locale) {
            back = item.lang
        }
    })
    return back
}

/**
 * 将字节大小转为可读的文件大小
 * @param size 字节大小
 * @returns 
 */
export function getSizeFromBytes(size: number): string {
    if (!size) {
        return ''
    }

    const num = 1024.00

    if (size < num) {
        return size + 'B'
    }
    if (size < Math.pow(num, 2)) {
        return (size / num).toFixed(2) + 'K'
    }
    if (size < Math.pow(num, 3)) {
        return (size / Math.pow(num, 2)).toFixed(2) + 'M'
    }
    if (size < Math.pow(num, 4)) {
        return (size / Math.pow(num, 3)).toFixed(2) + 'G'
    }
    return (size / Math.pow(num, 4)).toFixed(2) + 'T'
}

/**
 * 将被 HTML 编码的符号转回来
 * @param str 待处理的字符串
 * @returns 处理完成的字符串
 */
export function htmlDecodeByRegExp(str: string): string {
    let s = ''
    if (str.length === 0) return ''
    s = str.replace(/&amp;/g, '&')
    s = s.replace(/&lt;/g, '<')
    s = s.replace(/&gt;/g, '>')
    s = s.replace(/&nbsp;/g, ' ')
    s = s.replace(/&#39;/g, '\'')
    s = s.replace(/&quot;/g, '"')
    return s
}

/**
 * 根据区间和位数生成指定长度的随机数
 * @param TODO: 我忘了这些参数都是干嘛的了，懒得看
 * @returns 随机数组
 */
export function getRandom(num: boolean, maxA: boolean, minlA: boolean, fqy: number): string {
    const arr = []
    const arr1 = []
    const arr2 = []
    if (num) {
        for (let m = 0; m <= 9; m++) {
            arr.push(m)
        }
    }
    if (maxA) {
        for (let m = 65; m <= 90; m++) {
            arr1.push(m)
        }
    }
    if (minlA) {
        for (let m = 97; m <= 122; m++) {
            arr2.push(m)
        }
    }
    if (!fqy) {
        console.log('生成位数必传')
    }
    const mergeArr = arr.concat(arr1)
    const mergeArr1 = mergeArr.concat(arr2)
    const _length = mergeArr1.length
    let text = ''
    for (let m = 0; m < fqy; m++) {
        let text1 = ''
        let max = 0
        let min = _length
        if (_length > 0) {
            max = _length
            min = 0
        }
        const random = parseInt((Math.random() * (max - min)).toString()) + min
        if ((mergeArr1[random]) <= 9) {
            text1 = mergeArr1[random].toString()
        } else if ((mergeArr1[random]) > 9) {
            text1 = String.fromCharCode(mergeArr1[random])
        }
        text += text1
    }
    return text
}

/**
 * 根据区间生成一个随机数
 * @param minNum 最小值
 * @param maxNum 最大值
 * @returns 随机数
 */
export function randomNum(minNum: number, maxNum: number) {
    switch (arguments.length)
    {
        case 1: return parseInt((Math.random() * minNum + 1).toString(), 10);
        case 2: return parseInt((Math.random() * (maxNum - minNum + 1) + minNum).toString(), 10);
        default: return 0;
    }
}

/**
 * 将消息对象处理为扁平字符串
 * @param message 待处理的消息对象
 * @returns 字符串
 */
export function getMsgRawTxt(message: [{ [key: string]: any }]): string {
    let back = ''
    for (let i = 0; i < message.length; i++) {
        switch (message[i].type) {
            case 'at': if(message[i].text == undefined) { break }
            // eslint-disable-next-line
            case 'text': back += message[i].text.replaceAll('\n', ' ').replaceAll('\r', ' '); break
            case 'face':
            case 'bface': back += '[表情]'; break
            case 'image': back += '[图片]'; break
            case 'record': back += '[语音]'; break
            case 'video': back += '[视频]'; break
            case 'file': back += '[文件]'; break
            case 'json': back += JSON.parse(message[i].data).prompt; break
            case 'xml': {
                let name = message[i].data.substring(message[i].data.indexOf('<source name="') + 14)
                name = name.substring(0, name.indexOf('"'))
                back += '[' + name + ']'
                break
            }
        }
    }
    return back
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
 * 将扁平的 CQCode 消息处理成消息对象
 * @param msg CQCode 消息
 * @returns 消息对象
 */
export function parseCQ(data: any) {
    let msg = data.message as string
    // 将纯文本也处理为 CQCode 格式
    // PS：这儿不用担心方括号本身，go-cqhttp 会把它转义掉
    let reg = /^[^\]]+?\[|\].+\[|\][^[]+$|^[^[\]]+$/g
    const textList = msg.match(reg)
    if (textList !== null) {
        textList.forEach((item) => {
            item = item.replace(']', '').replace('[', '')
            msg = msg.replace(item, `[CQ:text,text=${item}]`)
        })
    }
    // 拆分 CQCode
    reg = /\[.+?\]/g
    msg = msg.replaceAll('\n', '\\n')
    const list = msg.match(reg)
    // 处理为 object
    const back: { [ket: string]: any }[] = []
    reg = /\[CQ:([^,]+),(.*)\]/g
    if(list !== null) {
        list.forEach((item) => {
            if (item.match(reg) !== null) {
                const info: {[key: string]: any} = { type: RegExp.$1 }
                RegExp.$2.split(',').forEach((key) => {
                    const kv = []
                    kv.push(key.substring(0, key.indexOf('=')))
                    // 对 html 转义字符进行反转义
                    const a = document.createElement('a')
                    a.innerHTML = key.substring(key.indexOf('=') + 1)
                    kv.push(a.innerText)
                    info[kv[0]] = kv[1]
                })
                // 对文本消息特殊处理
                if(info.type == 'text') {
                    info.text = RegExp.$2
                        .substring(RegExp.$2.lastIndexOf('=') + 1)
                        .replaceAll('\\n', '\n')
                    // 对 html 转义字符进行反转义
                    const a = document.createElement('a')
                    a.innerHTML = info.text
                    info.text = a.innerText
                }
                // 对回复消息进行特殊处理
                if(info.type == 'reply') {
                    data.source = {
                        user_id: info.user_id,
                        seq: info.seq,
                        message: info.message
                    }
                } else {
                    back.push(info)
                }
            }
        })
    }
    logger.debug(app.config.globalProperties.$t('log_cq_msg_parsed') + ': ' + JSON.stringify(back))
    data.message = back
    return data
}

/**
 * 将 oicq1 的 JSON 消息转换为 oicq2
 * @param msg oicq1 JSON 消息
 * @returns 消息对象
 */
export function parseOICQ1JSON(data: any) {
    const message = data.message
    if(message) {
        // 遍历 message 将 message[i].data 扁平化到 message 里
        (message as {[key: string]: any}[])
        .forEach((item, index) => {
            Object.assign(data.message[index], item.data)
            delete data.message[index].data
        })
    }
    return data
}

/**
 * 将消息对象转换为 CQCode
 * @param data 
 * @returns CQCode 字符串
 */
export function parseJSONCQCode(data: any) {
    let back = ''
    data.forEach((item: any) => {
        if(item.type != 'text') {
            let body = '[CQ:' + item.type +','
            Object.keys(item).forEach((key: any) => {
                body += `${key}=${item[key]},`
            })
            body = body.substring(0, body.length - 1) + ']'
            back += body
        } else {
            back += item.text
        }
    })
    return back
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
    // 加载历史消息
    // Note: https://github.com/takayama-lily/oicq/wiki/93.%E8%A7%A3%E6%9E%90%E6%B6%88%E6%81%AFID
    let msgid = null
    switch (type) {
        case 'user': {
            // friend msg id 为 4*4+1 = 17 bit
            const buffer = new ArrayBuffer(17)
            const dv = new DataView(buffer, 0)
            dv.setInt32(0, id)
            dv.setInt32(4, 0)
            dv.setInt32(8, 0)
            dv.setInt32(12, 0)
            dv.setInt8(16, 0)
            msgid = buildMsgIdInfo(buffer)
            break
        }
        case 'group': {
            // group msg id 为 4*5+1 = 21 bit
            const buffer = new ArrayBuffer(21)
            const dv = new DataView(buffer, 0)
            dv.setInt32(0, id)
            dv.setInt32(4, 0)
            dv.setInt32(8, 0)
            dv.setInt32(12, 0)
            dv.setInt32(16, 0)
            dv.setInt8(20, 0)
            msgid = buildMsgIdInfo(buffer)
            break
        }
    }
    if (msgid != null) {
        // 发送请求
        let name = 'get_chat_history'
        if(runtimeData.botInfo['go-cqhttp'] === true)
            name = 'get_msg_history'
        Connector.send(
            name,
            {
                message_id: msgid,
                target_id: id,
                group: type == 'group',
                count: count
            },
            echo
        )
        return true
    } else {
        return false
    }
}

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
 * 将 gitmoji 字符串转为 emoji 符号
 * @param name 名称
 * @returns emoji 符号
 */
export function gitmojiToEmoji (name: string) {
    return {":zap:":"⚡️",":art:":"🎨",":fire:":"🔥",":bug:":"🐛",":ambulance:":"🚑️",":sparkles:":"✨",":memo:":"📝",":rocket:":"🚀",":lipstick:":"💄",":tada:":"🎉",":white-check-mark:":"✅",":lock:":"🔒️",":closed-lock-with-key:":"🔐",":bookmark:":"🔖",":rotating-light:":"🚨",":construction:":"🚧",":green-heart:":"💚",":arrow-down:":"⬇️",":arrow-up:":"⬆️",":pushpin:":"📌",":construction-worker:":"👷",":chart-with-upwards-trend:":"📈",":recycle:":"♻️",":heavy-plus-sign:":"➕",":heavy-minus-sign:":"➖",":wrench:":"🔧",":hammer:":"🔨",":globe-with-meridians:":"🌐",":pencil2:":"✏️",":poop:":"💩",":rewind:":"⏪️",":twisted-rightwards-arrows:":"🔀",":package:":"📦️",":alien:":"👽️",":truck:":"🚚",":page-facing-up:":"📄",":boom:":"💥",":bento:":"🍱",":wheelchair:":"♿️",":bulb:":"💡",":beers:":"🍻",":speech-balloon:":"💬",":card-file-box:":"🗃️",":loud-sound:":"🔊",":mute:":"🔇",":busts-in-silhouette:":"👥",":children-crossing:":"🚸",":building-construction:":"🏗️",":iphone:":"📱",":clown-face:":"🤡",":egg:":"🥚",":see-no-evil:":"🙈",":camera-flash:":"📸",":alembic:":"⚗️",":mag:":"🔍️",":label:":"🏷️",":seedling:":"🌱",":triangular-flag-on-post:":"🚩",":goal-net:":"🥅",":animation:":"💫",":wastebasket:":"🗑️",":passport-control:":"🛂",":adhesive-bandage:":"🩹",":monocle-face:":"🧐",":coffin:":"⚰️",":test-tube:":"🧪",":necktie:":"👔",":stethoscope:":"🩺",":bricks:":"🧱",":technologist:":"🧑‍💻"}[name]
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
    if(!process.env.IS_ELECTRON) {
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
        const electron = (process.env.IS_ELECTRON as any) === true ? window.require('electron') : null
        const reader = electron ? electron.ipcRenderer : null
        if (reader) {
            reader.on('sys:downloadBack', (event, params) => {
                onprocess(params)
            })
            reader.send('sys:download', {
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
    const electron = (process.env.IS_ELECTRON as any) === true ? window.require('electron') : null
    const reader = electron ? electron.ipcRenderer : null
    if (reader) {
        // 主题更新回调
        reader.on('sys:updateGTKTheme', (event, params) => {
            if(option.get('opt_auto_gtk') == true) {
                console.log('GTK 主题已更新：' + params.name)
                updateGTKTheme(params.css)
            }
        })
        updateGTKTheme(await reader.invoke('sys:getGTKTheme'))
        
    }
}

export async function loadWinColor() {
    const electron = (process.env.IS_ELECTRON as any) === true ? window.require('electron') : null
    const reader = electron ? electron.ipcRenderer : null
    if (reader) {
        // 获取系统主题色
        updateWinColor(await reader.invoke('sys:getWinColor'))
        
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

/**
 * RGB 颜色值转换为 HSL.
 * 转换公式参考自 http://en.wikipedia.org/wiki/HSL_color_space.
 * r, g, 和 b 需要在 [0, 255] 范围内
 * 返回的 h, s, 和 l 在 [0, 1] 之间
 *
 * @param r 红色色值
 * @param g 绿色色值
 * @param b 蓝色色值
 * @return HSL各值数组
 */
export function rgbToHsl(r: number, g: number, b: number) {
    r /= 255, g /= 255, b /= 255
    const max = Math.max(r, g, b), min = Math.min(r, g, b)
    let h = 0, s
    const l = (max + min) / 2
 
    if (max == min){ 
        h = s = 0
    } else {
        const d = max - min
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
        switch(max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break
            case g: h = (b - r) / d + 2; break
            case b: h = (r - g) / d + 4; break
        }
        h /= 6
    }
 
    return [h, s, l]
}

/**
 * HSL颜色值转换为RGB. 
 * 换算公式改编自 http://en.wikipedia.org/wiki/HSL_color_space.
 * h, s, 和 l 设定在 [0, 1] 之间
 * 返回的 r, g, 和 b 在 [0, 255]之间
 *
 * @param h 色相
 * @param s 饱和度
 * @param l 亮度
 * @return RGB色值数值
 */
export function hslToRgb(h: number, s: number, l: number) {
    let r, g, b
 
    if(s == 0) {
        r = g = b = l
    } else {
        const hue2rgb = function hue2rgb(p: number, q: number, t: number) {
            if(t < 0) t += 1
            if(t > 1) t -= 1
            if(t < 1/6) return p + (q - p) * 6 * t
            if(t < 1/2) return q
            if(t < 2/3) return p + (q - p) * (2/3 - t) * 6
            return p
        }
 
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s
        const p = 2 * l - q
        r = hue2rgb(p, q, h + 1/3)
        g = hue2rgb(p, q, h)
        b = hue2rgb(p, q, h - 1/3)
    }
 
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)]
}

export default {
    openLink,
    getTrueLang,
    getMsgRawTxt,
    parseMsgId,
    htmlDecodeByRegExp,
    parseCQ,
    parseOICQ1JSON,
    parseJSONCQCode,
    loadHistory,
    scrollToMsg,
    gitmojiToEmoji,
    randomNum,
    downloadFile,
    getSizeFromBytes
}