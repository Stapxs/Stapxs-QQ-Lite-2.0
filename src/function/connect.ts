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
            if(!runtimeData.tags.connectSsl) {
                try {
                    websocket = new WebSocket(`ws://${address}?access_token=${token}`)
                } catch(e) {
                    // 无法连接时尝试使用 SSL 连接
                    if(runtimeData.tags.connectSsl == false) {
                        runtimeData.tags.connectSsl = true
                        this.create(address, token)
                    }
                    return
                }
            } else {
                websocket = new WebSocket(`wss://${address}?access_token=${token}`)
            }
        }

        websocket.onopen = () => {
            logger.add(LogType.WS, $t('log_con_success'))
            // 保存登录信息（一个月）
            Option.save('address', address)
            // 保存密钥
            if(runtimeData.sysConfig.save_password && runtimeData.sysConfig.save_password != '') {
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
                if(e.code == 1006 && runtimeData.tags.connectSsl == false) {
                    runtimeData.tags.connectSsl = true
                    this.create(address, token)
                } else {
                    logger.error($t('pop_log_con_fail') + ': ' + e.code)
                    popInfo.add(PopType.ERR, $t('pop_log_con_fail') + ': ' + e.code, false)
                    console.log(e)
                }
            } else {
                logger.debug($t('pop_log_con_closed') + ': ' + e.code)
                popInfo.add(PopType.INFO, $t('pop_log_con_closed'))
            }
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

export const login: LoginCacheElem = reactive({ status: false, address: '', token: '' })