<!--
 * @FileDescription: 聊天面板页面（命令行样式）
 * @Author: Stapxs
 * @Date: 2023/01/11
 * @Version: 1.0 - 初始版本
 * @Description: 这是个命令行样式的聊天面板，摸鱼专用.gif
-->

<!-- 
    追加备注
    此界面主题不支持以下功能：
    - 图片预览器，这玩意虽然说是全局的，但是太突兀了（无端）
 -->

<template>
    <div :class="'chat-pan' + (runtimeData.tags.openSideBar ? ' open': '')" id="chat-pan">
        <div id="shell-pan" class="shell-pan">
            <div>
                <template
                    v-for="msg in runtimeData.messageList"
                    :key="msg.message_id">
                    <div v-if="msg.post_type == 'message'" style="cursor: pointer;" :class="'shell-msg' + (msg.revoke ? ' revoke' : '')">
                        <span @click="copy(msg.sender.user_id)" :class="'sname s' + msg.sender.role + (runtimeData.loginInfo.uin == msg.sender.user_id ? ' smine' : '')">{{ msg.sender.card ? msg.sender.card : msg.sender.nickname }}{{ msg.sub_type == 'friend' ? (runtimeData.loginInfo.uin == msg.sender.user_id ? runtimeData.loginInfo.nickname : runtimeData.chatInfo.show.name) : '' }}{{ msg.sender.user_id == 0 ? '' : ': ' }}</span>
                        <span class="smsg" @click="copy(msg.message_id)">{{ msg.raw_message }}</span>
                        <template v-for="(item, index) in msg.message" :key="msg.message_id + '-' + index.toString()">
                            <pre v-if="item.type == 'image'" v-show="tags.showImg" :id="'img-' + msg.message_id + '-' + index.toString()" :data-get="makeAscii('img-' + msg.message_id + '-' + index.toString(), item.url)"></pre>
                        </template>
                        <br>
                    </div>
                    <div v-else-if="msg.post_type == 'notice'">
                        <span v-if="msg.sub_type == 'recall'" style="color:yellow">:: <span style="color:yellow;opacity: 0.7;">{{ getRecallName(msg.operator_id) }}</span> recalled a message.</span>
                    </div>
                    <div v-else-if="msg.commandLine">
                        <div class="line-head">
                            <span class="time">{{ msg.time.time }}</span>
                            <span class="c1"></span>
                            <span class="name">{{ runtimeData.loginInfo.nickname }}@sql-vue</span>
                            <span class="c2"></span>
                            <span class="dir">{{ msg.dir }}</span>
                            <span :class="'c3' + (Object.keys(msg.data).length > 0 ? ' c3bg' : '')"></span>
                            <template v-if="Object.keys(msg.data).length > 0">
                                <span v-if="msg.data.reply" class="dir" style="background:var(--color-main);color: var(--color-font-r);">{{ msg.data.reply ? 'reply' : '' }}</span>
                                <span class="c3" style="color:var(--color-main)"></span>
                            </template>
                        </div>
                        <a class=command-start>$ </a>
                        <span>{{ msg.str }}</span>
                    </div>
                    <div v-else-if="msg.commandOut">
                        <div v-if="msg.html" v-html="msg.html"></div>
                        <span v-else :style="'color:' + msg.color">{{ msg.str }}</span>
                    </div>
                </template>
            </div>
            <div class="shell-input">
                <div class="line-head">
                    <span class="time">{{ timeShow }}</span>
                    <span class="c1"></span>
                    <span class="name">{{ runtimeData.loginInfo.nickname }}@sql-vue</span>
                    <span class="c2"></span>
                    <span class="dir">{{ runtimeData.chatInfo.show.name }}</span>
                    <span :class="'c3' + (Object.keys(tags.cmdTags).length > 0 ? ' c3bg' : '')"></span>
                    <template v-if="Object.keys(tags.cmdTags).length > 0">
                        <span v-if="tags.cmdTags.reply" class="dir" style="background:var(--color-main);color: var(--color-font-r);">{{ tags.cmdTags.reply ? 'reply' : '' }}</span>
                        <span class="c3" style="color:var(--color-main)"></span>
                    </template>
                </div>
                <a class=command-start>$ </a>
                <input @keyup="sendMsg" v-model="msg" @paste="addImg">
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import app from '@/main'
import SendUtil from '@/function/sender'
import packageInfo from '../../../package.json'
import Option from '@/function/option'

