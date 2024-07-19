import jp from 'jsonpath'
import app from '@/main'

import { Logger } from '@/function/base'
import { runtimeData } from '@/function/msg'
import { v4 as uuid } from 'uuid'
import { Connector } from '@/function/connect'
import { BotMsgType } from '../elements/information'
import Umami from '@stapxs/umami-logger-typescript'

const logger = new Logger()

/**
 * 根据 JSON Path 映射数据返回需要的内容体
 * @param msg 
 * @param map 
 * @returns 
 */
export function getMsgData(name: string, msg: { [key: string]: any }, map: string | { [key: string]: any }) {
    let back = undefined
    // 解析数据
    if (map != undefined) {
        if (typeof map == 'string' || map.source != undefined) {
            try {
                back = jp.query(msg, replaceJPValue(typeof map == 'string' ? map : map.source))
                if (typeof map != 'string' && map.list != undefined) {
                    const backList = [] as any[]
                    back.forEach((item) => {
                        const itemObj = {} as any
                        Object.keys(map.list).forEach((key: string) => {
                            if (map.list[key] && map.list[key] != '') {
                                if (map.list[key].startsWith('/'))
                                    itemObj[key] = item[map.list[key].substring(1)]
                                else {
                                    let nameKey = map.list[key]
                                    let regexKey = null
                                    if(nameKey.indexOf('@') > -1) {
                                        const [name, key] = nameKey.split('@')
                                        nameKey = name
                                        regexKey = key
                                    }
                                    itemObj[key] = jp.query(item, replaceJPValue(nameKey))[0]
                                    if(regexKey != null) {
                                        const regex = new RegExp(regexKey)
                                        const match = itemObj[key].match(regex)
                                        if(match != null) {
                                            itemObj[key] = match[0]
                                        }
                                    }
                                }
                            }
                        })
                        backList.push(itemObj)
                    })
                    back = backList
                }
            } catch (ex) {
                logger.error(`解析消息 JSON 错误：${name} -> ${map}`)
                console.log(ex)
            }
        } else {
            const data = {} as { [key: string]: any }
            Object.keys(map).forEach((key) => {
                if (map[key] != undefined && map[key] !== '' && !key.startsWith('_'))
                    try {
                        data[key] = jp.query(msg, replaceJPValue(map[key]))[0]
                    } catch (ex) {
                        logger.error(`解析 JSON 错误：${name} -> ${map}`)
                        console.log(ex)
                    }
            })
            back = [data]
        }
    }
    return back
}
function replaceJPValue(jpStr: string) {
    return jpStr.replaceAll('<uin>', runtimeData.loginInfo.uin)
}

/**
 * 获取表情图片，优先返回 gif，不存在的返回 png
 * @param id 表情编号
 * @returns 表情图片
 */
export function getFace(id: number) {
    // eslint-disable-next-line
    try { return require('./../../assets/img/qq-face/gif/s' + id + '.gif') } catch { }
    // eslint-disable-next-line
    try { return require('./../../assets/img/qq-face/gif/s' + id + '.png') } catch { }
    // eslint-disable-next-line
    try { return require('./../../assets/img/qq-face/static/s' + id + '.png') } catch { }
    return false
}

/**
 * 将一个消息体列表组装为基础消息列表便于解析（message 消息体可能不正确——
 * @param msgList 
 * @param map 
 * @returns 
 */
export function buildMsgList(msgList: { [key: string]: any }): { [key: string]: any } {
    const path = jp.parse(runtimeData.jsonMap.message_list.source)
    const keys = [] as string[]
    path.forEach((item) => {
        if (item.expression.value != '*' && item.expression.value != '$') {
            keys.push(item.expression.value)
        }
    })
    const result = {} as any
    keys.reduce((acc, key, index) => {
        if (index === keys.length - 1) {
            acc[key] = msgList
        } else {
            acc[key] = {}
        }
        return acc[key]
    }, result)
    return result
}

export function parseMsgList(list: any, map: string, valueMap: { [key: string]: any }): any[] {
    // 判断消息类型
    if(runtimeData.tags.msgType == BotMsgType.Auto) {
        if(typeof list[0].message == 'string') {
            runtimeData.tags.msgType = BotMsgType.CQCode
        } else {
            runtimeData.tags.msgType = BotMsgType.Array
        }
    }
    // 消息类型的特殊处理
    switch (runtimeData.tags.msgType) {
        case BotMsgType.CQCode: {
            // 这儿会默认处理成 oicq2 的格式，所以 CQCode 消息请使用 oicq2 配置文件修改
            for (let i = 0; i < list.length; i++) {
                list[i] = parseCQ(list[i])
            }
            break
        }
        case BotMsgType.Array: {
            // 非扁平化消息体，这儿会取 _type 后半段的 JSON Path 将结果并入 message
            for (let i = 0; i < list.length; i++) {
                let msgList = list[i].message
                if (msgList == undefined) {
                    msgList = list[i].content
                }
                for (let j = 0; j < msgList.length; j++) {
                    const data = getMsgData('message_list_message', msgList[j], map)
                    if (data != undefined && data.length == 1) {
                        msgList[j] = Object.assign(msgList[j], data[0])
                    }
                }
            }
        }
    }
    // 消息字段的标准化特殊处理
    if (valueMap != undefined) {
        for (let i = 0; i < list.length; i++) {
            Object.entries(valueMap).forEach(([type, values]) => {
                Object.entries(values).forEach(([key, value]) => {
                    let content = list[i].message
                    if (content == undefined) {
                        content = list[i].content
                    }
                    content.forEach((item: any) => {
                        if (item.type == type) {
                            item[key] = jp.query(item, value as string)[0]
                        }
                        // 顺便把没用的 data 删了，这边要注意 item.data 必须是个对象
                        // 因为有些消息类型的 data 就叫 data
                        if (typeof item.data == 'object') {
                            delete item.data
                        }
                    })
                    // 其他处理
                    if (list[i].content != undefined) {
                        // 把 content 改成 message
                        list[i].message = content
                        delete list[i].content
                        // 添加一个 sender.user_id 为 user_id
                        list[i].sender = {
                            user_id: list[i].user_id,
                            nickname: list[i].nickname
                        }
                    }
                })
            })
        }
    }
    return list
}

