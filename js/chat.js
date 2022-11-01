/*
    msg.js - 提供 UI 相关方法
    2022/04/05 - Stapx Steve [林槐]
*/

// 样式 LOG
function showLog(bg, fg, head, info) {
    const level = window.optCookie["opt_log_level"]
    if(((level == undefined || level == "err") && bg == "ff5370") || level == "all" || head == "SS") {
        console.log("%c" + head + "%c " + info, "background:#" + bg + ";color:#" + fg + ";border-radius:7px 0 0 7px;display:inline-block;padding:2px 4px 2px 7px;", "")
    }
}

// 设置状态消息
function setStatue(type, msg, stay) {
    const body = document.getElementById("run-statue")
    const div = document.createElement("div")
    div.style.height = "0"
    let html = "{svg}<a>{msg}</a>"
    let icon = ""
    switch (type) {
        case "load": {
            icon = "<svg class='fa-pulse' xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 512 512\"><!--! Font Awesome Pro 6.1.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2022 Fonticons, Inc. --><path d=\"M304 48C304 74.51 282.5 96 256 96C229.5 96 208 74.51 208 48C208 21.49 229.5 0 256 0C282.5 0 304 21.49 304 48zM304 464C304 490.5 282.5 512 256 512C229.5 512 208 490.5 208 464C208 437.5 229.5 416 256 416C282.5 416 304 437.5 304 464zM0 256C0 229.5 21.49 208 48 208C74.51 208 96 229.5 96 256C96 282.5 74.51 304 48 304C21.49 304 0 282.5 0 256zM512 256C512 282.5 490.5 304 464 304C437.5 304 416 282.5 416 256C416 229.5 437.5 208 464 208C490.5 208 512 229.5 512 256zM74.98 437C56.23 418.3 56.23 387.9 74.98 369.1C93.73 350.4 124.1 350.4 142.9 369.1C161.6 387.9 161.6 418.3 142.9 437C124.1 455.8 93.73 455.8 74.98 437V437zM142.9 142.9C124.1 161.6 93.73 161.6 74.98 142.9C56.24 124.1 56.24 93.73 74.98 74.98C93.73 56.23 124.1 56.23 142.9 74.98C161.6 93.73 161.6 124.1 142.9 142.9zM369.1 369.1C387.9 350.4 418.3 350.4 437 369.1C455.8 387.9 455.8 418.3 437 437C418.3 455.8 387.9 455.8 369.1 437C350.4 418.3 350.4 387.9 369.1 369.1V369.1z\"/></svg>\n"
            break
        }
        case "ok": {
            icon = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 448 512\"><!--! Font Awesome Pro 6.1.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2022 Fonticons, Inc. --><path d=\"M438.6 105.4C451.1 117.9 451.1 138.1 438.6 150.6L182.6 406.6C170.1 419.1 149.9 419.1 137.4 406.6L9.372 278.6C-3.124 266.1-3.124 245.9 9.372 233.4C21.87 220.9 42.13 220.9 54.63 233.4L159.1 338.7L393.4 105.4C405.9 92.88 426.1 92.88 438.6 105.4H438.6z\"/></svg>"
            break
        }
        case "err": {
            icon = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 320 512\"><!--! Font Awesome Pro 6.1.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2022 Fonticons, Inc. --><path d=\"M310.6 361.4c12.5 12.5 12.5 32.75 0 45.25C304.4 412.9 296.2 416 288 416s-16.38-3.125-22.62-9.375L160 301.3L54.63 406.6C48.38 412.9 40.19 416 32 416S15.63 412.9 9.375 406.6c-12.5-12.5-12.5-32.75 0-45.25l105.4-105.4L9.375 150.6c-12.5-12.5-12.5-32.75 0-45.25s32.75-12.5 45.25 0L160 210.8l105.4-105.4c12.5-12.5 32.75-12.5 45.25 0s12.5 32.75 0 45.25l-105.4 105.4L310.6 361.4z\"/></svg>"
            break
        }
    }
    html = html.replace("{svg}", icon)
    html = html.replace("{msg}", msg)
    div.innerHTML = html
    body.append(div)
    setTimeout(() => {
        div.style.height = "35px"
    }, 100)
    if (stay == true) {
        div.style.cursor = "pointer"
        div.onclick = function() { 
            div.style.height = "0"
            div.style.opacity = "0"
            div.style.margin = "0"
            setTimeout(() => {
                body.removeChild(div)
            }, 350)
         }
    } else {
        setTimeout(() => {
            div.style.height = "0"
            div.style.opacity = "0"
            div.style.margin = "0"
            setTimeout(() => {
                body.removeChild(div)
            }, 350)
        }, 1500)
    }
}

// 显示新消息提醒
function noticeMsg() {
    document.getElementById("msg-view").style.border = "2px solid var(--color-main)"
    setTimeout(() => {
        document.getElementById("msg-view").style.border = "2px solid transparent"
    }, 500)
}

function showLoginPan(what) {
    if(window.connect !== true) {
        if (what === true) {
            document.getElementById("login-pan").style.display = "block"
            setTimeout(() => {
                document.getElementById("login-pan").style.opacity = "1"
            }, 100)
        } else {
            document.getElementById("login-pan").style.opacity = "0"
            setTimeout(() => {
                document.getElementById("login-pan").style.display = "none"
            }, 300)
        }
    } else {
        // 断开连接
        window.ws.close(1000, "主动断开")
    }
}

function showUpdatePan(what) {
    if(window.connect !== true) {
        if (what === true) {
            document.getElementById("update-info-pan").style.display = "block"
            setTimeout(() => {
                document.getElementById("update-info-pan").style.opacity = "1"
            }, 100)
        } else {
            document.getElementById("update-info-pan").style.opacity = "0"
            setTimeout(() => {
                document.getElementById("update-info-pan").style.display = "none"
            }, 300)
        }
    } else {
        // 断开连接
        window.ws.close(1000, "主动断开")
    }
}

