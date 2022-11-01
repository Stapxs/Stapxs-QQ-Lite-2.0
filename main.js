'use strict';

window.version = 'v1.2957'
window.loading = true
document.getElementById("opt-version").innerText = window.version
waveAnimation(document.getElementById("login-wave"))
// 自动暗黑模式标志
window.is_auto_dark = true
// 检查 Cookie 可用性
if(!window.navigator.cookieEnabled) {
    document.getElementById("cookie-tip").style.display = "block"
}
// 加载 cookie
let x = document.cookie
window.optCookie = {}
window.cookie = {}
if(x != "") {
    x = x.split(";")
    for(let i=0; i<x.length; i++) {
        window.cookie[x[i].split("=")[0].trim()] = x[i].split("=")[1].trim()
    }
    // 解析设置
    if(window.cookie["option"] != undefined) {
        const optStr = window.cookie["option"].split("&")
        console.log(optStr)
        for(let i=0; i<optStr.length; i++) {
            window.optCookie[optStr[i].split(":")[0]] = optStr[i].split(":")[1]
        }
    }
    // 载入设置
    showLog("b573f7", "fff", "UI", "正在载入设置 ……")
    for(let i=0; i<Object.keys(window.optCookie).length; i++) {
        let body = document.getElementById(Object.keys(window.optCookie)[i])
        if(body == undefined) {
            body = document.getElementById(Object.keys(window.optCookie)[i] + "_" + window.optCookie[Object.keys(window.optCookie)[i]])
        }
        if(body != undefined) {
            switch(body.nodeName) {
                case "INPUT": {
                    if(body.type == "checkbox") {
                        if(window.optCookie[Object.keys(window.optCookie)[i]] == "true" && body.checked == false ||
                            window.optCookie[Object.keys(window.optCookie)[i]] == "false" && body.checked == true) {
                            body.click()
                        }
                    } else if(body.type == "radio") {
                        body.click()
                    } else {
                        body.value = window.optCookie[Object.keys(window.optCookie)[i]]
                    }
                    break
                }
                case "SELECT": {
                    body.value = window.optCookie[Object.keys(window.optCookie)[i]]
                    break
                }
            }
        }
    }
    // 填充输入框
    if(window.cookie["address"] != undefined) {
        document.getElementById("sev_address").value = window.cookie["address"]
    }
    if(window.cookie["token"] != undefined) {
        document.getElementById("access_token").value = window.cookie["token"]
    }
    // 自动连接
    if(window.optCookie["opt_auto_connect"] == "true") {
        document.getElementById("connect_btn").click()
    }
    // 检查缓存版本
    if(window.cookie["version"] == undefined || Number(window.cookie["version"].substring(1)) < Number(window.version.substring(1))) {
        // 刷新 Cookie
        var date = new Date()
        date.setDate(date.getDate() + 30)
        const cookie = "version=" + window.version + "; expires=" + date.toUTCString()
        document.cookie = cookie
        // 尝试拉取 GitHub 上的最新日志
        fetch('https://api.github.com/repos/stapxs/qq-web-lite/commits')
            .then(response => response.json())
            .then(data => {
                if(data.length > 0) {
                    showUpdatePan(true)
                    for(let i=0; i<data.length; i++) {
                        if(data[i]["commit"]["message"].indexOf(":") > 0 && data[i]["commit"]["author"]["email"] == "1007028430.stapx@gmail.com") {
                            const msgList = data[i]["commit"]["message"].split("\n")
                            let msgStr = ""
                            for(let i=0; i<msgList.length; i++) {
                                if(i == 0) {
                                    msgStr += "<p style='text-align: center;font-size: 1rem;    margin-bottom: -1rem;margin-top: -0.5rem;font-weight: bold;'>" + msgList[i] + "</p><br>"
                                    continue
                                }
                                if(msgList[i].substring(0, 1) == ":") {
                                    const emoji = msgList[i].substring(0, msgList[i].substring(1).indexOf(":") + 2)
                                    msgStr += (gitmojiToEmoji(emoji) == undefined ? "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;" : gitmojiToEmoji(emoji)) + msgList[i].substring(msgList[i].substring(1).indexOf(":") + 2) + "<br>"
                                } else {
                                    msgStr += msgList[i] + "<br>"
                                }
                            }
                            document.getElementById("update-info").innerHTML = msgStr
                            break
                        }
                    }
                }
            })
            .catch(function (e) {
                console.log(e)
            })
    }
    window.loading = false
}
// 看看日期
const datey = new Date()
if(datey.getMonth === 5 && datey.getDate() === 1) {
    document.getElementById("opt_debug_fk").click()
}
// 覆写粘贴事件，提供粘贴图片的功能
const pasteEvent = function(e) {
    // 判断粘贴类型
    if (!(e.clipboardData && e.clipboardData.items)) {
        return
    }
    for (let i = 0, len = e.clipboardData.items.length; i < len; i++) {
        let item = e.clipboardData.items[i]
        if (item.kind === "file") {
            let blob = item.getAsFile()
            if (blob.type.indexOf("image/") >= 0 && blob.size != 0) {
                setStatue("load", "正在处理图片 ……")
                if (blob.size < 3145728) {
                    // 转换为 Base64
                    var reader = new FileReader();
                    reader.readAsDataURL(blob);
                    reader.onloadend = function () {
                        var base64data = reader.result
                        // 记录图片信息
                        if (window.cacheImg == undefined) {
                            window.cacheImg = []
                        }
                        if(window.cacheImg.length < 4) {
                            window.cacheImg.push(base64data)
                        } else {
                            setStatue("err", "最多发送四张图片 ……", true)
                        }
                        // 完成
                        setStatue("ok", "图片处理完成！")
                        // 显示弹窗
                        showAddImgPan(true)
                    }
                    // 图片过大
                } else setStatue("err", "图片过大！")
            }
            // 阻止默认行为
            e.preventDefault();
        }
    }
}
document.getElementById("send-box").addEventListener("paste", pasteEvent)
document.getElementById("send-img-text").addEventListener("paste", pasteEvent)
// 复制消息
let clipboard = new ClipboardJS(document.getElementById("menuCopy"), {
    text: function() {
        return (window.msgInMenu != undefined && window.msgInMenu != null)? window.msgInMenu.dataset.raw: ""
    }
});
clipboard.on('success', function(e) {
    showMsgMenu()
});
clipboard.on('error', function(e) {
    console.error('Action:', e.action);
    console.error('Trigger:', e.trigger);
    setStatue("err", "复制消息失败！")
});
// 加载仓库贡献者信息
fetch('https://api.github.com/repos/stapxs/stapxs-qq-lite/contributors')
    .then(response => response.json())
    .then(data => {
        for(let i=0; i<data.length; i++) {
            const img = document.createElement("div")
            img.style.backgroundImage = "url('" + data[i]["avatar_url"] + "')"
            img.title = data[i]["login"]
            if(data[i]["login"] == "Stapxs") {
                img.style.outline = "2px solid var(--color-main)"
                img.style.border = "1px solid var(--color-card-1)"
            }
            img.onclick = function () {
                window.open(data[i]["html_url"]);
            }
            document.getElementById("contributors-list").append(img)
        }
    })
    .catch(console.error)