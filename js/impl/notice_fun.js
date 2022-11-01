/*
    notice_fun.js - 这里是用于处理 WS 发送而来的消息的方法们 > ws.js line 45 runJSON()
    2022/04/08 - Stapx Steve [林槐]
*/


// 分发指令
function runJSON(json) {
    const msg = JSON.parse(json)
    if(msg.echo != undefined) {
        // 触发事件
        switch(msg.echo) {
            case "get_version_info": getBotInfo(msg.data); break                                            // 后端信息
            case "get_friend_list": setFriendList(msg.data); break                                          // 获取好友列表
            case "get_group_list": setGroupList(msg.data); break                                            // 获取群列表
            case "get_login_info": setUserInfo(msg.data); break                                             // 获取用户信息
            case "get_csrf_token": window.utoken = msg.data.token; break                                    // 获取 token
            case "get_cookies": window.ucookies = msg.data.cookies;break                                    // 获取 Cookies
            case "get_chat_history_fist": firstLoadingMsg(msg); break                                       // 首次获取历史消息（20）
            case "get_chat_history": loadingMoreMsg(msg); break                                             // 获取更多历史消息
            case "send_msg": sendMsgBack(msg); break                                                        // 发送消息回调
            case "get_forward_msg": printForwardMsg(msg.data); break                                        // 输出合并转发消息详情
            case "get_group_member_list": saveGroupMemberList(msg.data); break                              // 获取群成员列表
            case "delete_msg": deleteMsgBack(msg); break                                                    // 删除消息回调
            default: {
                // 处理其他特殊的返回
                if(msg.echo.indexOf("get_rep_msg_") >= 0) {
                    // 刷新回复原消息体
                    const raw = getMsgRawTxt(msg.data.message)
                    updateReplyBody(msg.echo, raw==null?msg.raw_message:raw)
                }
                if(msg.echo.indexOf("get_send_msg_") >= 0) {
                    // 打印消息回调
                    if(msg.retcode === 0) {
                        printMsg(msg.data, null)
                        document.getElementById("msg-body").scrollTop = document.getElementById("msg-body").scrollHeight
                    } else {
                        // 再次尝试请求
                        const list = msg.echo.split("_")
                        const msgId = list[list.length - 2]
                        const times = Number(list[list.length - 1]) + 1
                        if(times < 5) {
                            setTimeout(() => {
                                setStatue("load", "重试获取发送的消息(" + times + ") ……")
                                // 请求消息内容
                                sendWs(createAPI(
                                    "get_msg",
                                    {"message_id":msgId},
                                    "get_send_msg_" + msgId + "_" + times
                                ))
                            }, 1000)
                        } else {
                            setStatue("err", "获取发送的消息失败，可能是消息发送失败。")
                        }
                    }
                }
            }
        }
    } else {
        switch(msg.post_type) {
            case "message": updateMsg(msg); break                                                           // 通知消息
            case "notice": runNotice(msg); break                                                            // 服务端通知
        }
    }
}

// ----------------------------------------------------------------------------------