function openImgView(url) {
    if(url === undefined || url === null) {
        document.getElementById("img-view").style.opacity = "0"
        setTimeout(() => {
            document.getElementById("img-view").style.display = "none"
        }, 300)
    } else {
        // 赋值图片
        document.getElementById("img-view").getElementsByTagName("img")[0].src = url
        document.getElementById("img-view").style.display = "block"
            setTimeout(() => {
                document.getElementById("img-view").style.opacity = "1"
            }, 100)
    }
    // 尝试加载前后文
    let control = document.getElementById("img-control")
    control.children[0].style.display = "unset"
    control.children[2].style.display = "unset"
    // 寻找 url 在列表里的位置
    let index = -1
    for (let i = 0; i < window.imgList.length; i++) {
        if (window.imgList[i].url === url) {
            index = i
            break
        }
    }
    control.children[0].dataset.id = index - 1
    control.children[2].dataset.id = index + 1
    if(index == 0) {
        control.children[0].style.display = "none"
    }
    if(index == window.imgList.length - 1) {
        control.children[2].style.display = "none"
    }
    if(index == -1) {
        control.children[0].style.display = "none"
        control.children[2].style.display = "none"
    }
}

function changeImg(sender) {
    let id = sender.dataset.id
    if(id != undefined && id >= 0 && id < window.imgList.length) {
        openImgView(window.imgList[id].url)
    }
}

function runConnect() {
    showLoginPan(false)
    // 啊吧啊吧
    document.getElementById("referrer").content = "no-referrer"
    // 隐藏底栏
    document.getElementById("footer").style.transform = "translate(0, 100px)"
    document.getElementById("main-view").style.height  = "100vh"
    document.getElementById("forward-msg").style.height  = "calc(100vh - 44px)"
    // 扩展视图
    document.getElementById("main-body").className = "main-body"
    document.getElementById("main-view").style.padding = "0"
    setTimeout(() => {
        document.getElementById("footer").style.display = "none"
    }, 450)
    setTimeout(() => {
        // 开始链接
        runWs();
    }, 500)
}

function btnChangeColor() {
    const botton = document.getElementById("opt_dark")
    if(botton.dataset.color == "dark") {
        botton.dataset.color = "light"
        changeColor("light")
    } else {
        botton.dataset.color = "dark"
        changeColor("dark")
    }
}

function onListClick(sender) {
    setStatue("load", "正在加载历史消息 ……")
    const type = sender.dataset.type
    // 清除和显示高亮
    const lastBody = findBodyInList(null, document.getElementById("msg-hander").dataset.id)
    if(lastBody != null) {
        lastBody.classList.remove("active")
    }
    sender.classList.add("active")
    // 清空搜索
    document.getElementById("seach-input").value = ""
    cancelSearch()
    // 去除未读标记
    if(sender.dataset.alwayTop != "true") {
        sender.children[0].style.transform = "scaleY(0)"
    }
    // 去除禁言状态
    document.getElementById("send-box").disabled = false
    document.getElementById("send-box").placeholder = ""
    // 清空群员列表
    window.nowGroupMumber = null
    // 显示顶栏
    document.getElementById("msg-hander").getElementsByTagName("a")[0].innerText = sender.dataset.name
    document.getElementById("msg-hander").dataset.id = sender.dataset.id
    document.getElementById("msg-hander").dataset.type = sender.dataset.type
    document.getElementById("msg-hander").style.display = "flex"
    // 切换位置
    changeView(true)
    // 清空聊天记录框
    document.getElementById("msg-body").innerHTML = ""
    // 加载历史消息
    // Note: https://github.com/takayama-lily/oicq/wiki/93.%E8%A7%A3%E6%9E%90%E6%B6%88%E6%81%AFID
    var msgid = null
    switch(type) {
        case "friend": {
            // friend msg id 为 4*4+1 = 17 bit
            var buffer = new ArrayBuffer(17)
            var dv = new DataView(buffer, 0)
            dv.setInt32(0, sender.dataset.id)
            dv.setInt32(4, 0)
            dv.setInt32(8, 0)
            dv.setInt32(12, 0)
            dv.setInt8(16, 0)
            msgid = buildMsgIdInfo(buffer)
            break
        }
        case "group": {
            // group msg id 为 4*5+1 = 21 bit
            var buffer = new ArrayBuffer(21)
            var dv = new DataView(buffer, 0)
            dv.setInt32(0, sender.dataset.id)
            dv.setInt32(4, 0)
            dv.setInt32(8, 0)
            dv.setInt32(12, 0)
            dv.setInt32(16, 0)
            dv.setInt8(20, 0)
            msgid = buildMsgIdInfo(buffer)
            break
        }
    }
    if(msgid != null) {
        // 发送请求
        sendWs(
            createAPI(
                "get_chat_history",
                {"message_id":msgid},
                "get_chat_history_fist"
            )
        )
    } else {
        return false
    }
    // 执行转发
    if(document.getElementById("resend-tips").dataset.onresend == "true") {
        // 关闭提示控件
        document.getElementById("resend-tips").style.height = "0"
        document.getElementById("resend-tips").dataset.onresend = "false"
        // 执行转发
        if(window.resendList != undefined && window.resendList.length > 0) {
            if(window.resendList.length == 1) {
                // 单条转发
                // 直接发送消息
                // 构建 JSON
                const doms = window.resendList[0].children
                const readyMsg = doms[doms.length - 1].innerText
                switch(sender.dataset.type) {
                    case "group": json = createAPI("send_msg", {"group_id": sender.dataset.id, "message": readyMsg}, null); break
                    case "friend": json = createAPI("send_msg", {"user_id": sender.dataset.id, "message": readyMsg}, null); break
                }
                if(json != null) {
                    sendWs(json)
                }
            }
        }
        // 清空转发列队
        window.resendList = []
    }
}

function scrollToMsg(obj) {
    let wrapper = document.getElementById("msg-body")
    wrapper.scrollTo(0 , obj.offsetTop - 89*2);
}

function msgBodyScroll() {
    const msgBody = document.getElementById("msg-body")
    // 获取更多历史消息
    if(msgBody.scrollTop == 0 && msgBody.children.length > 0) {
        setStatue("load", "正在加载历史消息 ……")
        const msgId = document.getElementById("msg-body").children[0].dataset.id
        // 发送请求
        sendWs(
            createAPI(
                "get_chat_history",
                {"message_id":msgId}
            )
        )
    }
}

