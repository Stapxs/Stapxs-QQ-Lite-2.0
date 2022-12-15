/*
 * @FileDescription: Websocket 底层模块
 * @Author: Stapxs
 * @Date: 2022/10/20
 * @Version: 1.0
 * @Description: 此模块主要处理 Websocket 交互相关功能
*/

import Option from "./option"
import app from "@/main"

import { LogType, Logger, PopType, PopInfo  } from "./base"
import { parse } from './msg'

import { BotActionElem, LoginCacheElem } from "./elements/system"

const logger = new Logger()
const popInfo = new PopInfo()

export let websocket: WebSocket

export class Connector {
    /**
     * 创建 Websocket 连接
     * @param address 地址
     * @param token 密钥
     */
    static create(address: string, token?: string) {
        const $t = app.config.globalProperties.$t
        const $cookies = app.config.globalProperties.$cookies
        
        logger.debug($t('log_ws_log_debug'))
        logger.add(LogType.WS, $t('log_we_log_all'))

        websocket = new WebSocket(`ws://${address}?access_token=${token}`)
        websocket.onopen = () => {
            logger.add(LogType.WS, $t('log_con_success'))
            // 保存登录信息（一个月）
            $cookies.set('address', address, '1m')
            // 加载初始化数据
            // PS：标记登陆成功在获取用户信息的回调位置，防止无法获取到内容
            getBaseInfo()
        }
        websocket.onmessage = (e) => {
            logger.add(LogType.WS, 'GET：' + e.data)
            parse(e.data)
        }
        websocket.onclose = (e) => {
            login.status = false
            if (e.code !== 1000) {
                logger.error($t('pop_log_con_fail') + ': ' + e.code)
                popInfo.add(PopType.ERR, $t('pop_log_con_fail'), false)
            } else {
                logger.debug($t('pop_log_con_closed') + ': ' + e.code)
                popInfo.add(PopType.INFO, $t('pop_log_con_closed'))
            }
            // 清空数据
            const loginAddress = login.address
            login = { status: false, address: '', token: '' }
            login.address = loginAddress
        }
        websocket.onerror = (e) => {
            popInfo.add(PopType.ERR, $t('log_com_err') + ': ' + e)
        }
    }

    static send(name: string, value: {[key: string]: any}, echo: string = name) {
        // 构建 JSON
        const json = JSON.stringify({ action: name, params: value, echo: echo } as BotActionElem)
        // 发送
        websocket.send(json)
        if (Option.get('log_level') === 'debug') {
            logger.debug('PUT：' + json)
        } else {
            logger.add(LogType.WS, 'PUT：' + json)
        }
    }
}

function getBaseInfo() {
    // bot 信息
    Connector.send('get_version_info', {}, 'getVersionInfo')
    // 用户信息
    Connector.send('get_login_info', {}, 'getLoginInfo')
}

export let login: LoginCacheElem = { status: false, address: '', token: '' }