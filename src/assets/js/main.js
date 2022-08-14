/*
 * @FileDescription: 基础功能模块
 * @Author: Stapxs
 * @Date: 2022/08/01
 * @Version: 1.0
*/

import Vue from 'vue'

// 初始化信息
export function loadBaseInfo () {
  // // Bot 信息
  // Vue.sendWs(Vue.createAPI(
  //   'get_version_info',
  //   null, null
  // ))
  // 用户信息
  Vue.sendWs(Vue.createAPI('get_login_info', null, 'getLoginInfo'))
  // // 通用凭证
  // Vue.sendWs(Vue.createAPI(
  //   'get_csrf_token',
  //   null, null
  // ))
  // 好友列表
  Vue.sendWs(Vue.createAPI('getFriendList', null, null))
  // 群列表
  Vue.sendWs(Vue.createAPI('getGroupList', null, null))
}

// 加载历史消息
export function loadHistoryMessage (id, type) {
  // 加载历史消息
  // Note: https://github.com/takayama-lily/oicq/wiki/93.%E8%A7%A3%E6%9E%90%E6%B6%88%E6%81%AFID
  var msgid = null
  switch (type) {
    case 'user': {
      // friend msg id 为 4*4+1 = 17 bit
      const buffer = new ArrayBuffer(17)
      const dv = new DataView(buffer, 0)
      dv.setInt32(0, id)
      dv.setInt32(4, 0)
      dv.setInt32(8, 0)
      dv.setInt32(12, 0)
      dv.setInt8(16, 0)
      msgid = Vue.buildMsgIdInfo(buffer)
      break
    }
    case 'group': {
      // group msg id 为 4*5+1 = 21 bit
      const buffer = new ArrayBuffer(21)
      const dv = new DataView(buffer, 0)
      dv.setInt32(0, id)
      dv.setInt32(4, 0)
      dv.setInt32(8, 0)
      dv.setInt32(12, 0)
      dv.setInt32(16, 0)
      dv.setInt8(20, 0)
      msgid = Vue.buildMsgIdInfo(buffer)
      break
    }
  }
  if (msgid != null) {
    // 发送请求
    Vue.sendWs(
      Vue.createAPI(
        'getChatHistory',
        { 'message_id': msgid },
        'getChatHistoryFist'
      )
    )
    return true
  } else {
    return false
  }
}

export default {
  loadBaseInfo,
  loadHistoryMessage
}
