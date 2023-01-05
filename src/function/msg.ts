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

import { reactive, nextTick } from 'vue'
import { PopInfo, PopType, Logger } from './base'
import { Connector, login } from './connect'
import { GroupMemberInfoElem, UserFriendElem, UserGroupElem, MsgItemElem, RunTimeDataElem, BotMsgType } from './elements/information'
import { NotificationElem } from './elements/system'

const popInfo = new PopInfo()

export function parse(str: string) {
    const msg = JSON.parse(str)
    if (msg.echo !== undefined) {
        switch (msg.echo) {
            case 'getVersionInfo'       : saveBotInfo(msg.data); break
            case 'getLoginInfo'         : saveLoginInfo(msg.data); break
            case 'getMoreLoginInfo'     : runtimeData.loginInfo.info = msg.data.data.result.buddy.info_list[0]; break
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
            case 'getJin'               : saveJin(msg.data.data); break
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
                        case 'getChatHistoryScroll' : saveChatHistoryScroll(echoList, msg); break
                    }
                }
            }
        }
    } else {
        switch (msg.post_type) {
            // gocqhttp 自动发送的消息回调和其他消息有区分
            case 'message_sent'         : msg.post_type = 'message'
            // eslint-disable-next-line
            case 'message'              : newMsg(msg); break
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
    const barMsg = document.getElementById('bar-msg')
    if(barMsg != null) {
        barMsg.click()
    }
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
    // 好友列表
    Connector.send('get_friend_list', {}, 'getFriendList')
    // 群列表
    Connector.send('get_group_list', {}, 'getGroupList')
}

function saveUser(list: (UserFriendElem & UserGroupElem)[]) {
    runtimeData.userList = runtimeData.userList.concat(list)
    // 刷新置顶列表
    const info = runtimeData.sysConfig.top_info as { [key: string]: number[] } | null
    if (info != null) {
        const topList = info[runtimeData.loginInfo.uin]
        if (topList !== undefined) {
            list.forEach((item) => {
                const id = Number(item.user_id ? item.user_id : item.group_id)
                if (topList.indexOf(id) >= 0) {
                    item.always_top = true
                    runtimeData.onMsgList.push(item)
                }
            })
        }
    }
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
        popInfo.add(PopType.ERR, app.config.globalProperties.$t('pop_chat_load_msg_err', { code: msg.error | msg.retcode }))
        runtimeData.messageList = []
    } else {
        // 对 CQCode 消息进行转换
        if (runtimeData.tags.msgType === BotMsgType.CQCode) {
            for (let i = 0; i < msg.data.length; i++) {
                msg.data[i] = Util.parseCQ(msg.data[i])
            }
        }
        runtimeData.messageList = msg.data
        // setTimeout(() => {
        //   this.$refs.chat.scrollBottom()
        // }, 500)
    }
}

function saveMsg(msg: any) {
    if (msg.error !== undefined) {
        popInfo.add(PopType.ERR, app.config.globalProperties.$t('pop_chat_load_msg_err', { code: msg.error | msg.retcode }))
    } else {
        const items = msg.data
        items.pop() // 去除最后一条重复的消息，获取历史消息会返回当前消息 **以及** 之前的 N-1 条
        if (items.length < 1) {
            runtimeData.tags.canLoadHistory = false
            return
        }
        // 对 CQCode 消息进行转换
        if (runtimeData.tags.msgType === BotMsgType.CQCode) {
            for (let i = 0; i < items.length; i++) {
                items[i] = Util.parseCQ(items[i])
            }
        }
        runtimeData.messageList = items.concat(runtimeData.messageList)
    }
}

function saveChatHistoryScroll(list: string[], msg: any) {
    saveMsg(msg)
    // 尝试跳转消息
    const back = Util.scrollToMsg('chat-' + list[1], true)
    if(!back && Number(list[3]) < Number(list[2])) {
        Connector.send(
            'get_chat_history',
            { 'message_id': msg.data[0].message_id },
            // 目标 seq 、最大跳转次数、当前已跳转次数
            'getChatHistoryScroll_' + list[1] + '_' + list[2] + '_' + (Number(list[3]) + 1)
        )
    }
}

