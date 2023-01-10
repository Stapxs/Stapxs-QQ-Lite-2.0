/*
 * @FileDescription: 消息发送模块
 * @Author: Stapxs
 * @Date:
 *      2022/10/20
 *      2022/12/12
 * @Version: 
 *      1.0 - 初始版本
 *      1.5 - 重构为 ts 版本，代码格式优化
 * @Description: 此模块包括消息发送相关的功能
*/

// 消息类型结构参考
// https://github.com/takayama-lily/oicq/blob/main/lib/message/elements.ts
// CQ Code 参考
// https://docs.go-cqhttp.org/cqcode/#%E8%BD%AC%E4%B9%89

import { BotMsgType, MsgItemElem } from './elements/information'
import { runtimeData } from './msg'

/**
 * 反序列化消息
 * @param msg 带有 SQCode 标记的文本消息（也可以不带有）
 * @param cache 多媒体消息缓存列表
 * @returns 用于发送的纯文本消息（根据 Bot 类型可能是 CQ 码或者 JSON 对象等）
 */
export function parseMsg(msg: string, cache: MsgItemElem[], img: string[]) {
    // 如果消息发送框功能是启用的，则先将 cache 的图片插入到最前面
    // 将图片插入 cache 列表并在消息文本前插入 SQCode
    if (img.length > 0) {
        img.forEach((item) => {
            cache.push({
                type: 'image',
                file: 'base64://' + item.substring(item.indexOf('base64,') + 7, item.length)
            })
            msg = `[SQ:${cache.length - 1}]` + msg
        })
    }
    // 处理消息
    let back = undefined
    if (runtimeData.tags.msgType === undefined || runtimeData.tags.msgType === BotMsgType.JSON) {
        back = parseMsgToJSON(msg, cache)
    } else if (runtimeData.tags.msgType === BotMsgType.CQCode) {
        back = parseMsgToCQ(msg, cache)
    }
    return back
}

/**
 * 获取字符串内的所有 SQCode
 * @param msg 
 * @returns SQCode 字符串列表
 */
export function getSQList(msg: string) {
    const reg = /\[SQ:\d+\]/gm
    return msg.match(reg)
}

export default {
    parseMsg,
    getSQList
}

// ========================================

/**
 * 将消息对象转为 JSON，这儿也会完成所有的发送前处理
 * @param msg 
 * @param cache 
 * @returns 
 */
function parseMsgToJSON(msg: string, cache: MsgItemElem[]) {
    const back = []
    // 处理消息文本
    const specialList = getSQList(msg)
    if (specialList !== null) {
        specialList.forEach((item) => {
            const index = Number(item.replace('[', '').replace(']', '').split(':')[1])
            const regCut = RegExp('^[^\\[]*\\[SQ:' + index + '\\]', 'g')
            // 处理内容
            const cutList = msg.match(regCut)
            if (cutList !== null) {
                const cutMsg = cutList[0].replace(item, '')
                // 添加前段文本
                if (cutMsg !== '') {
                    back.push({ type: 'text', text: cutMsg })
                }
                // 添加后段特殊消息
                if (cache[index] !== null) {
                    back.push(cache[index])
                }
                // 去除内容
                msg = msg.replace(cutList[0], '')
            }
        })
    }
    if (msg !== '') {
        back.push({ type: 'text', text: msg })
    }
    // 在缓存堆中寻找其他需要特殊处理的消息
    cache.forEach((item) => {
        switch (item.type) {
            // 把回复消息移到第一个防止官方端显示错误
            case 'reply': back.unshift(item); break
        }
    })
    // 插入小尾巴
    const taill = (runtimeData.sysConfig.msg_taill as string).replaceAll('\\n', '\n')
    if(taill && taill != '') {
        for(let i=back.length - 1; i>=0; i--) {
            if(back[i].type == 'text') {
                back[i].text = back[i].text + taill
                break
            }
        }
    }
    // 返回
    return back
}

function parseMsgToCQ(msg: string, cache: MsgItemElem[]) {
    let back = ''
    // 处理消息文本
    const specialList = getSQList(msg)
    if (specialList !== null) {
        specialList.forEach((item) => {
            const index = Number(item.replace('[', '').replace(']', '').split(':')[1])
            const regCut = RegExp('^[^\\[]*\\[SQ:' + index + '\\]', 'g')
            // 处理内容
            const cutList = msg.match(regCut)
            if (cutList !== null) {
                const cutMsg = cutList[0].replace(item, '')
                // 添加前段文本
                if (cutMsg !== '') {
                    back += cutMsg
                }
                // 添加后段特殊消息
                if (cache[index] !== null) {
                    let cqstr = '[CQ:' + cache[index].type
                    Object.keys(cache[index]).forEach((item) => {
                        if (item !== 'type') {
                            cqstr += ',' + item + '=' + cache[index][item]
                        }
                    })
                    back += cqstr + ']'
                }
                // 去除内容
                msg = msg.replace(cutList[0], '')
            }
        })
    }
    if (msg !== '') {
        back += msg
    }
    // 插入小尾巴
    back = back + (runtimeData.sysConfig.msg_taill as string).replaceAll('\\n', '\n')
    // 返回
    return back
}
