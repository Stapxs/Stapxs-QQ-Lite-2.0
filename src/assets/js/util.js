/*
 * @FileDescription: 工具模块
 * @Author: Stapxs
 * @Date: 2022/08/02
 * @Version: 1.0
 * @Description： 一个平平无奇的工具类
*/

import Vue from 'vue'
import l10nConfig from '../src/l10n/_l10nconfig.json'
import { logger, popInfo } from './base'

import { connect as connector, login } from './connect'
import { runtimeData } from './msg'

export function mergeList (a, b) {
  if (a === undefined) {
    return b
  }
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
    connector.send(
      'get_chat_history',
      { 'message_id': msgid },
      'getChatHistoryFist'
    )
    return true
  } else {
    return false
  }
}

export function openLink (url) {
  window.open(url)
}

export function getTrueLang () {
  let back = 'zh-CN'
  l10nConfig.forEach((item) => {
    if (item.value === Vue.$i18n.locale) {
      back = item.lang
    }
  })
  return back
}

export function getSizeFromBytes (size) {
  if (!size) {
    return ''
  }

  var num = 1024.00

  if (size < num) {
    return size + 'B'
  }
  if (size < Math.pow(num, 2)) {
    return (size / num).toFixed(2) + 'K'
  }
  if (size < Math.pow(num, 3)) {
    return (size / Math.pow(num, 2)).toFixed(2) + 'M'
  }
  if (size < Math.pow(num, 4)) {
    return (size / Math.pow(num, 3)).toFixed(2) + 'G'
  }
  return (size / Math.pow(num, 4)).toFixed(2) + 'T'
}

