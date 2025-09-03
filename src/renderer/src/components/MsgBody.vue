<!--
 * @FileDescription: 消息模板
 * @Author: Stapxs
 * @Date:
 *      2022/08/03
 *      2022/12/12
 * @Version:
 *      1.0 - 初始版本
 *      1.5 - 重构为 ts 版本，代码格式优化
 -->

<template>
    <div :id="'chat-' + data.message_id"
        ref="msgMain"
        :class="'message' +
            (type ? ' ' + type : '') +
            (data.revoke ? ' revoke' : '') +
            (isMe ? ' me' : '') +
            (selected ? ' selected' : '')"
        :data-raw="getMsgRawTxt(data)"
        :data-sender="data.sender.user_id"
        :data-time="data.time"
        @mouseleave="hiddenUserInfo">
        <img v-show="!isMe || type == 'merge'"
            v-menu.prevent="event => $emit('showMenu', event, data)"
            name="avatar"
            :src="'https://q1.qlogo.cn/g?b=qq&s=0&nk=' + data.sender.user_id"

            @mouseenter="userInfoHoverHandle($event, getUserById(data.sender.user_id))"
            @mousemove="userInfoHoverHandle($event, getUserById(data.sender.user_id))"
            @mouseleave="userInfoHoverEnd($event)"
            @dblclick="sendPoke">
        <div v-if="isMe && type != 'merge'"
            class="message-space" />
        <div v-if="data.fake_msg == true"
            :class="'sending left' + (isMe ? ' me' : '')">
            <font-awesome-icon :icon="['fas', 'spinner']" />
        </div>
        <div :class="isMe ? type == 'merge' ? 'message-body' : 'message-body me' : 'message-body'">
            <template v-if="runtimeData.chatInfo.show.type == 'group' && !isMe">
                <span v-if="senderInfo && isRobot(senderInfo.user_id)" class="robot">{{ $t('机器人') }}</span>
                <span v-if="senderInfo?.role == 'owner'" class="owner">{{ $t('群主') }}</span>
                <span v-else-if="senderInfo?.role == 'admin'" class="admin">{{ $t('管理员') }}</span>
                <span v-if="senderInfo?.title && senderInfo?.title != ''">{{ senderInfo?.title.replace(/[\u202A-\u202E\u2066-\u2069]/g, '') }}</span>
            </template>
            <a v-if="data.sender.card || data.sender.nickname"
                v-show="!isMe || type == 'merge'">
                {{ data.sender.card ? data.sender.card : data.sender.nickname }}
            </a>
            <a v-else v-show="!isMe || type == 'merge'">
                {{ isMe ? runtimeData.loginInfo.nickname : runtimeData.chatInfo.show.name }}
            </a>
            <a v-if="selected" class="time">
                {{ Intl.DateTimeFormat(trueLang, {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: 'numeric',
                    minute: 'numeric',
                    second: 'numeric',
                }).format(getViewTime(getViewTime(data.time))) }}
            </a>
            <div
                v-menu.prevent="event => $emit('showMenu', event, data)"
                @touchstart.stop="msgMoveStart($event)"
                @touchend.stop="msgMoveEnd($event)"
                @touchmove.stop="msgKeepMove($event)"
                @wheel.stop="msgMoveWheel($event)">
                <!-- 消息体 -->
                <!-- 消息体 -->
                <template v-if="data.message.length === 0">
                    <span class="msg-text" style="opacity: 0.5">{{ $t('空消息') }}</span>
                </template>
                <template v-else-if="!hasCard()">
                    <div v-for="(item, index) in data.message"
                        :key="data.message_id + '-m-' + index"
                        :class="View.isMsgInline(item.type) ? 'msg-inline' : ''">
                        <div v-if="item.type === undefined" />
                        <span v-else-if="isDebugMsg" class="msg-text">{{ item }}</span>
                        <template v-else-if="item.type == 'text'">
                            <div v-if="hasMarkdown()" class="msg-md-title" />
                            <!-- {{ item.text }} -->
                            <span v-else v-show="item.text !== ''"
                                class="msg-text" @click="textClick" v-html="textIndex[index]" />
                        </template>
                        <div v-else-if="item.type == 'markdown'" v-once
                            :id="getMdHTML(item.content, 'msg-md-' + data.message_id)"
                            class="msg-md" />
                        <img v-else-if="item.type == 'image' && item.file == 'marketface'"
                            :class=" imgStyle(data.message.length, index, true) + ' msg-mface'"
                            :src="item.url"
                            @load="imageLoaded"
                            @error="imgLoadFail">
                        <img v-else-if="item.type == 'image'"
                            :title="(!item.summary || item.summary == '') ? $t('预览图片') : item.summary"
                            :alt="$t('图片')"
                            :class=" imgStyle(data.message.length, index, item.asface)"
                            :src="backend.proxyUrl(item.url)"
                            @load="imageLoaded"
                            @error="imgLoadFail"
                            @click="imgClick(data.message_id)">
                        <template v-else-if="item.type == 'face'">
                            <img v-if="getFace(item.id)"
                                :alt="item.text"
                                class="msg-face"
                                :src="getFace(item.id)"
                                :title="item.text">
                            <font-awesome-icon v-else :class="'msg-face-svg' + (isMe ? ' me' : '')" :icon="['fas', 'face-grin-wide']" />
                        </template>
                        <span v-else-if="item.type == 'bface'"
                            style="font-style: italic; opacity: 0.7">
                            [ {{ $t('图片') }}：{{ item.text }} ]
                        </span>
                        <div v-else-if="item.type == 'at'"
                            :class="getAtClass(item.qq)">
                            <a :data-id="item.qq"
                                :data-group="data.group_id"
                                @mouseenter="userInfoHoverHandle($event, getAtMember(item.qq))"
                                @mousemove="userInfoHoverHandle($event, getAtMember(item.qq))"
                                @mouseleave="userInfoHoverEnd($event)">
                                {{ getAtName(item) }}
                            </a>
                        </div>
                        <div
                            v-else-if="item.type == 'file'" :class="'msg-file' + (isMe ? ' me' : '')">
                            <div>
                                <div>
                                    <a>
                                        <font-awesome-icon :icon="['fas', 'file']" />
                                        {{ runtimeData.chatInfo.show.type == 'group' ? $t('群文件') : $t('离线文件') }}
                                    </a>
                                    <p>{{ loadFileBase( item, item.name ?? item.file_name, data.message_id) }}</p>
                                </div>
                                <i>{{ getSizeFromBytes(item.size ?? item.file_size) }}</i>
                            </div>
                            <div>
                                <font-awesome-icon
                                    v-if="item.download_percent === undefined"
                                    :icon="['fas', 'angle-down']"
                                    @click="downloadFile(item, data.message_id)" />
                                <svg v-else-if="item.download_percent !== undefined && item.download_percent < 100"
                                    class="download-bar"
                                    xmlns="http://www.w3.org/2000/svg">
                                    <circle cx="50%" cy="50%" r="40%"
                                        stroke-width="15%" ill="none" stroke-linecap="round" />
                                    <circle cx="50%" cy="50%" r="40%"
                                        stroke-width="15%" fill="none"
                                        :stroke-dasharray="item.download_percent === undefined ? '0,10000' :
                                            `${(Math.floor(2 * Math.PI * 25) * item.download_percent) / 100},10000`" />
                                </svg>
                                <font-awesome-icon v-else :icon="['fas', 'check']" />
                            </div>
                            <div v-if="data.fileView && Object.keys(data.fileView).length > 0"
                                class="file-view">
                                <img v-if="['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(data.fileView.ext)"
                                    :src="data.fileView.url">
                                <video v-else-if="['mp4', 'avi', 'mkv', 'flv'].includes(data.fileView.ext)"
                                    playsinline controls muted
                                    autoplay>
                                    <source :src="data.fileView.url"
                                        :type="'video/' + data.fileView.ext">
                                    现在还有不支持 video tag 的浏览器吗？
                                </video>
                                <span v-else-if="['txt', 'md'].includes(data.fileView.ext) && (item.size ?? item.file_size) < 2000000" class="txt">
                                    <a>&gt; {{ item.name }} - {{ $t('文件预览') }}</a>
                                    {{ getTxtUrl(data.fileView) }}{{ data.fileView.txt }}
                                </span>
                            </div>
                        </div>
                        <div v-else-if="item.type == 'video'"
                            class="msg-video">
                            <video playsinline controls muted
                                autoplay>
                                <source :src="item.url"
                                    type="video/mp4">
                                现在还有不支持 video tag 的浏览器吗？
                            </video>
                        </div>
                        <template v-else-if="item.type == 'forward'">
                            <div class="msg-raw-forward"
                                @click="openMerge()">
                                <span>{{ $t('合并转发消息') }}</span>
                                <div class="forward-msg">
                                    <div v-if="item.content === undefined">
                                        <div class="loading">
                                            <font-awesome-icon :icon="['fas', 'spinner']" />
                                            {{ $t('加载中') }}
                                        </div>
                                    </div>
                                    <div v-for="(i, indexItem) in item.content.slice(0, 3)" v-else-if="item.content.length > 0"
                                        :key="'raw-forward-' + indexItem">
                                        {{ i.sender.nickname }}:
                                        <span v-for="(msg, msgIndex) in i.message"
                                            :key="'raw-forward-item-' + msgIndex">
                                            <span v-if="msg.type == 'text'">
                                                {{ msg.text }}
                                            </span>
                                            <span v-else-if="msg.type == 'image'">
                                                [{{ $t('图片') }}]
                                            </span>
                                            <span v-else-if="msg.type == 'face' || msg.type == 'bface'">
                                                [{{ $t('表情') }}]
                                            </span>
                                            <span v-else-if="msg.type == 'file'">
                                                [{{ $t('文件') }}]{{ msg.data.file }}
                                            </span>
                                            <span v-else-if="msg.type == 'video'">
                                                [{{ $t('视频') }}]
                                            </span>
                                            <span v-else-if="msg.type == 'forward'">
                                                [{{ $t('聊天记录') }}]
                                            </span>
                                            <span v-else-if="msg.type == 'reply'">
                                                <!--原版QQ此处不做处理-->
                                            </span>
                                            <span v-else>
                                                [{{ $t('不支持的消息') }}]
                                            </span>
                                        </span>
                                    </div>
                                    <div v-else>
                                        {{ $t('加载失败') }}
                                    </div>
                                </div>
                                <div>
                                    <span v-if="item.content !== undefined">
                                        {{ $t('查看 {count} 条转发消息', { count: item.content.length }) }}
                                    </span>
                                    <span v-else>
                                        {{ $t('聊天记录') }}
                                    </span>
                                </div>
                            </div>
                        </template>
                        <div v-else-if="item.type == 'reply'"
                            :class="isMe ? type == 'merge' ? 'msg-replay' : 'msg-replay me' : 'msg-replay'"
                            @click="scrollToMsg(item.id)">
                            <font-awesome-icon :icon="['fas', 'reply']" />
                            <a :class="getRepMsg(item.id) ? '' : 'msg-unknown'"
                                style="cursor: pointer">
                                {{ getRepMsg(item.id) ?? $t('（查看回复消息）') }}
                            </a>
                        </div>
                        <div v-else-if="item.type == 'poke'" v-once :class="showPock()">
                            <font-awesome-icon class="poke-hand" style="margin-right: 5px;" :icon="['fas', 'fa-hand-point-up']" />
                            {{ $t('戳了戳你') }}
                        </div>
                        <span v-else class="msg-unknown">{{ '( ' + $t('不支持的消息') + ': ' + item.type + ' )' }}</span>
                    </div>
                </template>
                <template v-else>
                    <template v-for="(item, index) in data.message"
                        :key="data.message_id + '-m-' + index">
                        <CardMessage v-if="item.type == 'xml' || item.type == 'json'"
                            :id="data.message_id"
                            :item="item"
                            @page-view="loadLinkPreview" />
                    </template>
                </template>
                <!-- 链接预览框 -->
                <div v-if="pageViewInfo !== undefined && Object.keys(pageViewInfo).length > 0"
                    :class="'msg-link-view ' + linkViewStyle">
                    <template v-if="pageViewInfo.type == undefined">
                        <div :class="'bar' + (isMe ? ' me' : '')" />
                        <div>
                            <img v-if="pageViewInfo.img !== undefined"
                                :id="data.message_id + '-linkview-img'"
                                alt="预览图片"
                                title="查看图片"
                                :src="pageViewInfo.img"
                                @load="linkViewPicFin"
                                @error="linkViewPicErr">
                            <div class="body">
                                <p v-show="pageViewInfo.site">
                                    {{ pageViewInfo.site }}
                                </p>
                                <span :href="pageViewInfo.url">{{
                                    pageViewInfo.title
                                }}</span>
                                <span>{{ pageViewInfo.desc }}</span>
                            </div>
                        </div>
                    </template>
                    <template v-else>
                        <!-- 特殊 URL 的预览 -->
                        <div v-if="pageViewInfo.type == 'bilibili'" class="link-view-bilibili">
                            <div class="user">
                                <img :src="backend.proxyUrl(pageViewInfo.data.owner.face)">
                                <span>{{ pageViewInfo.data.owner.name }}</span>
                                <a>{{ Intl.DateTimeFormat(trueLang, {
                                    year: 'numeric',
                                    month: 'numeric',
                                    day: 'numeric',
                                    hour: 'numeric',
                                    minute: 'numeric'
                                }).format(getViewTime(pageViewInfo.data.public)) }}</a>
                            </div>
                            <img :src="backend.proxyUrl(pageViewInfo.data.pic)">
                            <span>{{ pageViewInfo.data.title }}</span>
                            <a>{{ pageViewInfo.data.desc }}</a>
                            <div class="data">
                                <font-awesome-icon :icon="['fas', 'play']" />
                                {{ pageViewInfo.data.stat.view }}
                                <font-awesome-icon :icon="['fas', 'coins']" />
                                {{ pageViewInfo.data.stat.coin }}
                                <font-awesome-icon :icon="['fas', 'star']" />
                                {{ pageViewInfo.data.stat.favorite }}
                                <font-awesome-icon :icon="['fas', 'thumbs-up']" />
                                {{ pageViewInfo.data.stat.like }}
                            </div>
                        </div>
                        <div v-else-if="pageViewInfo.type == 'music163'" class="link-view-music163">
                            <div>
                                <img :src="pageViewInfo.data.cover">
                                <div :id="'music163-audio-' + data.message_id" :class="isMe ? 'me' : ''">
                                    <a>{{ pageViewInfo.data.info.name }}
                                        <a v-if="pageViewInfo.data.info.free != null">{{ $t('（试听）') }}</a>
                                    </a>
                                    <span>{{ pageViewInfo.data.info.author.join('/') }}</span>
                                    <audio :src="backend.proxyUrl(pageViewInfo.data.play_link)"
                                        @loadedmetadata="audioLoaded()"
                                        @timeupdate="audioUpdate()" />
                                    <div>
                                        <input value="0" min="0" step="0.1"
                                            type="range" @input="audioChange()">
                                        <div><div /><div /></div>
                                        <font-awesome-icon v-if="!pageViewInfo.data.loaded" :icon="['fas', 'spinner']" spin />
                                        <template v-else>
                                            <font-awesome-icon v-if="!pageViewInfo.data.play" :icon="['fas', 'play']" @click="audioControll()" />
                                            <font-awesome-icon v-else :icon="['fas', 'pause']" @click="audioControll()" />
                                        </template>
                                        <span>00:00 / 00:00</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </template>
                </div>
            </div>
        </div>
        <div v-if="data.fake_msg == true"
            :class="'sending right' + (isMe ? ' me' : '')">
            <font-awesome-icon :icon="['fas', 'spinner']" />
        </div>
        <div v-if="data.emoji_like"
            :class="'emoji-like' + (isMe ? ' me' : '')">
            <div class="emoji-like-body">
                <div v-for="info in data.emoji_like"
                    v-show="getFace(info.emoji_id) != ''"
                    :key="'respond-' + data.message_id + '-' + info.emoji_id">
                    <img loading="lazy" :src="getFace(info.emoji_id) as any">
                    <span>{{ info.count }}</span>
                </div>
            </div>
        </div>
        <code style="display: none">{{ data.raw_message }}</code>
    </div>
