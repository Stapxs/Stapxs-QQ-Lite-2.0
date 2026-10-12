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
        :class="'chat-pan' + (uiStore.openSideBar ? ' open' : '') + (['linux', 'win32'].includes(backend.platform ?? '') ? ' withBar' : '') ">
        <span v-if="tags.fullscreen" class="shell-pan-title">admin@{{ new URL(settingsStore.sysConfig.address).hostname }}:/Volumes/Contacts/{{ chatStore.chatInfo.show.id }}</span>
        <div id="shell-pan" class="shell-pan">
            <div>
                <template
                    v-for="(msgItem, index) in chatStore.messageList"
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
                                    (authStore.loginInfo.uin == msgItem.sender.user_id
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
                                    ? authStore.loginInfo.uin ==
                                        msgItem.sender.user_id
                                        ? authStore.loginInfo.nickname
                                        : chatStore.chatInfo.show.name
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
                                    {{ chatStore.chatInfo.show.name }}
                                </span>
                                <span style="color: var(--color-main-0)">
                                    <font-awesome-icon
                                        :icon="['fas', 'plug']" />
                                    {{ settingsStore.sysConfig.address }}
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
                        <span v-else :style="{ 'color': msgItem.color }">
                            {{ msgItem.str }}
                        </span>
                    </div>
                </template>
            </div>
            <div class="shell-input">
                <div class="line-head">
                    <div>
                        <span>
                            <font-awesome-icon
                                :icon="['fas', 'folder-open']" />
                            {{ chatStore.chatInfo.show.name }}
                            {{ tags.replyName ? ' -> ' + tags.replyName : '' }}
                        </span>
                        <span style="color: var(--color-main-0)">
                            <font-awesome-icon :icon="['fas', 'plug']" />{{
                                settingsStore.sysConfig.address
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
                <label for="shell-msg-input" class="sr-only">{{ $t('命令行消息输入框') }}</label>
                <input
                    id="shell-msg-input"
                    v-model="msg"
                    @keyup="sendMsg"
                    @paste="addImg">
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
    import app, { i18n, uptime } from '@renderer/main'
    import SendUtil from '@renderer/function/sender'
    import packageInfo from '../../../../../package.json'

    import { nextTick, ref, watch, onMounted, onUnmounted, markRaw } from 'vue'
    import { useSettingsStore } from '@renderer/state/settings'
    import { getTrueLang } from '@renderer/function/utils/systemUtil'
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
    import { sendMsgRaw, getMsgRawTxt, getShowName } from '@renderer/function/utils/msgUtil'
    import { loadMoreHistoryMessages } from '@renderer/function/utils/appUtil'
    import { backend } from '@renderer/runtime/backend'
    import { useUIStore } from '@renderer/state/ui'
    import { useAuthStore } from '@renderer/state/auth'
    import { useContactStore } from '@renderer/state/contact'
    import { useChatStore } from '@renderer/state/chat'

    defineOptions({ name: 'ChatShell' })

    const uiStore = useUIStore()
    const authStore = useAuthStore()
    const contactStore = useContactStore()
    const chatStore = useChatStore()
    const settingsStore = useSettingsStore()
    const $t = i18n.global.t
    const { URL } = globalThis

    const { chat, list } = defineProps<{
        chat: any
        list: any
        mumberInfo: any
    }>()

    // --- data ---
    const tags = ref({
        fullscreen: false,
        fistget: true,
        cmdTags: {} as { [key: string]: any },
        newMsg: 0,
        replyName: null as string | null,
        replyId: null as string | null,
    })
    const trueLang = getTrueLang()
    const timeShow = ref('')
    let timeSetter: ReturnType<typeof setInterval> | undefined = undefined
    const msg = ref('')
    const supportCmd = ref<{ [key: string]: any }>({})
    const imgCache = ref<string[]>([])
    const sendCache = ref<MsgItemElem[]>([])
    const searchListCache = ref<(UserFriendElem & UserGroupElem)[]>([])

    // --- watchers ---
    watch(() => chat, () => {
        tags.value.fistget = true
        tags.value.cmdTags = {}
    })

    // --- methods ---
    function hasReply(msg: any) {
        if (msg.message) {
            const repItem = msg.message.filter((item: any) => {
                return item.type == 'reply'
            })
            if (repItem[0]) {
                const repMsg = chatStore.messageList.filter(
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
    }

    /**
     * 消息区滚动到指定位置
     * @param where 位置（px）
     * @param showAnimation 是否使用动画
     */
    function scrollTo(where: number | undefined, showAnimation = true) {
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
    }

    function scrollBottom(showAnimation = false) {
        const pan = document.getElementById('shell-pan')
        if (pan !== null) {
            scrollTo(pan.scrollHeight + 40, showAnimation)
        }
    }

    function updateList(_: number, oldLength: number) {
        if (tags.value.fistget && oldLength == 0) {
            tags.value.fistget = false
            addCommandOutF(':: joining chat ..', 'yellow')
            addCommandLineF(
                'screen ' + chatStore.chatInfo.show.id,
                chatStore.chatInfo.show.type,
            )
            addCommandLineF('[screen is terminating]')
            addCommandOutF(
                '* Stapxs QQ Lite Shell requires "FiraCode Nerd Font" to display complete command line symbols, please ensure the device has installed this font.\n\n* Use the command "fullscreen" or return to the parent directory to exit the full screen mode.\n\n* 使用 "help" 命令查看所有可用命令。\n\n\n',
                'var(--color-font)',
            )
            addCommandOutF(
                `  => 当前存在 ${contactStore.onMsgList.length} 个活跃会话\n\n`,
                'var(--color-font)',
            )
            addCommandOutF(
                `Welcome to Stapxs QQ Lite ${packageInfo.version} (Vue ${packageInfo.devDependencies.vue}-${import.meta.env.DEV ? 'development' : 'production'})\n\n`,
                'var(--color-font)',
            )
        }
        scrollBottom(true)
    }

    function showPop(newLength: number, oldLength: number) {
        if (newLength > oldLength) {
            const info = popList[popList.length - 1]
            if (info.svg == PopType.ERR) {
                addCommandOut('::' + info.text, 'red')
            } else {
                addCommandOut('::' + info.text, 'yellow')
            }
        }
    }

    function addCommandOut(
        raw: string,
        color = 'var(--color-font-2)',
        html = undefined as unknown,
    ) {
        chatStore.messageList.push({
            commandOut: true,
            color: color,
            str: raw,
            html: html,
        })
    }

    function addCommandOutF(
        raw: string,
        color = 'var(--color-font-2)',
        html = undefined as unknown,
    ) {
        chatStore.messageList.unshift({
            commandOut: true,
            color: color,
            str: raw,
            html: html,
        })
    }

    function addCommandLine(
        str: string,
        dir = chatStore.chatInfo.show.name,
        appendData: { [key: string]: any } = {},
    ) {
        chatStore.messageList.push({
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
    }

    function addCommandLineF(str: string, dir = chatStore.chatInfo.show.name) {
        chatStore.messageList.unshift({
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
    }

    function sendMsg(event: KeyboardEvent) {
        // 执行指令
        if (event.keyCode === 13) {
            addCommandLine(
                msg.value,
                chatStore.chatInfo.show.name,
                tags.value.cmdTags,
            )
            if (msg.value == '') return

            // 检查是否是支持的指令
            let currentMsg = msg.value
            if (currentMsg[0] == '/') {
                currentMsg =
                    'ssqq send ' + currentMsg.substring(1, currentMsg.length)
            }
            const msgList = currentMsg.split(' ')
            new Logger().add(
                LogType.DEBUG,
                'CMD: ' + msgList.toString(),
            )
            if (msgList.length > 0 && supportCmd.value[msgList[0]]) {
                supportCmd.value[msgList[0]].fun(currentMsg, msgList)
                msg.value = ''
            } else {
                addCommandOut(
                    'stsh: command not found, use the help command to view all available commands.',
                    'red',
                )
            }
            // 发送后处理
            tags.value.cmdTags = {}
            if (
                sendCache.value.filter((item) => {
                    return item.type === 'reply'
                }).length > 0
            ) {
                tags.value.cmdTags.reply = true
            }
        }
        setTimeout(() => {
            scrollBottom()
        }, 500)
    }

    function copy(str: string) {
        const input = document.getElementById('msgInput')
        if (input) {
            msg.value = 'ssqq reply ' + str + ' '
            input.focus()
        }
        app.config.globalProperties.$copyText(String(str)).then(
            () => {
                addCommandOut(
                    ':: Copy messageId successfully.',
                    'gray',
                )
            },
            () => {
                addCommandOut(':: Copy messageId failed.', 'gray')
            },
        )
    }

    /**
     * 添加特殊消息结构
     * @param data obj
     */
    function addSpecialMsg(data: SQCodeElem) {
        if (data !== undefined) {
            const index = sendCache.value.length
            sendCache.value.push(data.msgObj)
            if (data.addText === true) {
                if (data.addTop === true) {
                    msg.value = '[SQ:' + index + ']' + msg.value
                } else {
                    msg.value += '[SQ:' + index + ']'
                }
            }
            return index
        }
        return -1
    }

    function getRecallName(id: number) {
        let backName = id.toString()
        // 补全撤回者信息
        if (chatStore.chatInfo.show.type === 'group') {
            // 寻找群成员信息
            if (chatStore.chatInfo.info.group_members !== undefined) {
                const back =
                    chatStore.chatInfo.info.group_members.filter(
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
            backName = chatStore.chatInfo.show.name
        }
        return backName
    }

    function addImg(event: ClipboardEvent) {
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
                setImg(item.getAsFile())
                // 阻止默认行为
                event.preventDefault()
            }
        }
    }

    function setImg(blob: File | null) {
        const popInfoLocal = new PopInfo()
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
                        // 记录图片信息
                        // 只要你内存够猛，随便 cache 图片，这边就不做限制了
                        imgCache.value.push(base64data)
                    }
                }
            } else {
                popInfoLocal.add(PopType.INFO, $t('图片过大'))
            }
        }
    }

    // --- mounted ---
    onMounted(() => {
        supportCmd.value = {
            help: {
                info: 'Show All Command.',
                fun: () => {
                    let back = ''
                    Object.keys(supportCmd.value).forEach((name) => {
                        if (name != '')
                            back +=
                                '<span style="color: var(--color-font-2);"><span style="width: 13ch;display: inline-block;">' +
                                name +
                                '</span>: ' +
                                supportCmd.value[name].info +
                                '</span><br>'
                    })
                    addCommandOut('', '', back)
                },
            },
            ls: {
                info: 'List all contacts in the current message queue.',
                fun: () => {
                    searchListCache.value = [...contactStore.onMsgList.values()]
                    let str =
                        '  total ' + searchListCache.value.length + '\n'
                    let hasMsg = false
                    Array.from(contactStore.onMsgList).forEach((item, index) => {
                        if (item.new_msg == true) {
                            str += '• '
                            hasMsg = true
                        } else str += '  '
                        str += ('#' + index.toString()).padEnd(8, ' ')
                        str += (item.group_id ? item.group_id : item.user_id).toString().padEnd(20, ' ')
                        str += getShowName(item.group_name || item.nickname, item.remark)
                        str += '\n'
                    })
                    if (hasMsg)
                        addCommandOut(':: You have message.', 'yellow')
                    addCommandOut(str)
                },
            },
            ssqq: {
                info: 'Stapxs QQ Lite Base Command.',
                fun: (raw: string, item: string[]) => {
                    switch (item[1]) {
                        // 发送消息
                        case 'send': {
                            const rawMsg = raw.substring(
                                raw.indexOf('send') + 5,
                            )
                            const parsedMsg = SendUtil.parseMsg(
                                rawMsg,
                                sendCache.value,
                                imgCache.value,
                            )
                            if (chat.show.temp) {
                                sendMsgRaw(
                                    chat.show.id +
                                        '/' +
                                        chat.show.temp,
                                    chat.show.type,
                                    parsedMsg,
                                )
                            } else {
                                sendMsgRaw(
                                    chat.show.id,
                                    chat.show.type,
                                    parsedMsg,
                                )
                            }
                            // 发送后处理
                            sendCache.value = []
                            imgCache.value = []

                            tags.value.replyName = null
                            tags.value.replyId = null
                            break
                        }
                        // 寻找联系人
                        case 'list': {
                            const value = item[2]
                            searchListCache.value =
                                contactStore.userList.filter(
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
                                searchListCache.value.length +
                                '\n'
                            searchListCache.value.forEach((item, index) => {
                                str += ('#' + index.toString()).padEnd(8, ' ')
                                str += (item.group_id ? item.group_id : item.user_id).toString().padEnd(20, ' ')
                                str += getShowName(item.group_name || item.nickname, item.remark)
                                str += '\n'
                            })
                            addCommandOut(str)
                            break
                        }
                        // 回复消息
                        case 'reply': {
                            // 去除回复消息缓存
                            sendCache.value = sendCache.value.filter(
                                (item) => {
                                    return item.type !== 'reply'
                                },
                            )
                            if (item[2] && item[2] != 'clear') {
                                // 根据 item[2] 寻找这条消息 的名字
                                const replyMsg = chatStore.messageList.filter(
                                    (msg) => {
                                        return msg.message_id == item[2]
                                    },
                                )
                                tags.value.replyId = item[2]
                                if (replyMsg[0]) {
                                    tags.value.replyName = replyMsg[0].sender.card? replyMsg[0].sender.card: replyMsg[0].sender.nickname
                                }
                                addSpecialMsg({
                                    msgObj: { type: 'reply', id: item[2] },
                                    addText: false,
                                    addTop: true,
                                })
                            } else if (item[2] && item[2] == 'clear') {
                                sendCache.value = sendCache.value.filter(
                                    (item) => {
                                        return item.type !== 'reply'
                                    },
                                )
                                tags.value.replyName = null
                                tags.value.replyId = null
                            }
                            if (item[3]) {
                                supportCmd.value['ssqq'].fun(
                                    'ssqq send ' + item[3],
                                    ['ssqq', 'send', item[3]],
                                )
                                msg.value = ''
                            }
                            break
                        }
                        // 加载历史记录
                        case 'history': {
                            // 移除顶部的首次加载提示
                            if (chatStore.messageList[0]?.commandOut) {
                                chatStore.messageList.shift()
                                chatStore.messageList.shift()
                                chatStore.messageList.shift()
                                chatStore.messageList.shift()
                            }
                            // 加载历史消息
                            // 获取列表第一条消息 ID
                            const firstMsgId =
                                chatStore.messageList[0]?.message_id ?? 0
                            loadMoreHistoryMessages(firstMsgId)
                            break
                        }
                        default: {
                            addCommandOut(
                                'usage: ssqq send [msg]: Send a message, you can directly use "/<Message>" to replace it, \n           list [search]: Fuzzy search in the list of friends/groups, \n           reply [msgId] <message>: Use the message id to reply to the message, Click the message to copy the id, \n           history: Load more history.',
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
                        if (!tags.value.fullscreen) {
                            tags.value.fullscreen = true
                            pan.classList.add('full')
                        } else {
                            tags.value.fullscreen = false
                            pan.classList.remove('full')
                        }
                    }
                },
            },
            fastfetch: {
                info: 'print system info.',
                fun: () => {
                    const infoList = {
                        Application: 'Stapxs QQ Lite',
                        Kernel: packageInfo.version + '-' + backend.type,
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
                    let info = ''
                    Object.keys(infoList).forEach((key) => {
                        info += `<span>${key}<span>: ${infoList[key]}</span></span>`
                    })
                    addCommandOut(
                        '',
                        '',
                        `<div class="shell-fastfetch"><span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;***&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;*******************&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;***************************&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;*******************************&nbsp;&nbsp;&nbsp;&nbsp;<br>&nbsp;&nbsp;&nbsp;**************&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**************&nbsp;&nbsp;<br>&nbsp;&nbsp;*************&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;*************&nbsp;<br>&nbsp;**************&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;*************<br>&nbsp;*************,&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;*************<br>*************,&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;************<br>&nbsp;************&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;***********<br>&nbsp;***********,**&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;*.***********<br>&nbsp;&nbsp;*************&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;*************&nbsp;<br>&nbsp;&nbsp;&nbsp;***********************************&nbsp;&nbsp;<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;*******************************&nbsp;&nbsp;&nbsp;&nbsp;<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;***************************&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;*******************<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;***</span><div><span>${authStore.loginInfo.nickname}<span>@</span>ssqq-vue</span><a>-----------------</a>${info}<div><div style="background:black"></div><div style="background:red"></div><div style="background:green"></div><div style="background:yellow"></div><div style="background:blue"></div><div style="background:violet"></div></div></div></div>`,
                    )
                },
            },
            clear: {
                info: 'clear message list.',
                fun: () => {
                    chatStore.messageList = []
                    // PS：让消息列表不是空的防止输出首次进入信息
                    addCommandOut('')
                },
            },
            screen: {
                info: 'Switch to a specified contact chat.',
                fun: (_: string, itemInfo: string[]) => {
                    let id = '0'
                    if (
                        itemInfo.length == 1 &&
                        searchListCache.value.length == 1
                    ) {
                        id = (
                            searchListCache.value[0].user_id? searchListCache.value[0].user_id: searchListCache.value[0].group_id
                        ).toString()
                    } else {
                        id = itemInfo[1]
                        if (itemInfo[1] == '../') {
                            const pan = document.getElementById('chat-pan')
                            if (pan) {
                                tags.value.fullscreen = false
                                pan.classList.remove('full')
                                chatStore.chatInfo.show.id = 0
                            }
                            return
                        }
                        if (itemInfo[1].startsWith('#')) {
                            const index = Number(itemInfo[1].substring(1))
                            if (searchListCache.value[index]) {
                                id = (
                                    searchListCache.value[index].user_id? searchListCache.value[index]
                                              .user_id: searchListCache.value[index]
                                              .group_id
                                ).toString()
                            } else {
                                addCommandOut(
                                    ':: Search cache id does not exist',
                                    'red',
                                )
                                return
                            }
                        }
                    }
                    // 从缓存列表里寻找这个 ID
                    for (let i = 0; i < contactStore.userList.length; i++) {
                        const item = contactStore.userList[i]
                        const gid =
                            item.user_id !== undefined? item.user_id: item.group_id
                        if (String(gid) === id) {
                            // 检查显示列表里有没有它
                            if (!document.getElementById('user-' + id)) {
                                // 把它插入到显示列表
                                contactStore.baseOnMsgList?.set(Number(id), item)
                            }
                            nextTick(() => {
                                const bodyNext = document.getElementById(
                                    'user-' + id,
                                )
                                if (bodyNext !== null) {
                                    // 然后点一下它触发聊天框切换
                                    bodyNext.click()
                                } else {
                                    addCommandOut(
                                        ':: No valid contacts found',
                                        'red',
                                    )
                                }
                            })
                            return
                        }
                    }
                    addCommandOut(':: No valid contacts found', 'red')

                    tags.value.replyName = null
                    tags.value.replyId = null
                },
            },
        }

        watch(() => list.length, updateList)
        watch(() => popList.length, showPop)
        timeSetter = setInterval(() => {
            timeShow.value = Intl.DateTimeFormat(trueLang, {
                hour: 'numeric',
                minute: 'numeric',
                second: 'numeric',
            }).format(new Date())
            // 刷新新消息数
            tags.value.newMsg = [...contactStore.onMsgList.values()].filter((item) => {
                return item.new_msg == true
            }).length
        }, 1000)
        const pan = document.getElementById('chat-pan')
        if (pan) {
            tags.value.fullscreen = true
            pan.classList.add('full')
        }
    })

    onUnmounted(() => {
        if (timeSetter) {
            clearInterval(timeSetter)
            timeSetter = undefined
        }
    })
</script>

<style>
    .shell-pan-title {
        display: block;
        height: 40px;
        width: 100%;
        text-align: center;
        line-height: 40px;
        font-weight: bold;
        font-size: 0.8rem;
    }
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

    .shell-fastfetch {
        display: flex;
        flex-wrap: wrap;
    }
    .shell-fastfetch span {
        line-height: 1.2rem;
    }
    .shell-fastfetch > span {
        color: var(--color-main-0);
        margin-bottom: 20px;
        margin-right: 20px;
        letter-spacing: -1px;
    }
    .shell-fastfetch > div {
        flex-direction: column;
        display: flex;
    }
    .shell-fastfetch > div > a {
        font-family: unset;
    }
    .shell-fastfetch > div > span {
        color: var(--color-main);
    }
    .shell-fastfetch > div > span > span {
        color: var(--color-font);
    }
    .shell-fastfetch > div > div {
        margin-top: 1rem;
        display: flex;
    }
    .shell-fastfetch > div > div > div {
        height: 1.5rem;
        width: 2rem;
    }
</style>