export function htmlDecodeByRegExp (str) {
  var s = ''
  if (str.length === 0) return ''
  s = str.replace(/&amp;/g, '&')
  s = s.replace(/&lt;/g, '<')
  s = s.replace(/&gt;/g, '>')
  s = s.replace(/&nbsp;/g, ' ')
  s = s.replace(/&#39;/g, '\'')
  s = s.replace(/&quot;/g, '"')
  return s
}

export function getRandom (num, maxA, minlA, fqy) {
  let arr = []
  let arr1 = []
  let arr2 = []
  if (num) {
    for (let m = 0; m <= 9; m++) {
      arr.push(m)
    }
  }
  if (maxA) {
    for (let m = 65; m <= 90; m++) {
      arr1.push(m)
    }
  }
  if (minlA) {
    for (let m = 97; m <= 122; m++) {
      arr2.push(m)
    }
  }
  if (!fqy) {
    console.log('生成位数必传')
  }
  let mergeArr = arr.concat(arr1)
  let mergeArr1 = mergeArr.concat(arr2)
  let _length = mergeArr1.length
  let text = ''
  for (let m = 0; m < fqy; m++) {
    let text1 = ''
    var max = 0
    var min = _length
    if (_length > 0) {
      max = _length
      min = 0
    }
    let random = parseInt(Math.random() * (max - min)) + min
    if ((mergeArr1[random]) <= 9) {
      text1 = mergeArr1[random]
    } else if ((mergeArr1[random]) > 9) {
      text1 = String.fromCharCode(mergeArr1[random])
    }
    text += text1
  }
  return text
}

export function $t (args) {
  // 别 BB（全恼
  /* eslint-disable */
  return Vue.i18n.tc.call(Vue.i18n, args)
}

export function getMsgRawTxt(message) {
  let back = ''
  for (let i = 0; i < message.length; i++) {
    switch (message[i].type) {
      case 'at':
      case 'text': back += message[i].text.replaceAll('\n', ' ').replaceAll('\r', ' '); break
      case 'face':
      case 'bface': back += '[表情]'; break
      case 'image': back += '[图片]'; break
      case 'record': back += '[语音]'; break
      case 'video': back += '[视频]'; break
      case 'file': back += '[文件]'; break
      case 'json': back += JSON.parse(message[i].data).prompt; break
      case 'xml': {
        let name = message[i].data.substring(message[i].data.indexOf('<source name="') + 14)
        name = name.substring(0, name.indexOf('"'))
        back += '[' + name + ']'
        break
      }
    }
  }
  return back
}

// 初始化构建 UI Test 的范例数据
export function initUITest () {
  // 绕过登陆判定
  Vue.set(login, 'status', true)
  Vue.set(login, 'info', {'uin':1111111111,'lnick':'这只是测试用的数据','nick':'林小槐'})
  // 填充运行时数据
  Vue.set(runtimeData, 'loginInfo', )
  Vue.set(runtimeData, 'onChat', {"type":"group","id":1111111111,"name":"Stapxs QQ Lite 内测群","avatar":"https://p.qlogo.cn/gh/1111111111/1111111111/0","info":{"group":{},"group_members":[{"user_id":2222222222,"nickname":"林小槐","card":"","level":1,"role":"admin"},{"user_id":3333333333,"nickname":"HappyDay's  small ID","card":"","level":1,"role":"member"},{"user_id":4444444444,"nickname":"晓狩","card":"","level":1,"role":"member"}],"group_files":{"file_list":[{"bus_id":104,"create_time":1669356711,"dead_time":1670221311,"download_times":2,"id":"/0d55f622-6c88-11ed-8d9f-5254001daf95","md5":"8106ece97e5de9434d63faa991d8513f","name":"901309905.mp4","owner_name":"林小槐","owner_uin":2222222222,"parent_id":"/","size":161478663,"type":1}],"next_index":0,"total_cnt":1},"group_sub_files":{},"user":{},"me":{"group_id":1111111111,"user_id":2222222222,"nickname":"林小槐","card":"","level":1,"role":"admin","echo":"getUserInfoInGroup"},"group_notices":{"feeds":[{"u":2222222222,"msg":{"text":"Stapxs QQ Lite 2.0 来辣，戳下面的链接去用用看 ……\nmemo 全新的 README（还有点感谢内容要写）\nsparkles 群公告支持（不支持图片）\nbug 修正在窄布局下，底栏被消息组件弹窗遮挡\nart 拆分 MsgBody 的部分方法便于之后的兼容复用\nsparkles 消息列表部分功能（打开自动添加到消息列表、新消息置顶、新消息提示、显示消息预览）\nbug 修正了好友列表搜索不支持备注的遗漏 \nhttps://stapxs.github.io/Stapxs-QQ-Lite-2.0/","text_face":"Stapxs QQ Lite 2.0 来辣，戳下面的链接去用用看 ……\nmemo 全新的 README（还有点感谢内容要写）\nsparkles 群公告支持（不支持图片）\nbug 修正在窄布局下，底栏被消息组件弹窗遮挡\nart 拆分 MsgBody 的部分方法便于之后的兼容复用\nsparkles 消息列表部分功能（打开自动添加到消息列表、新消息置顶、新消息提示、显示消息预览）\nbug 修正了好友列表搜索不支持备注的遗漏 \nhttps://stapxs.github.io/Stapxs-QQ-Lite-2.0/","title":"群公告"},"read_num":4,"is_read":0}]}}})
  Vue.set(runtimeData, 'userList', [{"user_id":3333333333,"nickname":"晓狩","sex":"male","remark":""},{"group_id":1000000000,"group_name":"DHW ∞ 行在","owner_id":2222222222}])
  Vue.set(runtimeData, 'onMsg', [{"group_id":1000000000,"group_name":"DHW ∞ 行在","owner_id":2222222222,"new_msg":false},{"group_id":1111111111,"group_name":"Stapxs QQ Lite 内测群","owner_id":2222222222,"new_msg":true}])
  Vue.set(runtimeData, 'messageList', [{"post_type":"message","message_id":"E/1","user_id":2222222222,"time":1669898020,"seq":9706,"rand":1560268290,"font":"微软雅黑","message":[{"type":"text","text":"又遇到个见鬼的 BUG ……"}],"raw_message":"又遇到个见鬼的 BUG ……","message_type":"group","sender":{"user_id":2222222222,"nickname":"林小槐","card":""},"group_id":1111111111,"atme":false,"atall":false},{"post_type":"message","message_id":"E/2","user_id":2222222222,"time":1669898020,"seq":9706,"rand":1560268290,"font":"微软雅黑","message":[{"type":"text","text":"https://github.com/Stapxs/Stapxs-QQ-Lite-2.0"}],"raw_message":"https://github.com/Stapxs/Stapxs-QQ-Lite-2.0","message_type":"group","sender":{"user_id":2222222222,"nickname":"林小槐","card":""},"group_id":1111111111,"atme":false,"atall":false},{"post_type":"message","message_id":"E/3","user_id":2222222222,"time":1669898020,"seq":9706,"rand":1560268290,"font":"微软雅黑","message":[{"type":"text","text":"看看现在好没好"}],"raw_message":"看看现在好没好","message_type":"group","sender":{"user_id":2222222222,"nickname":"林小槐","card":""},"group_id":1111111111,"atme":false,"atall":false},{"post_type":"notice","notice_type":"group","group_id":1111111111,"sub_type":"recall","user_id":2222222222,"operator_id":2222222222,"message_id":"这个不重要","self_id":2222222222,"name":"林小槐","time":1669898020},{"post_type":"message","message_id":"E/5","user_id":2222222222,"time":1669943800,"seq":114361,"rand":3096699112,"font":"宋体","message":[{"type":"image","file":"66cba6ff5b2364d27eb3d6ed4d2faeca92966-554-838.png","url":"https://gchat.qpic.cn/gchatpic_new/1007028430/560932983-3133756386-66CBA6FF5B2364D27EB3D6ED4D2FAECA/0?term=2&is_origin=0","asface":false},{"type":"text","text":" 像是这样翻译模式（UI 测试模式）应该就能用了 hummmm"}],"raw_message":"[图片] 像是这样翻译模式（UI 测试模式）应该就能用了 hummmm","message_type":"group","sender":{"user_id":2222222222,"nickname":"林小槐 - Stapx_Steve","card":"林小槐 - Stapx_Steve","level":1,"role":"admin"},"group_id":1111111111}])
  Vue.set(runtimeData, 'botInfo', {"app_name":"oicq2","version":"2.3.1","http_api":"1.1.0","stat":{"start_time":1669940663,"lost_times":0,"recv_pkt_cnt":30,"sent_pkt_cnt":24,"lost_pkt_cnt":0,"recv_msg_cnt":1,"sent_msg_cnt":0,"msg_cnt_per_min":0,"remote_ip":"58.212.179.115","remote_port":8080}})
  Vue.set(runtimeData, 'loginInfo', {"uin":2222222222,"status":"online","nickname":"林小槐","sex":"male"})
  Vue.set(runtimeData, 'showData', [{"group_id":1000000000,"group_name":"DHW ∞ 行在","owner_id":2222222222},{"user_id":3333333333,"nickname":"晓狩","sex":"male","remark":""}])
  Vue.set(runtimeData, 'mergeMessageList', [{"user_id":2222222222,"time":1669942039,"nickname":"林小槐 - Stapx_Steve","group_id":1111111111,"message":[{"type":"image","file":"6b02169dd9cb486330e400fdebf8312a5310-290-290.jpg","url":"https://gchat.qpic.cn/gchatpic_new/1007028430/560932983-2842238012-6B02169DD9CB486330E400FDEBF8312A/0?term=2&is_origin=0","asface":true}],"raw_message":"[动画表情]","sender":{"user_id":2222222222,"nickname":"林小槐 - Stapx_Steve","card":"林小槐 - Stapx_Steve"}},{"time":1669893493,"user_id":2222222222,"nickname":"林小槐 - Stapx_Steve","group_id":1111111111,"message":[{"type":"text","text":"烦内"}],"raw_message":"烦内","sender":{"user_id":2222222222,"nickname":"林小槐 - Stapx_Steve","card":"林小槐 - Stapx_Steve"}}])
  Vue.set(runtimeData, 'stickers', [])
  // 输出所有的 popInfo
  popInfo.add(popInfo.appMsgType.info, $t('pop_print_all_pop'), true)
  setTimeout(() => {
    const lang = require('../src/l10n/zh-CN.json')
    const list = Object.keys(lang).filter((item) => {return item.startsWith('pop')})
    for(let i=0; i<list.length; i++) {
      const item = list[i]
      setTimeout(() => {
        popInfo.add(popInfo.appMsgType.info, $t(item, {code: 'test'}), true)
      }, 3000 * i)
    }
  }, 5000)
}

export function loadPage (botName) {
  switch(botName) {
    // go-cqhttp 兼容，渲染 CQCode -> JSON，消息发送 JSON -> CQCode
    case 'go-cqhttp': {
      Vue.set(runtimeData.pageView, 'msgView', () => import(`../../components/msg/body/GOCQHttp.vue`))
      Vue.set(runtimeData.tags, 'sendType', 'CQCode')
    }
  }
}

export function parseCQ (msg) {
  // 将纯文本也处理为 CQCode 格式
  // PS：这儿不用担心方括号本身，go-cqhttp 会把它转义掉
  let reg = /^[^\]]+?\[|\].+\[|\][^\[]+$|^[^\[\]]+$/g
  msg.match(reg).forEach((item) => {
    // PS：顺便把被转义的方括号转回来
    const trueText = item.replace('[', '').replace(']', '')
                         .replace('&#91;', '[').replace('&#93;', ']')
    msg = msg.replace(trueText, `[CQ:text,text=${trueText}]`)
  })
  // 拆分 CQCode
  reg = /\[.+?\]/g
  const list = msg.match(reg)
  // 处理为 object
  let back = []
  reg = /\[CQ:([^,]+),(.*)\]/g
  list.forEach((item) => {
    if(item.match(reg) !== null) {
      let info = {type: RegExp.$1}
      RegExp.$2.split(',').forEach((key) => {
        const kv = key.split('=')
        info[kv[0]] = kv[1]
      })
      back.push(info)
    }
  })
  logger.debug($t('log_cq_msg_parsred') + ': ' + JSON.stringify(back))
  return back
}

export default {
  getMsgRawTxt,
  mergeList,
  parseMsgId,
  waveAnimation,
  loadHistoryMessage,
  openLink,
  getTrueLang,
  htmlDecodeByRegExp,
  loadPage,
  parseCQ,
  $t
}
