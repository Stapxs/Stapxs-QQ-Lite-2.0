/*
 * @FileDescription: Websocket 底层模块
 * @Author: Stapxs
 * @Date: 2022/10/20
 * @Version: 1.0
 * @Description: 此模块主要处理 Websocket 交互相关功能
*/

import Vue from 'vue'
import Util from './util'
import Option from './options'

import { logger, popInfo } from './base'
import { parse } from './msg'

export class connect {
  static create (address, token) {
    logger.debug(Util.$t('log_ws_log_debug'))
    logger.add(logger.logMode.ws, Util.$t('log_we_log_all'))

    websocket = new WebSocket(`ws://${address}?access_token=${token}`)
    websocket.onopen = () => {
      logger.add(logger.logMode.ws, Util.$t('log_con_success'))
      // 保存登录信息（一个月）
      Vue.$cookies.set('address', address, '1m')
      // 加载初始化数据
      getBaseInfo()
      // PS：标记登陆成功在获取用户信息的回调位置，防止无法获取到内容
    }
    websocket.onmessage = (e) => {
      logger.add(logger.logMode.ws, 'GET：' + e.data)
      parse(e.data)
    }
    websocket.onclose = (e) => {
      Vue.set(login, 'status', false)
      if (e.code !== 1000) {
        logger.error(Util.$t('log_con_fail') + ': ' + e.code)
        popInfo.add(popInfo.appMsgType.err, Util.$t('log_con_fail'), false)
      } else {
        logger.debug(Util.$t('log_con_closed') + ': ' + e.code)
        popInfo.add(popInfo.appMsgType.info, Util.$t('log_con_closed'))
      }
      // 清空数据
      const loginAddress = login.address
      login = {}
      login.address = loginAddress
    }
  }

  static send (name, value, echo) {
    // 构建 JSON
    let obj = {}
    obj.action = name
    obj.params = (value === null || value === undefined) ? {} : value
    obj.echo = (echo === null || echo === undefined) ? name : echo
    const json = JSON.stringify(obj)
    // 发送
    websocket.send(json)
    if (Option.get('log_level') === 'debug') {
      logger.debug('PUT：' + json)
    } else {
      logger.add(logger.logMode.ws, 'PUT：' + json)
    }
  }
}

function getBaseInfo () {
  // bot 信息
  connect.send('get_version_info', null, 'getVersionInfo')
  // 用户信息
  connect.send('get_login_info', null, 'getLoginInfo')
  // 好友列表
  connect.send('get_friend_list', null, 'getFriendList')
  // 群列表
  connect.send('get_group_list', null, 'getGroupList')
}

export var websocket
export let login = {}
