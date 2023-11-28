import jp from 'jsonpath'

import { Logger } from '@/function/base'
import { runtimeData } from '@/function/msg'

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
        if (typeof map == 'string' || map._basic != undefined) {
            try {
                back = jp.query(msg, replaceJPValue(typeof map == 'string' ? map : map._basic))
                if(typeof map != 'string' && map._list != undefined) {
                    const backList = [] as any[]
                    back.forEach((item) => {
                        const itemObj = {} as any
                        Object.keys(map._list).forEach((key: string) => {
                            if(map._list[key] != '') {
                                if(map._list[key].startsWith('/'))
                                    itemObj[key] = item[map._list[key].substring(1)]
                                else
                                    itemObj[key] = jp.query(item, replaceJPValue(map._list[key]))[0]
                            }
                        })
                        backList.push(itemObj)
                    })
                    back = backList
                }
            } catch(ex) {
                logger.error(`解析 JSON 错误：${name} -> ${map}`)
                console.log(ex)
            }
        } else {
            const data = {} as { [key: string]: any }
            Object.keys(map).forEach((key) => {
                if(map[key] != undefined && map[key] !== '' && !key.startsWith('_'))
                    try {
                        data[key] = jp.query(msg, replaceJPValue(map[key]))[0]
                    } catch(ex) {
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
    try { return require('./../assets/img/qq-face/gif/s' + id + '.gif') } catch {}
    // eslint-disable-next-line
    try { return require('./../assets/img/qq-face/gif/s' + id + '.png') } catch {}
    // eslint-disable-next-line
    try { return require('./../assets/img/qq-face/static/s' + id + '.png') } catch {}
    return false
}

/**
 * 将一个消息体列表组装为标准消息列表便于解析
 * @param msgList 
 * @param map 
 * @returns 
 */
export function buildMsgList(msgList: any) {
    const path = jp.parse(runtimeData.jsonMap.message_list._basic)
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

export default {
    getMsgData
}