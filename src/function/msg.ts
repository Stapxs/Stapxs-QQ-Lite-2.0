/*
 * @FileDescription: 消息处理模块
 * @Author: Stapxs
 * @Date: 
 *      2022/11/1
 *      2022/12/7
 * @Version: 
 *      1.0 - 初始版本
 *      2.0 - 重构为 ts 版本，修改 Vue3 相关变更
 * @Description: 此模块用于拆分和保存/处理 bot 返回的各类信息，整个运行时数据也保存在这儿。
*/

import FileDownloader from 'js-file-downloader'
import app from '@/main'
import Option from './option'
import Util from './util'

import { reactive } from 'vue'
import { PopInfo, PopType, Logger } from './base'
import { Connector, login } from './connect'
import { GroupMemberInfoElem, UserFriendElem, UserGroupElem } from './elements/information'
import { BotMsgType } from './elements/information'
import { RunTimeDataElem } from './elements/information'

const popInfo = new PopInfo()

export function parse(str: string) {
    const msg = JSON.parse(str)
    if (msg.echo !== undefined) {
        switch (msg.echo) {
            case 'getVersionInfo'       : saveBotInfo(msg.data); break
            case 'getLoginInfo'         : saveLoginInfo(msg.data); break
            case 'getGroupList'         : saveUser(msg.data); break
            case 'getFriendList'        : saveUser(msg.data); break
            case 'getUserInfoInGroup'   : runtimeData.chatInfo.info.me_info = msg; break
            case 'getGroupMemberList'   : saveGroupMember(msg.data); break
            case 'getChatHistoryFist'   : saveMsgFist(msg); break
            case 'getChatHistory'       : saveMsg(msg); break
            case 'getForwardMsg'        : saveForwardMsg(msg.data); break
            case 'sendMsgBack'          : showSendedMsg(msg); break
            case 'getRoamingStamp'      : runtimeData.stickerCache = msg.data.reverse(); break
            case 'getMoreGroupInfo'     : runtimeData.chatInfo.info.group_info = msg.data.data; break
            case 'getMoreUserInfo'      : runtimeData.chatInfo.info.user_info = msg.data.data.result.buddy.info_list[0]; break
            case 'getGroupNotices'      : runtimeData.chatInfo.info.group_notices = msg.data.data; break
            case 'getGroupFiles'        : saveFileList(msg.data.data); break
            case 'getMoreGroupFiles'    : saveMoreFileList(msg.data.data); break
            default                     : {
                const echoList = msg.echo.split('_')
                const head = echoList[0]
                if (msg.echo.indexOf('_') > 0) {
                    // 复杂消息头
                    // PS：复杂消息头由“消息头_参数1_参数N”组成
                    switch (head) {
                        case 'getSendMsg'           : saveSendedMsg(echoList, msg); break
                        case 'getGroupMemberInfo'   : saveMemberInfo(msg); break
                        case 'downloadGroupFile'    : downloadGroupFile(msg); break
                        case 'getGroupDirFiles'     : saveDirFile(msg); break
                    }
                }
            }
        }
    } else {
        switch (msg.post_type) {
            // gocqhttp 自动发送的消息回调和其他消息有区分
            // case 'message_sent'         : msg.post_type = 'message'
            // case 'message'              : newMsg(msg); break
            case 'notice'               : {
                switch (msg.sub_type) {
                    case 'recall'           : revokeMsg(msg); break
                }
                break
            }
        }
    }
}


// ==============================================================

/**
 * 保存 Bot 信息
 * @param data Bot 信息
 */
function saveBotInfo(data: { [key: string]: any }) {
    runtimeData.botInfo = data
    // // GA：提交统计信息，主要在意的是 bot 类型
    // if (Option.get('open_ga_bot') !== false) {
    //     if (data.app_name !== undefined) {
    //         Vue.$gtag.event('login', { method: data.app_name })
    //     } else {
    //         Vue.$gtag.event('login')
    //     }
    // }
    // 加载切换兼容页面
    switch (data.app_name) {
        // go-cqhttp 兼容，渲染 CQCode -> JSON，消息发送 JSON -> CQCode
        case 'go-cqhttp': {
            runtimeData.tags.msgType = BotMsgType.CQCode
        }
    }
}

/**
 * 保存账号信息
 * @param data 账号信息
 */
function saveLoginInfo(data: { [key: string]: any }) {
    // 如果是 user_id 的话 ……
    if (data.uin === undefined && data.user_id !== undefined) {
        data.uin = data.user_id
    }
    runtimeData.loginInfo = data
    login.status = true
    // 获取更详细的信息
    const url = 'https://find.qq.com/proxy/domain/cgi.find.qq.com/qqfind/find_v11?backver=2'
    const info = `bnum=15&pagesize=15&id=0&sid=0&page=0&pageindex=0&ext=&guagua=1&gnum=12&guaguan=2&type=2&ver=4903&longitude=116.405285&latitude=39.904989&lbs_addr_country=%E4%B8%AD%E5%9B%BD&lbs_addr_province=%E5%8C%97%E4%BA%AC&lbs_addr_city=%E5%8C%97%E4%BA%AC%E5%B8%82&keyword=${data.uin}&nf=0&of=0&ldw=${data.bkn}`
    Connector.send(
        'http_proxy',
        { 'url': url, 'method': 'post', 'data': info },
        'getMoreLoginInfo'
    )
    // GA：将 QQ 号 MD5 编码后用于用户识别码
    // if (Option.get('open_ga_user') === true) {
    //   const md5 = require('js-md5')
    //   const userId = md5(data.uin)
    //   Vue.$gtag.config({
    //     user_id: userId
    //   })
    // }
}