import { imageToText, getImageData } from "char-dust"

import { nextTick } from 'vue'
import { Connector } from '@/function/connect'
import { defineComponent, markRaw } from 'vue'
import { runtimeData, appendMsg } from '@/function/msg'
import { getTrueLang, parseMsgId } from '@/function/util'
import { MsgItemElem, SQCodeElem, UserFriendElem, UserGroupElem } from '@/function/elements/information'
import { Logger, LogType, PopInfo, popList, PopType } from '@/function/base'

export default defineComponent({
    name: 'ChatShell',
    props: ['chat', 'list', 'mergeList', 'mumberInfo'],
    data() {
        return { 
            tags: {
                fullscreen: false,
                fistget: true,
                cmdTags: {} as { [key: string]: any },
                showImg: false
            },
            popInfo: new PopInfo(),
            packageInfo: packageInfo,
            runMode: process.env.NODE_ENV,
            timeLoad: markRaw({ time: Intl.DateTimeFormat(getTrueLang(), { hour: 'numeric', minute: 'numeric', second: 'numeric' }).format(new Date()) }),
            runtimeData: runtimeData,
            trueLang: getTrueLang(),
            timeShow: '',
            timeSetter: undefined as unknown,
            msg: '',
            supportCmd: {} as { [key: string]: any },
            imgCache: [] as string[],
            sendCache: [] as MsgItemElem[],
            searchListCache: [] as (UserFriendElem & UserGroupElem)[],
            asciiCache: {} as { [ key: string ]: string }
        }
    },
    methods: {
        /**
         * 消息区滚动到指定位置
         * @param where 位置（px）
         * @param showAnimation 是否使用动画
         */
         scrollTo (where: number | undefined, showAnimation = true) {
            const pan = document.getElementById('shell-pan')
            if(pan !== null && where) {
                if (showAnimation === false) {
                    pan.style.scrollBehavior = 'unset'
                } else {
                    pan.style.scrollBehavior = 'smooth'
                }
                pan.scrollTop = where
                pan.style.scrollBehavior = 'smooth'
            }
        },
        scrollBottom (showAnimation = false) {
            const pan = document.getElementById('shell-pan')
            if(pan !== null) {
                this.scrollTo(pan.scrollHeight + 40, showAnimation)
            }
        },

        updateList (newLength: number, oldLength: number) {
            if(this.tags.fistget && oldLength == 0) {
                this.tags.fistget = false
                this.addCommandOutF(':: joining chat ..', 'yellow')
                this.addCommandLineF('cd ' + runtimeData.chatInfo.show.id, runtimeData.chatInfo.show.type)
                this.addCommandOutF('* Stapxs QQ Lite 2.0 Shell Theme requires "FiraCode Nerd Font" to display complete command line symbols, please ensure the device has installed this font.\n\n* Use the command "fullscreen" or return to the parent directory to exit the full screen mode.\n\n\n', 'var(--color-font)')
                this.addCommandOutF(`Welcome to Stapxs QQ Lite ${packageInfo.version} (Vue ${packageInfo.dependencies.vue}-${this.runMode})\n\n`, 'var(--color-font)')
            }
            this.scrollBottom(true)
        },

        showPop (newLength: number, oldLength: number) {
            if(newLength > oldLength) {
                const info = popList[popList.length - 1]
                if(info.svg == PopType.ERR) {
                    this.addCommandOut('::' + info.text, 'red')
                } else {
                    this.addCommandOut('::' + info.text, 'yellow')
                }
            }
        },

        addCommandOut(raw: string, color = 'var(--color-font-2)', html = undefined as unknown) {
            runtimeData.messageList.push({
                commandOut: true,
                color: color,
                str: raw,
                html: html
            })
        },
        addCommandOutF(raw: string, color = 'var(--color-font-2)', html = undefined as unknown) {
            runtimeData.messageList.unshift({
                commandOut: true,
                color: color,
                str: raw,
                html: html
            })
        },

        addCommandLine(str: string, dir = runtimeData.chatInfo.show.name, appendData: {[key: string]: any} = {}) {
            runtimeData.messageList.push({
                dir: dir,
                commandLine: true,
                str: str, 
                time: markRaw({ time: Intl.DateTimeFormat(getTrueLang(), { hour: 'numeric', minute: 'numeric', second: 'numeric' }).format(new Date()) }),
                data: appendData
            })
        },
        addCommandLineF(str: string, dir = runtimeData.chatInfo.show.name) {
            runtimeData.messageList.unshift({
                dir: dir,
                commandLine: true,
                str: str, 
                time: markRaw({ time: Intl.DateTimeFormat(getTrueLang(), { hour: 'numeric', minute: 'numeric', second: 'numeric' }).format(new Date()) }),
                data: {}
            })
        },

        sendMsg (event: KeyboardEvent) {
            // 执行指令
            if (event.keyCode === 13 && this.msg != '') {
                this.addCommandLine(this.msg, runtimeData.chatInfo.show.name, this.tags.cmdTags)
                // 检查是否是支持的指令
                const msgList = this.msg.split(' ')
                new Logger().add(LogType.DEBUG, 'CMD: ' + msgList.toString())
                if(msgList.length > 0 && this.supportCmd[msgList[0]]) {
                    this.supportCmd[msgList[0]].fun(this.msg, msgList)
                    this.msg = ''
                } else {
                    this.addCommandOut('stsh: command not found, use the help command to view all available commands.', 'red')
                }
                // 发送后处理
                this.scrollBottom()
                this.tags.cmdTags = {}
                if(this.sendCache.filter((item) => { return item.type === 'reply'}).length > 0) {
                    this.tags.cmdTags.reply = true
                }
            }
        },

        copy(str: string) {
            app.config.globalProperties.$copyText(str).then(() => {
                this.popInfo.add(PopType.INFO, 'copy messageId successfully', true)
            }, () => {
                this.popInfo.add(PopType.ERR, 'copy messageId failed', true)
            })
        },

        /**
         * 添加特殊消息结构
         * @param data obj
         */
         addSpecialMsg (data: SQCodeElem) {
            if (data !== undefined) {
                const index = this.sendCache.length
                this.sendCache.push(data.msgObj)
                if (data.addText === true) {
                    if (data.addTop === true) {
                        this.msg = '[SQ:' + index + ']' + this.msg
                    } else {
                        this.msg += '[SQ:' + index + ']'
                    }
                }
                return index
            }
            return -1
        },
        
        makeAscii(id: string, url: string) {
            // 检查缓存是否存在
            if(!this.asciiCache[id]) {
                // PS：由于 QQ 的图片也有跨域限制
                // 导致生成 ascii 纯文本无法正常下载图片 ……
                // 于是也只能拜托后端帮忙下载一下用 base64 图片丢回来（当然这样效率低到了一个新的高度）
                // 总之为了彩蛋就不管了

                // 添加自定义的 msg 处理方法
                const setAscii = (msg: any) => {
                    msg = msg.data
                    // 图片 base64
                    const base64 = 'data:' + msg.headers['content-type'] + ';base64,' + msg.data
                    const img = document.createElement('img')
                    img.src = base64
                    const imageData = getImageData(img)
                    const text = imageToText(imageData)
                    this.asciiCache[id] = 'test'
                    const pre = document.getElementById(id)
                    if(pre) {
                        let out = ''
                        text.forEach((line: string) => {
                            out += line + '\n'
                        })
                        // 修正宽度
                        const chat = document.getElementById('chat-pan')
                        if(chat) {
                            let fontWidth = chat.offsetWidth / text[0].length
                            if(fontWidth < 1) {
                                fontWidth = 1
                            }
                            if(fontWidth > 7) {
                                fontWidth = 7
                            }
                            pre.style.fontSize = Math.ceil(fontWidth) + 'px'
                            pre.style.lineHeight = (Math.ceil(fontWidth) + 1) + 'px'
                        }
                        pre.innerHTML = out
                    }
                }
                appendMsg.getImgAscii = setAscii

                // 请求图片
                Connector.send('http_proxy', {url: url, responseEncoding: 'base64'}, 'getImgAscii')
                return 'get'
            }
            return 'has'
        },

        getRecallName(id: number) {
            let backName = id.toString()
            // 补全撤回者信息
            if (runtimeData.chatInfo.show.type === 'group') {
                // 寻找群成员信息
                if (runtimeData.chatInfo.info.group_members !== undefined) {
                    const back = runtimeData.chatInfo.info.group_members.filter((item) => {
                        return item.user_id === Number(id)
                    })
                    if (back.length === 1) {
                        backName = back[0].card === '' ? back[0].nickname : back[0].card
                    }
                }
            } else {
                backName = runtimeData.chatInfo.show.name
            }
            return backName
        },

        addImg (event: ClipboardEvent) {
            // 判断粘贴类型
            if (!(event.clipboardData && event.clipboardData.items)) {
                return
            }
            for (let i = 0, len = event.clipboardData.items.length; i < len; i++) {
                let item = event.clipboardData.items[i]
                if (item.kind === 'file') {
                    this.setImg(item.getAsFile())
                    // 阻止默认行为
                    event.preventDefault()
                }
            }
        },

        setImg(blob: File | null) {
            const popInfo = new PopInfo()
            if (blob !== null && blob.type.indexOf('image/') >= 0 && blob.size !== 0) {
                if (blob.size < 3145728) {
                    // 转换为 Base64
                    var reader = new FileReader()
                    reader.readAsDataURL(blob)
                    reader.onloadend = () => {
                        var base64data = reader.result as string
                        if (base64data !== null) {
                            if (Option.get('close_chat_pic_pan') === true) {
                                // 在关闭图片插入面板的模式下将直接以 SQCode 插入输入框
                                const data = {
                                    addText: true,
                                    msgObj: {
                                        type: 'image',
                                        file: 'base64://' + base64data.substring(base64data.indexOf('base64,') + 7, base64data.length)
                                    }
                                }
                                this.addSpecialMsg(data)
                            } else {
                                // 记录图片信息
                                // 只要你内存够猛，随便 cache 图片，这边就不做限制了
                                this.imgCache.push(base64data)
                            }
                        }
                    }
                } else {
                    popInfo.add(PopType.INFO, this.$t('pop_chat_image_toooo_big'))
                }
            }
        }

    },
    watch: {
        chat () {
            this.tags.fistget = true
            this.tags.cmdTags = {}
        }
    },
    mounted() {
        this.supportCmd = {
            help: {
                info: 'Show All Command.',
                fun: () => {
                    let back = ''
                    Object.keys(this.supportCmd).forEach((name) => {
                        if(name != '')
                            back += '<span style="color: var(--color-font-2);"><span style="width: 13ch;display: inline-block;">' + name + '</span>: ' + this.supportCmd[name].info + '</span><br>'
                    })
                    this.addCommandOut('', '', back)
                }
            },
            ls: {
                info: 'List all contacts in the current message queue.',
                fun: () => {
                    this.searchListCache = markRaw(runtimeData.onMsgList)
                    let str = ''
                    let hasMsg = false
                    runtimeData.onMsgList.forEach((item, index) => {
                        if(item.new_msg == true) {
                            str += '• '; hasMsg = true;
                        } else str += '  '
                        str += index.toString() + '     '
                        str += (item.group_id ? item.group_id : item.user_id) + '     '
                        str += (item.group_name ? item.group_name : item.nickname) + '     '
                        str += '\n'
                    })
                    if(hasMsg) this.addCommandOut(':: You have message.', 'yellow')
                    this.addCommandOut(str)
                }
            },
            '': {
                info: 'Alias for the command "sql send".',
                fun: (raw: string, item: string[]) => {
                    if(item[0] == '' && item[1] == '') {
                        const msg = raw.substring(2, raw.length)
                        this.supportCmd.sql.fun('sql send ' + msg, ['sql', 'send', msg])
                    }
                }
            },
            sql: {
                info: 'Stapxs QQ Lite 2.0 Base Command.',
                fun: (raw: string, item: string[]) => {
                    switch(item[1]) {
                        // 发送消息
                        case 'send': {
                            const rawMsg = raw.substring(raw.indexOf('send') + 5)
                            let msg = SendUtil .parseMsg(rawMsg, this.sendCache, this.imgCache)
                            if (msg !== undefined && msg.length > 0) {
                                switch (this.chat.show.type) {
                                    case 'group': Connector.send('send_group_msg', { 'group_id': this.chat.show.id, 'message': msg }, 'sendMsgBack'); break
                                    case 'user': Connector.send('send_private_msg', { 'user_id': this.chat.show.id, 'message': msg }, 'sendMsgBack'); break
                                }
                            }
                            // 发送后处理
                            this.sendCache = []
                            this.imgCache = []
                            break
                        }
                        // 寻找联系人
                        case 'list': {
                            const value = item[2]
                            this.searchListCache = runtimeData.userList.filter((item: UserFriendElem & UserGroupElem) => {
                                const name = (item.user_id ? (item.nickname + item.remark) : item.group_name).toLowerCase()
                                const id = item.user_id ? item.user_id : item.group_id
                                return name.indexOf(value.toLowerCase()) !== -1 || id.toString() === value
                            }) as (UserFriendElem & UserGroupElem)[]
                            let str = ''
                            this.searchListCache.forEach((item, index) => {
                                str += index.toString() + '     '
                                str += (item.group_id ? item.group_id : item.user_id) + '     '
                                str += (item.group_name ? item.group_name : item.nickname) + '     '
                                str += '\n'
                            })
                            this.addCommandOut(str)
                            break
                        }
                        // 回复消息
                        case 'reply': {
                            // 去除回复消息缓存
                            this.sendCache = this.sendCache.filter((item) => {
                                return item.type !== 'reply'
                            })
                            if(item[2]) {
                                try {
                                    parseMsgId(item[2])
                                    this.addSpecialMsg({ msgObj: { type: 'reply', id: item[2] }, addText: false, addTop: true })
                                } catch (e) {
                                    this.addCommandOut(':: Invalid message id.')
                                }
                            }
                            break
                        }
                        // 加载历史记录
                        case 'history': {
                            // 移除顶部的首次加载提示
                            if(runtimeData.messageList[0].commandOut) {
                                runtimeData.messageList.shift()
                                runtimeData.messageList.shift()
                                runtimeData.messageList.shift()
                                runtimeData.messageList.shift()
                            }
                            // 加载历史消息
                            // 获取列表第一条消息 ID
                            const firstMsgId = runtimeData.messageList[0].message_id
                            if (firstMsgId) {
                                // 发起获取历史消息请求
                                let name = 'get_chat_history'
                                if(runtimeData.botInfo['go-cqhttp'] === true)
                                    name = 'get_msg_history'
                                Connector.send(
                                    name,
                                    {
                                        'message_id': firstMsgId,
                                        'target_id': runtimeData.chatInfo.show.id,
                                        'group': runtimeData.chatInfo.show.type
                                    },
                                    'getChatHistory'
                                )
                            } else {
                                this.addCommandOut(':: No messages in the message list. Failed to get message id ...', 'red')
                            }
                            break
                        }
                        case 'showImg': {
                            this.tags.showImg = !this.tags.showImg
                            break
                        }
                        default: {
                            this.addCommandOut('usage: sql send [msg], \n           list [search], \n           reply [msgId], \n           history, \n           showImg')
                        }
                    }
                }
            },
            fullscreen: {
                info: 'fullscreen chat view.',
                fun: () => {
                    const pan = document.getElementById('chat-pan')
                    if (pan) {
                        if (!this.tags.fullscreen) {
                            this.tags.fullscreen = true
                            pan.classList.add('full')
                        } else {
                            this.tags.fullscreen = false
                            pan.classList.remove('full')
                        }
                    }
                }
            },
            neofetch: {
                info: 'print system info.',
                fun: () => {
                    this.addCommandOut('', '', `<div class="shell-neofetch"><span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;***&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;*******************&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;***************************&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;*******************************&nbsp;&nbsp;&nbsp;&nbsp;<br>&nbsp;&nbsp;&nbsp;**************&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**************&nbsp;&nbsp;<br>&nbsp;&nbsp;*************&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;*************&nbsp;<br>&nbsp;**************&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;*************<br>&nbsp;*************,&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;*************<br>*************,&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;************<br>&nbsp;************&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;***********<br>&nbsp;***********,**&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;*.***********<br>&nbsp;&nbsp;*************&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;*************&nbsp;<br>&nbsp;&nbsp;&nbsp;***********************************&nbsp;&nbsp;<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;*******************************&nbsp;&nbsp;&nbsp;&nbsp;<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;***************************&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;*******************<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;***</span><div><span>${runtimeData.loginInfo.nickname}<span>@</span>sql-vue</span><a>-----------------</a><span>Application<span>: Stapxs QQ Lite 2.0</span></span><span>Kernel<span>: ${packageInfo.version}-web</span></span><span>Shell<span>: stsh base</span></span><span>Theme<span>: ChatSHell</span></span><div><div style="background:black"></div><div style="background:red"></div><div style="background:green"></div><div style="background:yellow"></div><div style="background:blue"></div><div style="background:violet"></div></div></div></div>`)
                }
            },
            clear: {
                info: 'clear message list.',
                fun: () => {
                    runtimeData.messageList = []
                    // PS：让消息列表不是空的防止输出首次进入信息
                    this.addCommandOut('')
                }
            },
            cd: {
                info: 'Alias for "cd /[id]"',
                fun: (raw: string, itemInfo: string[]) => {
                    let id = '0'
                    if(itemInfo.length == 1 && this.searchListCache.length == 1) {
                        id = (this.searchListCache[0].user_id ? this.searchListCache[0].user_id : this.searchListCache[0].group_id).toString()
                    } else {
                        id = itemInfo[1]
                        if (itemInfo[1] == '../') {
                            const pan = document.getElementById('chat-pan')
                            if (pan) {
                                this.tags.fullscreen = false
                                pan.classList.remove('full')
                                runtimeData.chatInfo.show.id = 0
                            }
                            return
                        }
                        if (itemInfo[1].startsWith('#')) {
                            const index = Number(itemInfo[1].substring(1))
                            if(this.searchListCache[index]) {
                                id = (this.searchListCache[index].user_id ? this.searchListCache[index].user_id : this.searchListCache[index].group_id).toString()
                            } else {
                                this.addCommandOut(':: Search cache id does not exist', 'red')
                                return
                            }
                        }
                    }
                    // 从缓存列表里寻找这个 ID
                    for (let i = 0; i < runtimeData.userList.length; i++) {
                        const item = runtimeData.userList[i]
                        const gid = item.user_id !== undefined ? item.user_id : item.group_id
                        if (String(gid) === id) {
                            // 检查显示列表里有没有它
                            if (!document.getElementById('user-' + id)) {
                                // 把它插入到显示列表的第一个
                                runtimeData.showList?.unshift(item)
                            }
                            nextTick(() => {
                                const bodyNext = document.getElementById('user-' + id)
                                if (bodyNext !== null) {
                                    // 然后点一下它触发聊天框切换
                                    bodyNext.click()
                                } else {
                                    this.addCommandOut(':: No valid contacts found', 'red')
                                }
                            })
                            return
                        }
                    }
                    this.addCommandOut(':: No valid contacts found', 'red')
                }
            }
        }


        this.$watch(() => this.list.length, this.updateList)
        this.$watch(() => popList.length, this.showPop)
        this.timeSetter = setInterval(()=>{
            this.timeShow = Intl.DateTimeFormat(this.trueLang, { hour: 'numeric', minute: 'numeric', second: 'numeric' }).format(new Date())
        }, 1000);
        const pan = document.getElementById('chat-pan')
        if (pan) {
            this.tags.fullscreen = true
            pan.classList.add('full')
        }
    }
})
</script>

