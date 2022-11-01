/*
    msg_fun.js - 用于显示消息本体
    2022/04/08 - Stapx Steve [林槐]
*/

// 显示消息
function printMsg(obj, addTo, addAt) {
    try {
        const user_id = obj.sender == undefined ? obj.user_id : obj.sender.user_id
        const nickname = obj.sender == undefined ? obj.nickname : obj.sender.nickname
        const card = obj.sender == undefined ? "" : obj.sender.card
        // 消息未被屏蔽
        if(obj.block == undefined || !Boolean(obj.block)) {
            // 创建时间标记
            if(document.getElementById('msg-body').lastChild != null &&
                Number(obj.time) - Number(document.getElementById('msg-body').lastChild.dataset.time) > 300) {
                var unixTimestamp = new Date(Number(obj.time) * 1000)
                const note = document.createElement("div")
                note.classList.add("note-base")
                note.innerHTML = "<a class='note-time'>" + unixTimestamp.toLocaleString() + "</a>"
                document.getElementById("msg-body").appendChild(note)
            }
            // 创建消息外壳
            // <div class="message">
            //     <img src="https://q1.qlogo.cn/g?b=qq&s=0&nk=1007028430">
            //     <div class="message-body">
            //         <a>林小槐</a>
            //         <div></div>
            //     </div>
            //     <div class="message-space"></div>
            // </div>
            const div = document.createElement("div")
            div.classList.add("message")
            const raw = getMsgRawTxt(obj.message)
            div.dataset.raw = raw == ""?obj.raw_message:raw     // 纯文本消息
            div.dataset.id = obj.message_id                     // 消息编号
            div.dataset.sender = user_id                         // 用户 ID
            div.dataset.time = obj.time                         // 消息时间
            let html = String.raw`<img src="https://q1.qlogo.cn/g?b=qq&s=0&nk={id}" style="{hidden}">
        <div class="message-space" style="{space}"></div>
        <div class="message-body">
            <a style="{hidden}">{name}</a>
            <div class="{mine}">{body}</div>
        </div>
        <code style="display: none;">{raw}</code>`
            html = html.replace("{id}", user_id)
            let name = nickname
            if(obj.message_type=="group" && card!=nickname && card!="") {
                name = card
            }
            html = html.replace("{name}", name)
            html = html.replace("{space}", user_id==window.login_id?"":"flex:unset;")
            html = html.replaceAll("{hidden}", user_id==window.login_id?"display:none;":"")
            html = html.replace("{mine}", user_id==window.login_id?"message-mine":"")
            html = html.replace("{raw}", obj.raw_message)
            // 处理消息体
            let body = ""
            if(typeof obj.message == "string") {
                body = printText(obj.message, obj.message_id)
            } else {
            // 遍历消息体
                for(let i=0; i<obj.message.length; i++) {
                    let nowBreak = false
                    switch(obj.message[i].type) {
                        case "reply": { if(obj.message[i+1].type == "at")obj.message[i+1].type = "pass";body = printReplay(obj.message[i].data.id, obj.message_id) + body; break }
                        case "text": body = body + printText(obj.message[i].data.text, obj.message_id); break
                        case "image": body = body + printImg(obj.message[i].data.url, obj.message.length, i, user_id, obj.time); break
                        case "face": body = body + printFace(obj.message[i].data.id, obj.message[i].data.text); break
                        case "bface": body = body + printBface("[ 表情：" + obj.message[i].data.text + " ]"); break
                        case "at": body = body + printAt(obj.message[i].data.text, obj.message[i].data.qq, user_id); break
                        case "xml": body = body + printXML(obj.message[i].data.data, obj.message[i].data.type); break
                        case "json": body = body + printJSON(obj.message[i].data.data, obj.message[i].data.type); break
                        case "record": body = body + printRecord(obj.message[i].data.url); break
                        case "video": body = body + printVideo(obj.message[i].data.url); break
                        case "file": body = body + printFile(obj.message[i].data); break
                        case "pass": break
                        default: {
                            nowBreak = true
                            body = "<a class='msg-unknow'>（不支持的消息：" + obj.message[i].type + "）</a>"
                        }
                    }
                    if(nowBreak) {
                        break
                    }
                }
            }
            html = html.replace("{body}", body)
            div.innerHTML = html
            div.oncontextmenu = function()                  { return showMsgMenu(); }                       // 阻止右击菜单
            div.onmousedown = function()                    { msgMouseDown(div, event); }                   // 右击判定
            div.addEventListener("touchstart", function()   { msgTouchDown(div, event); }, false)           // 触屏判定（开始）
            div.addEventListener("touchend", function()     { msgTouchEnd(div, event); }, false)            // 触屏判定（结束）
            div.addEventListener("touchmove", function()    { msgTouchMove(div, event); }, false)           // 触屏判定（移动）
            // 添加到消息列表内
            if(addAt == undefined) {
                addAt = document.getElementById("msg-body")
            }
            if(addTo == null) {
                addAt.appendChild(div)
                // TODO：显示新消息标志
            } else {
                addAt.insertBefore(div, addTo)
            }
        }
    } catch(e) {
        showLog("ff5370", "fff", "CORE", "显示消息错误：" + JSON.stringify(obj))
        console.error(e)
    }
}

