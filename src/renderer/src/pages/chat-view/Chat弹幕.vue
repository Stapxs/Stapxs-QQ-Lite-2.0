<!--
 * @FileDescription: 聊天面板页面（弹幕样式）
 * @Author: Stapxs
 * @Date: 2024/07/17
 * @Version: 1.0 - 初始版本
 * @Description: 这是个弹幕样式的聊天面板
-->
 <!-- eslint-disable max-len -->

<template>
    <div
        id="chat-pan"
        :class="{
            'chat-pan': true,
            'open': runtimeData.tags.openSideBar,
            'withBar': needBar()
        }">
        <div class="danmu-pan">
            <vue-danmaku
                ref="danmakuRef"
                style="height: calc(100vh - 40px); width: 100%"
                :channels="0"
                :danmus="danmus"
                :speeds="opt.speeds"
                random-channel
                :top="2"
                :loop="opt.loop"
                use-slot>
                <div class="controller">
                    <div
                        class="back"
                        @click="openLeftBar">
                        <font-awesome-icon :icon="['fas', 'angle-left']" />
                    </div>
                    <div
                        class="back"
                        @click="opera">
                        <font-awesome-icon
                            v-if="parseIndex == -1"
                            :icon="['fas', 'pause']" />
                        <font-awesome-icon
                            v-else
                            :icon="['fas', 'play']" />
                    </div>
                    <div class="loop">
                        <font-awesome-icon :icon="['fas', 'arrows-rotate']" />
                        <label class="ss-switch">
                            <input
                                v-model="opt.loop"
                                type="checkbox"
                                checked>
                            <div>
                                <div />
                            </div>
                        </label>
                    </div>
                    <div class="space" />
                    <div class="ss-range">
                        <font-awesome-icon
                            :class="opt.speeds < 120 ? 'w' : ''"
                            :icon="['fas', 'gauge-high']" />
                        <input
                            v-model="opt.speeds"
                            :style="`background-size: ${opt.speeds / 8}% 100%;`"
                            type="range"
                            min="20"
                            max="800"
                            step="20">
                        <span
                            :style="`color: var(--color-font${opt.speeds / 8 > 50 ? '-r' : ''})`">{{ opt.speeds }} px/s</span>
                    </div>
                </div>
                <div class="controller input">
                    <input
                        id="msgInput"
                        v-model="msg"
                        class="msgInput"
                        @keyup="sendMsg"
                        @paste="addImg">
                </div>
                <template #dm="{ index, danmu }">
                    <div
                        :data-id="index"
                        :class="
                            'danmu' +
                                (index == 0 ? ' new' : '') +
                                (runtimeData.loginInfo.uin == danmu.id
                                    ? ' me'
                                    : '') +
                                (parseIndex != index && parseIndex != -1
                                    ? ' opacity'
                                    : '')
                        "
                        @mouseenter="pause(index)"
                        @mouseleave="play"
                        @touchstart="pause(index)"
                        @touchend="play">
                        <img
                            name="avatar"
                            :src="
                                'https://q1.qlogo.cn/g?b=qq&s=0&nk=' + danmu.id
                            ">
                        <a>{{ danmus.length - index + 1 }}</a>
                        <span>{{ danmu.text }}</span>
                    </div>
                </template>
                <div :class="'danmu-bg' + (parseIndex != -1 ? ' hidden' : '')">
                    <svg
                        class="bg"
                        width="930"
                        height="414"
                        viewBox="0 0 930 414"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg">
                        <g clip-path="url(#clip0_810_16)">
                            <rect
                                width="1.40442"
                                height="49"
                                rx="0.70221"
                                transform="matrix(-0.745625 -0.666366 -0.666366 0.745625 455.05 67.6182)"
                                fill="var(--color-main)" />
                            <path
                                d="M402.229 113.088L407.629 103L413.029 113.088L421 117.867L413.029 122.646L407.629 133L403.514 122.646L394 117.867L402.229 113.088Z"
                                stroke="var(--color-main)"
                                stroke-linecap="round" />
                            <rect
                                width="1.40442"
                                height="49"
                                rx="0.70221"
                                transform="matrix(-0.745625 -0.666366 -0.666366 0.745625 516.05 146.936)"
                                fill="var(--color-main)" />
                            <path
                                d="M463.229 192.406L468.629 182.318L474.029 192.406L482 197.185L474.029 201.964L468.629 212.318L464.514 201.964L455 197.185L463.229 192.406Z"
                                stroke="var(--color-main)"
                                stroke-linecap="round" />
                            <rect
                                width="1.40442"
                                height="49"
                                rx="0.70221"
                                transform="matrix(-0.745625 -0.666366 -0.666366 0.745625 330.05 197.936)"
                                fill="var(--color-main)" />
                            <path
                                d="M277.229 243.406L282.629 233.318L288.029 243.406L296 248.185L288.029 252.964L282.629 263.318L278.514 252.964L269 248.185L277.229 243.406Z"
                                stroke="var(--color-main)"
                                stroke-linecap="round" />
                            <rect
                                width="1.40442"
                                height="49"
                                rx="0.70221"
                                transform="matrix(-0.745625 -0.666366 -0.666366 0.745625 468.05 290.936)"
                                fill="var(--color-main)" />
                            <path
                                d="M415.229 336.406L420.629 326.318L426.029 336.406L434 341.185L426.029 345.964L420.629 356.318L416.514 345.964L407 341.185L415.229 336.406Z"
                                stroke="var(--color-main)"
                                stroke-linecap="round" />
                            <rect
                                width="1.40442"
                                height="49"
                                rx="0.70221"
                                transform="matrix(-0.745625 -0.666366 -0.666366 0.745625 656.05 224.936)"
                                fill="var(--color-main)" />
                            <path
                                d="M603.229 270.406L608.629 260.318L614.029 270.406L622 275.185L614.029 279.964L608.629 290.318L604.514 279.964L595 275.185L603.229 270.406Z"
                                stroke="var(--color-main)"
                                stroke-linecap="round" />
                            <rect
                                width="1.40442"
                                height="49"
                                rx="0.70221"
                                transform="matrix(-0.745625 -0.666366 -0.666366 0.745625 803.05 70.9359)"
                                fill="var(--color-main)" />
                            <path
                                d="M750.229 116.406L755.629 106.318L761.029 116.406L769 121.185L761.029 125.964L755.629 136.318L751.514 125.964L742 121.185L750.229 116.406Z"
                                stroke="var(--color-main)"
                                stroke-linecap="round" />
                            <rect
                                width="1.40442"
                                height="49"
                                rx="0.70221"
                                transform="matrix(-0.745625 -0.666366 -0.666366 0.745625 864.05 276.936)"
                                fill="var(--color-main)" />
                            <path
                                d="M811.229 322.406L816.629 312.318L822.029 322.406L830 327.185L822.029 331.964L816.629 342.318L812.514 331.964L803 327.185L811.229 322.406Z"
                                stroke="var(--color-main)"
                                stroke-linecap="round" />
                            <rect
                                width="1.40442"
                                height="49"
                                rx="0.70221"
                                transform="matrix(-0.745625 -0.666366 -0.666366 0.745625 144.05 183.936)"
                                fill="var(--color-main)" />
                            <path
                                d="M91.2286 229.406L96.6286 219.318L102.029 229.406L110 234.185L102.029 238.964L96.6286 249.318L92.5143 238.964L83 234.185L91.2286 229.406Z"
                                stroke="var(--color-main)"
                                stroke-linecap="round" />
                            <rect
                                width="1.40442"
                                height="49"
                                rx="0.70221"
                                transform="matrix(-0.745625 -0.666366 -0.666366 0.745625 171.05 34.9359)"
                                fill="var(--color-main)" />
                            <rect
                                width="1.40442"
                                height="49"
                                rx="0.70221"
                                transform="matrix(-0.745625 -0.666366 -0.666366 0.745625 256.699 175.936)"
                                fill="var(--color-main)" />
                            <rect
                                width="1.40442"
                                height="49"
                                rx="0.70221"
                                transform="matrix(-0.745625 -0.666366 -0.666366 0.745625 701.699 132.936)"
                                fill="var(--color-main)" />
                            <rect
                                width="1.40442"
                                height="92.07"
                                rx="0.70221"
                                transform="matrix(-0.745625 -0.666366 -0.666366 0.745625 302.699 16.9359)"
                                fill="var(--color-main)" />
                            <rect
                                width="1.40442"
                                height="92.07"
                                rx="0.70221"
                                transform="matrix(-0.745625 -0.666366 -0.666366 0.745625 344.4 326.936)"
                                fill="var(--color-main)" />
                            <rect
                                width="1.40442"
                                height="92.07"
                                rx="0.70221"
                                transform="matrix(-0.745625 -0.666366 -0.666366 0.745625 657.4 337.936)"
                                fill="var(--color-main)" />
                            <rect
                                width="1.40442"
                                height="92.07"
                                rx="0.70221"
                                transform="matrix(-0.745625 -0.666366 -0.666366 0.745625 847.4 167.936)"
                                fill="var(--color-main)" />
                            <path
                                d="M118.229 80.4062L123.629 70.3177L129.029 80.4062L137 85.185L129.029 89.9638L123.629 100.318L119.514 89.9638L110 85.185L118.229 80.4062Z"
                                stroke="var(--color-main)"
                                stroke-linecap="round" />
                            <rect
                                width="1.40442"
                                height="49"
                                rx="0.70221"
                                transform="matrix(-0.745625 -0.666366 -0.666366 0.745625 205.05 372.936)"
                                fill="var(--color-main)" />
                            <path
                                d="M152.229 418.406L157.629 408.318L163.029 418.406L171 423.185L163.029 427.964L157.629 438.318L153.514 427.964L144 423.185L152.229 418.406Z"
                                stroke="var(--color-main)"
                                stroke-linecap="round" />
                            <rect
                                width="1.40442"
                                height="49"
                                rx="0.70221"
                                transform="matrix(-0.745625 -0.666366 -0.666366 0.745625 756.05 408.936)"
                                fill="var(--color-main)" />
                            <rect
                                width="1.40442"
                                height="49"
                                rx="0.70221"
                                transform="matrix(-0.745625 -0.666366 -0.666366 0.745625 686.05 5.93591)"
                                fill="var(--color-main)" />
                            <path
                                d="M633.229 51.4062L638.629 41.3177L644.029 51.4062L652 56.185L644.029 60.9638L638.629 71.3177L634.514 60.9638L625 56.185L633.229 51.4062Z"
                                stroke="var(--color-main)"
                                stroke-linecap="round" />
                            <circle
                                cx="291.5"
                                cy="122.5"
                                r="13"
                                stroke="var(--color-main)"
                                stroke-linecap="round" />
                            <circle
                                cx="846.5"
                                cy="407.5"
                                r="13"
                                stroke="var(--color-main)"
                                stroke-linecap="round" />
                            <circle
                                cx="910.5"
                                cy="64.5"
                                r="13"
                                stroke="var(--color-main)"
                                stroke-linecap="round" />
                        </g>
                        <defs>
                            <clipPath id="clip0_810_16">
                                <rect
                                    width="930"
                                    height="414"
                                    rx="7"
                                    fill="white" />
                            </clipPath>
                        </defs>
                    </svg>
                    <span class="name">{{
                        runtimeData.chatInfo.show.name
                    }}</span>
                    <div class="info">
                        <span class="time">
                            {{
                                list[list.length - 1]
                                    ? $t('上次消息 - {time}', {
                                        time: Intl.DateTimeFormat(trueLang, {
                                            hour: 'numeric',
                                            minute: 'numeric',
                                            second: 'numeric',
                                        }).format(
                                            new Date(
                                                list[list.length - 1].time *
                                                    1000,
                                            ),
                                        ),
                                    })
                                    : $t('暂无消息')
                            }}
                        </span>
                    </div>
                </div>
            </vue-danmaku>
        </div>
    </div>