function sendMsg() {
    let json = null
    try {
        // 发送消息
        let msg = document.getElementById("send-box").value
        const type = document.getElementById("msg-hander").dataset.type
        const id = document.getElementById("msg-hander").dataset.id
        // 构建消息体
        if(window.cacheImg != undefined && window.cacheImg.length > 0) {
            for(let i = 0; i < window.cacheImg.length; i++) {
                // 构建图片 CQ 码
                msg  = "[CQ:image,file=base64://" + window.cacheImg[i].substring(window.cacheImg[i].indexOf("base64") + 7)  + "]" + msg
            }
            // 清除图片缓存
            window.cacheImg = []
        }
        if (document.getElementById("replyer").dataset.id != undefined && document.getElementById("replyer").dataset.id != "") {
            // 构建回复 CQ 码
            msg = "[CQ:reply,id=" + document.getElementById("replyer").dataset.id + "]" + msg
            cancelReply()
        }
        if(msg != "" && msg != undefined && msg != null && type != undefined && id != undefined && window.connect) {
            // 构建 JSON
            switch(type) {
                case "group": json = createAPI("send_msg", {"group_id": id, "message": msg}, null); break
                case "friend": json = createAPI("send_msg", {"user_id": id, "message": msg}, null); break
            }
            if(json != null) {
                // 清空输入框
                document.getElementById("send-box").value = ""
                sendWs(json)
                // PS: 渲染本条消息的功能由消息本请求的返回系统处理
            }
        } else {
            // 发送条件异常
            showLog("ff5370", "fff", "CORE", "发送消息错误：" + msg + " / " + type + " / " + id + " / " + window.connect)
        }
    }
    catch(e) {
        showLog("ff5370", "fff", "CORE", "发送消息错误：" + json)
        console.error(e)
    }
    finally {
        return false
    }
}

function selectImgFile(sender) {
    showMoreBox()
    if(window.cacheImg == undefined) {
        window.cacheImg = []
    }
    if(window.cacheImg.length < 4) {
        const blob = sender.files[0]
        setSendPic(blob)
    } else {
        setStatue("err", "最多发送四张图片 ……", true)
    }
}

function searchInList() {
    // 清空搜索结果
    const body = document.getElementById("friend-search-body")
    while(body.children.length > 0) {
        if(body.children[0].dataset.id != document.getElementById("msg-hander").dataset.id) {
            body.children[0].classList.remove("active")
        }
        document.getElementById("friend-list-body").appendChild(body.children[0])
    }
    const what = document.getElementById("seach-input").value
    if(what != null && what != "") {
        const childs =  document.getElementById("friend-list-body").children
        for(let i=0; i<childs.length; i++) {
            if(childs[i].dataset.id == what || (childs[i].dataset.allname.toLowerCase()).indexOf(what.toLowerCase()) >= 0) {
                document.getElementById("friend-search-body").style.display = "block"
                // 将对象复制到搜索结果框内
                childs[i].classList.add("active")
                document.getElementById("friend-search-body").append(childs[i])
            }
        }
    }
}

function cancelSearch() {
    const what = document.getElementById("seach-input").value
    if(what == null || what == "") {
        // 清空搜索结果
        const body = document.getElementById("friend-search-body")
        while(body.children.length > 0) {
            if(body.children[0].dataset.id != document.getElementById("msg-hander").dataset.id) {
                body.children[0].classList.remove("active")
            }
            document.getElementById("friend-list-body").appendChild(body.children[0])
        }
        // 刷新置顶
        if(window.cookie["top_bodys"] != undefined) {
            const ids = window.cookie["top_bodys"].split("&")
            for(let i=0; i<ids.length; i++) {
                setTop(ids[i])
            }
        }
    }
}

function reloadList() {
    // 取消搜索
    document.getElementById("seach-input").value = ""
    cancelSearch()
    // 清空列表
    document.getElementById("friend-list-body").innerHTML = ""
    // 加载好友列表
    sendWs(createAPI(
        "get_friend_list",
        null, null
    ))
    // 加载群列表
    sendWs(createAPI(
        "get_group_list",
        null, null
    ))
}

function jumpToMsg(id) {
    const msg = findMsgInList(id)
    if(msg != null) {
        scrollToMsg(msg)
    } else {
        setStatue("err", "消息未被显示在窗口内。")
    }
}

function showMsgMenu() {
    if (window.optCookie["opt_clouse_cmenu"] == undefined || window.optCookie["opt_clouse_cmenu"] == "false") {
        return false
    }
    return true
}

function msgMouseDown(sender, e) {
    showLog("b573f7", "fff", "UI", "消息被点击：" + e.which)
    // 单击事件
    if(e.which == 1) {
        // 判断是否多选
        if(document.getElementById("resender").dataset.onchoice == "true") {
            sender.style.background = "#00000008"
            if(window.resendList == undefined) {
                window.resendList = []
            }
            window.resendList.push(sender)
        }
    }
    // 右击事件
    else if(e.which == 3) {
        if (window.optCookie["opt_clouse_cmenu"] == undefined || window.optCookie["opt_clouse_cmenu"] == "false") {
            // 阻止点击传递
            e.stopPropagation()
            // 显示菜单
            showMsgMenu(sender)
        }
    }
}

function msgTouchDown(sender, event) {
    showLog("b573f7", "fff", "UI", "消息触屏点击事件开始 ……")
    window.msgOnTouchDown = true
    window.msgTouchX = event.targetTouches[0].pageX
    window.msgTouchY = event.targetTouches[0].pageY
    // 消息长按事件，计时 500ms 判定长按
    setTimeout(() => {
        showLog("b573f7", "fff", "UI", "消息触屏长按判定：" + window.msgOnTouchDown)
        if(window.msgOnTouchDown === true) {
            showMsgMenu(sender, event.targetTouches[0])
        }
    }, 450)
}