/**
 * 将消息对象处理为扁平字符串
 * @param message 待处理的消息对象
 * @returns 字符串
 */
export function getMsgRawTxt(message: [{ [key: string]: any }]): string {
    let back = ''
    for (let i = 0; i < message.length; i++) {
        try {
            switch (message[i].type) {
                case 'at': if (message[i].text == undefined) { break }
                // eslint-disable-next-line
                case 'text': back += message[i].text.replaceAll('\n', ' ').replaceAll('\r', ' '); break
                case 'face': back += '[表情]'; break
                case 'mface': back += message[i].summary ?? message[i].text; break
                case 'bface': back += message[i].text; break
                case 'image': back += '[图片]'; break
                case 'record': back += '[语音]'; break
                case 'video': back += '[视频]'; break
                case 'file': back += '[文件]'; break
                case 'json': {
                    try {
                        back += JSON.parse(message[i].data).prompt;
                    } catch (error) {
                        back += '[卡片消息]';
                    }
                    break
                }
                case 'xml': {
                    let name = message[i].data.substring(message[i].data.indexOf('<source name="') + 14)
                    name = name.substring(0, name.indexOf('"'))
                    back += '[' + name + ']'
                    break
                }
            }
        } catch (error) {
            logger.error('解析消息短格式错误：' + JSON.stringify(message[i]))
            console.log(error)
        }
    }
    return back
}

/**
 * 将消息对象转换为 CQCode
 * @param data 
 * @returns CQCode 字符串
 */
export function parseJSONCQCode(data: any) {
    let back = ''
    data.forEach((item: any) => {
        if (item.type != 'text') {
            let body = '[CQ:' + item.type + ','
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
    if (list !== null) {
        list.forEach((item) => {
            if (item.match(reg) !== null) {
                const info: { [key: string]: any } = { type: RegExp.$1 }
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
                if (info.type == 'text') {
                    info.text = RegExp.$2
                        .substring(RegExp.$2.lastIndexOf('=') + 1)
                        .replaceAll('\\n', '\n')
                    // 对 html 转义字符进行反转义
                    const a = document.createElement('a')
                    a.innerHTML = info.text
                    info.text = a.innerText
                }
                // 对回复消息进行特殊处理
                if (info.type == 'reply') {
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

export function sendMsgRaw(id: string, type: string, msg: string | { type: string; text: string; }[] | undefined, preShow = false) {
    // 将消息构建为完整消息体先显示出去
    const msgUUID = uuid()
    if (preShow) {
        const showMsg = {
            revoke: true,
            fake_msg: true,
            message_id: msgUUID,
            message_type: runtimeData.chatInfo.show.type,
            time: parseInt(String(new Date().getTime() / 1000)),
            post_type: "message",
            sender: {
                user_id: runtimeData.loginInfo.uin,
                nickname: runtimeData.loginInfo.nickname
            },
            message: JSON.parse(JSON.stringify(msg)),
            raw_message: app.config.globalProperties.$t('chat_msg_sending'),
        } as { [key: string]: any }
        if (showMsg.message_type == 'group') {
            showMsg.group_id = runtimeData.chatInfo.show.id
        } else {
            showMsg.user_id = runtimeData.chatInfo.show.id
        }
        runtimeData.messageList = runtimeData.messageList.concat([showMsg])
    }
    // 检查消息体是否需要处理
    if (runtimeData.tags.msgType == BotMsgType.Array) {
        const map = runtimeData.jsonMap.message_list.type
        const path = jp.parse(map)
        const keys = [] as string[]
        path.forEach((item) => {
            if (item.expression.value != '*' && item.expression.value != '$') {
                keys.push(item.expression.value)
            }
        })
        if (msg && typeof msg != 'string') {
            const newMsg = [] as any
            msg.forEach((item) => {
                const result = {} as any
                keys.reduce((acc, key, index) => {
                    if (index === keys.length - 1) {
                        acc[key] = item
                    } else {
                        acc[key] = {}
                    }
                    return acc[key]
                }, result)
                const newResult = {} as { [key: string]: any }
                newResult.type = item.type
                newResult.data = item
                delete newResult.data.type
                newMsg.push(newResult)
            })
            msg = newMsg
        }
    }
    if (msg !== undefined && msg.length > 0) {
        switch (type) {
            case 'group': 
                Connector.send(
                    runtimeData.jsonMap.message_list.name_group_send ?? 'send_group_msg',
                    { 'group_id': id, 'message': msg },'sendMsgBack_uuid_' + msgUUID); break
            case 'user': 
            {
                if(String(id).indexOf('/') > 1) {
                    Connector.send(
                        runtimeData.jsonMap.message_list.name_temp_send ?? 'send_temp_msg', 
                        { 'user_id': id.split('/')[0], 'group_id': id.split('/')[1], 'message': msg }, 'sendMsgBack_uuid_' + msgUUID);
                } else {
                    Connector.send(
                        runtimeData.jsonMap.message_list.name_user_send ?? 'send_private_msg',
                         { 'user_id': id, 'message': msg }, 'sendMsgBack_uuid_' + msgUUID);
                }
                break
            }
        }
        // UM：统计消息发送次数
        Umami.trackEvent('sendMsg', { type: type })
    }
}