function getBotInfo(msg) {
    const body = document.getElementById("bot-info-body")
    // 清空状态
    document.getElementById("bot-icon").innerHTML = '<svg style="fill: var(--color-font-1);" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512"><path d="M9.375 233.4C3.375 239.4 0 247.5 0 256v128c0 8.5 3.375 16.62 9.375 22.62S23.5 416 32 416h32V224H32C23.5 224 15.38 227.4 9.375 233.4zM464 96H352V32c0-17.62-14.38-32-32-32S288 14.38 288 32v64H176C131.8 96 96 131.8 96 176V448c0 35.38 28.62 64 64 64h320c35.38 0 64-28.62 64-64V176C544 131.8 508.3 96 464 96zM256 416H192v-32h64V416zM224 296C201.9 296 184 278.1 184 256S201.9 216 224 216S264 233.9 264 256S246.1 296 224 296zM352 416H288v-32h64V416zM448 416h-64v-32h64V416zM416 296c-22.12 0-40-17.88-40-40S393.9 216 416 216S456 233.9 456 256S438.1 296 416 296zM630.6 233.4C624.6 227.4 616.5 224 608 224h-32v192h32c8.5 0 16.62-3.375 22.62-9.375S640 392.5 640 384V256C640 247.5 636.6 239.4 630.6 233.4z"/></svg>'
    body.innerHTML = '<span id="bot-info" style="margin-bottom: 5px;"></span><span id = "onebot-info" style = "color: var(--color-font-1);" ></span>'
    document.getElementById("not-allow-info").style.display = "block"
    // 加载
    document.getElementById("backside-info").style.display = "block"
    document.getElementById("bot-info").innerHTML = msg.app_name.toUpperCase() + "<span style='margin-left: 10px;color: var(--color-font-2);'>" + msg.app_version + "</span>"
    document.getElementById("onebot-info").innerText = "OneBot：" + msg.protocol_version
    let span = document.createElement("span")
    span.style.color = "var(--color-font-1)"
    switch(msg.app_name) {
        case "oicq": {
            document.getElementById("not-allow-info").style.display = "none"
            span.innerHTML = "仓库信息：" + "<a target='_blank' class='link' href='" + msg.homepage + "'>查看仓库</a>"
            body.appendChild(span)
            span = document.createElement("span")
            span.style.color = "var(--color-font-1)"
            span.innerText = "作者：" + msg.author
            body.appendChild(span)
            span = document.createElement("span")
            span.style.color = "var(--color-font-1)"
            span.innerText = "程序引擎：nodejs " + msg.engines.node
            body.appendChild(span)
            span = document.createElement("span")
            span.style.color = "var(--color-font-1)"
            span.innerText = "程序入口：" + msg.main
            body.appendChild(span)
            break
        }
        case "go-cqhttp": {
            document.getElementById("bot-icon").innerHTML = "<img src='https://user-images.githubusercontent.com/25968335/120111974-8abef880-c139-11eb-99cd-fa928348b198.png' style='width: calc(70% - 20px);margin-left: 20px;border-radius: 7px;'>"
            document.getElementById("not-allow-info").children[0].innerText = "您使用了 GO-CQHTTP，但是我们并不完全支持它。你将无法加载历史消息同时也无法完美的显示消息，唯一可以正常使用的是发送消息功能。"
            span = document.createElement("span")
            span.style.color = "var(--color-font-1)"
            span.innerText = "程序引擎：" + msg.runtime_version
            body.appendChild(span)
            span = document.createElement("span")
            span.style.color = "var(--color-font-1)"
            span.innerText = "代码版本：" + msg.plugin_version
            body.appendChild(span)
            span.style.color = "var(--color-font-1)"
            span.innerText = "启动目录：" + msg.coolq_directory
            body.appendChild(span)
            break
        }
    }
}

function deleteMsgBack(msg) {
    if(msg.status == "failed") {
        setStatue("err", "撤回消息失败，可能是消息不存在或消息超时。(" + msg.error.code + ":" + msg.error.message + ")")
    }
}

function setFriendList(data) {
    // 遍历列表
    // <div class="friend-body" data-id="1007028430" data-type="friend">
    //     <img src="https://q1.qlogo.cn/g?b=qq&s=0&nk=1007028430">
    //     <div>
    //         <p>林小槐（木）</p>
    //         <a>你是不是闲着无聊</a>
    //     </div>
    // </div>
    for(let i=0; i<data.length; i++) {
        const div = document.createElement("div")
        div.classList.add("friend-body")
        div.dataset.id = data[i].user_id
        div.dataset.name = data[i].nickname
        div.dataset.allname = data[i].remark === data[i].nickname ? data[i].nickname : data[i].remark + "（" + data[i].nickname + "）"
        div.dataset.type = "friend"
        div.onclick = function() { onListClick(div) }
        // 添加内容
        div.innerHTML = "<div></div><img loading='lazy' src='https://q1.qlogo.cn/g?b=qq&s=0&nk=" + data[i].user_id + "'>" +
                        "<div><div><p>" + div.dataset.allname + "</p><div style='flex:1'></div><a class='time'></a></div><div><a></a><div style='margin-left:10px'></div></div></div>"
        // 添加到元素内
        document.getElementById("friend-list-body").appendChild(div)
    }
    // 加载置顶
    if(window.cookie["top_bodys"] != undefined) {
        const ids = window.cookie["top_bodys"].split("&")
        for(let i=0; i<ids.length; i++) {
            setTop(ids[i])
        }
    }
}

function setGroupList(data) {
    for(let i=0; i<data.length; i++) {
        const div = document.createElement("div")
        div.classList.add("friend-body")
        div.dataset.id = data[i].group_id
        div.dataset.name = data[i].group_name
        div.dataset.allname = data[i].group_name
        div.dataset.type = "group"
        div.onclick = function() { onListClick(div) }
        // 添加内容
        div.innerHTML = "<div></div><img loading='lazy' src='https://p.qlogo.cn/gh/" + data[i].group_id + "/" + data[i].group_id + "/0'>" +
                        "<div><div><p>" + data[i].group_name + "</p><div style='flex:1'></div><a class='time'></a></div><div><a></a><div style='margin-left:10px'></div></div></div>"
        // 添加到元素内
        document.getElementById("friend-list-body").appendChild(div)
    }
    // 加载置顶
    if(window.cookie["top_bodys"] != undefined) {
        const ids = window.cookie["top_bodys"].split("&")
        for(let i=0; i<ids.length; i++) {
            setTop(ids[i])
        }
    }
}