function msgTouchMove(sender, event) {
    if(window.msgTouchX != null && window.msgTouchY != null && window.msgTouchX != undefined && window.msgTouchY != undefined) {
        // 计算移动差值
        const dx = Math.abs(window.msgTouchX - event.targetTouches[0].pageX)
        const dy = Math.abs(window.msgTouchY - event.targetTouches[0].pageY)
        const x = window.msgTouchX - event.targetTouches[0].pageX
        // 如果 dy 大于 10px 则判定为用户在滚动页面，打断长按消息判定
        if(dy > 10 || dx > 5) {
            if(window.msgOnTouchDown == true) {
                showLog("b573f7", "fff", "UI", "用户正在滑动，打断长按判定。")
                window.msgOnTouchDown = false
            }
        }
        if(dy < 50) {
            if(x < -10) {
                // 左滑
                window.msgOnMove = "on"
                if(dx >= sender.offsetWidth / 10) {
                    showLog("b573f7", "fff", "UI", "触发左滑判定 ……")
                    window.msgOnMove = "right"
                    window.msgInMenu = sender
                } else {
                    sender.style.transform = "translate(" + dx + "px)"
                    sender.style.transition = "transform 0s"
                }
            } else if(x > 10) {
                // 右滑
                window.msgOnMove = "on"
                if(dx >= sender.offsetWidth / 10) {
                    showLog("b573f7", "fff", "UI", "触发右滑判定 ……")
                    window.msgOnMove = "left"
                    window.msgInMenu = sender
                } else {
                    sender.style.transform = "translate(-" + dx + "px)"
                    sender.style.transition = "transform 0s"
                }
            } 
        }else {
            window.msgOnMove = null
            sender.style.transform = "translate(0px)"
        }
    }
}

function msgTouchEnd(sender, event) {
    window.msgOnTouchDown = false
    window.msgTouchX = null
    window.msgTouchY = null
    // 判定左右滑动
    if(window.msgOnMove != undefined && window.msgOnMove != null) {
        sender.style.transition = "transform 0.2s"
        Window.msgOnMove = null
        setTimeout(() => {
            sender.style.transform = "translate(0px)"
        }, 10)
        if(window.msgOnMove == "left") {
            menuReply()
            showMsgMenu()
        }
        else if(window.msgOnMove == "right") {
            menuResend()
            showMsgMenu()
        }
    }
}

function showMsgMenu(sender, event) {
    const menu = document.getElementById("right-click-menu")
    const body = document.getElementById("right-click-menu-body")
    if(sender == undefined || sender == null) {
        body.style.transform = "scaleY(0)"
        document.getElementById("right-click-menu-bg").onmousedown = null
        setTimeout(() => {
            menu.style.display = "none"
            // 恢复被隐藏的菜单
            for(let i=0; i<body.children.length; i++) {
                body.children[i].style.display = "flex"
            }
        }, 150)
        window.msgInMenu.style.background = "transparent"
        window.msgInMenu = null
    } else {
        // 登记
        window.msgInMenu = sender
        // 修改消息的背景
        sender.style.background = "#00000008"
        // 判断是不是自己的消息
        if(Number(sender.dataset.sender) != Number(window.login_id)) {
            document.getElementById("menuCancel").style.display = "none"
        }
        // 只显示复制菜单(已经被撤回的消息、合并转发消息、未登录)
        if(sender.style.opacity === "0.4" || sender.parentNode.parentNode.id == "forward-msg-body" || window.connect == false) {
            for(let i=0; i<body.children.length; i++) {
                body.children[i].style.display = "none"
            }
            document.getElementById("menuCopy").style.display = "flex"
        }
        // 获取鼠标位置
        const pointEvent = event || window.event
        // 判定菜单是否出界
        menu.style.display = "block"
        const height = body.offsetHeight
        const webHeight = document.body.offsetHeight
        const width = body.offsetWidth
        const webWidth = document.body.offsetWidth
        // 修改菜单位置
        showLog("b573f7", "fff", "UI", "菜单底部位置：" + (pointEvent.pageY + height) + "，页面高度：" + webHeight)
        if(pointEvent.pageY + height < webHeight) {
            body.style.marginTop = pointEvent.pageY + "px"
        } else {
            body.style.marginTop = pointEvent.pageY - (pointEvent.pageY + height - webHeight) + "px"
            showLog("b573f7", "fff", "UI", "菜单位置：" + body.style.marginTop)
        }
        if(pointEvent.pageX + width < webWidth) {
            body.style.marginLeft = pointEvent.pageX + "px"
        } else {
            body.style.marginLeft = pointEvent.pageX - (pointEvent.pageX + width - webWidth) + "px"
            showLog("b573f7", "fff", "UI", "菜单位置：" + body.style.marginLeft)
        }
        // 显示菜单
        setTimeout(() => {
            body.style.transform = "scaleY(1)"
            setTimeout(() => {
                document.getElementById("right-click-menu-bg").onmousedown = function() { showMsgMenu() }
            }, 100)
        }, 50)
    }
}

function menuReply() {
    cancelResend()
    if(window.msgInMenu != undefined && window.msgInMenu != null) {
        // 设置回复标志
        document.getElementById("replyer-txt").innerText = window.msgInMenu.dataset.raw
        document.getElementById("replyer").dataset.id = window.msgInMenu.dataset.id
        document.getElementById("replyer").dataset.sender = window.msgInMenu.dataset.sender
        // 显示
        document.getElementById("replyer").style.height = "45px"
        document.getElementById("replyer").style.marginBottom = "10px"
        // 关闭菜单
        showMsgMenu()
        // 将光标聚焦到输入框
        document.getElementById("send-box").focus()
    }
}

function cancelReply() {
    document.getElementById("replyer-txt").innerText = ""
    document.getElementById("replyer").dataset.id = ""
    document.getElementById("replyer").style.height = "0"
    document.getElementById("replyer").style.marginBottom = "0"
}

function menuResend() {
    cancelReply()
    if(window.msgInMenu != undefined && window.msgInMenu != null) {
        // 显示提示控件
        document.getElementById("resend-tips").style.height = "45px"
        document.getElementById("resend-tips").dataset.onresend = "true"
        // 切换视图
        changeView(false)
        // 存储转发内容
        if(window.resendList == undefined) {
            window.resendList = []
        }
        window.resendList.push(window.msgInMenu)
        showMsgMenu()
    }
}

function cancelResend() {
    changeView(true)
    document.getElementById("resend-tips").style.height = "0"
    document.getElementById("resend-tips").dataset.onresend = "false"
    window.resendList = []
}