</template>

<script setup lang="ts">
import Option from '@renderer/function/option'
import CardMessage from './msg-component/CardMessage.vue'
import app from '@renderer/main'
import markdownit from 'markdown-it'

import { MsgBodyFuns as ViewFuns } from '@renderer/function/model/msg-body'
import { defineComponent } from 'vue'
import { Connector } from '@renderer/function/connect'
import { getMessageList, runtimeData } from '@renderer/function/msg'
import { Logger, LogType, PopInfo, PopType } from '@renderer/function/base'
import { StringifyOptions } from 'querystring'
import { getFace, getMsgRawTxt, pokeAnime } from '@renderer/function/utils/msgUtil'
import {
    isRobot,
    openLink,
    sendStatEvent,
    useStayEvent,
} from '@renderer/function/utils/appUtil'
import {
    getSizeFromBytes,
    getTrueLang,
    getViewTime } from '@renderer/function/utils/systemUtil'
import { linkView } from '@renderer/function/utils/linkViewUtil'
import { MenuEventData, MergeStackData } from '@renderer/function/elements/information'
import { vMenu } from '@renderer/function/utils/appUtil'
import { wheelMask } from '@renderer/function/input'
import { backend } from '@renderer/runtime/backend'
import { UserInfoPan } from './UserInfoPan.vue'