function setUserInfo(data) {
    window.login_id = data.user_id
    document.getElementById("main-src").src = "https://q1.qlogo.cn/g?b=qq&s=0&nk=" + data.user_id
    document.getElementById("opt-main-src").src = "https://q1.qlogo.cn/g?b=qq&s=0&nk=" + data.user_id
    document.getElementById("main-name").innerText = data.nickname
    document.getElementById("opt-main-name").innerText = data.nickname
    document.getElementById("opt-account-main").style.display = "block"
    document.getElementById("opt-account-tip").style.display = "none"
}

function firstLoadingMsg(msg) {
    if(msg.retcode === 0) {
        const data = msg.data
        // 遍历消息
        for(let i=0; i<data.length; i++) {
            printMsg(data[i], null)
        }
        document.getElementById("msg-body").scrollTop = document.getElementById("msg-body").scrollHeight
        setStatue("ok", "加载历史消息完成！")
        // 刷新列表框
        const id = data[data.length-1].message_type == "group" ? data[data.length-1].group_id:data[data.length-1].user_id
        const raw = getMsgRawTxt(data[data.length-1].message)
        // 刷新列表显示消息
        var myDate = new Date();
        findBodyInList(null, id).children[2].children[0].children[2].innerText = myDate.getHours().toString().padStart(2, "0") + ":" + myDate.getMinutes().toString().padStart(2, "0")
        findBodyInList(null, id).children[2].children[1].children[0].innerText = raw==""?data[data.length-1].raw_message:raw
    } else {
        // 获取失败
        setStatue("err", "加载历史消息失败，可能是没有历史消息。")
    }
}

function loadingMoreMsg(msg) {
    if(msg.retcode === 0) {
        const where = document.getElementById("msg-body").firstChild
        const data = msg.data
        // 遍历消息
        for(let i=data.length-2; i>0; i--) {
            // 获取插入位置
            printMsg(data[i], document.getElementById("msg-body").firstChild)
        }
        setStatue("ok", "加载历史消息完成！")
        // 滚动到之前位置
        scrollToMsg(where)
    } else {
        // 获取失败
        setStatue("err", "加载历史消息失败，可能是没有历史消息。")
    }
}

// 发送消息回调
function sendMsgBack(msg) {
    if (msg.data != undefined) {
        // 请求消息内容
        sendWs(createAPI(
            "get_msg",
            { "message_id": msg.data.message_id },
            "get_send_msg_" + msg.data.message_id + "_0"
        ))
    } else if (msg.status == "failed") {
        switch (msg.error.code) {
            case 120: {
                // 被禁言
                setStatue("err", "您已被禁言，无法发送消息。")
                document.getElementById("send-box").disabled = true
                document.getElementById("send-box").placeholder = "禁言中 ……"
                break
            }
        }
    }
}

// 刷新消息
function updateMsg(msg) {
    const list = document.getElementById("friend-list-body")
    const id = msg.message_type == "group" ? msg.group_id:msg.user_id
    const raw = getMsgRawTxt(msg.message)
    // 刷新列表显示消息
    var myDate = new Date();
    findBodyInList(null, id).children[2].children[0].children[2].innerText = myDate.getHours().toString().padStart(2, "0") + ":" + myDate.getMinutes().toString().padStart(2, "0")
    findBodyInList(null, id).children[2].children[1].children[0].innerText = raw==""?msg.raw_message:raw
    // 获取当前打开的窗口 ID
    const nowSee = document.getElementById("msg-hander").dataset.id
    // 刷新当前打开的窗口
    if(nowSee == id) {
        // 如果消息本来就在底部就准备下滚
        let scroll = false
        const body = document.getElementById("msg-body")
        if(body.scrollHeight - body.scrollTop === body.clientHeight) {
            scroll = true
        }
        printMsg(msg)
        // 滚动屏幕
        if(scroll == true) {
            body.scrollTop = body.scrollHeight
        }
    }
    // 刷新列表
    if(msg.message_type != "group" || window.optCookie["opt_notice_all_msg"] == "true") {
        findBodyInList(null, id).style.transform = "translate(0, -50%)"
        if(nowSee != id) {
            // 尝试通过浏览器通知用户
            showNotice(msg)
        }
        // 如果当前消息并没有打开，则置顶列表项
        for (let i = 0; i < list.children.length; i++) {
            if (list.children[i].dataset.alwayTop != "true") {
                list.insertBefore(findBodyInList(null, id), list.children[i])
                setTimeout(() => {
                    findBodyInList(null, id).style.transform = "translate(0, 0)"
                }, 10)
                setTimeout(() => {
                    // 如果当前未打开才显示新消息标记
                    if(nowSee != id) {
                        findBodyInList(null, id).children[0].style.transform = "scaleY(0.5)"
                        findBodyInList(null, id).style.transform = "translate(0, 0)"
                    }
                }, 300)
                break
            }
        }
    } else {
        if(window.optCookie["opt_group_no_up"] == undefined || window.optCookie["opt_group_no_up"] == "false") {
            // 如果是群组，置顶到最新的置顶消息下面，不提醒
            findBodyInList(null, id).style.transform = "translate(0, -50%)"
            if (findBodyInList(null, id).dataset.alwayTop == "true") {
                list.insertBefore(findBodyInList(null, id), list.firstChild)
                setTimeout(() => {
                    findBodyInList(null, id).style.transform = "translate(0, 0)"
                }, 10)
            } else {
                // 寻找最新的置顶消息
                for(let i=0; i<list.children.length; i++) {
                    if (list.children[i].children[0].style.transform !== "scaleY(0.5)" && list.children[i].dataset.alwayTop != "true") {
                        list.insertBefore(findBodyInList(null, id), list.children[i])
                        setTimeout(() => {
                            findBodyInList(null, id).style.transform = "translate(0, 0)"
                        }, 10)
                        break
                    }
                }
            }
        }
        //判断 at
        // TODO: at 全体在这边不会触发 atme 标志，但是由于不方便判断，暂时用 indexOf 判断
        if((msg.atme == true || msg.raw_message.indexOf("CQ:at,qq=all,text=@全体成员") > 0) && nowSee != id) {
            showNotice(msg)
        }
    }
    // 抽个签
    const num = randomNum(0, 5000)
    if(num >= 4500 && num <= 5500) {
        showLog("99b3db", "fff", "SS", num)
    }
    if(num === 2500) {
        document.getElementById("qe").style.display = "block"
        setTimeout(() => {
            document.getElementById("qe").style.opacity = "1"
        }, 300)
    }
}