function menuCancel() {
    if(window.msgInMenu != undefined && window.msgInMenu != null) {
        sendWs(createAPI("delete_msg", {"message_id": window.msgInMenu.dataset.id}))
        showMsgMenu()
    }
}

function menuChoice() {
    // 显示控件
    document.getElementById("resender").style.height = "90px"
    document.getElementById("resender").style.marginBottom = "10px"
    document.getElementById("resender").dataset.onchoice = "true"
    // 添加列表
    if(window.resendList == undefined) {
        window.resendList = []
    }
    window.resendList.push(window.msgInMenu)
    // 防止被关闭菜单撤回
    window.msgInMenu = null
    // 关闭菜单
    showMsgMenu()
}

function cancelChoice() {
    // 关闭
    document.getElementById("resender").style.height = "0"
    document.getElementById("resender").style.marginBottom = "0"
    document.getElementById("resender").dataset.onchoice = "false"
    // 清空选中背景
    for(let i=0; i<window.resendList.length; i++) {
        window.resendList[i].style.background = "transparent"
    }
    // 清空列表
    window.resendList = []
}

function choiceMsg() {

}

function noticeOnClick(event) {
    window.focus();
    const openId = event.target.tag.split("/")[0]
    // 打开界面
    const dom = findBodyInList(null, openId)
    if(dom != null) {
        dom.click()
    }
}

function noticeOnClose(event) {
    event.preventDefault()
    const openId = event.target.tag.split("/")[0]
    // 删除消息体缓存
    delete window.notices[openId]
}

function imgLoaded() {
    document.getElementById("msg-body").scrollTop = document.getElementById("msg-body").scrollHeight
}

function changeView(statue) {
    const btn = document.getElementById("change-view-btn")
    if(statue == undefined) {
        if(btn.dataset.icon == "left") {
            btn.dataset.icon = "right"
            btn.children[0].style.transform = "rotate(0deg)"
            document.getElementById("msg-view").className = "msg-view ss-card"
            document.getElementById("msg-view-mask").style.display = "block"
        } else {
            btn.dataset.icon = "left"
            btn.children[0].style.transform = "rotate(180deg)"
            document.getElementById("msg-view").className = "msg-view-right ss-card"
            document.getElementById("msg-view-mask").style.display = "none"
        }
    } else if(statue == true) {
        btn.dataset.icon = "left"
        btn.children[0].style.transform = "rotate(180deg)"
        document.getElementById("msg-view").className = "msg-view-right ss-card"
        document.getElementById("msg-view-mask").style.display = "none"
    } else {
        btn.dataset.icon = "right"
        btn.children[0].style.transform = "rotate(0deg)"
        document.getElementById("msg-view").className = "msg-view ss-card"
        document.getElementById("msg-view-mask").style.display = "block"
    }
}

function showOpt(statue) {
    if(document.location.protocol == "file:") {
        // 显示文件打开方式提醒
        document.getElementById("file-open-tip").style.display = "block"
    }
    if(statue == true) {
        document.getElementById("opt-body").style.display = "block"
        setTimeout(() => {
            document.getElementById("opt-body").style.opacity = "1"
        }, 10)
    } else {
        document.getElementById("opt-body").style.opacity = "0"
        setTimeout(() => {
            document.getElementById("opt-body").style.display = "none"
        }, 300)
    }
}

function moYu() {
    showLog("99b3db", "fff", "SS", "说了不能摸鱼 ……")
    return false
}

function xmlClick(sender) {
    const type = sender.dataset.type
    // 如果存在 url 项，优先打开 url
    if(sender.dataset.url != undefined && sender.dataset.url != "undefined" && sender.dataset.url != "") {
        window.open(sender.dataset.url, "_blank")
        return
    }
    // 接下来按类型处理
    if(type == "forward") {
        // 解析合并转发消息
        sendWs(createAPI("get_forward_msg", {"id": sender.dataset.id}))
    }
}

function closeForwardBody() {
    document.getElementById("forward-msg-body").classList = "forward-msg-body"
    document.getElementById("forward-msg-bg").style.opacity = "0"
    document.getElementById("forward-msg-bg").style.pointerEvents = "none"
}

function runDebugFk() {
    if(window.optCookie["opt_debug_fk"] == "true") {
        const msgView = document.getElementById("main-body")
        const optView = document.getElementById("opt-body")
        msgView.style.transform != "rotate(180deg)" ? msgView.style.transform = "rotate(180deg)" : msgView.style.transform = "rotate(0deg)"
        optView.style.transform != "rotate(180deg)" ? optView.style.transform = "rotate(180deg)" : optView.style.transform = "rotate(0deg)"
        showOpt()
    }
}

function setAutoDark() {
    if(window.optCookie["opt_auto_dark"] == "true") {
        window.is_auto_dark = true
        // 判定暗黑模式
        let media = window.matchMedia('(prefers-color-scheme: dark)')
        if (media.matches) {
            changeColor("dark")
        } else {
            changeColor("light")
        }
    } else {
        window.is_auto_dark = false
        changeColor("light")
    }
}
function changButton() {
    if(window.optCookie["opt_switch_style"] == "true") {
        document.documentElement.style.setProperty('--switch-dot-border-me', "4px")
        document.documentElement.style.setProperty('--switch-dot-margin-me', "-4px")
        document.documentElement.style.setProperty('--switch-height-me', "15px")
        document.documentElement.style.setProperty('--switch-min-width', "40px")
        document.documentElement.style.setProperty('--switch-top', "1rem")
    } else {
        document.documentElement.style.setProperty('--switch-dot-border-me', "4px")
        document.documentElement.style.setProperty('--switch-dot-margin-me', "5px")
        document.documentElement.style.setProperty('--switch-height-me', "30px")
        document.documentElement.style.setProperty('--switch-min-width', "55px")
        document.documentElement.style.setProperty('--switch-top', "0.5rem")
    }
}

function runNoBack(sender) {
    window.nb_times == undefined ? window.nb_times = 1 : window.nb_times++
    if(window.nb_times > 3) {
        sender.parentNode.style.display = "none"
    }
    if(document.getElementById("abab_1").dataset.say == "1") {
        document.getElementById("abab_1").dataset.say = "2"
        document.getElementById("abab_1").innerText = "说了不做这功能就是不做"
    } else {
        document.getElementById("abab_1").dataset.say = "1"
        document.getElementById("abab_1").innerText = "说出去的话就像是泼出去的水 ——"
    }
    setTimeout(() => {
        sender.checked = false
    }, 400)
}

