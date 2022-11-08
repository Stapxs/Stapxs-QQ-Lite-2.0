/*
 * @FileDescription: 消息处理模块
 * @Author: Stapxs
 * @Date: 2022/11/1
 * @Version: 1.0
 * @Description: 此模块用于拆分和保存/处理 bot 返回的各类信息，整个运行时数据也保存在这儿。
*/

import Vue from 'vue'
import FileDownloader from 'js-file-downloader'
import Util from './util'
import Option from './options'

import { popInfo } from './base'
import { connect as connecter, login } from './connect'

// 处理消息
export function parse (str) {
  const msg = JSON.parse(str)
  if (msg.echo !== undefined) {
    /* eslint-disable */
    switch (msg.echo) {
      case 'websocketTest'      : backTestInfo(msg); break
      case 'getGroupList'       : saveUser(msg.data); break
      case 'getFriendList'      : saveUser(msg.data); break
      case 'getLoginInfo'       : saveLoginInfo(msg.data); break
      case 'getVersionInfo'     : break
      case 'getMoreLoginInfo'   : saveInfo(login, 'info', msg.data.data.result.buddy.info_list[0]); break
      case 'getMoreGroupInfo'   : saveInfo(runtimeData.onChat.info, 'group', msg.data.data); break
      case 'getMoreUserInfo'    : saveInfo(runtimeData.onChat.info, 'user', msg.data.data.result.buddy.info_list[0]); break
      case 'getGroupMemberList' : saveInfo(runtimeData.onChat.info, 'group_members', msg.data); break
      case 'getGroupFiles'      : saveFileList(msg.data.data); break
      case 'getMoreGroupFiles'  : saveMoreFileList(msg.data.data); break
      case 'getForwardMsg'      : saveForwardMsg(msg.data); break
      case 'getChatHistoryFist' : saveMsgFist(msg); break
      case 'getChatHistory'     : saveMsg(msg); break
      case 'sendMsgBack'        : showSendedMsg(msg); break
      default                   : {
        const echoList = msg.echo.split('_')
        const head = echoList[0]
        if(msg.echo.indexOf('_') > 0) {
          // 复杂消息头
          // PS：复杂消息头由“消息头_参数1_参数N”组成
          switch (head) {
            case 'getSendMsg'         : saveSendedMsg(msg); break
            case 'getGroupMemberInfo' : saveMemberInfo(msg); break
            case 'getGroupDirFiles'   : saveDirFile(msg); break
            case 'downloadGroupFile'  : downloadGroupFile(msg); break
          }
        }
      }
    }
    /* eslint-enable */
  } else {
    switch (msg.post_type) {
      case 'message': newMsg(msg); break
    }
  }
}

// ===================================================