function saveForwardMsg(data: any) {
    // gocqhttp 在 message 里，消息为 content，并且直接进行一个 CQCode 的转
    if(runtimeData.botInfo['go-cqhttp'] === true) {
        data = data.messages
    }

    console.log(data)
    // 格式化不规范消息格式
    for (let i = 0; i < data.length; i++) {
        if(!data[i].sender) {
            data[i].sender = {
                user_id: data[i].user_id,
                nickname: data[i].nickname,
                card: ''
            }
        }
        if(!data[i].message) {
            data[i].message = data[i].content
            data[i] = Util.parseCQ(data[i])
        }
    }
    console.log(data)
    // 处理
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
    const msgIdInfo = Util.parseMsgId(echoList[1]);
    if (Number(echoList[2]) <= 5) {
        // // 防止重试过程中切换聊天
        if(msgIdInfo.gid == runtimeData.chatInfo.show.id || msgIdInfo.uid == runtimeData.chatInfo.show.id) {
            if (echoList[1] !== msg.message_id) {
                // 返回的不是这条消息，重新请求
                popInfo.add(PopType.ERR, 
                    app.config.globalProperties.$t('pop_chat_get_msg_err') + ' ( ' + echoList[2] + ' )')
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
                list.splice((msgIndex + 1), 0, msg)
              } else {
                list.push(msg)
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
        runtimeData.chatInfo.info.group_files.file_list = runtimeData.chatInfo.info.group_files.file_list.concat(data.file_list)
        // 设置最大值位置
        runtimeData.chatInfo.info.group_files.next_index = data.next_index
    }
}

function newMsg(data: any) {
    // TODO: 没有对频道的支持计划
    if(data.message_type == 'guild') {
        return
    }
    // 对 CQCode 消息进行转换
    if (runtimeData.tags.msgType === BotMsgType.CQCode) {
        data = Util.parseCQ(data)
    }
    const id = data.from_id ? data.from_id : data.group_id
    const sender = data.sender.user_id
    // 消息回调检查
    // PS：如果在新消息中获取到了自己的消息，则自动打开“停止消息回调”设置防止发送的消息重复
    if (Option.get('send_reget') !== true && sender === runtimeData.loginInfo.uin) {
        Option.save('send_reget', true)
    }
    // 显示消息
    if (id === runtimeData.chatInfo.show.id) {
        runtimeData.messageList.push(data)
    }
    // 刷新消息列表
    // PS：在消息列表内的永远会刷新，不需要被提及
    const get = runtimeData.onMsgList.filter((item, index) => {
        if(Number(id) === item.user_id || Number(id) === item.group_id) {
            if(data.message_type === 'group') {
                const name = (data.sender.card && data.sender.card !== '') ? data.sender.card : data.sender.nickname
                runtimeData.onMsgList[index].raw_msg = name + ': ' + data.raw_message
            } else {
                runtimeData.onMsgList[index].raw_msg = data.raw_message
            }
            runtimeData.onMsgList[index].time = Number(data.time) * 1000
            return true
        }
        return false
    })
    // (发送者不是群组 || 群组 AT || 群组 AT 全体 || 打开了通知全部消息) 这些情况需要进行新消息处理
    if (data.message_type !== 'group' || data.atme || data.atall || Option.get('notice_all') === true) {
        // (发送者没有被打开 || 窗口被最小化) 这些情况需要进行消息通知
        if (id !== runtimeData.chatInfo.show.id || document.hidden) {
            // 检查通知权限，老旧浏览器不支持这个功能
            if (Notification.permission === 'default') {
                Notification.requestPermission(() => {
                    sendNotice(data)
                })
            } else if (Notification.permission !== 'denied') {
                sendNotice(data)
            }
        }
        // 如果发送者不在消息列表里，将它添加到消息列表里
        if (get.length !== 1) {
            const getList = runtimeData.userList.filter((item) => { return item.user_id === id || item.group_id === id })
            if (getList.length === 1) {
                runtimeData.onMsgList.push(getList[0])
            }
        }
        runtimeData.onMsgList.forEach((item) => {
            // 刷新新消息标签
            if (id !== runtimeData.chatInfo.show.id && (id == item.group_id || id == item.user_id)) {
                item.new_msg = true
            }
        })
        // 重新排序列表
        const newList = [] as (UserFriendElem & UserGroupElem)[]
        let topNum = 1
        runtimeData.onMsgList.forEach((item) => {
            // 排序操作
            if (item.always_top === true) {
                newList.unshift(item)
                topNum++
            } else if (item.new_msg === true) {
                newList.splice(topNum - 1, 0, item)
            } else {
                newList.push(item)
            }
        })
        runtimeData.onMsgList = newList
    }
}

function sendNotice(msg: any) {
    if (Option.get('close_notice') !== true) {
        let raw = Util.getMsgRawTxt(msg.message)
        raw = raw === '' ? msg.raw_message : raw
        // 构建通知
        let notificationTile = ''
        const notificationBody = {} as NotificationElem
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
        // 如果消息有图片，追加第一张图片
        msg.message.forEach((item: MsgItemElem) => {
            if (item.type === 'image' && notificationBody.image === undefined) {
                notificationBody.image = item.url
            }
        })
        // 发起通知
        const notification = new Notification(notificationTile, notificationBody)
        notificationList[msg.message_id] = notification
        notification.onclick = (event: Event) => {
            const info = event.target as NotificationOptions
            if(info.tag !== undefined) {
                const userId = info.tag.split('/')[0]
                const msgId = Number(info.tag.substring(userId.length + 1, info.tag.length))
                if (notificationList[msgId] !== undefined) {
                    delete notificationList[msgId]
                }

                // 跳转到这条消息的发送者页面
                window.focus()
                const body = document.getElementById('user-' + userId)
                if (body === null) {
                    // 从缓存列表里寻找这个 ID
                    for (let i = 0; i < runtimeData.userList.length; i++) {
                        const item = runtimeData.userList[i]
                        const id = item.user_id !== undefined ? item.user_id : item.group_id
                        if (String(id) === userId) {
                            // 把它插入到显示列表的第一个
                            runtimeData.showList?.unshift(item)
                            nextTick(() => {
                                const bodyNext = document.getElementById('user-' + userId)
                                if(bodyNext !== null) {
                                    // 添加一个消息跳转标记
                                    bodyNext.dataset.jump = msgId.toString()
                                    // 然后点一下它触发聊天框切换
                                    bodyNext.click()
                                }
                            })
                            break
                        }
                    }
                } else {
                    body.click()
                }

            }
        }
        notification.onclose = (event: Event) => {
            const info = event.target as NotificationOptions
            if(info.tag !== undefined) {
                const msgId = Number(info.tag.split('/')[1])
                if (notificationList[msgId] !== undefined) {
                    delete notificationList[msgId]
                }
            }
        }
    }
}

/**
 * 保存精华消息
 * @param data 返回数据
 */
function saveJin (data: any) {
    if(runtimeData.chatInfo.info.jin_info.data.msg_list.length == 0) {
        // 首次获取
        runtimeData.chatInfo.info.jin_info = data
    } else {
        // 追加保存
        if(data.retcode == 0) {
            runtimeData.chatInfo.info.jin_info.data.msg_list = 
                runtimeData.chatInfo.info.jin_info.data.msg_list.concat(data.data.msg_list)
                runtimeData.chatInfo.info.jin_info.data.is_end = data.data.is_end
        }
    }
}

// ==============================================================

const notificationList: Notification[] = []

const baseRuntime = JSON.stringify({
    tags: {
        firstLoad: false,
        canLoadHistory: true,
        openSideBar: false,
        viewer: { index: 0 }
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
            group_sub_files: {},
            jin_info: { data: { msg_list: [] } }
        }
    },
    userList: [],
    onMsgList: [],
    loginInfo: {},
    botInfo: {},
    sysConfig: {},
    messageList: [],
    popBoxList: []
})

export const runtimeData: RunTimeDataElem = reactive(JSON.parse(baseRuntime))