function setMainColor(sender) {
    document.documentElement.style.setProperty('--color-main', "var(--color-main-" + sender.parentNode.dataset.id + ")")
}

function openTopMenu() {
    // 恢复菜单
    for(let i=0; i<document.getElementById("msg-top-menu-body").children.length; i++) {
        document.getElementById("msg-top-menu-body").children[i].style.display = "block"
    }
    // 特殊显示
    const id = document.getElementById("msg-hander").dataset.id
    if(window.cookie["top_bodys"] == undefined || window.cookie["top_bodys"].indexOf(id) < 0) {
        document.getElementById("msg-untop").style.display = "none"
    } else {
        document.getElementById("msg-top").style.display = "none"
    }
    // 处理菜单
    if(document.getElementById("msg-top-menu").style.transform == "scaleY(0)") {
        const menuWidth = document.getElementById("msg-top-menu").offsetWidth
        document.getElementById("msg-top-menu").style.right = (menuWidth / 2 - 50) + "px"
        document.getElementById("msg-top-menu").style.transform = "scaleY(1)"
    } else {
        document.getElementById("msg-top-menu").style.transform = "scaleY(0)"
    }
}

function addTopBody(statue) {
    const id = document.getElementById("msg-hander").dataset.id
    if(statue != false) {
        setTop(id)
        // 保存 cookie
        if(window.cookie["top_bodys"] == undefined || window.cookie["top_bodys"].indexOf(id) < 0) {
            let str = ""
            if(window.cookie["top_bodys"] == undefined) {
                str += id + "&"
            } else {
                str += window.cookie["top_bodys"] + id + "&"
            }
            var date = new Date()
            date.setDate(date.getDate() + 30)
            const cookie = "top_bodys=" + str + "; expires=" + date.toUTCString()
            window.cookie["top_bodys"] = str
            document.cookie = cookie
        }
    } else {
        setTop(id, false)
        // 保存 cookie
        if(window.cookie["top_bodys"].indexOf(id) >= 0) {
            const str = window.cookie["top_bodys"].replace(id + "&", "")
            var date = new Date()
            date.setDate(date.getDate() + 30)
            const cookie = "top_bodys=" + str + "; expires=" + date.toUTCString()
            window.cookie["top_bodys"] = str
            document.cookie = cookie
        }
        // 刷新置顶
        if(window.cookie["top_bodys"] != undefined) {
            const ids = window.cookie["top_bodys"].split("&")
            for(let i=0; i<ids.length; i++) {
                setTop(ids[i])
            }
        }
    }
}

function setTop(id, statue) {
    const list = document.getElementById("friend-list-body")
    const upBody = findBodyInList(null, id)
    if(upBody != null) {
        if(statue != false) {
            // 置顶
            list.insertBefore(upBody, list.firstChild)
            const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg")
            svg.setAttribute("viewBox", "0 0 448 512")
            svg.style.transform = "rotate(45deg)"
            svg.innerHTML = '<path d="M32 32C32 14.33 46.33 0 64 0H320C337.7 0 352 14.33 352 32C352 49.67 337.7 64 320 64H290.5L301.9 212.2C338.6 232.1 367.5 265.4 381.4 306.9L382.4 309.9C385.6 319.6 383.1 330.4 377.1 338.7C371.9 347.1 362.3 352 352 352H32C21.71 352 12.05 347.1 6.04 338.7C.0259 330.4-1.611 319.6 1.642 309.9L2.644 306.9C16.47 265.4 45.42 232.1 82.14 212.2L93.54 64H64C46.33 64 32 49.67 32 32zM224 384V480C224 497.7 209.7 512 192 512C174.3 512 160 497.7 160 480V384H224z"/>'
            upBody.children[2].children[1].children[1].innerHTML = ""
            upBody.children[2].children[1].children[1].append(svg)
            upBody.dataset.alwayTop = "true"
            setTimeout(() => {
                upBody.style.transform = "translate(0, 0)"
            }, 10)
            setTimeout(() => {
                upBody.children[0].style.transform = "scaleY(0.5)"
                upBody.children[0].style.opacity = "0"
                upBody.style.transform = "translate(0, 0)"
            }, 300)
        } else {
            // 取消置顶
            upBody.children[2].children[1].children[1].innerHTML = ""
            upBody.children[0].style.transform = "scaleY(0)"
            upBody.children[0].style.opacity = "1"
            upBody.dataset.alwayTop = "false"
        }
    }
}

function openSenderView(statue, always) {
    const body = document.getElementById("sender-view-box")
    if(statue != false) {
        body.innerHTML = ""
        body.style.height = "auto"
        body.style.marginBottom = "10px"
    } else {
        if(document.activeElement.id != body.id || always == true) {
            body.style.height = "0"
            body.style.marginBottom = "0"
        }
    }
}

