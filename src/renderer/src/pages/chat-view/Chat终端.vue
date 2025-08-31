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
    <div
        id="chat-pan"
        :class="{
            'chat-pan': true,
            'open': runtimeData.tags.openSideBar,
            'withBar': needBar()
        }">
        <div
            id="shell-pan"
            class="shell-pan">
            <div>
                <template
                    v-for="(msgItem, index) in runtimeData.messageList"
                    :key="msgItem.message_id">
                    <div
                        v-if="msgItem.post_type == 'message'
                            || msgItem.post_type == 'message_sent'"
                        :class="
                            'shell-msg' +
                                (msgItem.revoke ? ' revoke' : '') +
                                (tags.replyId == msgItem.message_id ? ' reply' : '')
                        "
                        style="cursor: pointer">
                        <span
                            :class="
                                'sname s' +
                                    msgItem.sender.role +
                                    (runtimeData.loginInfo.uin == msgItem.sender.user_id
                                        ? ' smine'
                                        : '')
                            "
                            @click="copy(msgItem.sender.user_id)">
                            {{
                                msgItem.sender.card
                                    ? msgItem.sender.card
                                    : msgItem.sender.nickname
                            }}{{ hasReply(msg) ?? ''
                            }}{{
                                msgItem.sub_type == 'friend'
                                    ? runtimeData.loginInfo.uin ==
                                        msgItem.sender.user_id
                                        ? runtimeData.loginInfo.nickname
                                        : runtimeData.chatInfo.show.name
                                    : ''
                            }}{{ msgItem.sender.user_id == 0 ? '' : ': ' }}
                        </span>
                        <span
                            class="smsg"
                            @click="copy(msgItem.message_id)">{{
                            getMsgRawTxt(msgItem)
                        }}</span>
                        <br>
                    </div>
                    <div v-else-if="msgItem.post_type == 'notice'">
                        <span
                            v-if="msgItem.sub_type == 'recall'"
                            style="color: yellow">::
                            <span style="color: yellow; opacity: 0.7">{{
                                getRecallName(msgItem.operator_id)
                            }}</span>
                            recalled a message.</span>
                    </div>
                    <div v-else-if="msgItem.commandLine">
                        <div
                            v-if="index == 2"
                            class="line-head">
                            <div>
                                <span>
                                    <font-awesome-icon
                                        :icon="['fas', 'folder-open']" />
                                    {{ runtimeData.chatInfo.show.name }}
                                </span>
                                <span style="color: var(--color-main-0)">
                                    <font-awesome-icon
                                        :icon="['fas', 'plug']" />
                                    {{ runtimeData.sysConfig.address }}
                                </span>
                            </div>
                            <div style="flex: 1" />
                            <div>
                                <span style="color: var(--color-main-1)">
                                    {{ packageInfo.version
                                    }}<font-awesome-icon
                                        :icon="['fas', 'code-branch']" />
                                </span>
                                <span>
                                    {{ msgItem.time.time
                                    }}<font-awesome-icon
                                        :icon="['fas', 'clock']" />
                                </span>
                            </div>
                        </div>
                        <a class="command-start">• </a>
                        <span>{{ msgItem.str }}</span>
                    </div>
                    <div v-else-if="msgItem.commandOut">
                        <div
                            v-if="msgItem.html"
                            v-html="msgItem.html" />
                        <span
                            v-else
                            :style="'color:' + msgItem.color">{{ msgItem.str }}</span>
                    </div>
                </template>
            </div>
            <div class="shell-input">
                <div class="line-head">
                    <div>
                        <span>
                            <font-awesome-icon
                                :icon="['fas', 'folder-open']" />
                            {{ runtimeData.chatInfo.show.name }}
                            {{ tags.replyName ? ' -> ' + tags.replyName : '' }}
                        </span>
                        <span style="color: var(--color-main-0)">
                            <font-awesome-icon :icon="['fas', 'plug']" />{{
                                runtimeData.sysConfig.address
                            }}
                        </span>
                    </div>
                    <div style="flex: 1" />
                    <div>
                        <span
                            v-if="tags.newMsg > 0"
                            style="color: var(--color-main-2)">
                            {{ tags.newMsg
                            }}<font-awesome-icon :icon="['fas', 'envelope']" />
                        </span>
                        <span style="color: var(--color-main-1)">
                            {{ packageInfo.version
                            }}<font-awesome-icon
                                :icon="['fas', 'code-branch']" />
                        </span>
                        <span>
                            {{ timeShow
                            }}<font-awesome-icon :icon="['fas', 'clock']" />
                        </span>
                    </div>
                </div>
                <a class="command-start">• </a>
                <input
                    id="msgInput"
                    v-model="msg"
                    @keyup="sendMsg"
                    @paste="addImg">
            </div>
        </div>
    </div>