<style>
a {
    font-family: "FiraCode Nerd Font";
    color: var(--color-font);
    white-space:pre-wrap;
}
a:hover {
    color: var(--color-font);
}
span {
    font-family: "FiraCode Nerd Font";
    white-space: pre-wrap;
}

.line-head {
    margin-bottom: 5px;
}
.line-head > span.time {
    background: var(--color-main);
    color: var(--color-font-r);
    border-radius: 7px 0 0 7px;
    padding: 0 5px 0 10px;
}
.line-head > span.c1 {
    color: var(--color-main);
}
.line-head > span.name {
    background: var(--color-card);
    padding: 0 10px;
}
.line-head > span.c2 {
    background: rgb(0, 122, 204);
    color: var(--color-card);
}
.line-head > span.dir {
    background: rgb(0, 122, 204);
    padding: 0 10px;
}
.line-head > span.c3 {
    color: rgb(0, 122, 204);
}
.line-head > span.c3.c3bg {
    background: var(--color-main);
}
.command-start {
    color: greenyellow;
}


.shell-pan {
    padding: 20px;
    pointer-events: all;
    overflow-y: scroll;
    overflow-x: hidden;
}
.shell-pan > a {
    flex: 1;
}

.shell-msg.revoke {
    display: none;
}
.shell-msg > span.sname.sadmin {
    color: green;
}
.shell-msg > span.sname.sowner {
    color: gold;
}
.shell-msg > span.sname.smine {
    color: rgb(0, 122, 204) !important;
}
.shell-msg > span.smsg {
    color: var(--color-font-2);
}
.shell-msg img {
    max-width: 50%;
    opacity: 0;
}
.shell-msg pre {
    font-family: 'FiraCode Nerd Font';
    line-height: 7px;
    font-size: 6px;
}

.shell-input {
    margin-bottom: 40px;
}
.shell-input > input {
    font-family: "FiraCode Nerd Font";
    caret-color: var(--color-main);
    width: calc(100% - 2rem);
    background: transparent;
    margin-top: -3px;
    border: 0;
}

.shell-neofetch {
    display: flex;
    flex-wrap: wrap;
}
.shell-neofetch > span {
    color: var(--color-main);
    margin-bottom: 20px;
    margin-right: 20px;
    line-height: 1.3rem;
}
.shell-neofetch > div {
    flex-direction: column;
    display: flex;
}
.shell-neofetch > div > a {
    font-family: unset;
}
.shell-neofetch > div > span {
    color: var(--color-main);
}
.shell-neofetch > div > span > span {
    color: var(--color-font);
}
.shell-neofetch > div > div {
    margin-top: 1rem;
    display: flex;
}
.shell-neofetch > div > div > div {
    height: 1.5rem;
    width: 2rem;
}
</style>