function mainInputChange(sender) {
    const value = sender.value
    const lastInput = value.substring(value.length - 1)
    // 匹配群成员列表
    if(lastInput == "@" && document.getElementById("msg-hander").dataset.type == "group") {
        if(window.nowGroupMumber == undefined || window.nowGroupMumber == null) {
            // 尝试获取群友列表
            sendWs(createAPI("get_group_member_list", {"group_id": document.getElementById("msg-hander").dataset.id}, null))
        }
        // 设置标记
        showLog("b573f7", "fff", "UI", "开始匹配群成员列表 ……")
        window.onAtFind = true
        Window.atInfo = ""
        openSenderView()
    }
    // 检索群成员列表
    if(window.onAtFind == true) {
        if(value.lastIndexOf("@") < 0) {
            showLog("b573f7", "fff", "UI", "At 匹配被打断 ……")
            window.onAtFind = false
            Window.atInfo = ""
            openSenderView(false)
            return
        }
        window.atInfo = value.substring(value.lastIndexOf("@") + 1)
        showLog("b573f7", "fff", "UI", "匹配列表：" + window.atInfo)
        if(window.nowGroupMumber != undefined && window.nowGroupMumber != null) {
            if(window.atInfo != "") {
                document.getElementById("sender-view-box").innerHTML = ""
                let num = 0
                for(let i=0; i<window.nowGroupMumber.length; i++) {
                    if((window.nowGroupMumber[i].name.toLowerCase()).indexOf(window.atInfo.toLowerCase()) >= 0 || (window.nowGroupMumber[i].id == window.atInfo)) {
                        const div = document.createElement("div")
                        div.dataset.id = window.nowGroupMumber[i].id
                        div.onclick = function() { addAtStr(sender, window.nowGroupMumber[i].id) }
                        div.className = "at-mb-body"
                        div.innerHTML = "<img src='https://q1.qlogo.cn/g?b=qq&s=0&nk=" + window.nowGroupMumber[i].id + "'><i>" +
                                         window.nowGroupMumber[i].name + "</i><a>" + window.nowGroupMumber[i].id + "</a>"
                        document.getElementById("sender-view-box").appendChild(div)
                        num ++
                    }
                }
                if(num == 0) {
                    const div = document.createElement("div")
                    div.className = "at-mb-body"
                    div.innerHTML = "<i style='display: block;text-align: center;'>没有找到匹配的群成员</i>"
                    document.getElementById("sender-view-box").appendChild(div)
                }
            } else {
                const div = document.createElement("div")
                div.className = "at-mb-body"
                div.innerHTML = "<i style='display: block;text-align: center;'>没有找到匹配的群成员</i>"
                document.getElementById("sender-view-box").appendChild(div)
            }
        } else {
            const div = document.createElement("div")
            div.className = "at-mb-body"
            div.innerHTML = "<i style='display: block;text-align: center;'>正在获取群成员列表</i>"
            document.getElementById("sender-view-box").appendChild(div)
        }
    }
}

function mainInputOut(sender) {
    // 取消 at 匹配
    showLog("b573f7", "fff", "UI", "At 匹配被打断 ……")
    window.onAtFind = false
    Window.atInfo = ""
    setTimeout(() => {
        openSenderView(false)
    }, 100)
}

function mainInputDrop(e, sender) {
    // 拖拽文件
    e.preventDefault();
    const files = e.dataTransfer.files;
    // 获取文件
    if(files.length > 0) {
        const blob = files[0];
        setSendPic(blob)
    }
}

function addAtStr(sender, id) {
    // 去除 at 文本
    sender.value = sender.value.substring(0, sender.value.lastIndexOf("@"))
    // 追加 cq 码
    sender.value += "[CQ:at,qq=" + id + "] "
    // 关闭菜单
    openSenderView(false, true)
    // 将光标聚焦到输入框
    document.getElementById("send-box").focus()
}

function closeQe(sender) {
    const card = document.getElementById("qe")
    card.style.opacity = "0"
    setTimeout(() => {
        card.style.display = "none"
    }, 300)
}

function acceptQe() {
    if(document.getElementById("qe-checkbox").checked) {
        location.reload()
    } else {
        closeQe()
    }
}

// 通知所有消息开关的后续操作
function changeNoticeAll(sender) {
    // 因为这个设置和不冒泡冲突，所以在打开的时候隐藏冒泡的设置
    const value = sender.checked
    const set = document.getElementById("opt_group_no_up").parentNode.parentNode
    if(value == true) {
        set.style.display = "none"
    } else {
        set.style.display = "flex"
    }
}
function changeNoUp(sender) {
    const value = sender.checked
    const set = document.getElementById("opt_notice_all_msg").parentNode.parentNode
    if(value == true) {
        set.style.display = "none"
    } else {
        set.style.display = "flex"
    }
}

function changeOpt(sender) {
    // 获取设置项
    let name = sender.id
    let value = ""
    switch(sender.nodeName) {
        case "INPUT": {
            if(sender.type == "checkbox") {
                value = String(sender.checked)
            } else if(sender.type = "radio") {
                value = sender.parentNode.dataset.id
                name = sender.name
            } else {
                value = sender.value
            }
            break
        }
        case "SELECT": {
            value = sender.value
            break
        }
    }
    // 保存设置
    if(name != undefined && name != "" && value != "") {
        window.optCookie[name] = value
        let outCookie = ""
        // 构建字符串
        for(let i=0; i<Object.keys(window.optCookie).length; i++) {
            outCookie += Object.keys(window.optCookie)[i] + ":" + window.optCookie[Object.keys(window.optCookie)[i]] + "&"
        }
        outCookie = outCookie.substring(0, outCookie.length-1)
        showLog("b573f7", "fff", "UI", outCookie)
        var date = new Date()
        date.setDate(date.getDate() + 30)
        const cookie = "option=" + outCookie + "; expires=" + date.toUTCString()
        document.cookie = cookie
    } else {
        showLog("ff5370", "fff", "ERR", "获取设置内容出错")
    }
}

function setSendPic(blob) {
    if(blob.type.indexOf("image/") >= 0 && blob.size != 0) {
        setStatue("load", "正在处理图片 ……")
        if(blob.size < 3145728) {
            // 转换为 Base64
            var reader = new FileReader();
            reader.readAsDataURL(blob); 
            reader.onloadend = function() {
                var base64data = reader.result
                // 记录图片信息
                if(window.cacheImg == undefined) {
                    window.cacheImg = []
                }
                window.cacheImg.push(base64data)
                // 完成
                setStatue("ok", "图片处理完成！")
                // 显示弹窗
                showAddImgPan(true)
            }
        } else {
            // 图片过大
            setStatue("err", "图片过大！")
        }
    }
}

function waveAnimation(wave) {
    let waves = wave.children[1].children
    let min = 20
    let max = 195
    let add = 1
    let timer = setInterval(() => {
        // 遍历波浪体
        for(var i=0; i<waves.length; i++) {
            let now = waves[i].getAttribute("x")
            if(Number(now) + add > max) {
                waves[i].setAttribute("x", min)
            } else {
                waves[i].setAttribute("x", Number(now) + add)
            }
        }
    }, 50);
    return timer;
}

