/*
 * @FileDescription: Websocket 底层模块
 * @Author: Stapxs
 * @Date: 2022/10/20
 * @Version: 1.0
 * @Description: 此模块主要处理 Websocket 交互相关功能
*/

import Option from "./option"
import app from "@/main"

import { reactive } from 'vue'
import { LogType, Logger, PopType, PopInfo  } from './base'
import { parse, runtimeData } from './msg'

import { BotActionElem, LoginCacheElem } from './elements/system'

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
        
        logger.debug($t('log_ws_log_debug'))
        logger.add(LogType.WS, $t('log_we_log_all'))

        if(!websocket || websocket.readyState != WebSocket.OPEN) {
            try {
                websocket = new WebSocket(`ws://${address}?access_token=${token}`)
                runtimeData.tags.connectSsl = false
            } catch (ex) {
                websocket = new WebSocket(`wss://${address}?access_token=${token}`)
                runtimeData.tags.connectSsl = true
            }
        }

        websocket.onopen = () => {
            logger.add(LogType.WS, $t('log_con_success'))
            // 保存登录信息（一个月）
            Option.save('address', address)
            // 保存密钥
            if(runtimeData.sysConfig.save_password == true) {
                Option.save('save_password', token)
            }
            // 加载初始化数据
            // PS：标记登陆成功在获取用户信息的回调位置，防止无法获取到内容
            getBaseInfo()
        }
        websocket.onmessage = (e) => {
            // 心跳包输出到日志里太烦人了
            if (!e.data.startsWith("{\"post_type\":\"meta_event\",\"meta_event_type\":\"heartbeat\"")) {
                logger.add(LogType.WS, 'GET：' + e.data)
            }
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
            // TODO: 重置运行时数据并不会刷新，重新连接会有问题，暂时进行页面刷新。
            location.reload()
        }
        websocket.onerror = () => {
            popInfo.add(PopType.ERR, $t('log_com_err'))
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

export let login: LoginCacheElem = reactive({ status: false, address: '', token: '' })