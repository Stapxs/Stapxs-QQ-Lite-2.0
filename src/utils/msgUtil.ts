import jp from 'jsonpath'

import { Logger } from '@/function/base'
import { runtimeData } from '@/function/msg'
import util from '@/function/util'

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

export function parseMsgList(list: any, map: string, valueMap: { [key: string]: any }): any[] {
    // 消息类型的特殊处理
    switch(map.split('|')[0]) {
        case 'cq-code': {
            // 这儿会默认处理成 oicq2 的格式，所以 CQCode 消息请使用 oicq2 配置文件修改
            for (let i = 0; i < list.length; i++) {
                list[i] = util.parseCQ(list[i])
            }
            break
        }
        case 'json_with_data': {
            // 非扁平化消息体，这儿会取 _type 后半段的 JSON Path 将结果并入 message
            for (let i = 0; i < list.length; i++) {
                for(let j = 0; j < list[i].message.length; j++) {
                    const data = getMsgData('message_list_message', list[i].message[j], map.split('|')[1])
                    if(data != undefined && data.length == 1) {
                        list[i].message[j] = Object.assign(list[i].message[j], data[0])
                    }
                }
            }
        }
    }
    // 消息字段的标准化特殊处理
    if(valueMap != undefined) {
        for (let i = 0; i < list.length; i++) {
            Object.entries(valueMap).forEach(([type, values]) => {
                Object.entries(values).forEach(([key, value]) => {
                    list[i].message.forEach((item: any) => {
                        if(item.type == type) {
                            item[key] = jp.query(item, value as string)[0]
                        }
                        // 顺便把没用的 data 删了
                        delete item.data
                    })
                })
            })
        }
    }
    return list
}

export default {
    getMsgData
}