function downloadFile(url, name) {
    // 如果是 safari，使用更兼容的方式下载
    if(navigator.userAgent.indexOf("Safari") > -1 && navigator.userAgent.indexOf("Chrome") == -1) {
        window.open(url)
        return
    }
    // 使用 a 标签下载文件
    var a = document.createElement("a")
    a.href = url
    a.download = name
    a.click()
}

function changeSavePwd(sender) {
    const value = sender.checked
    if(value == false) {
        changeOpt(sender)
    } else {
        if(!window.loading) {
            if(sender.dataset.accept == "true") {
                sender.checked = true
                document.getElementById("save_pwd_note").style.display = "none"
                changeOpt(sender)
            } else {
                // 显示二次确认提醒
                sender.dataset.accept = "true"
                sender.checked = false
                document.getElementById("save_pwd_note").style.display = "block"
            }
        }
    }
}

function showAddImgPan(what) {
    if (what === true) {
        document.getElementById("add-img-pan").style.display = "block"
        setTimeout(() => {
            document.getElementById("add-img-pan").style.opacity = "1"
        }, 100)
        // 聚焦输入框
        document.getElementById("send-img-text").focus()
        // 复制输入框内本来就有的内容
        document.getElementById("send-img-text").value = document.getElementById("send-box").value
        // 刷新图片显示区
        document.getElementById("img-show-pan").innerText = ""
        for(let i=0; i<window.cacheImg.length; i++) {
            const div = document.createElement("div")
            div.dataset.num = i
            div.className = "img-show-item-" + (window.cacheImg.length + 1)
            div.style.backgroundImage = "url(" + window.cacheImg[i] + ")"
            div.onclick = function() { openImgView(window.cacheImg[i]) }
            document.getElementById("img-show-pan").appendChild(div)
        }
        if(window.cacheImg.length < 4) {
            const div = document.createElement("div")
            div.className = "img-show-item-add img-show-item-" + (window.cacheImg.length + 1)
            div.onclick = function() { div.lastChild.click() }
            const input = document.createElement("input")
            input.id = "choice-pic"
            input.type = "file"
            input.style.display = "none"
            input.onchange = function() { selectImgFile(input) }
            div.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M0 256C0 114.6 114.6 0 256 0C397.4 0 512 114.6 512 256C512 397.4 397.4 512 256 512C114.6 512 0 397.4 0 256zM256 368C269.3 368 280 357.3 280 344V280H344C357.3 280 368 269.3 368 256C368 242.7 357.3 232 344 232H280V168C280 154.7 269.3 144 256 144C242.7 144 232 154.7 232 168V232H168C154.7 232 144 242.7 144 256C144 269.3 154.7 280 168 280H232V344C232 357.3 242.7 368 256 368z"/></svg>'
            div.appendChild(input)
            document.getElementById("img-show-pan").appendChild(div)
        }
    } else {
        document.getElementById("add-img-pan").style.opacity = "0"
        setTimeout(() => {
            document.getElementById("add-img-pan").style.display = "none"
        }, 300)
        // 清除缓存
        window.cacheImg = []
    }
}

function sendImgMsg() {
    document.getElementById("send-box-button").click()
    showAddImgPan(false)
    return false
}

function sendImgTextChange() {
    document.getElementById("send-box").value = document.getElementById("send-img-text").value
}

function showMoreBox() {
    const body = document.getElementById("more-box")
    const sender = document.getElementById("more-box-button")
    if(body.style.height == 0 || body.style.height == "0px") {
        body.style.height = "60px"
        body.style.marginBottom = "10px"
        sender.children[0].style.transform = "rotate(-90deg)"
    } else {
        body.style.height = 0
        body.style.marginBottom = 0
        sender.children[0].style.transform = "rotate(90deg)"
    }
}

function moYuPlus() {
    // 这是个全新升级版本
    moYu()
    showLog("99b3db", "fff", "SS", "摸大鱼")
    return true
}

function showPopPan(id, how) {
    if(how === true) {
        document.getElementById(id).style.display = "block"
        setTimeout(() => {
            document.getElementById(id).style.opacity = "1"
        }, 100)
    } else {
        document.getElementById(id).style.opacity = "0"
        setTimeout(() => {
            document.getElementById(id).style.display = "none"
        }, 300)
    }
}

function showALoadFacePan() {
    showMoreBox()
    showPopPan("add-face-pan", true)
    // 表情信息
    const maxId = 323;
    const passId = [17, 40, 44, 45, 47, 48, 50, 51, 52, 58, 65, 68, 70, 71, 73, 80 ,81, 82, 83, 84, 87, 88,
                    92, 93, 94, 95, 248, 249, 250, 251, 252, 253, 254, 255, 256, 257, 258, 259, 275, 276]
    if(document.getElementById("add-face-pan").dataset.loaded == "false") {
        // 加载表情列表
        for(let i=0; i<=maxId; i++) {
            if(passId.indexOf(i) == -1) {
                const div = document.createElement("div")
                div.onclick = function() { choiceFace(i) }
                div.innerHTML = '<img loading="lazy" src="src/qq-face/' + i + '.gif" alt="">'
                document.getElementById("face-show-pan").appendChild(div)
            }
        }
        // 刷新状态
        document.getElementById("add-face-pan").dataset.loaded = "true"
    }
}

function choiceFace(id) {
    document.getElementById("send-box").value += "[CQ:face,id=" + id + "]"
}

function setUserColor(sender) {
    if(!window.loading) {
        changeOpt(sender)
        document.getElementById("user_color_picker").click()
    } else {
        // 加载主题色
        if(window.optCookie["opt_color_user"] != undefined && window.optCookie["opt_color"] == "-1") {
            const color = window.optCookie["opt_color_user"]
            document.getElementById("user_color_dot").style.background = color
            document.getElementById("user_color_dot").style.backgroundImage = "none"
            // 设置主题色
            document.documentElement.style.setProperty('--color-main', color)
        }
    }
}

function colorPickChange(sender) {
    const button = document.getElementById("opt_color_user")
    button.parentNode.children[1].style.background = sender.value
    // 保存
    const id = button.parentNode.dataset.id
    const name = button.name
    button.parentNode.dataset.id = sender.value
    button.name = button.id
    changeOpt(button)
    button.parentNode.dataset.id = id
    button.name = name
    // 设置主题色
    document.documentElement.style.setProperty('--color-main', sender.value)
}