</template>

<script lang="ts">
    import SendUtil from '@renderer/function/sender'
    import packageInfo from '../../../../../package.json'
    import Option from '@renderer/function/option'

    import { nextTick } from 'vue'
    import { Connector } from '@renderer/function/connect'
    import { defineComponent, markRaw } from 'vue'
    import { runtimeData } from '@renderer/function/msg'
    import { getTrueLang, needBar } from '@renderer/function/utils/systemUtil'
    import {
        MsgItemElem,
        SQCodeElem,
        UserFriendElem,
        UserGroupElem,
    } from '@renderer/function/elements/information'
    import {
        Logger,
        LogType,
        PopInfo,
        popList,
        PopType,
    } from '@renderer/function/base'
    import { sendMsgRaw, getMsgRawTxt } from '@renderer/function/utils/msgUtil'
    import { uptime } from '@renderer/main'
    import { backend } from '@renderer/runtime/backend'

    export default defineComponent({
        name: 'ChatShell',
        props: ['chat', 'list', 'mumberInfo'],
        data() {
            return {
                backend,
                needBar,
                tags: {
                    fullscreen: false,
                    fistget: true,
                    cmdTags: {} as { [key: string]: any },
                    newMsg: 0,
                    replyName: null as string | null,
                    replyId: null as string | null,
                },
                getMsgRawTxt: getMsgRawTxt,
                popInfo: new PopInfo(),
                packageInfo: packageInfo,
                runMode: import.meta.env.DEV,
                timeLoad: markRaw({
                    time: Intl.DateTimeFormat(getTrueLang(), {
                        hour: 'numeric',
                        minute: 'numeric',
                        second: 'numeric',
                    }).format(new Date()),
                }),
                runtimeData: runtimeData,
                trueLang: getTrueLang(),
                timeShow: '',
                timeSetter: undefined as unknown,
                msg: '',
                supportCmd: {} as { [key: string]: any },
                imgCache: [] as string[],
                sendCache: [] as MsgItemElem[],
                searchListCache: [] as (UserFriendElem & UserGroupElem)[],
            }
        },
        watch: {
            chat() {
                this.tags.fistget = true
                this.tags.cmdTags = {}
            },
        },
        mounted() {
            this.supportCmd = {
                help: {
                    info: 'Show All Command.',
                    fun: () => {
                        let back = ''
                        Object.keys(this.supportCmd).forEach((name) => {
                            if (name != '')
                                back +=
                                    '<span style="color: var(--color-font-2);"><span style="width: 13ch;display: inline-block;">' +
                                    name +
                                    '</span>: ' +
                                    this.supportCmd[name].info +
                                    '</span><br>'
                        })
                        this.addCommandOut('', '', back)
                    },
                },
                ls: {
                    info: 'List all contacts in the current message queue.',
                    fun: () => {
                        this.searchListCache = [...runtimeData.baseOnMsgList.values()]
                        let str =
                            '  total ' + this.searchListCache.length + '\n'
                        let hasMsg = false
                        runtimeData.baseOnMsgList.forEach((item, index) => {
                            if (item.new_msg == true) {
                                str += '• '
                                hasMsg = true
                            } else str += '  '
                            str += index.toString() + '     '
                            str +=
                                (item.group_id ? item.group_id : item.user_id) +
                                '     '
                            str +=
                                (item.group_name? item.group_name: item.nickname) + '     '
                            str += '\n'
                        })
                        if (hasMsg)
                            this.addCommandOut(':: You have message.', 'yellow')
                        this.addCommandOut(str)
                    },
                },
                sql: {
                    info: 'Stapxs QQ Lite 2.0 Base Command.',
                    fun: (raw: string, item: string[]) => {
                        switch (item[1]) {
                            // 发送消息
                            case 'send': {
                                const rawMsg = raw.substring(
                                    raw.indexOf('send') + 5,
                                )
                                const msg = SendUtil.parseMsg(
                                    rawMsg,
                                    this.sendCache,
                                    this.imgCache,
                                )
                                if (this.chat.show.temp) {
                                    sendMsgRaw(
                                        this.chat.show.id +
                                            '/' +
                                            this.chat.show.temp,
                                        this.chat.show.type,
                                        msg,
                                    )
                                } else {
                                    sendMsgRaw(
                                        this.chat.show.id,
                                        this.chat.show.type,
                                        msg,
                                    )
                                }
                                // 发送后处理
                                this.sendCache = []
                                this.imgCache = []

                                this.tags.replyName = null
                                this.tags.replyId = null
                                break
                            }
                            // 寻找联系人
                            case 'list': {
                                const value = item[2]
                                this.searchListCache =
                                    runtimeData.userList.filter(
                                        (
                                            item: UserFriendElem &
                                                UserGroupElem,
                                        ) => {
                                            const name = (
                                                item.user_id? item.nickname +
                                                      item.remark: item.group_name
                                            ).toLowerCase()
                                            const id = item.user_id? item.user_id: item.group_id
                                            return (
                                                name.indexOf(
                                                    value.toLowerCase(),
                                                ) !== -1 ||
                                                id.toString() === value
                                            )
                                        },
                                    ) as (UserFriendElem & UserGroupElem)[]
                                let str =
                                    '  total ' +
                                    this.searchListCache.length +
                                    '\n'
                                this.searchListCache.forEach((item, index) => {
                                    str += index.toString() + '     '
                                    str +=
                                        (item.group_id? item.group_id: item.user_id) + '     '
                                    str +=
                                        (item.group_name? item.group_name: item.nickname) + '     '
                                    str += '\n'
                                })
                                this.addCommandOut(str)
                                break
                            }
                            // 回复消息
                            case 'reply': {
                                // 去除回复消息缓存
                                this.sendCache = this.sendCache.filter(
                                    (item) => {
                                        return item.type !== 'reply'
                                    },
                                )
                                if (item[2] && item[2] != 'clear') {
                                    // 根据 item[2] 寻找这条消息 的名字
                                    const msg = runtimeData.messageList.filter(
                                        (msg) => {
                                            return msg.message_id == item[2]
                                        },
                                    )
                                    this.tags.replyId = item[2]
                                    if (msg[0]) {
                                        this.tags.replyName = msg[0].sender.card? msg[0].sender.card: msg[0].sender.nickname
                                    }
                                    this.addSpecialMsg({
                                        msgObj: { type: 'reply', id: item[2] },
                                        addText: false,
                                        addTop: true,
                                    })
                                } else if (item[2] && item[2] == 'clear') {
                                    this.sendCache = this.sendCache.filter(
                                        (item) => {
                                            return item.type !== 'reply'
                                        },
                                    )
                                    this.tags.replyName = null
                                    this.tags.replyId = null
                                }
                                if (item[3]) {
                                    this.supportCmd['sql'].fun(
                                        'sql send ' + item[3],
                                        ['sql', 'send', item[3]],
                                    )
                                    this.msg = ''
                                }
                                break
                            }
                            // 加载历史记录
                            case 'history': {
                                // 移除顶部的首次加载提示
                                if (runtimeData.messageList[0].commandOut) {
                                    runtimeData.messageList.shift()
                                    runtimeData.messageList.shift()
                                    runtimeData.messageList.shift()
                                    runtimeData.messageList.shift()
                                }
                                // 加载历史消息
                                // 获取列表第一条消息 ID
                                const firstMsgId =
                                    runtimeData.messageList[0].message_id ?? 0
                                // 发起获取历史消息请求
                                const type = runtimeData.chatInfo.show.type
                                const id = runtimeData.chatInfo.show.id
                                let name
                                const fullPage =
                                    runtimeData.jsonMap.message_list
                                        ?.pagerType == 'full'
                                if (
                                    runtimeData.jsonMap.message_list &&
                                    type != 'group'
                                ) {
                                    name =
                                        runtimeData.jsonMap.message_list
                                            .private_name
                                } else {
                                    name = runtimeData.jsonMap.message_list.name
                                }
                                Connector.send(
                                    name ?? 'get_chat_history',
                                    {
                                        group_id:
                                            type == 'group' ? id : undefined,
                                        user_id:
                                            type != 'group' ? id : undefined,
                                        message_id: firstMsgId,
                                        count: fullPage? runtimeData.messageList.length +
                                              20: 20,
                                    },
                                    'getChatHistory',
                                )
                                break
                            }
                            default: {
                                this.addCommandOut(
                                    'usage: sql send [msg]: Send a message, you can directly use "/<Message>" to replace it, \n           list [search]: Fuzzy search in the list of friends/groups, \n           reply [msgId] <message>: Use the message id to reply to the message, Click the message to copy the id, \n           history: Load more history.',
                                )
                            }
                        }
                    },
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
                    },
                },
                neofetch: {
                    info: 'print system info.',
                    fun: () => {
                        const infoList = {
                            Application: 'Stapxs QQ Lite 2.0',
                            Kernel: packageInfo.version + '-web',
                            Shell: 'stsh Basic Shell 1.0',
                            Theme: 'ChatSHell',
                            Uptime:
                                Math.floor(
                                    ((new Date().getTime() - uptime) / 1000) *
                                        100,
                                ) /
                                    100 +
                                ' s',
                            Resolution:
                                window.screen.width +
                                'x' +
                                window.screen.height,
                        } as { [key: string]: string }
                        if (backend.isDesktop()) {
                            infoList.Kernel = packageInfo.version + '-electron'
                        }
                        let info = ''
                        Object.keys(infoList).forEach((key) => {
                            info += `<span>${key}<span>: ${infoList[key]}</span></span>`
                        })
                        this.addCommandOut(
                            '',
                            '',
                            `<div class="shell-neofetch"><span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;***&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;*******************&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;***************************&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;*******************************&nbsp;&nbsp;&nbsp;&nbsp;<br>&nbsp;&nbsp;&nbsp;**************&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**************&nbsp;&nbsp;<br>&nbsp;&nbsp;*************&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;*************&nbsp;<br>&nbsp;**************&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;*************<br>&nbsp;*************,&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;*************<br>*************,&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;************<br>&nbsp;************&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;***********<br>&nbsp;***********,**&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;*.***********<br>&nbsp;&nbsp;*************&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;*************&nbsp;<br>&nbsp;&nbsp;&nbsp;***********************************&nbsp;&nbsp;<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;*******************************&nbsp;&nbsp;&nbsp;&nbsp;<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;***************************&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;*******************<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;***</span><div><span>${runtimeData.loginInfo.nickname}<span>@</span>sql-vue</span><a>-----------------</a>${info}<div><div style="background:black"></div><div style="background:red"></div><div style="background:green"></div><div style="background:yellow"></div><div style="background:blue"></div><div style="background:violet"></div></div></div></div>`,
                        )
                    },
                },
                clear: {
                    info: 'clear message list.',
                    fun: () => {
                        runtimeData.messageList = []
                        // PS：让消息列表不是空的防止输出首次进入信息
                        this.addCommandOut('')
                    },
                },
                cd: {
                    info: 'Alias for "cd /[id]"',
                    fun: (_: string, itemInfo: string[]) => {
                        let id = '0'
                        if (
                            itemInfo.length == 1 &&
                            this.searchListCache.length == 1
                        ) {
                            id = (
                                this.searchListCache[0].user_id? this.searchListCache[0].user_id: this.searchListCache[0].group_id
                            ).toString()
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
                                if (this.searchListCache[index]) {
                                    id = (
                                        this.searchListCache[index].user_id? this.searchListCache[index]
                                                  .user_id: this.searchListCache[index]
                                                  .group_id
                                    ).toString()
                                } else {
                                    this.addCommandOut(
                                        ':: Search cache id does not exist',
                                        'red',
                                    )
                                    return
                                }
                            }
                        }
                        // 从缓存列表里寻找这个 ID
                        for (let i = 0; i < runtimeData.userList.length; i++) {
                            const item = runtimeData.userList[i]
                            const gid =
                                item.user_id !== undefined? item.user_id: item.group_id
                            if (String(gid) === id) {
                                // 检查显示列表里有没有它
                                if (!document.getElementById('user-' + id)) {
                                    // 把它插入到显示列表
                                    runtimeData.baseOnMsgList?.set(Number(id), item)
                                }
                                nextTick(() => {
                                    const bodyNext = document.getElementById(
                                        'user-' + id,
                                    )
                                    if (bodyNext !== null) {
                                        // 然后点一下它触发聊天框切换
                                        bodyNext.click()
                                    } else {
                                        this.addCommandOut(
                                            ':: No valid contacts found',
                                            'red',
                                        )
                                    }
                                })
                                return
                            }
                        }
                        this.addCommandOut(':: No valid contacts found', 'red')

                        this.tags.replyName = null
                        this.tags.replyId = null
                    },
                },
            }

            this.$watch(() => this.list.length, this.updateList)
            this.$watch(() => popList.length, this.showPop)
            this.timeSetter = setInterval(() => {
                this.timeShow = Intl.DateTimeFormat(this.trueLang, {
                    hour: 'numeric',
                    minute: 'numeric',
                    second: 'numeric',
                }).format(new Date())
                // 刷新新消息数
                this.tags.newMsg = [...runtimeData.baseOnMsgList.values()].filter((item) => {
                    return item.new_msg == true
                }).length
            }, 1000)
            const pan = document.getElementById('chat-pan')
            if (pan) {
                this.tags.fullscreen = true
                pan.classList.add('full')
            }
        },
        methods: {
            hasReply(msg: any) {
                if (msg.message) {
                    const repItem = msg.message.filter((item: any) => {
                        return item.type == 'reply'
                    })
                    if (repItem[0]) {
                        const repMsg = runtimeData.messageList.filter(
                            (item) => {
                                return item.message_id == repItem[0].id
                            },
                        )
                        if (repMsg[0]) {
                            return (
                                '->' +
                                (repMsg[0].sender.card? repMsg[0].sender.card: repMsg[0].sender.nickname)
                            )
                        }
                    }
                }
                return null
            },

            /**
             * 消息区滚动到指定位置
             * @param where 位置（px）
             * @param showAnimation 是否使用动画
             */
            scrollTo(where: number | undefined, showAnimation = true) {
                const pan = document.getElementById('shell-pan')
                if (pan !== null && where) {
                    if (showAnimation === false) {
                        pan.style.scrollBehavior = 'unset'
                    } else {
                        pan.style.scrollBehavior = 'smooth'
                    }
                    pan.scrollTop = where
                    pan.style.scrollBehavior = 'smooth'
                }
            },
            scrollBottom(showAnimation = false) {
                const pan = document.getElementById('shell-pan')
                if (pan !== null) {
                    this.scrollTo(pan.scrollHeight + 40, showAnimation)
                }
            },

            updateList(_: number, oldLength: number) {
                if (this.tags.fistget && oldLength == 0) {
                    this.tags.fistget = false
                    this.addCommandOutF(':: joining chat ..', 'yellow')
                    this.addCommandLineF(
                        'cd ' + runtimeData.chatInfo.show.id,
                        runtimeData.chatInfo.show.type,
                    )
                    this.addCommandOutF(
                        '* Stapxs QQ Lite 2.0 Shell requires "FiraCode Nerd Font" to display complete command line symbols, please ensure the device has installed this font.\n\n* Use the command "fullscreen" or return to the parent directory to exit the full screen mode.\n\n* 使用 "help" 命令查看所有可用命令。\n\n\n',
                        'var(--color-font)',
                    )
                    this.addCommandOutF(
                        `Welcome to Stapxs QQ Lite ${packageInfo.version} (Vue ${packageInfo.devDependencies.vue}-${this.runMode})\n\n`,
                        'var(--color-font)',
                    )
                }
                this.scrollBottom(true)
            },

            showPop(newLength: number, oldLength: number) {
                if (newLength > oldLength) {
                    const info = popList[popList.length - 1]
                    if (info.svg == PopType.ERR) {
                        this.addCommandOut('::' + info.text, 'red')
                    } else {
                        this.addCommandOut('::' + info.text, 'yellow')
                    }
                }
            },

            addCommandOut(
                raw: string,
                color = 'var(--color-font-2)',
                html = undefined as unknown,
            ) {
                runtimeData.messageList.push({
                    commandOut: true,
                    color: color,
                    str: raw,
                    html: html,
                })
            },
            addCommandOutF(
                raw: string,
                color = 'var(--color-font-2)',
                html = undefined as unknown,
            ) {
                runtimeData.messageList.unshift({
                    commandOut: true,
                    color: color,
                    str: raw,
                    html: html,
                })
            },

            addCommandLine(
                str: string,
                dir = runtimeData.chatInfo.show.name,
                appendData: { [key: string]: any } = {},
            ) {
                runtimeData.messageList.push({
                    dir: dir,
                    commandLine: true,
                    str: str,
                    time: markRaw({
                        time: Intl.DateTimeFormat(getTrueLang(), {
                            hour: 'numeric',
                            minute: 'numeric',
                            second: 'numeric',
                        }).format(new Date()),
                    }),
                    data: appendData,
                })
            },
            addCommandLineF(str: string, dir = runtimeData.chatInfo.show.name) {
                runtimeData.messageList.unshift({
                    dir: dir,
                    commandLine: true,
                    str: str,
                    time: markRaw({
                        time: Intl.DateTimeFormat(getTrueLang(), {
                            hour: 'numeric',
                            minute: 'numeric',
                            second: 'numeric',
                        }).format(new Date()),
                    }),
                    data: {},
                })
            },

            sendMsg(event: KeyboardEvent) {
                // 执行指令
                if (event.keyCode === 13) {
                    this.addCommandLine(
                        this.msg,
                        runtimeData.chatInfo.show.name,
                        this.tags.cmdTags,
                    )
                    if (this.msg == '') return

                    // 检查是否是支持的指令
                    if (this.msg[0] == '/') {
                        this.msg =
                            'sql send ' + this.msg.substring(1, this.msg.length)
                    }
                    const msgList = this.msg.split(' ')
                    new Logger().add(
                        LogType.DEBUG,
                        'CMD: ' + msgList.toString(),
                    )
                    if (msgList.length > 0 && this.supportCmd[msgList[0]]) {
                        this.supportCmd[msgList[0]].fun(this.msg, msgList)
                        this.msg = ''
                    } else {
                        this.addCommandOut(
                            'stsh: command not found, use the help command to view all available commands.',
                            'red',
                        )
                    }
                    // 发送后处理
                    this.tags.cmdTags = {}
                    if (
                        this.sendCache.filter((item) => {
                            return item.type === 'reply'
                        }).length > 0
                    ) {
                        this.tags.cmdTags.reply = true
                    }
                }
                setTimeout(() => {
                    this.scrollBottom()
                }, 500)
            },

            copy(str: string) {
                const input = document.getElementById('msgInput')
                if (input) {
                    this.msg = 'sql reply ' + str + ' '
                    input.focus()
                }
                app.config.globalProperties.$copyText(String(str)).then(
                    () => {
                        this.addCommandOut(
                            ':: Copy messageId successfully.',
                            'gray',
                        )
                    },
                    () => {
                        this.addCommandOut(':: Copy messageId failed.', 'gray')
                    },
                )
            },

            /**
             * 添加特殊消息结构
             * @param data obj
             */
            addSpecialMsg(data: SQCodeElem) {
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
            getRecallName(id: number) {
                let backName = id.toString()
                // 补全撤回者信息
                if (runtimeData.chatInfo.show.type === 'group') {
                    // 寻找群成员信息
                    if (runtimeData.chatInfo.info.group_members !== undefined) {
                        const back =
                            runtimeData.chatInfo.info.group_members.filter(
                                (item) => {
                                    return item.user_id === Number(id)
                                },
                            )
                        if (back.length === 1) {
                            backName =
                                back[0].card === ''? back[0].nickname: back[0].card
                        }
                    }
                } else {
                    backName = runtimeData.chatInfo.show.name
                }
                return backName
            },

            addImg(event: ClipboardEvent) {
                // 判断粘贴类型
                if (!(event.clipboardData && event.clipboardData.items)) {
                    return
                }
                for (
                    let i = 0, len = event.clipboardData.items.length;
                    i < len;
                    i++
                ) {
                    const item = event.clipboardData.items[i]
                    if (item.kind === 'file') {
                        this.setImg(item.getAsFile())
                        // 阻止默认行为
                        event.preventDefault()
                    }
                }
            },

            setImg(blob: File | null) {
                const popInfo = new PopInfo()
                if (
                    blob !== null &&
                    blob.type.indexOf('image/') >= 0 &&
                    blob.size !== 0
                ) {
                    if (blob.size < 3145728) {
                        // 转换为 Base64
                        const reader = new FileReader()
                        reader.readAsDataURL(blob)
                        reader.onloadend = () => {
                            const base64data = reader.result as string
                            if (base64data !== null) {
                                if (Option.get('close_chat_pic_pan') === true) {
                                    // 在关闭图片插入面板的模式下将直接以 SQCode 插入输入框
                                    const data = {
                                        addText: true,
                                        msgObj: {
                                            type: 'image',
                                            file:
                                                'base64://' +
                                                base64data.substring(
                                                    base64data.indexOf(
                                                        'base64,',
                                                    ) + 7,
                                                    base64data.length,
                                                ),
                                        },
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
                        popInfo.add(PopType.INFO, this.$t('图片过大'))
                    }
                }
            },
        },
    })
</script>

<style>
    .shell-pan a,
    .shell-pan span {
        font-family: 'FiraCode Nerd Font', Helvetica, Arial,
             Verdana, Tahoma, sans-serif;
        color: var(--color-font);
        white-space: pre-wrap;
    }
    .shell-pan a:hover {
        color: var(--color-font);
    }

    .line-head {
        margin: 5px 0;
        color: var(--color-font);
        font-size: 0.8rem;
        display: flex;
        justify-content: flex-end;
    }
    .line-head > div:first-child svg {
        margin-right: 10px;
    }
    .line-head > div:last-child svg {
        margin-left: 10px;
    }
    .line-head > div > span {
        background: var(--color-card-1);
        margin-left: 5px;
        padding: 3px 10px;
    }
    .line-head > div > span:first-child {
        border-radius: 10px 0 0 10px;
        margin-left: 0;
    }
    .line-head > div:first-child > span:first-child {
        background: var(--color-main);
        color: var(--color-font-r);
    }
    .line-head > div > span:last-child {
        border-radius: 0 10px 10px 0;
    }
    .command-start {
        color: greenyellow;
    }

    .shell-pan {
        margin-top: 40px;
        padding: 0 20px;
        pointer-events: all;
        overflow-y: scroll;
        overflow-x: hidden;
    }
    .shell-pan > a {
        flex: 1;
    }

    .shell-msg {
        border-radius: 7px;
    }
    .shell-msg.revoke {
        display: none;
    }
    .shell-msg.reply {
        background: var(--color-card-1);
    }
    .shell-msg > span.sname.sadmin {
        color: var(--color-main-1);
    }
    .shell-msg > span.sname.sowner {
        color: var(--color-main-4);
    }
    .shell-msg > span.sname.smine {
        color: var(--color-main-0) !important;
    }
    .shell-msg > span.smsg {
        color: var(--color-font-2);
    }
    .shell-msg img {
        max-width: 50%;
        opacity: 0;
    }
    .shell-msg pre {
        font-family: 'FiraCode Nerd Font', Helvetica, Arial,
            Verdana, Tahoma, sans-serif;
        line-height: 7px;
        font-size: 6px;
    }

    .shell-input {
        margin-bottom: 40px;
    }
    .shell-input > input {
        font-family: 'FiraCode Nerd Font', Helvetica, Arial,
             Verdana, Tahoma, sans-serif;
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
    .shell-neofetch span {
        line-height: 1.2rem;
    }
    .shell-neofetch > span {
        color: var(--color-main-0);
        margin-bottom: 20px;
        margin-right: 20px;
        letter-spacing: -1px;
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