// PS：这玩意只能用来保存 Object
function saveInfo (parent, name, data) {
  if (parent[name] === undefined) {
    parent[name] = {}
  }
  Vue.set(parent, name, data)
}
function saveUser (list) {
  const back = Util.mergeList(runtimeData.userList, list)
  Vue.set(runtimeData, 'userList', back)
}
function saveLoginInfo (data) {
  Vue.loginInfo = data
  Vue.set(login, 'status', true)
  // 获取更详细的信息
  let url = 'https://find.qq.com/proxy/domain/cgi.find.qq.com/qqfind/find_v11?backver=2'
  let info = `bnum=15&pagesize=15&id=0&sid=0&page=0&pageindex=0&ext=&guagua=1&gnum=12&guaguan=2&type=2&ver=4903&longitude=116.405285&latitude=39.904989&lbs_addr_country=%E4%B8%AD%E5%9B%BD&lbs_addr_province=%E5%8C%97%E4%BA%AC&lbs_addr_city=%E5%8C%97%E4%BA%AC%E5%B8%82&keyword=${data.account.uin}&nf=0&of=0&ldw=${data.oicq.bkn}`
  connecter.send(
    'http_proxy',
    { 'url': url, 'method': 'post', 'data': info },
    'getMoreLoginInfo'
  )
}
function saveFileList (data) {
  if (data.ec !== 0) {
    popInfo.add(
      popInfo.appMsgType.err,
      Util.$t('chat.chat_info.load_file_err', {code: data.ec})
    )
  } else {
    saveInfo(runtimeData.onChat.info, 'group_files', data)
  }
}
function saveMoreFileList (data) {
  if (runtimeData.onChat.info !== undefined && runtimeData.onChat.info.group_files !== undefined) {
    // 追加文件列表
    const list = Util.mergeList(runtimeData.onChat.info.group_files.file_list, data.file_list)
    saveInfo(runtimeData.onChat.info.group_files, 'file_list', list)
    // 设置最大值位置
    saveInfo(runtimeData.onChat.info.group_files, 'next_index', data.next_index)
  }
}
function saveForwardMsg (data) {
  // 格式化不规范消息格式
  for (let i = 0; i < data.length; i++) {
    data[i].sender = {
      user_id: data[i].user_id,
      nickname: data[i].nickname,
      card: ''
    }
  }
  Vue.set(runtimeData, 'mergeMessageList', data)
}
function backTestInfo (data) {
  runtimeData.wsTestBack = data
  console.log('=========================')
  console.log(data)
  console.log('=========================')
}
function saveMsgFist (msg) {
  if (msg.error !== undefined) {
    popInfo.add(popInfo.appMsgType.err, Util.$t('chat.load_msg_err', {code: msg.error}))
    Vue.set(runtimeData, 'messageList', [])
  } else {
    Vue.set(runtimeData, 'messageList', msg.data)
    // setTimeout(() => {
    //   this.$refs.chat.scrollBottom()
    // }, 500)
  }
}
function saveMsg (msg) {
  if (msg.error !== undefined) {
    popInfo.add(popInfo.appMsgType.err, this.$t('chat.load_msg_err', {code: msg.error}))
  } else {
    const items = msg.data
    items.pop() // 去除最后一条重复的消息，获取历史消息会返回当前消息 **以及** 之前的 N-1 条
    // if (items.length < 1) {
    //   this.$refs.chat.setNoMoreHistory()
    //   return
    // }
    Vue.set(runtimeData, 'messageList', Util.mergeList(items, runtimeData.messageList))
  }
}
function showSendedMsg (msg) {
  if (msg.error !== undefined) {
    popInfo.add(popInfo.appMsgType.err, Util.$t('chat.send_msg_err', {code: msg.error}))
  } else {
    if (msg.message_id !== undefined) {
      // 请求消息内容
      connecter.send(
        'get_msg',
        { 'message_id': msg.message_id },
        'getSendMsg_' + msg.message_id + '_0'
      )
    }
  }
}
function saveSendedMsg (msg) {
  // TODO 这里暂时没有考虑消息获取失败的情况（因为没有例子）
  Vue.set(runtimeData, 'messageList', Util.mergeList(runtimeData.messageList, [msg]))
}
function saveMemberInfo (msg) {
  const pointInfo = msg.echo.split('_')
  msg.x = pointInfo[1]
  msg.y = pointInfo[2]
  Vue.set(runtimeData, 'nowMemberInfo', msg)
}
function saveDirFile (msg) {
  // TODO 这边不分页直接拿全
  const id = msg.echo.split('_')[1]
  let fileIndex = -1
  runtimeData.onChat.info.group_files.file_list.forEach((item, index) => {
    if (item.id === id) {
      fileIndex = index
    }
  })
  Vue.set(runtimeData.onChat.info.group_files.file_list[fileIndex], 'sub_list', msg.data.data.file_list)
}
function downloadGroupFile (msg) {
  const info = msg.echo.split('_')
  const id = info[1]
  const json = JSON.parse(msg.data.data.substring(msg.data.data.indexOf('(') + 1, msg.data.data.lastIndexOf(')')))
  let fileName = 'new-file'
  let fileIndex = -1
  let subFileIndex = -1
  runtimeData.onChat.info.group_files.file_list.forEach((item, index) => {
    if (item.id === id) {
      fileName = Util.htmlDecodeByRegExp(item.name)
      fileIndex = index
    }
  })
  // 这是个子文件
  if (info[2] !== undefined) {
    runtimeData.onChat.info.group_files.file_list[fileIndex].sub_list.forEach((item, index) => {
      if (item.id === info[2]) {
        fileName = Util.htmlDecodeByRegExp(item.name)
        subFileIndex = index
      }
    })
  }
  const onProcess = function (event) {
    if (!event.lengthComputable) return
    var downloadingPercentage = Math.floor(event.loaded / event.total * 100)
    if (fileIndex !== -1) {
      if (subFileIndex === -1) {
        if (runtimeData.onChat.info.group_files.file_list[fileIndex].downloadingPercentage === undefined) {
          Vue.set(runtimeData.onChat.info.group_files.file_list[fileIndex], 'downloadingPercentage', 0)
        }
        Vue.set(runtimeData.onChat.info.group_files.file_list[fileIndex], 'downloadingPercentage', downloadingPercentage)
      } else {
        if (runtimeData.onChat.info.group_files.file_list[fileIndex].sub_list[subFileIndex].downloadingPercentage === undefined) {
          Vue.set(runtimeData.onChat.info.group_files.file_list[fileIndex].sub_list[subFileIndex], 'downloadingPercentage', 0)
        }
        Vue.set(runtimeData.onChat.info.group_files.file_list[fileIndex].sub_list[subFileIndex], 'downloadingPercentage', downloadingPercentage)
      }
    }
  }
  // 下载文件
  new FileDownloader({
    url: json.data.url,
    autoStart: true,
    process: onProcess,
    nameCallback: function () {
      return fileName
    }
  })
    .then(function () {
      console.log('finished')
    })
    .catch(function (error) {
      if (error) {
        console.log(error)
      }
    })
}
function newMsg (data) {
  const id = data.from_id ? data.from_id : data.group_id
  if (id === runtimeData.onChat.id) {
    const list = runtimeData.messageList
    Vue.set(runtimeData, 'messageList', Util.mergeList(list, [data]))
  }
  // 新消息提示处理
  // (发送者没有被打开 || 窗口被最小化) && (发送者不是群组 || 群组 AT || 群组 AT 全体 || 打开了通知全部消息)
  if (id !== runtimeData.onChat.id || document.hidden) {
    if (data.message_type !== 'group' || data.atme || data.atall || Option.get('notice_all') === true) {
      // 检查通知权限，老旧浏览器不支持这个功能
      if (Notification.permission === 'default') {
        Notification.requestPermission(function (status) {
          if (Notification.permission !== status) {
            Notification.permission = status
          }
          sendNotice(data)
        })
      } else if (Notification.permission !== 'denied' &&
      Notification.permission !== 'default') {
        sendNotice(data)
      }
    }
  }
}
function sendNotice (msg) {
  if (Option.get('close_notice') !== true) {
    let raw = Util.getMsgRawTxt(msg.message)
    raw = raw === '' ? msg.raw_message : raw
    // 构建通知
    let notificationTile = ''
    let notificationBody = {}
    if (msg.message_type === 'group') {
      notificationTile = msg.group_name
      notificationBody.body = msg.sender.nickname + ':' + raw
      notificationBody.tag = `${msg.group_id}/${msg.message_id}`
      notificationBody.icon = `https://p.qlogo.cn/gh/${msg.group_id}/${msg.group_id}/0`
    } else {
      notificationTile = msg.sender.nickname
      notificationBody.body = raw
      notificationBody.tag = `${msg.user_id}/${msg.message_id}`
      notificationBody.icon = `https://q1.qlogo.cn/g?b=qq&s=0&nk=${msg.user_id}`
    }
    // 如果消息有图片，追加图片
    msg.message.forEach((item) => {
      if (item.type === 'image' && notificationBody.image === undefined) {
        notificationBody.image = item.url
      }
    })
    // 发起通知
    let notification = new Notification(notificationTile, notificationBody)
    notificationList[msg.message_id] = notification
    notification.onclick = function () {
      window.focus()
      const userId = event.target.tag.split('/')[0]
      document.getElementById('user-' + userId).click()

      const msgId = event.target.tag.split('/')[1]
      if (notificationList[msgId] !== undefined) {
        delete notificationList[msgId]
      }
    }
    notification.onclose = function () {
      const msgId = event.target.tag.split('/')[1]
      if (notificationList[msgId] !== undefined) {
        delete notificationList[msgId]
      }
    }
  }
}

let notificationList = {}

// 运行时数据，用于在全程序内共享使用
export let runtimeData = {
  onChat: { type: '', id: '', name: '', avatar: '', info: {} },
  messageList: []
}