// 获取消息有效文本
function getMsgRawTxt(message) {
    let back = ""
    for(let i=0; i<message.length; i++) {
        switch(message[i].type) {
            case "at":
            case "text": back += message[i].data.text.replaceAll('\n', ' ').replaceAll('\r', ' ');break
            case "face": 
            case "bface": back += "[表情]";break
            case "image": back += "[图片]";break
            case "record": back += "[语音]";break
            case "video": back += "[视频]";break
            case "file": back += "[文件]"; break
            case "json": back += JSON.parse(message[i].data.data).prompt;break
            case "xml": {
                let name = message[i].data.data.substring(message[i].data.data.indexOf("<source name=\"") + 14)
                name = name.substring(0, name.indexOf("\""))
                back += "[" + name + "]"
                break
            }
        }
    }
    return back
}

// --------------------------------------------------------------

function printText(txt, msgid) {
    txt = txt.replaceAll(" ", "&nbsp;")
    txt = txt.replaceAll("<", "&lt;")
    txt = txt.replaceAll(">", "&gt;")
    txt = txt.replaceAll("\n\r", "<br>")
    txt = txt.replaceAll("\n", "<br>")
    txt = txt.replaceAll("\r", "<br>")
    // 判断文本内有没有链接
    let reg = /(http|ftp|https):\/\/[\w\-_]+(\.[\w\-_]+)+([\w\-\.,@?^=%&:/~\+#]*[\w\-\@?^=%&/~\+#])?/gi
    if (reg.test(txt)) {
        showLog("b573f7", "fff", "UI", "正在获取链接预览 ……")
        // 获取第一个匹配的结果
        let url = txt.match(reg)[0]
        // 尝试通过 API 获取链接预览
        fetch('https://api.stapxs.cn/Page-Info?address=' + url)
        .then(res => res.json())
        .then(res => {
            if (res.status == undefined && Object.keys(res).length > 0) {
                showLog("b573f7", "fff", "UI", "获取链接预览成功：" + res['og:title'])
                const div = document.createElement("div")
                div.className = "msg-link-view"
                let hasImg = res['og:image'] == undefined ? "display: none;" : ""
                let site = res['og:site_name'] == undefined ? "" : res['og:site_name']
                let title = res['og:title'] == undefined ? "" : res['og:title']
                let desc = res['og:description'] == undefined ? "" : res['og:description']
                div.innerHTML = '<div></div><img alt="预览图片" title="查看图片" onclick="openImgView(\'' + res['og:image'] + '\');" onerror="this.style.display=\'none\';" src="' + res['og:image'] + '" style="' + hasImg + '">' +
                    '<div><p>' + site + '</p><span href="' + res['og:url'] + '">' + title + '</span><span>' + desc + '</span></div>'
                // 添加到消息内
                document.getElementById("link-" + msgid).parentNode.appendChild(div)
            } else {
                showLog("b573f7", "fff", "UI", "获取链接预览失败：" + res)
            }
        })
        // 将所有链接替换为可点击的链接
        txt = txt.replaceAll(reg, '<a href="$&" target="_blank">$&</a>')
        return "<span id='link-" + msgid + "' style='overflow-wrap: anywhere;'>" + txt + "</span>"
    }
    return "<span style='overflow-wrap: anywhere;'>" + txt + "</span>"
}

function printBface(txt) {
    return printText(txt).replace("style='", "style='font-style: italic;opacity: 0.7;")
}

function printAt(txt, id, sender) {
    txt = txt.replaceAll(" ", "&nbsp;")
    txt = txt.replaceAll("<", "&lt;")
    txt = txt.replaceAll(">", "&gt;")
    if(sender == window.login_id) {
        return "<a class='msg-at' style='color: var(--color-font-r) !important;' data-id='" + id  + "'>" + txt + "</a>"
    } else {
        return "<a class='msg-at' data-id='" + id  + "'>" + txt + "</a>"
    }
}

function printImg(url, num, where, sender, time) {
    // 缓存图片列表
    if(window.imgListId != document.getElementById("msg-hander").dataset.id) {
        // 如果不是当前消息的图片列表，则清空
        window.imgList = []
        window.imgListId = document.getElementById("msg-hander").dataset.id
    }
    if (window.imgList == undefined) {
        // 初始化图片列表
        window.imgList = []
    }
    // 如果时间小于第一个的时间则插入在前面
    if (window.imgList.length == 0 || Number(time) < Number(window.imgList[0].time)) {
        window.imgList.unshift({
            url: url,
            time: time
        })
    } else {
        window.imgList.push({
            url: url,
            time: time
        })
    }
    // 加载图片
    const body = document.getElementById("msg-body")
    let loaded = ""
    if((window.login_id == sender && body.scrollHeight - body.scrollTop === body.clientHeight) || body.scrollHeight - body.scrollTop === body.clientHeight) {
        loaded = "imgLoaded()"
    }
    // 判断是否需要去除消息框边距
     if(num == 1) {
         return "<img title='查看图片' alt='群图片' onload='" + loaded + "' style='max-width: calc(100% + 20px);transform: unset;width: calc(100% + 20px);margin: -10px;border: 1px solid var(--color-main);' onclick='openImgView(\"" + url + "\");' class='msg-img' src='" + url + "'>"
     } else {
        // 判断上下边距的添加
        if(where == 0) {
            return "<img title='查看图片' alt='群图片' onload='" + loaded + "' style='margin-bottom: 5px;' onclick='openImgView(\"" + url + "\");' class='msg-img' src='" + url + "'>"
        } else if(where == (num - 1)) {
            return "<img title='查看图片' alt='群图片' onload='" + loaded + "' style='margin-top: 5px;' onclick='openImgView(\"" + url + "\");' class='msg-img' src='" + url + "'>"
        } else {
            return "<img title='查看图片' alt='群图片' onload='" + loaded + "' style='margin-bottom: 5px;margin-top: 5px;' onclick='openImgView(\"" + url + "\");' class='msg-img' src='" + url + "'>"
        }
    }
}

function printFace(id, name) {
    return "<img alt='" + name + "' class='msg-face' src='src/qq-face/" + id + ".gif' title='" + name + "'>"
}

function printReplay(msgid, rawid) {
    // 尝试在消息队列里寻找这个消息
    const msg = findMsgInList(msgid)
    if(msg != null) {
        const svg = String.raw`<svg style="height: 1rem;display: inline-block;margin-right: 5px;fill: var(--color-font-2);" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--! Font Awesome Pro 6.1.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2022 Fonticons, Inc. --><path d="M8.31 189.9l176-151.1c15.41-13.3 39.69-2.509 39.69 18.16v80.05C384.6 137.9 512 170.1 512 322.3c0 61.44-39.59 122.3-83.34 154.1c-13.66 9.938-33.09-2.531-28.06-18.62c45.34-145-21.5-183.5-176.6-185.8v87.92c0 20.7-24.31 31.45-39.69 18.16l-176-151.1C-2.753 216.6-2.784 199.4 8.31 189.9z"></path></svg>`
        return "<div class='msg-replay' onclick='jumpToMsg(\"" + msgid + "\")'>" + svg + "<span>" + msg.dataset.raw + "</span></div>"
    } else {
        // 如果消息队列里没有这个消息，尝试向服务器获取此条消息
        sendWs(createAPI(
            "get_msg",
            {"message_id":msgid},
            "get_rep_msg_" + rawid
        ))
        return "<div class='msg-replay' id='get_rep_msg_" + rawid + "' onclick='jumpToMsg(\"" + msgid + "\")'><a style='font-style: italic;opacity: 0.7;'>加载回复消息失败 ……</a></div>"
    }
}

function printRecord(url) {
    // TODO：前端无法解析语音文件，待后端参与
    // URL 为文件地址
    return "<div class='msg-record'><i class='fa fa-play-circle' aria-hidden='true'></i><div><a>不支持播放语音消息</a></div></div>"
}

function printVideo(url) {
    return "<div class='msg-video'><video controls><source src='" + url + "' type='video/mp4'></video></div>"
}

function printFile(data) {
    let html = String.raw`<div class="msg-file">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><path d="M0 64C0 28.65 28.65 0 64 0H224V128C224 145.7 238.3 160 256 160H384V448C384 483.3 355.3 512 320 512H64C28.65 512 0 483.3 0 448V64zM256 128V0L384 128H256z"/></svg>
    <div><div><p>${data.name}</p><a>（${formatBytes(data.size)}）</a></div><i>${data.md5}</i></div>
    <div onclick="downloadFile('${data.url}', '${data.name}')"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><path d="M374.6 310.6l-160 160C208.4 476.9 200.2 480 192 480s-16.38-3.125-22.62-9.375l-160-160c-12.5-12.5-12.5-32.75 0-45.25s32.75-12.5 45.25 0L160 370.8V64c0-17.69 14.33-31.1 31.1-31.1S224 46.31 224 64v306.8l105.4-105.4c12.5-12.5 32.75-12.5 45.25 0S387.1 298.1 374.6 310.6z"/></svg></div>
</div>`
    return html
}

function printXML(xml, type) {
    // 尝试渲染 xml 消息
    // <msg> 标签内的为本体
    let item = xml.substring(xml.indexOf("<item"), xml.indexOf("</msg>"))
    // 尝试转换标签为 html
    // item = item.replaceAll("/>", ">")
    item = item.replaceAll("item", "div")                                                       // item
    item = item.replaceAll("<div", "<div class='msg-xml' onclick='xmlClick(this.parentNode)'")
    item = item.replaceAll("title", "p")                                                        // title
    item = item.replaceAll("summary", "a")                                                      // summary
    item = item.replaceAll("<a", "<a class='msg-xml-summary'")
    item = item.replaceAll("<picture", "<img alt='XML 图片' class='msg-xml-img'")               // picture
    // 将不正确的参数改为 dataset
    item = item.replaceAll("size=", "data-size=")
    item = item.replaceAll("linespace=", "data-linespace=")
    item = item.replaceAll("cover=", "src=")
    // 处理出处标签
    item = item.replace("source name=", "source data-name=")
    // 处理错误的 style 位置
    const div = document.createElement("div")
    div.innerHTML = item
    for(let i=0; i<div.children[0].children.length; i++) {
        switch(div.children[0].children[i].nodeName) {
            case "P": {
                div.children[0].children[i].style.fontSize = Number(div.children[0].children[i].dataset.size) / 30 + "rem"
                div.children[0].children[i].style.marginBottom = Number(div.children[0].children[i].dataset.size) / 5 + "px"
                break
            }
        }
    }
    // 解析 msg 消息体
    let msgHeader = xml.substring(xml.indexOf("<msg"), xml.indexOf("<item")) + "</msg>"
    msgHeader = msgHeader.replace("msg", "div")
    msgHeader = msgHeader.replace("m_resid=", "data-resid=")
    msgHeader = msgHeader.replace("url=", "data-url=")
    let header = document.createElement("div")
    header.innerHTML = msgHeader
    // 处理特殊的出处
    let sourceBody = ""
    for(let i=0; i<div.children.length; i++) {
        if(div.children[i].nodeName == "SOURCE") {
            sourceBody = div.children[i]
        }
    }
    const source = sourceBody.dataset.name
    showLog("b573f7", "fff", "UI", "XML 解析类型：" + source)
    switch(source) {
        case "聊天记录": {
            // 合并转发消息
            div.dataset.type = "forward"
            div.dataset.id = header.children[0].dataset.resid
            div.style.cursor = "pointer"
            break
        }
        case "群投票": {
            // 群投票
            return "<a class='msg-unknow'>（不支持显示的 XML：" + source + "）</a>"
            break
        }
    }
    // 附带链接的 xml 消息处理
    if (header.children[0].dataset.url != undefined) {
        div.dataset.url = header.children[0].dataset.url
        div.style.cursor = "pointer"
    }
    return div.outerHTML
}

function printJSON(data, typeId) {
    // <div class="msg-json">
    //     <p>ケガレの唄 (秽之歌)</p>
    //     <span>羽生まゐご/v flower</span>
    //     <div style="background-image: url(http://p3.music.126.net/zGMkUpsKqG1qeNSDZwN0fg==/109951166503498637.jpg);"></div>
    //     <div>
    //         <img src="https://i.gtimg.cn/open/app_icon/00/49/50/85/100495085_100_m.png">
    //             <span>网易云音乐</span>
    //     </div>
    // </div>
    // 解析 JSON
    let json = JSON.parse(data)
    let body = json.meta[Object.keys(json.meta)[0]]
    // App 信息
    let name = body.tag == undefined ? body.title : body.tag
    let icon = body.icon == undefined ? body.source_icon : body.icon

    let title = body.title
    let desc = body.desc

    let preview = body.preview
        if (preview != undefined && preview.indexOf("http") == -1) preview = "//" + preview

    let url = body.qqdocurl == undefined ? body.jumpUrl : body.qqdocurl
    // 构建 HTML
    let html = '<div class="msg-json" onclick="xmlClick(this)" data-url="' + url + '">' +
               '<p>' + title + '</p>' +
               '<span>' + desc + '</span>' + 
               '<img src="' + preview + '">' + 
               '<div><img src="' + icon + '"><span>' + name + '</span></div>' +
               '</div>'
    // 返回
    return html
}