// 处理通知消息
function runNotice(msg) {
    switch(msg.sub_type) {
        // 撤回消息
        case "recall": {
            // 判断目标
            const id = msg.notice_type == "group"?msg.group_id:msg.user_id
            if(Number(id) == Number(document.getElementById("msg-hander").dataset.id)) {
                // 如果是自己的消息则只降低透明的不隐藏
                if(Number(msg.user_id) == Number(window.login_id)) {
                    findMsgInList(msg.message_id).style.opacity = "0.4"
                } else {
                    // 隐藏消息
                    findMsgInList(msg.message_id).style.display = "none"
                }
            }
            // 尝试撤回通知
            if(window.notices != undefined && window.notices[msg.message_id] != undefined) {
                window.notices[msg.message_id].close()
            }
            break
        }
        case "ban": {
            if (msg.group_id == document.getElementById("msg-hander").dataset.id && msg.user_id == window.login_id) {
                if (document.getElementById("send-box").disabled == true) {
                    document.getElementById("send-box").disabled = false
                    document.getElementById("send-box").placeholder = ""
                } else {
                    document.getElementById("send-box").disabled = true
                    document.getElementById("send-box").placeholder = "禁言中 ……"
                }
            }
            break
        }
    }
}

function updateReplyBody(name, raw) {
    const svg = String.raw`<svg style="height: 1rem;display: inline-block;margin-right: 5px;fill: var(--color-font-2);" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--! Font Awesome Pro 6.1.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2022 Fonticons, Inc. --><path d="M8.31 189.9l176-151.1c15.41-13.3 39.69-2.509 39.69 18.16v80.05C384.6 137.9 512 170.1 512 322.3c0 61.44-39.59 122.3-83.34 154.1c-13.66 9.938-33.09-2.531-28.06-18.62c45.34-145-21.5-183.5-176.6-185.8v87.92c0 20.7-24.31 31.45-39.69 18.16l-176-151.1C-2.753 216.6-2.784 199.4 8.31 189.9z"></path></svg>`
    document.getElementById(name).innerHTML = svg + raw
}

function printForwardMsg(msg) {
    document.getElementById("forward-msg-body-inn").innerHTML = ""
    for(let i=0; i<msg.length; i++) {
        printMsg(msg[i], null, document.getElementById("forward-msg-body-inn"))
    }
    document.getElementById("forward-msg-body-inn").scrollTop = "0"
    document.getElementById("forward-msg-body").className = "forward-msg-body forward-msg-body-open"
    document.getElementById("forward-msg-bg").style.opacity = "0.7"
    document.getElementById("forward-msg-bg").style.pointerEvents = "auto"
}

function saveGroupMemberList(data) {
    window.nowGroupMumber = []
    for(let i=0; i<data.length; i++) {
        let dataIn = {}
        dataIn.id = data[i].user_id
        dataIn.name = data[i].card == "" ? data[i].nickname : data[i].nickname + "(" + data[i].card + ")"
        window.nowGroupMumber.push(dataIn)
    }
}