function saveUser(list: (UserFriendElem & UserGroupElem)[]) {
    const back = runtimeData.userList.concat(list)
    runtimeData.userList = back
    // 刷新置顶列表
    // let info = Vue.$cookies.get('top')
    // if (info !== null) {
    //     Vue.set(runtimeData, 'topInfo', info)
    //     const topList = info[runtimeData.loginInfo.uin]
    //     if (topList !== undefined) {
    //         list.forEach((item) => {
    //             const id = Number(item.user_id ? item.user_id : item.group_id)
    //             if (topList.indexOf(id) >= 0) {
    //                 item.always_top = true
    //                 runtimeData.onMsg.push(item)
    //             }
    //         })
    //     }
    // }
}

function saveGroupMember(data: GroupMemberInfoElem[]) {
    // 筛选列表
    const adminList = data.filter((item: GroupMemberInfoElem) => {
        return item.role === 'admin'
    })
    const createrList = data.filter((item: GroupMemberInfoElem) => {
        return item.role === 'owner'
    })
    const memberList = data.filter((item: GroupMemberInfoElem) => {
        return item.role !== 'admin' && item.role !== 'owner'
    })
    // 拼接列表
    const back = createrList.concat(adminList.concat(memberList))
    runtimeData.chatInfo.info.group_members = back
}

function saveMsgFist(msg: any) {
    if (msg.error !== undefined || msg.status === 'failed') {
        popInfo.add(PopType.ERR, app.config.globalProperties.$t('pop_chat_load_msg_err', { code: msg.error }))
        runtimeData.messageList = []
    } else {
        // TODO: 对 CQCode 消息进行转换
        runtimeData.messageList = msg.data
        // setTimeout(() => {
        //   this.$refs.chat.scrollBottom()
        // }, 500)
    }
}

function saveMsg(msg: any) {
    if (msg.error !== undefined) {
      popInfo.add(PopType.ERR, app.config.globalProperties.$t('pop_chat_load_msg_err', {code: msg.error}))
    } else {
      const items = msg.data
      items.pop() // 去除最后一条重复的消息，获取历史消息会返回当前消息 **以及** 之前的 N-1 条
      if (items.length < 1) {
        runtimeData.tags.canLoadHistory = false
        return
      }
      // TODO: 对 CQCode 消息进行转换
      runtimeData.messageList = items.concat(runtimeData.messageList)
    }
}

function saveForwardMsg(data: any) {
    // 格式化不规范消息格式
    for (let i = 0; i < data.length; i++) {
        data[i].sender = {
            user_id: data[i].user_id,
            nickname: data[i].nickname,
            card: ''
        }
    }
    runtimeData.mergeMessageList = data
}

function showSendedMsg(msg: any) {
    if (msg.error !== undefined) {
        popInfo.add(PopType.ERR, app.config.globalProperties.$t('pop_chat_send_msg_err', { code: msg.error }))
    } else {
        if (msg.message_id !== undefined && Option.get('send_reget') !== true) {
            // 请求消息内容
            Connector.send(
                'get_msg',
                { 'message_id': msg.message_id },
                'getSendMsg_' + msg.message_id + '_0'
            )
        }
    }
}

function saveSendedMsg(echoList: string[], msg: any) {
    // TODO: 这里暂时没有考虑消息获取失败的情况（因为没有例子）
    if (Number(echoList[2]) <= 5) {
        if (echoList[1] !== msg.message_id) {
            // 返回的不是这条消息，重新请求
            popInfo.add(PopType.ERR, app.config.globalProperties.$t('pop_chat_get_msg_err') + '(' + echoList[2] + ')')
            setTimeout(() => {
                Connector.send(
                    'get_msg',
                    { 'message_id': echoList[1] },
                    'getSendMsg_' + echoList[1] + '_' + (Number(echoList[2]) + 1)
                )
            }, 5000)
        } else {
            runtimeData.messageList.push(msg)
        }
    } else {
        popInfo.add(PopType.ERR, app.config.globalProperties.$t('pop_chat_get_msg_err_fin'))
    }
}

function saveMemberInfo(msg: any) {
    const pointInfo = msg.echo.split('_')
    msg.x = pointInfo[1]
    msg.y = pointInfo[2]
    runtimeData.chatInfo.info.now_member_info = msg
}

