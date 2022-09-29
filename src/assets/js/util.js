/*
 * @FileDescription: 工具模块
 * @Author: Stapxs
 * @Date: 2022/08/02
 * @Version: 1.0
*/

import Vue from 'vue'

function mergeList (a, b) {
  return a.concat(b)
}

export function parseMsgId (id) {
  if (id !== undefined && id !== null && id.length > 0) {
    var binaryString = window.atob(id)
    var len = binaryString.length
    var bytes = new Uint8Array(len)
    for (var i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    var buffer = bytes.buffer
    var dv = new DataView(buffer, 0)
    if (id.length === 28) {
      return {
        gid: dv.getInt32(0),
        uid: dv.getInt32(4),
        seqid: dv.getInt32(8)
      }
    } else if (id.length === 24) {
      return {
        uid: dv.getInt32(0),
        seqid: dv.getInt32(4)
      }
    }
  }
  return { gid: '', uid: '', seqid: '' }
}

export function isExternal (path) {
  return /^(https?:|mailto:|tel:)/.test(path)
}

export function waveAnimation (wave) {
  let waves = wave.children[1].children
  let min = 20
  let max = 195
  let add = 1
  let timer = setInterval(() => {
    // 遍历波浪体
    for (var i = 0; i < waves.length; i++) {
      let now = waves[i].getAttribute('x')
      if (Number(now) + add > max) {
        waves[i].setAttribute('x', min)
      } else {
        waves[i].setAttribute('x', Number(now) + add)
      }
    }
  }, 50)
  return timer
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
  // Vue.sendWs(Vue.createAPI('getCsrfToken', null, null))
  // 好友列表
  Vue.sendWs(Vue.createAPI('getFriendList', null, null))
  // 群列表
  Vue.sendWs(Vue.createAPI('getGroupList', null, null))
}

export function openLink (url) {
  window.open(url)
}

export default {
  mergeList,
  parseMsgId,
  waveAnimation,
  loadHistoryMessage,
  loadBaseInfo,
  openLink
}
