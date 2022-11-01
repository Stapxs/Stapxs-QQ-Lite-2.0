/*
    ws.js - WS 主方法
    2022/04/05 - Stapx Steve [林槐]
*/

window.ws = null

function runWs(protocol) {
    setStatue("load", "正在尝试连接到服务 ……")
    const address = document.getElementById("sev_address").value
    window.token = document.getElementById("access_token").value

    if (protocol == undefined) {
        protocol = "ws://"
    }
    showLog("4a93c3", "fff", "WS", "尝试使用 " + protocol + " 连接 ……")
    window.ws = new WebSocket(protocol + address + "?access_token=" + token)

    window.ws.onopen = function (evt) {
        setStatue("ok", "成功连接 ……")
        showLog("7abb7e", "fff", "WS", "成功连接 ……")
        window.connect = true
        // 保存输入框
        var date = new Date()
        date.setDate(date.getDate() + 30)
        const cookie = "address=" + address + "; expires=" + date.toUTCString()
        document.cookie = cookie
        if(window.optCookie["opt_save_password"] == "true") {
            document.cookie = "token=" + token + "; expires=" + date.toUTCString()
        }
        // 清空消息历史
        document.getElementById("msg-body").innerHTML = ""
        // 开始加载数据
        loadInfo()
        // 初次连接 tag
        window.isFistUse = false
    }

    window.ws.onmessage = function (evt) {
        showLog("4a93c3", "fff", "GET", evt.data)
        runJSON(evt.data)
    }

    window.ws.onclose = function (evt) {
        showLog("ff5370", "fff", "WS", "连接关闭：" + evt.code)
        setStatue("err", "连接关闭：" + evt.code, true)
        window.connect = false
        // 显示底栏
        document.getElementById("footer").style.display = "block"
        document.getElementById("main-view").style.height = "calc(100vh - 110px)"
        document.getElementById("forward-msg").style.height = "calc(100vh - 150px)"
        // 扩展视图
        document.getElementById("main-body").className = "container-lg main-body"
        document.getElementById("main-view").style.padding = "20px 0"
        setTimeout(() => {
            document.getElementById("footer").style.transform = "translate(0)"
        }, 100)
        // 隐藏账号设置
        document.getElementById("opt-account-main").style.display = "none"
        document.getElementById("opt-account-tip").style.display = "block"
        // 如果是由于协议连接失败 ……
        if(window.isFistUse == undefined || window.isFistUse == true || window.tryAll == undefined) {
            window.tryAll = true
            if(protocol == "ws://") {
                runWs("wss://")
            } else {
                runWs("ws://")
            }
        }
    }
}

// 将消息发送为浏览器通知
function showNotice(msg) {
    if(window.optCookie["opt_no_notice"] == undefined || window.optCookie["opt_no_notice"] == "false") {
        try {
            // 初始化记录数组
            if(window.notices == undefined) {
                window.notices = {}
            }
            // 检查通知权限，注意 “老旧” 浏览器不支持这个功能
            if(Notification.permission == "default") {
                // 还没有请求过权限
                // 请求权限
                Notification.requestPermission(function (status) {
                    if (Notification.permission !== status) {
                      Notification.permission = status
                    }
                  });
            } else if(Notification.permission == "denied") {
                // 用户拒绝了权限
                return
            } else {     
                // 显示通知，不管之前有没有同意，反正我是发了（大声
                let raw = getMsgRawTxt(msg.message)
                raw = raw==""?msg.raw_message:raw
                if(msg.message_type == "group") {
                    const msgOut = msg.sender.nickname + ":" + raw
                    let notification = new Notification(msg.group_name, {"body": msgOut, "tag": msg.group_id + "/" + msg.message_id, "icon": "https://p.qlogo.cn/gh/" + msg.group_id + "/" + msg.group_id + "/0"})
                    window.notices[msg.message_id] = notification
                    notification.onclick = function() { noticeOnClick(event) }
                    notification.onclose = function() { noticeOnClose(event) }
                } else {
                    let notification = new Notification(msg.sender.nickname, {"body": raw, "tag": msg.user_id + "/" + msg.message_id, "icon": "https://q1.qlogo.cn/g?b=qq&s=0&nk=" + msg.user_id})
                    window.notices[msg.message_id] = notification
                    notification.onclick = function() { noticeOnClick(event) }
                    notification.onclose = function() { noticeOnClose(event) }
                }
            }
        }
        catch(e) {
            console.log(e)
        }
    }
}

// 加载基础数据
function loadInfo() {
    // 加载 Bot 信息
    sendWs(createAPI(
        "get_version_info",
        null, null
    ))
    // 加载用户信息
    sendWs(createAPI(
        "get_login_info",
        null, null
    ))
    if (window.isFistUse == undefined || window.isFistUse == true) {
        sendWs(createAPI(
            "get_csrf_token",
            null, null
        ))
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
}

// ----------------------------------------
// 子功能函数
// ----------------------------------------

function findBodyInList(name, id) {
    const childs =  document.getElementById("friend-list-body").children
    for(let i=0; i<childs.length; i++) {
        if(id != null && childs[i].dataset.id == id || name != null && childs[i].dataset.name == name) {
            return childs[i]
        }
    }
    return null
}

function findMsgInList(id) {
    const childs = document.getElementById("msg-body").children
    for(let i=0; i<childs.length; i++) {
        if(id == childs[i].dataset.id) {
            return childs[i]
        }
    }
    return null
}

// ----------------------------------------
// 功能辅助函数
// ----------------------------------------

// 构造 API 传参 JSON
function createAPI(action, params, echo) {
    // {
    //     "action": "send_private_msg",
    //     "params": {
    //         "user_id": 10001000,
    //         "message": "你好"
    //     },
    //     "echo": "123"
    // }
    let apiObj = {}
    apiObj.action = action
    if(params == null) {
        apiObj.params = {}
    } else {
        apiObj.params = params
    }
    if(echo == null) {
        apiObj.echo = action
    } else {
        apiObj.echo = echo
    }
    return JSON.stringify(apiObj)
}

// 发送消息封装
function sendWs(str) {
    window.ws.send(str)
    showLog("7abb7e", "fff", "PUT", str)
}

function getMsgIdInfo(msg_id, type) {
    var binary_string = window.atob(msg_id)
    var len = binary_string.length
    var bytes = new Uint8Array(len)
    for (var i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i)
    }
    var buffer = bytes.buffer
    var dv = new DataView(buffer, 0)

    const back = []
    if(type === "friend") {
        back.push(dv.getInt32(0))           // 对方QQ(int32)
        back.push(dv.getInt32(4))           // 消息编号(int32)
        back.push(dv.getInt32(8))           // 随机数(int32)
        back.push(dv.getInt32(12))          // 时间戳(int32)
        back.push(dv.getInt8(16))           // 发送flag(int8)
    } else {
        back.push(dv.getInt32(0))           // 群号(int32)
        back.push(dv.getInt32(4))           // 发送者QQ(int32)
        back.push(dv.getInt32(8))           // 消息编号(int32)
        back.push(dv.getInt32(12))          // 随机数(int32)
        back.push(dv.getInt32(16))          // 时间戳(int32)
        back.push(dv.getInt8(20))           // 分片数(int8)
    }
    return back
}

function buildMsgIdInfo(buffer) {
    var binary = ''
    var bytes = new Uint8Array(buffer)
    var len = bytes.byteLength
    for (var i=0; i<len; i++) {
        binary += String.fromCharCode(bytes[i])
    }
    return window.btoa(binary)
}