function revokeMsg(msg: any) {
    const chatId = msg.notice_type === 'group' ? msg.group_id : msg.user_id
    const msgId = msg.message_id
    // 当前窗口
    if (Number(chatId) === Number(runtimeData.chatInfo.show.id)) {
        // 寻找消息
        let msgGet = null as { [key: string]: any } | null
        let msgIndex = -1
        runtimeData.messageList.forEach((item, index) => {
            if (item.message_id === msgId) {
                msgGet = item
                msgIndex = index
            }
        })
        if (msgGet !== null && msgIndex !== -1) {
          runtimeData.messageList[msgIndex].revoke = true
          if(msgGet.sender.user_id !== runtimeData.loginInfo.uin) {
              // 显示撤回提示
              const list = runtimeData.messageList
              if (msgIndex !== -1) {
                  runtimeData.messageList.splice((msgIndex + 1), 0, msg)
              } else {
                runtimeData.messageList.push(msg)
              }
          }
        } else {
          new Logger().error(app.config.globalProperties.$t('log_revoke_miss'))
        }
    }
    // // 尝试撤回通知
    // if(window.notices != undefined && window.notices[msg.message_id] != undefined) {
    //     window.notices[msg.message_id].close()
    // }
}

function downloadGroupFile(msg: any) {
    // 基本信息
    const info = msg.echo.split('_')
    const id = info[1]
    const json = JSON.parse(msg.data.data.substring(msg.data.data.indexOf('(') + 1, msg.data.data.lastIndexOf(')')))
    // 文件信息
    let fileName = 'new-file'
    let fileIndex = -1
    let subFileIndex = -1
    runtimeData.chatInfo.info.group_files.file_list.forEach((item: any, index: number) => {
        if (item.id === id) {
            fileName = Util.htmlDecodeByRegExp(item.name)
            fileIndex = index
        }
    })
    // 特殊情况：这是个子文件
    if (info[2] !== undefined) {
        runtimeData.chatInfo.info.group_files.file_list[fileIndex].sub_list.forEach((item: any, index:number) => {
            if (item.id === info[2]) {
                fileName = Util.htmlDecodeByRegExp(item.name)
                subFileIndex = index
            }
        })
    }
    // 下载事件
    const onProcess = function (event: ProgressEvent): undefined {
        if (!event.lengthComputable) return
        const downloadingPercentage = Math.floor(event.loaded / event.total * 100)
        if (fileIndex !== -1) {
            if (subFileIndex === -1) {
                if (runtimeData.chatInfo.info.group_files.file_list[fileIndex].downloadingPercentage === undefined) {
                    runtimeData.chatInfo.info.group_files.file_list[fileIndex].downloadingPercentage = 0
                }
                runtimeData.chatInfo.info.group_files.file_list[fileIndex].downloadingPercentage = downloadingPercentage
            } else {
                if (runtimeData.chatInfo.info.group_files.file_list[fileIndex].sub_list[subFileIndex].downloadingPercentage === undefined) {
                    runtimeData.chatInfo.info.group_files.file_list[fileIndex].sub_list[subFileIndex].downloadingPercentage= 0
                }
                runtimeData.chatInfo.info.group_files.file_list[fileIndex].sub_list[subFileIndex].downloadingPercentage = downloadingPercentage
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
    }).then(function () {
        console.log('finished')
    }).catch(function (error) {
        if (error) {
            console.log(error)
        }
    })
}

function saveDirFile(msg: any) {
    // TODO: 这边不分页直接拿全，还没写
    const id = msg.echo.split('_')[1]
    let fileIndex = -1
    runtimeData.chatInfo.info.group_files.file_list.forEach((item: any, index: number) => {
        if (item.id === id) {
            fileIndex = index
        }
    })
    runtimeData.chatInfo.info.group_files.file_list[fileIndex].sub_list = msg.data.data.file_list
}

function saveFileList(data: any) {
    if (data.ec !== 0) {
        popInfo.add(
            PopType.ERR,
            app.config.globalProperties.$t('pop_chat_chat_info_load_file_err', { code: data.ec })
        )
    } else {
        runtimeData.chatInfo.info.group_files = data
    }
}

function saveMoreFileList(data: any) {
    if (runtimeData.chatInfo.info !== undefined && runtimeData.chatInfo.info.group_files !== undefined) {
        // 追加文件列表
        runtimeData.chatInfo.info.group_files = runtimeData.chatInfo.info.group_files.concat(data.file_list)
        // 设置最大值位置
        runtimeData.chatInfo.info.group_files.next_index = data.next_index
    }
}

// ==============================================================

export const runtimeData: RunTimeDataElem = reactive({
    tags: {
        firstLoad: false,
        canLoadHistory: true
    },
    pageView: {
        chatView: () => import('@/pages/Chat.vue'),
        msgView: () => import('@/components/MsgBody.vue')
    },
    chatInfo: {
        show: { type: '', id: 0, name: '', avatar: '' },
        info: {
            group_info: {},
            user_info: {},
            me_info: {},
            group_members: [],
            group_files: {},
            group_sub_files: {}
        }
    },
    userList: [],
    onMsgList: [],
    loginInfo: {},
    botInfo: {},
    sysConfig: {},
    messageList: []
})