</template>

<script lang="ts">
    import vueDanmaku from 'vue3-danmaku'
    import Option from '@renderer/function/option'

    import { Connector } from '@renderer/function/connect'
    import { defineComponent } from 'vue'
    import { runtimeData } from '@renderer/function/msg'
    import { getMsgRawTxt, sendMsgRaw } from '@renderer/function/utils/msgUtil'
    import { parseMsg } from '@renderer/function/sender'
    import {
        MsgItemElem,
        SQCodeElem,
    } from '@renderer/function/elements/information'
    import { PopInfo, PopType } from '@renderer/function/base'
    import { getTrueLang, needBar } from '@renderer/function/utils/systemUtil'
    import { backend } from '@renderer/runtime/backend'

    export default defineComponent({
        name: 'ChatDan',
        components: { vueDanmaku },
        props: ['chat', 'list', 'mumberInfo'],
        data() {
            return {
                needBar,
                backend,
                opt: {
                    speeds: 140,
                    loop: true,
                },
                runtimeData: runtimeData,
                trueLang: getTrueLang(),
                danmus: [],
                imgCache: [] as string[],
                sendCache: [] as MsgItemElem[],
                msg: '',
                parseIndex: -1,
                operaParse: false,
            }
        },
        mounted() {
            // 监听元素尺寸变化
            const ele = document.getElementById('chat-pan') as Element
            const resizeObserver = new ResizeObserver(() => {
                (this.$refs.danmakuRef as any)?.resize()
            })
            resizeObserver.observe(ele)
            // 监听消息列表，刷新到弹幕列表中
            this.$watch(() => this.list.length, this.updateList)
        },
        methods: {
            openLeftBar() {
                runtimeData.tags.openSideBar = !runtimeData.tags.openSideBar
            },

            pause(index: number) {
                (this.$refs.danmakuRef as any)?.pause()
                this.parseIndex = index
            },

            play() {
                if (!this.operaParse) {
                    (this.$refs.danmakuRef as any)?.play()
                    this.parseIndex = -1
                }
            },

            opera() {
                if (this.parseIndex == -1) {
                    this.operaParse = true
                    this.pause(0)
                } else {
                    this.operaParse = false
                    this.play()
                }
            },

            sendMsg(event: KeyboardEvent) {
                if (event.keyCode === 13 && this.msg != '') {
                    const msg = parseMsg(
                        this.msg, this.sendCache, this.imgCache)
                    if (this.chat.show.temp) {
                        sendMsgRaw(
                            this.chat.show.id + '/' + this.chat.show.temp,
                            this.chat.show.type,
                            msg,
                        )
                    } else {
                        sendMsgRaw(this.chat.show.id, this.chat.show.type, msg)
                    }
                    // 发送后处理
                    this.sendCache = []
                    this.imgCache = []
                    this.msg = ''
                }
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

            updateList() {
                if (this.opt.loop) {
                    // 如果弹幕列表长度是 20，请求更多消息
                    if (this.list.length == 20) {
                        const type = runtimeData.chatInfo.show.type
                        const id = runtimeData.chatInfo.show.id
                        const firstMsgId = this.list[0].message_id ?? 0
                        let name
                        const fullPage =
                            runtimeData.jsonMap.message_list?.pagerType ==
                            'full'
                        if (
                            runtimeData.jsonMap.message_list &&
                            type != 'group'
                        ) {
                            name = runtimeData.jsonMap.message_list.private_name
                        } else {
                            name = runtimeData.jsonMap.message_list.name
                        }
                        Connector.send(
                            name ?? 'get_chat_history',
                            {
                                group_id: type == 'group' ? id : undefined,
                                user_id: type != 'group' ? id : undefined,
                                message_id: firstMsgId,
                                count: fullPage? runtimeData.messageList.length + 10: 10,
                            },
                            'getChatHistory',
                        )
                    }
                    const list = this.list.map((data: any) => {
                        return {
                            text: getMsgRawTxt(data),
                            id: data.sender.user_id,
                        }
                    })
                    // list 只需要最新的 30 条消息，多余的从前删除
                    if (list.length > 30) {
                        list.splice(0, list.length - 30)
                    }
                    // 倒序, 保证最新的消息最现出来
                    this.danmus = list.reverse()
                } else {
                    // 只添加最后一条
                    (this.$refs.danmakuRef as any)?.push({
                        text: getMsgRawTxt(this.list[this.list.length - 1]),
                        id: this.list[this.list.length - 1].sender.user_id,
                    })
                }
            },
        },
    })
</script>

<style>
    .danmus {
        margin-top: 15px;
        height: calc(100% - 40px) !important;
    }
</style>
<style scoped>
    .ss-range input::-webkit-slider-thumb,
    .ss-range input::-moz-range-thumb {
        opacity: 0;
    }
    .ss-range input::-webkit-slider-runnable-track {
        opacity: 0;
    }

    .chat-pan {
        background: var(--color-card-1);
    }

    .chat-pan > div {
        pointer-events: visible;
    }
    .chat-pan > div:first-child {
        background: var(--color-card);
    }

    .controller {
        position: absolute;
        z-index: 1;
        width: calc(100% - 10px);
        height: 50px;
        pointer-events: none;
        display: flex;
        flex-direction: row;
        padding: 0 10px;
        align-items: center;
        flex-wrap: wrap;
    }
    .controller svg {
        color: var(--color-font-2);
    }
    .controller > div:not(.space) {
        height: 30px;
        border: 2px solid var(--color-card-2);
        border-radius: 7px;
        backdrop-filter: blur(15px);
        background: rgba(var(--color-card-rgb), 0.3);
        pointer-events: all;
        margin-right: 10px;
        cursor: pointer;
    }
    .controller > div.space {
        flex: 1;
    }
    .controller > div.back {
        width: 30px;
        display: flex;
        justify-content: center;
        align-items: center;
    }
    .controller > div.ss-range {
        padding-right: 5px;
    }
    .controller > div.ss-range > svg {
        padding: 8px 0;
        color: #fff;
        margin-right: -25px;
        z-index: 1;
        margin-left: 12px;
    }
    .controller > div.ss-range > svg.w {
        color: var(--color-font-2);
    }
    .controller > div.ss-range > input {
        background-color: transparent;
    }
    .controller > div.ss-range > span {
        color: var(--color-font-2);
        font-size: 0.7rem;
        margin-top: 2px;
    }

    .controller > div.loop {
        width: 80px;
        display: flex;
        flex-direction: row;
        align-items: center;
    }
    .controller > div.loop > svg {
        margin: 0 10px;
    }
    .controller > div.loop > label {
        --switch-dot-margin: 6px;
        --switch-height: 20px;
        min-width: 35px;
    }

    .controller.input {
        bottom: 0;
    }
    .msgInput {
        pointer-events: all;
        width: calc(100% - 35px);
        padding: 0 10px;
        height: 30px;
        border: 2px solid var(--color-card-2);
        outline: 0;
        border-radius: 7px;
        background: rgba(var(--color-card-rgb), 0.3);
        backdrop-filter: blur(15px);
    }

    .danmu-pan {
        border: 2px solid var(--color-card-2);
        border-radius: 7px;
        margin: 20px;
    }

    .danmu {
        display: flex;
        align-items: center;
        padding: 5px 10px;
        margin: 10px 0;
        border-radius: 7px;

        transition:
            background 0.5s,
            color 0.5s,
            opacity 0.5s;
    }
    .danmu.opacity {
        opacity: 0.5;
    }
    .danmu.me {
        background: var(--color-card-1);
    }
    .danmu.me > span {
        color: var(--color-font);
    }
    .danmu.new {
        background: var(--color-main);
    }
    .danmu.new > span {
        color: var(--color-font-r) !important;
    }
    .danmu > img {
        border-radius: 100%;
        width: 1.4rem;
        margin-right: 10px;
        border: 1px solid var(--color-main);
        background: var(--color-card-2);
    }
    .danmu > span {
        color: var(--color-font-2);
        font-size: 0.9rem;
    }
    .danmu > a {
        color: var(--color-font-1);
        background: var(--color-card-2);
        margin-right: 10px;
        padding: 2px;
        border-radius: 7px;
        width: 1.3rem;
        text-align: center;
        font-size: 0.7rem;
    }
    .danmu.new > a {
        display: none;
    }

    .danmu-bg {
        transition: opacity 0.7s;
        width: 100%;
        height: calc(100% - 60px);
        border-radius: 7px;
        display: flex;
        flex-direction: column-reverse;
        padding: 10px;
        opacity: 0.1;
        position: absolute;
        z-index: -1;
    }
    .danmu-bg.hidden {
        opacity: 0;
    }
    .danmu-bg span {
        color: var(--color-main);
        font-weight: bold;
    }
    .danmu-bg > span.name {
        white-space: nowrap;
        font-size: 50px;
    }
    .danmu-bg > svg.bg {
        width: 210%;
        position: absolute;
        z-index: -2;
        left: -20%;
        top: -15%;
        opacity: 0.9;
    }
    .danmu-bg > div.info {
        background: var(--color-main);
        border-radius: 7px;
        width: fit-content;
        padding: 10px;
    }
    .danmu-bg > div.info span {
        color: var(--color-font-r);
    }
</style>
