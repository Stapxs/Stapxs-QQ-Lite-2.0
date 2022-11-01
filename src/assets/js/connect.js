/*
 * @FileDescription: Websocket 底层模块
 * @Author: Stapxs
 * @Date: 2022/10/20
 * @Version: 1.0
 * @Description: 此模块主要处理 Websocket 交互相关功能
*/

import Vue from 'vue'
import { logger, popInfo } from './base'

export class connect {
  static create (address, token) {
    websocket = new WebSocket(`ws://${address}?access_token=${token}`)
    websocket.onopen = () => {
      logger.add(logger.logMode.ws, this.$t('log.con_success'))
      // 保存登录信息（一个月）
      Vue.$cookies.set('address', address, '1m')
      // 加载初始化数据
      // Util.loadBaseInfo()
      // PS：标记登陆成功在获取用户信息的回调位置，防止无法获取到内容
    }
    websocket.onmessage = (e) => {
      logger.debug('GET：' + e.data)
      // this.parse(e.data)
    }
    websocket.onclose = (e) => {
      // this.login.status = false
      if (e.code !== 1000) {
        logger.error(this.$t('log.con_fail') + ': ' + e.code)
        popInfo.add(popInfo.appMsgType.err, this.$t('log.con_fail'), false)
      } else {
        logger.debug(this.$t('log.con_closed') + ': ' + e.code)
        popInfo.add(popInfo.appMsgType.info, this.$t('log.con_closed'))
      }
      // 清空数据
      // const loginAddress = this.login.address
      // Object.assign(this.$data, this.$options.data())
      // this.login.address = loginAddress
    }
  }
}

export var websocket