type Msg = any
type IUser = any

const {
    data,
    selected,
    type,
    userInfoPan,
} = defineProps<{
    data: any
    selected?: boolean
    type?: string
    userInfoPan?: UserInfoPan
}>()

// 半 setup 半 旧的 api是这样的...旧的emit定义类型太麻烦了...
// eslint-disable-next-line  @typescript-eslint/no-unused-vars
const emit = defineEmits<{
    scrollToMsg: [...args: any[]]
    imageLoaded: [...args: any[]]
    sendPoke: [...args: any[]]
    leftMove: [msg: Msg]
    rightMove: [msg: Msg]
    showMenu: [event: MenuEventData, msg: Msg]
}>()

//#region == 长按/覆盖监视器 =========================================================
const {
    handle: userInfoHoverHandle,
    handleEnd: userInfoHoverEnd,
} = useStayEvent(
    (event: MouseEvent) => {
        return {
            x: event.clientX,
            y: event.clientY,
        }
    },
    {onFit: (eventData, ctx: number | IUser) => {
        userInfoPan?.open(ctx, eventData.x, eventData.y)
    },
    onLeave: () => {
        userInfoPan?.close()
    }}, 495
)
//#endregion

//#region == 工具函数 ================================================================
function getAtMember(id: number): IUser | number {
    const re = getUserById(id) ?? id
    return re
}
function getUserById(id: number): IUser | undefined {
    if (runtimeData.chatInfo.show.type === 'group') {
        if (!runtimeData.chatInfo.info.group_members) return id
        const user = runtimeData.chatInfo.info.group_members.find((item: IUser) => item.user_id == id)
        if (user) return user
        else return id
    }else {
        const user = runtimeData.userList.find((item: IUser) => item.user_id === id)
        if (user) return user
        else return id
    }
}
//#endregion
</script>
<script lang="ts">
    export default defineComponent({
        name: 'MsgBody',
        props: ['data', 'type', 'selected'],
        data() {
            return {
                backend,
                md: markdownit({ breaks: true }),
                isMe: false,
                isDebugMsg: Option.get('debug_msg'),
                linkViewStyle: '',
                View: ViewFuns,
                runtimeData: runtimeData,
                pageViewInfo: undefined as { [key: string]: any } | undefined,
                gotLink: false,
                getVideo: false,
                senderInfo: null as any,
                trueLang: getTrueLang(),
                textIndex: {} as { [key: string]: number },
                // 互动相关
                msgMove: {
                    move: 0,
                    onScroll: 'none' as 'none' | 'touch' | 'wheel',
                    touchLast: null as null | TouchEvent,
                },
            }
        },
        mounted() {
            // 初始化 isMe 参数
            this.isMe =
                Number(runtimeData.loginInfo.uin) ===
                Number(this.data.sender.user_id)
            // 补充发送者信息
            this.$watch(
                () => runtimeData.chatInfo.info.group_members.length,
                () => {
                    this.senderInfo =
                        runtimeData.chatInfo.info.group_members.filter(
                            (item: any) => {
                                return item.user_id == this.data.sender.user_id
                            },
                        )[0]
                },
            )
            this.senderInfo = runtimeData.chatInfo.info.group_members.filter(
                (item: any) => {
                    return item.user_id == this.data.sender.user_id
                },
            )[0]
            // 处理 textIndex
            for (let i = 0; i < this.data.message.length; i++) {
                const item = this.data.message[i]
                if(item.type == 'text') {
                    this.parseText(i)
                }
            }
            // 初始化解析合并转发消息
            if (this.data.message[0].type === 'forward'){
                Connector.callApi('forward_msg', {id: this.data.message[0].id})
                .then(data => {
                    data = getMessageList(data)
                    // PS：这个写法其实不合规，但是影响不大就这样罢
                    // eslint-disable-next-line vue/no-mutating-props
                    this.data.message[0].content = data
                })
            }
        },
        methods: {
            /**
             * 获取消息的纯文本（此方法可能会被遗弃）
             * @param message 消息对象
             */
            getMsgRawTxt(message: any) {
                return getMsgRawTxt(message)
            },

            /**
             * 根据消息状态获取 At 消息实际的 CSS class
             * @param who
             */
            getAtClass(who: number | string) {
                let back = 'msg-at'
                if (this.isMe && this.type != 'merge') {
                    back += ' me'
                }
                if (runtimeData.loginInfo.uin == who || who == 'all') {
                    back += ' atme'
                }
                return back
            },

            /**
             * 在 At 消息返回内容没有名字的时候尝试在群成员列表内寻找
             * @param item
             */
            getAtName(item: { [key: string]: any }) {
                if (item.qq == 'all') {
                    return '@' + this.$t('全体成员')
                }
                if (item.text != undefined) {
                    return item.text
                } else {
                    for (let i = 0; i < runtimeData.chatInfo.info.group_members.length; i++) {
                        const user = runtimeData.chatInfo.info.group_members[i]
                        if (user.user_id == Number(item.qq)) {
                            return ('@' + (user.card != '' && user.card != null? user.card: user.nickname))
                        }
                    }
                    return '@' + item.qq
                }
            },

            /**
             * 滚动到指定消息
             * @param id 消息 id
             */
            scrollToMsg(id: string) {
                this.$emit('scrollToMsg', 'chat-' + id)
            },

            /**
             * 处理图片显示需要的样式，顺便添加图片列表
             * @param length 消息段数
             * @param at 图片在消息中的位置
             */
            imgStyle(length: number, at: number, isFace: boolean) {
                let style = 'msg-img'
                // 处理样式
                if (isFace) {
                    style += ' face'
                }
                if (length === 1) {
                    return (style += ' alone')
                }
                if (at === 0) {
                    return (style += ' top')
                }
                if (at === length - 1) {
                    return (style += ' button')
                }
                return style
            },

            /**
             * 图片点击
             * @param msgId 消息 ID
             */
            imgClick(msgId: string) {
                const images = runtimeData.mergeMessageImgList ?? runtimeData.chatInfo.info.image_list
                if (images !== undefined) {
                    // 寻找实际的序号
                    let num = -1
                    for (let i = 0; i < images.length; i++) {
                        const item = images[i]
                        if (item.message_id == msgId) {
                            num = i
                            break
                        }
                    }
                    // 显示
                    const viewer = app.config.globalProperties.$viewer
                    if (num >= 0 && viewer) {
                        viewer.view(num)
                        viewer.show()
                        runtimeData.tags.viewer.index = num
                    } else {
                        new PopInfo().add(PopType.INFO, this.$t('定位图片失败'))
                    }
                }
            },

            /**
             * 图片加载完成，滚到底部
             */
            imageLoaded(event: Event) {
                const img = event.target as HTMLImageElement
                // 计算图片宽度
                const vh = document.documentElement.clientHeight || document.body.clientHeight
                const imgHeight = img.naturalHeight || img.height
                let imgWidth = img.naturalWidth || img.width
                if (imgHeight > vh * 0.35)
                    imgWidth = (imgWidth * (vh * 0.35)) / imgHeight
                img.style.setProperty('--width', `${imgWidth}px`)
                this.$emit('imageLoaded', img.offsetHeight)
            },

            /**
             * 图片加载失败
             */
            imgLoadFail(event: Event) {
                const sender = event.currentTarget as HTMLImageElement
                const parent = sender.parentNode as HTMLDivElement
                parent.style.display = 'flex'
                parent.style.flexDirection = 'column'
                parent.style.alignItems = 'center'
                parent.style.padding = '20px 50px'
                parent.style.border = '2px dashed var(--color-card-2)'
                parent.style.borderRadius = '10px'
                parent.style.margin = '10px 0'
                parent.innerText = ''
                // 新建 svg
                const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
                svg.setAttribute('viewBox', '0 0 512 512')
                svg.innerHTML =
                    '<path d="M119.4 44.1c23.3-3.9 46.8-1.9 68.6 5.3l49.8 77.5-75.4 75.4c-1.5 1.5-2.4 3.6-2.3 5.8s1 4.2 2.6 5.7l112 104c2.9 2.7 7.4 2.9 10.5 .3s3.8-7 1.7-10.4l-60.4-98.1 90.7-75.6c2.6-2.1 3.5-5.7 2.4-8.8L296.8 61.8c28.5-16.7 62.4-23.2 95.7-17.6C461.5 55.6 512 115.2 512 185.1v5.8c0 41.5-17.2 81.2-47.6 109.5L283.7 469.1c-7.5 7-17.4 10.9-27.7 10.9s-20.2-3.9-27.7-10.9L47.6 300.4C17.2 272.1 0 232.4 0 190.9v-5.8c0-69.9 50.5-129.5 119.4-141z"/>'
                svg.style.width = '40px'
                svg.style.opacity = '0.8'
                svg.style.fill = 'var(--color-main)'
                if (this.isMe) {
                    svg.style.fill = 'var(--color-font-r)'
                }
                parent.appendChild(svg)
                // 新建 span
                const span = document.createElement('span')
                span.innerText = this.$t('加载图片失败')
                span.style.marginTop = '10px'
                span.style.fontSize = '0.8rem'
                span.style.color = 'var(--color-font-2)'
                if (this.isMe) {
                    span.style.color = 'var(--color-font-1-r)'
                }
                parent.appendChild(span)
                // 链接
                const a = document.createElement('a')
                a.innerText = this.$t('预览图片')
                a.target = '__blank'
                a.href = sender.src
                a.style.marginTop = '10px'
                a.style.fontSize = '0.7rem'
                a.style.color = 'var(--color-font-2)'
                if (this.isMe) {
                    a.style.color = 'var(--color-font-1-r)'
                }
                parent.appendChild(a)
            },

            /**
             * 处理纯文本消息和链接预览
             * @param text 纯文本消息
             */
            async parseText(index: number) {
                let text = this.data.message[index].text

                const logger = new Logger()
                text = ViewFuns.parseText(text)
                // 防止大量的重复字符
                const filtedText = text.replace(/(.)(\1{10,})/g, '$1<span style="opacity:0.7;margin-right:10px;">...</span>')
                if(filtedText != text) {
                    const style = 'display:block;margin-top:10px;opacity:0.7;cursor:pointer;'
                    text = filtedText + '<a style="' + style +'" data-raw="' + text + '" onclick="this.parentNode.innerText = this.dataset.raw;return false;">' + this.$t('显示原始消息') + '</a>'
                }
                // 链接判定
                const reg = /(http|https):\/\/[\w\-_]+(\.[\w\-_]+)+([\w\-.,@?^=%&:/~+#]*[\w\-@?^=%&/~+#])?/gi
                text = text.replaceAll(reg, '<a href="" data-link="$&" onclick="return false">$&</a>')
                const linkList = text.match(reg)
                if (linkList !== null && !this.gotLink) {
                    queueMicrotask(async() => {
                        this.gotLink = true
                        const fistLink = linkList[0]
                        let protocol = ''
                        let domain = ''
                        try {
                            protocol = new URL(fistLink).protocol + '//'
                            domain = new URL(fistLink).hostname
                        } catch (ignore) {
                            // ignore
                        }
                        sendStatEvent('link_view', { domain: domain })

                        let data = null as any
                        let finaLink = fistLink
                        try {
                            finaLink = await backend.call('Onebot', 'sys:getFinalRedirectUrl', true, fistLink)
                            if(!finaLink) {
                                finaLink = fistLink
                            }
                        } catch(_) { /**/ }
                        const showLinkList = {
                            bilibili: ['bilibili.com', 'b23.tv', 'bili2233.cn', 'acg.tv'],
                            music163: ['music.163.com', '163cn.tv'],
                        }
                        for (const key in showLinkList) {
                            if (showLinkList[key].some((item: string) => finaLink.includes(item))) {
                                data = await linkView[key](finaLink)
                            }
                        }
                        // 通用 og 解析
                        if(!data) {
                            if (!backend.isWeb()) {
                                let html = await backend.call('Onebot', 'sys:getHtml', true, finaLink)
                                if(html) {
                                    const headEnd = html.indexOf('</head>')
                                    html = html.slice(0, headEnd)
                                    // 获取所有的 og meta 标签
                                    const ogRegex = /<meta\s+property="og:([^"]+)"\s+content="([^"]+)"\s*\/?>/g
                                    const ogTags = {} as {[key: string]: string}
                                    let match: string[] | null
                                    while ((match = ogRegex.exec(html)) !== null) {
                                        ogTags[`og:${match[1]}`] = match[2]
                                    }
                                    data = ogTags
                                }
                            } else {
                                // 获取链接预览
                                const response = await fetch(`${import.meta.env.VITE_APP_LINK_VIEW}/${encodeURIComponent(fistLink)}`)
                                if(response.ok) {
                                    const res = await response.json()
                                    if (res.status === undefined && Object.keys(res).length > 0) {
                                        data = res
                                    }
                                }
                            }
                        }

                        logger.add(LogType.DEBUG, 'Link View: ', data)
                        if(data) {
                            this.loadLinkPreview(protocol + domain, data)
                        }
                    })
                }
                this.textIndex[index] = text
            },

            loadLinkPreview(domain: string, res: any) {
                const logger = new Logger()
                logger.debug('获取链接预览成功: ' + res['og:title'])
                if(res != undefined) {
                    if (res.type == undefined) {
                        if(Object.keys(res).length > 0) {
                            let imgUrl = res['og:image']
                            if (imgUrl && !imgUrl.startsWith('http') && !imgUrl.startsWith('www')) {
                                imgUrl = new URL(imgUrl.startsWith('/') ? imgUrl : '/' + imgUrl, domain).toString()
                            }
                            const pageData = {
                                site: res['og:site_name'] === undefined ? '' : res['og:site_name'],
                                title: res['og:title'] === undefined ? '' : res['og:title'],
                                desc: res['og:description'] === undefined ? '' : res['og:description'],
                                img: imgUrl,
                                link: res['og:url'],
                            }
                            this.pageViewInfo = pageData
                        }
                    } else {
                        this.pageViewInfo = res
                    }
                }
            },

            /**
             * 对链接预览的图片长宽进行判定以确定显示样式
             */
            linkViewPicFin() {
                const img = document.getElementById(
                    this.data.message_id + '-linkview-img',
                ) as HTMLImageElement
                if (img !== null) {
                    const w = img.naturalWidth
                    const h = img.naturalHeight
                    if (w > h) {
                        this.linkViewStyle = 'large'
                    }
                }
            },
            linkViewPicErr() {
                if(this.pageViewInfo)
                    this.pageViewInfo.img = undefined
            },

            /**
             * 隐藏 At 信息面板
             */
            hiddenUserInfo() {
                if (runtimeData.chatInfo.info.now_member_info !== undefined) {
                    runtimeData.chatInfo.info.now_member_info = undefined
                }
            },

            /**
             * 尝试在消息列表中寻找这条被回复的消息，获取消息内容
             * @param message_id
             */
            getRepMsg(message_id: string) {
                const list = this.runtimeData.messageList.filter((item) => {
                    return item.message_id == message_id
                })
                if (list.length === 1) {
                    if (list[0].message.length > 0)
                        return ( list[0].sender.nickname + ': ' + getMsgRawTxt(list[0]))
                    else return this.$t('（获取回复消息失败）')
                }
                return null
            },

            /**
             * 下载消息中的文件
             * @param data 消息对象
             */
            downloadFile(data: any, message_id: string) {
                // 获取下载链接
                let name = runtimeData.jsonMap.file_download?.private_name
                if(runtimeData.chatInfo.show.type == 'group') {
                    name = runtimeData.jsonMap.file_download?.name
                }
                Connector.send(name, {
                    file_id: data.file_id,
                    group_id: runtimeData.chatInfo.show.type == 'group' ? runtimeData.chatInfo.show.id : undefined,
                },
                    'downloadFile_' + message_id + '_' + btoa(encodeURIComponent(data.name ?? data.file_name)),
                )
            },

            /**
             * 文本消息被点击
             * @param event 事件
             */
            textClick(event: Event) {
                const target = event.target as HTMLElement
                if (target.dataset.link) {
                    // 点击了链接
                    const link = target.dataset.link
                    openLink(link)
                }
            },

            /**
             * 对部分文件类型进行预览处理
             * @param name 文件名
             */
            loadFileBase(
                data: any,
                name: string,
                message_id: StringifyOptions,
            ) {
                const ext = name.split('.').pop()
                // 寻找消息
                const msg = runtimeData.messageList.find(
                    (item) => item.message_id === message_id,
                )
                if (ext && msg?.fileView == undefined) {
                    // 图片、视频和文本文件获取文件链接
                    const list = [
                        'jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp',
                        'mp4', 'avi', 'mkv', 'flv',
                        'txt', 'md',
                    ]
                    if (list.includes(ext)) {
                        msg.fileView = {}
                        // 获取下载链接
                        let name = runtimeData.jsonMap.file_download?.private_name
                        if(runtimeData.chatInfo.show.type == 'group') {
                            name = runtimeData.jsonMap.file_download?.name
                        }
                        if(name) {
                            Connector.send(name, {
                                file_id: data.file_id,
                                group_id: runtimeData.chatInfo.show.type == 'group' ? runtimeData.chatInfo.show.id : undefined,
                            },
                                'loadFileBase_' + this.data.message_id + '_' + ext,
                            )
                        }
                    }
                }
                return name
            },

            /**
             * 下载 txt 文件并获取文件内容
             * @param url 链接
             */
            getTxtUrl(view: any) {
                const url = view.url
                // 保存文件为 Blob
                fetch(url)
                    .then((r) => r.blob())
                    .then((blob) => {
                        // 读取文件内容并返回文本
                        const reader = new FileReader()
                        reader.readAsText(blob, 'utf-8')
                        reader.onload = function () {
                            // 只取前 300 字，超出部分加上 ……
                            const txt = reader.result as string
                            view.txt = txt.length > 300? txt.slice(0, 300) + '…': txt
                        }
                    })
            },

            hasCard() {
                let hasCard = false
                this.data.message.forEach((item: any) => {
                    if (item.type === 'json' || item.type === 'xml') {
                        hasCard = true
                    }
                })
                return hasCard
            },

            hasMarkdown() {
                let hasMarkdown = false
                this.data.message.forEach((item: any) => {
                    if (item.type === 'markdown') {
                        hasMarkdown = true
                    }
                })
                return hasMarkdown
            },

            sendPoke() {
                // 调用上级组件的 poke 方法
                this.$emit('sendPoke', this.data.sender.user_id)
            },

            async showPock() {
                // 如果是最后一条消息并且在最近发送
                if (this.data.message_id ==
                    runtimeData.messageList[runtimeData.messageList.length - 1].message_id &&
                    (new Date().getTime() - getViewTime(this.data.time)) / 1000 < 5) {
                    let windowInfo = null as {
                        x: number
                        y: number
                        width: number
                        height: number
                    } | null
                    if (backend.isDesktop()) {
                        windowInfo = await backend.call('Onebot', 'win:getWindowInfo', true)
                    }
                    const message = document.getElementById('chat-' + this.data.message_id)
                    let item = document.getElementById('app')
                    if (backend.isDesktop()) {
                        item = message?.getElementsByClassName('poke-hand')[0] as HTMLImageElement
                    }
                    this.$nextTick(() => {
                        pokeAnime(item, windowInfo)
                    })
                }
            },

            getMdHTML(str: string, id: string) {
                const html = this.md.render(str)
                const div = document.createElement('div')
                div.innerHTML = html
                // 二次处理 img；img 拥有这样的 alt：cornerRadius=100 #48px #48px
                const imgs = div.getElementsByTagName('img')
                for(let i=0; i<imgs.length; i++) {
                    const img = imgs[i]
                    const alt = img.getAttribute('alt')
                    if(alt) {
                        const size = alt.split('#')
                        if(size.length == 3) {
                            img.style.width = size[1]
                            img.style.height = size[2]
                        }
                    }
                }
                // 二次处理 a；去除 href
                const links = div.getElementsByTagName('a')
                for(let i=0; i<links.length; i++) {
                    const link = links[i]
                    const href = link.getAttribute('href')
                    if(href) {
                        link.setAttribute('data-link', href)
                        link.setAttribute('href', '')
                        link.onclick = (e) => {
                            e.preventDefault()
                            openLink(href)
                        }
                    }
                }

                const body = document.getElementById(id)
                if(body) {
                    body.innerHTML = ''
                    body.appendChild(div)
                }

                return id
            },

            audioLoaded() {
                const mainBody = document.getElementById('music163-audio-' + this.data.message_id)
                if(mainBody) {
                    const bar = mainBody.getElementsByTagName('input')[0]
                    const audio = mainBody.getElementsByTagName('audio')[0]
                    const span = mainBody.getElementsByTagName('div')[0].getElementsByTagName('span')[0]
                    const div = mainBody.getElementsByTagName('div')[0].getElementsByTagName('div')[0].children[1] as HTMLDivElement
                    if(bar && audio && span && div) {
                        const max = this.pageViewInfo?.data.info.time ?? audio.duration
                        bar.max = max.toString()
                        // 设置进度文本
                        const minutes = Math.floor(max / 60)
                        const seconds = Math.floor(max % 60)
                        span.innerHTML = '00:00 / ' +
                            (minutes < 10 ? '0' + minutes : minutes) + ':' +
                            (seconds < 10 ? '0' + seconds : seconds)
                        // 设置不可播放长度
                        if(max > audio.duration) {
                            const percent = audio.duration / max
                            if(percent > 0) {
                                div.style.width = 'calc(' + (1 - percent) * 100 + '% - 9px)'
                                div.style.marginLeft = 'calc(' + percent * 100 + '% + 9px)'
                            } else {
                                div.style.width = '0%'
                            }
                        }
                    }
                }
                if(this.pageViewInfo) this.pageViewInfo.data.loaded = true
            },

            audioControll() {
                const mainBody = document.getElementById('music163-audio-' + this.data.message_id)
                if(mainBody) {
                    const audio = mainBody.getElementsByTagName('audio')[0]
                    if(audio) {
                        if(audio.paused) {
                            audio.play()
                            if(this.pageViewInfo) this.pageViewInfo.data.play = true
                        } else {
                            audio.pause()
                            if(this.pageViewInfo) this.pageViewInfo.data.play = false
                        }
                    }
                }
            },

            audioUpdate() {
                const mainBody = document.getElementById('music163-audio-' + this.data.message_id)
                if(mainBody) {
                    const bar = mainBody.getElementsByTagName('input')[0]
                    const audio = mainBody.getElementsByTagName('audio')[0]
                    const span = mainBody.getElementsByTagName('div')[0].getElementsByTagName('span')[0]
                    const div = mainBody.getElementsByTagName('div')[0].getElementsByTagName('div')[0].children[0] as HTMLDivElement
                    if(bar && audio && span && div) {
                        const max = this.pageViewInfo?.data.info.time ?? audio.duration
                        bar.value = audio.currentTime.toString()
                        // 设置进度文本
                        const minutes = Math.floor(audio.currentTime / 60)
                        const seconds = Math.floor(audio.currentTime % 60)
                        const minutesDur = Math.floor(max / 60)
                        const secondsDur = Math.floor(max % 60)

                        span.innerHTML = (minutes < 10 ? '0' + minutes : minutes) + ':' +
                            (seconds < 10 ? '0' + seconds : seconds) + ' / ' +
                            (minutesDur < 10 ? '0' + minutesDur : minutesDur) + ':' +
                            (secondsDur < 10 ? '0' + secondsDur : secondsDur)

                        const perCent = (audio.currentTime / max) * 100
                        if(perCent > 100) {
                            div.style.width = '100%'
                        } else {
                            div.style.width = perCent + '%'
                        }

                        if(audio.currentTime >= audio.duration) {
                            bar.value = '0'
                            audio.currentTime = 0
                            if(this.pageViewInfo) this.pageViewInfo.data.play = false
                            div.style.width = '0%'
                        }
                    }
                }
            },

            audioChange() {
                const mainBody = document.getElementById('music163-audio-' + this.data.message_id)
                if(mainBody) {
                    const bar = mainBody.getElementsByTagName('input')[0]
                    const audio = mainBody.getElementsByTagName('audio')[0]
                    if(bar && audio) {
                        const value = parseFloat(bar.value)
                        if(value <= audio.duration) {
                            if(audio.paused) {
                                audio.currentTime = value
                            } else {
                                audio.pause()
                                audio.currentTime = value
                                audio.play()
                            }
                        } else {
                            bar.value = audio.currentTime.toString()
                        }
                    }
                }
            },
            openMerge(){
                const data: MergeStackData = {
                    messageList: [],
                    imageList: [],
                    placeCache: 0,
                    ready: false,
                    forwardMsg: this.data
                }
                const seg = this.data.message[0]
                if (seg.content !== undefined){
                    data.ready = true
                    data.messageList = seg.content
                    // 提取合并转发中的消息图片列表
                    const imgList = [] as {
                        index: number
                        message_id: string
                        img_url: string
                    }[]
                    let index = 0
                    data.messageList.forEach((item) => {
                        item.message.forEach((msg) => {
                            if (msg.type == 'image') {
                                imgList.push({
                                    index: index,
                                    message_id: item.message_id,
                                    img_url: msg.url,
                                })
                                index++
                            }
                        })
                    })
                    data.imageList = imgList
                }
                runtimeData.mergeMsgStack.push(data)
            },
            isFace(item: any) {
                if (item.asface) return true
                // 这是神马鬼玩意？一个驼峰，一个下划线，真是一个协议段一个协议啊
                else if (item.subType == 7) return true
                else if (item.sub_type == 7) return true
                return false
            },

            //#region ==互动相关================================
            // 滚轮滑动
            msgMoveWheel(event: WheelEvent) {
                const process = (event: WheelEvent) => {
                    // 正在触屏,不处理
                    if (this.msgMove.onScroll === 'touch') return false
                    const x = event.deltaX
                    const y = event.deltaY
                    const absX = Math.abs(x)
                    const absY = Math.abs(y)
                    // 斜度过大
                    if (absY !== 0 && absX / absY < 2) return false
                    this.dispenseMove('wheel', -x / 3)
                    return true
                }
                if (!process(event)) return
                event.preventDefault()
                // 创建遮罩
                // 由于在窗口移动中,窗口判定箱也在移动,当指针不再窗口外,事件就断了
                // 所以要创建一个不会动的全局遮罩来处理
                wheelMask(process,()=>{
                    this.dispenseMove('wheel', 0, true)
                })
            },

            // 触屏开始
            msgMoveStart(event: TouchEvent) {
                if (this.msgMove.onScroll === 'wheel') return
                // 触屏开始时，记录触摸点
                this.msgMove.touchLast = event
            },

            // 触屏滑动
            msgKeepMove(event: TouchEvent) {
                if (this.msgMove.onScroll === 'wheel') return
                if (!this.msgMove.touchLast) return
                const touch = event.changedTouches[0]
                const lastTouch = this.msgMove.touchLast.changedTouches[0]
                const deltaX = touch.clientX - lastTouch.clientX
                const deltaY = touch.clientY - lastTouch.clientY
                const absX = Math.abs(deltaX)
                const absY = Math.abs(deltaY)
                // 斜度过大
                if (absY !== 0 && absX / absY < 2) return
                // 触屏移动
                this.msgMove.touchLast = event
                this.dispenseMove('touch', deltaX)
            },

            // 触屏滑动结束
            msgMoveEnd(event: TouchEvent) {
                if (this.msgMove.onScroll === 'wheel') return
                const touch = event.changedTouches[0]
                const lastTouch = this.msgMove.touchLast?.changedTouches[0]
                if (lastTouch) {
                    const deltaX = touch.clientX - lastTouch.clientX
                    const deltaY = touch.clientY - lastTouch.clientY
                    const absX = Math.abs(deltaX)
                    const absY = Math.abs(deltaY)
                    // 斜度过大
                    if (absY === 0 || absX / absY > 2) {
                        this.dispenseMove('touch', deltaX)
                    }
                }
                this.dispenseMove('touch', 0, true)
                this.msgMove.touchLast = null
            },
            /**
             * 分发触屏/滚轮情况
             */
            dispenseMove(type: 'touch' | 'wheel', value: number, end: boolean = false) {
                if (
                    !end &&
                    this.msgMove.onScroll === 'none'
                ) this.startMove(type, value)
                if (this.msgMove.onScroll === 'none') return
                if (end) this.endMove()
                else this.keepMove(value)
            },
            /**
             * 开始窗口移动
             */
            startMove(type: 'touch' | 'wheel', value: number) {
                new Logger().add(LogType.UI, '开始窗口移动: ' + type + '')
                this.msgMove.onScroll = type
                this.msgMove.move = value
            },
            /**
             * 保持窗口移动
             */
            keepMove(value: number){
                this.msgMove.move += value
                const limit = runtimeData.inch * 0.75
                if (this.msgMove.move < -limit) this.msgMove.move = -limit
                else if (this.msgMove.move > runtimeData.inch * 0.75) this.msgMove.move = limit
                const move = this.msgMove.move
                const target = this.$refs.msgMain as HTMLDivElement
                target.style.transform = 'translateX(' + move + 'px)'
            },
            /**
             * 结束窗口移动
             */
            endMove() {
                new Logger().add(LogType.UI, '结束窗口移动: ' + this.msgMove.onScroll)
                // 保留自己要的数据
                const move = this.msgMove.move
                // 重置数据
                this.msgMove.onScroll = 'none'
                this.msgMove.move = 0

                const target = this.$refs.msgMain as HTMLDivElement

                target.style.transform = ''
                target.style.transition = 'all 0.3'

                // 移动距离大小判定
                const inch = runtimeData.inch
                // 如果移动距离大于0.5英尺,触发
                if (move < -0.5 * inch){
                    new Logger().add(LogType.UI, '左滑触发')
                    // eslint-disable-next-line vue/require-explicit-emits
                    this.$emit('leftMove', this.data)
                }
                else if (move > 0.5 * inch){
                    new Logger().add(LogType.UI, '右滑触发')
                    // eslint-disable-next-line vue/require-explicit-emits
                    this.$emit('rightMove', this.data)
                }
            },
            //#endregion
        },
    })
</script>
<style>
    .emoji-like {
        flex-direction: row;
        display: flex;
        width: 100%;
    }
    .emoji-like-body {
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        max-width: 30%;
        margin-left: 50px;
        margin-top: 10px;
    }
    .emoji-like-body div {
        background: var(--color-card-1);
        border-radius: 7px;
        margin-right: 5px;
        padding: 5px 15px;
        margin-bottom: 5px;
    }
    .emoji-like-body img {
        width: 15px;
        height: 15px;
    }
    .emoji-like-body span {
        color: var(--color-font-2);
        margin-left: 10px;
        font-size: 0.8rem;
    }

    @media (min-width: 992px) {
        .emoji-like.me {
            flex-direction: row-reverse;
        }
        .emoji-like.me > div.emoji-like-body {
            flex-direction: row-reverse;
            margin-right: -5px;
        }
    }

    .link-view-bilibili {
        flex-direction: column;
        width: 100%;
    }
    .link-view-bilibili > div.user {
        display: flex;
        align-items: center;
        margin-bottom: 10px;
    }
    .link-view-bilibili > div.user > img {
        width: 20px;
        border-radius: 100%;
        border: 2px solid transparent;
        outline: 2px solid var(--color-card);
    }
    .link-view-bilibili > div.user > span {
        flex: 1;
        margin-left: 10px;
        margin-right: 40px;
    }
    .link-view-bilibili > div.user > a {
        color: var(--color-font-2);
        font-size: 0.8rem;
    }
    .link-view-bilibili > img {
        margin-bottom: 10px;
        max-width: 100% !important;
        width: fit-content;
    }
    .link-view-bilibili > a {
        color: var(--color-font-2) !important;
        font-size: 0.8rem;
        max-height: 4rem;
        overflow-y: scroll;
    }
    .link-view-bilibili > a::-webkit-scrollbar {
        background: transparent;
    }
    .link-view-bilibili > div.data {
        display: flex;
        flex-direction: row;
        align-items: center;
        font-size: 0.8rem;
        margin-top: 10px;
        justify-content: space-around;
        opacity: 0.7;
    }

    .link-view-music163 {
        flex-direction: column;
        display: flex;
    }
    .link-view-music163 > div:first-child {
        align-items: flex-start;
        display: flex;
    }
    .link-view-music163 > div:first-child > img {
        border-radius: 7px;
        margin-right: 20px;
        max-height: 80px;
        width: 25%;
    }
    .link-view-music163 > div:first-child > div {
        flex-direction: column;
        display: flex;
        width: 100%;
    }
    .link-view-music163 > div:first-child > div > a {
        font-size: 0.9rem;
        font-weight: bold;
    }
    .link-view-music163 > div:first-child > div > a > a {
        font-size: 0.7rem;
        font-weight: normal;
    }
    .link-view-music163 > div:first-child > div > span {
        font-size: 0.8rem;
        opacity: 0.7;
    }
    .link-view-music163 > div:first-child > div > div {
        flex-direction: row;
        margin-top: 5px;
        flex-wrap: wrap;
        display: flex;
    }
    .link-view-music163 > div:first-child > div > div > input {
        appearance: none;
        -webkit-appearance: none;
        width: calc(100% - 20px);
        background: transparent;
        margin-bottom: 10px;
        margin-right: 20px;
    }
    .link-view-music163 > div:first-child > div > div > input::-webkit-slider-thumb {
        background: var(--color-main);
        -webkit-appearance: none;
        border-radius: 100%;
        margin-top: -3px;
        height: 12px;
        width: 12px;
    }
    .link-view-music163 > div:first-child > div.me > div > input::-webkit-slider-thumb {
        background: var(--color-font-r);
    }
    .link-view-music163 > div:first-child > div > div > input::-webkit-slider-runnable-track {
        background: var(--color-card-1);
        border-radius: 10px;
        height: 6px;
    }
    .link-view-music163 > div:first-child > div.me > div > input::-webkit-slider-runnable-track {
        background: var(--color-font-2);
    }
    .link-view-music163 > div:first-child > div > div > svg {
        font-size: 0.75rem;
        margin-left: 4px;
        cursor: pointer;
    }
    .link-view-music163 > div:first-child > div > div > span {
        font-size: 0.75rem;
        margin-right: 20px;
        text-align: right;
        flex: 1;
    }
    .link-view-music163 > div:first-child > div > div > div {
        width: calc(100% - 20px);
        margin-bottom: -6px;
        margin-right: 20px;
        margin-left: 3px;
    }
    .link-view-music163 > div:first-child > div > div > div > div {
        transform: translateY(calc(-100% - 10px));
        background: var(--color-main);
        pointer-events: none;
        border-radius: 6px;
        height: 6px;
        width: 0%;
    }
    .link-view-music163 > div:first-child > div > div > div > div:nth-child(2) {
        transform: translateY(calc(-100% - 16px));
        background: var(--color-card-2);
        border-radius: 0 6px 6px 0;
    }
    .link-view-music163 > div:first-child > div.me > div > div > div:nth-child(2) {
        background: var(--color-font-1);
    }
    .link-view-music163 > div:first-child > div.me > div > div > div {
        background: var(--color-font-r);
    }
</style>
