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
                            if(map._list[key].startsWith('/'))
                                itemObj[key] = item[map._list[key].substring(1)]
                            else
                                itemObj[key] = jp.query(item, replaceJPValue(map._list[key]))[0]
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
 * @param id 
 * @param getShow 
 * @returns 
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

export default {
    getMsgData
}