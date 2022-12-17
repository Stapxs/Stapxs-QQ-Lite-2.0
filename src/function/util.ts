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
    window.open(url)
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
 * 根据区间和位数生成指定数量的随机数
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
 * 将消息对象处理为扁平字符串
 * @param message 待处理的消息对象
 * @returns 字符串
 */
export function getMsgRawTxt(message: [{ [key: string]: any }]): string {
    let back = ''
    for (let i = 0; i < message.length; i++) {
        switch (message[i].type) {
            case 'at':
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
export function parseCQ(msg: string) {
    // 将纯文本也处理为 CQCode 格式
    // PS：这儿不用担心方括号本身，go-cqhttp 会把它转义掉
    let reg = /^[^\]]+?\[|\].+\[|\][^[]+$|^[^[\]]+$/g
    const textList = msg.match(reg)
    if (textList !== null) {
        textList.forEach((item) => {
            // PS：顺便把被转义的方括号转回来
            const trueText = item.replace('[', '').replace(']', '')
                .replace('&#91;', '[').replace('&#93;', ']')
            msg = msg.replace(trueText, `[CQ:text,text=${trueText}]`)
        })
    }
    // 拆分 CQCode
    reg = /\[.+?\]/g
    const list = msg.match(reg)
    // 处理为 object
    const back: [{ [ket: string]: any }] = [{}]
    reg = /\[CQ:([^,]+),(.*)\]/g
    if(list !== null) {
        list.forEach((item) => {
            if (item.match(reg) !== null) {
                const info: {[key: string]: any} = { type: RegExp.$1 }
                RegExp.$2.split(',').forEach((key) => {
                    const kv = key.split('=')
                    info[kv[0]] = kv[1]
                })
                back.push(info)
            }
        })
    }
    logger.debug(app.config.globalProperties.$t('log_cq_msg_parsred') + ': ' + JSON.stringify(back))
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
function loadHistoryMessage(id: number, type: string) {
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
        Connector.send(
            'get_chat_history',
            { 'message_id': msgid },
            'getChatHistoryFist'
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

export default {
    openLink,
    getTrueLang,
    getMsgRawTxt,
    parseMsgId,
    htmlDecodeByRegExp,
    parseCQ,
    loadHistory,
    scrollToMsg
}