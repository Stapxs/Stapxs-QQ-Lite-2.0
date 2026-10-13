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
    <div :id="(idPrefix ?? 'chat-') + data.message_id"
        ref="msgMain"
        v-menu.prevent="event => $emit('showMenu', event, data)"
        :class="[
            'message', type ?? '',
            { 'revoke': data.revoke },
            { 'me': isMe && type != 'body' },
            { 'selected': selected },
            { 'right': settingsStore.sysConfig.opt_ind_message === true && type != 'body' },
            { 'body-only': type == 'body' }
        ]"
        :data-raw="getMsgRawTxt(data)"
        :data-sender="data.sender.user_id"
        :data-time="data.time"
        @mouseleave="hiddenUserInfo">
        <template v-if="type != 'body'">
            <img v-menu.prevent="event => $emit('showMenu', event, data)"
                v-user-tooltip="() => getUserById(data.sender.user_id)"
                name="avatar"
                :src="'https://q1.qlogo.cn/g?b=qq&s=0&nk=' + data.sender.user_id"
                :alt="data.sender.card ? data.sender.card : data.sender.nickname"
                @dblclick="sendPoke">
            <div v-if="data.fake_msg == true"
                :class="'sending left' + (isMe ? ' me' : '')">
                <font-awesome-icon :icon="['fas', 'spinner']" />
            </div>
        </template>
        <div :class="msgBodyClass">
            <header v-if="type != 'body'">
                <template v-if="chatStore.chatInfo.show.type == 'group'">
                    <span v-if="senderInfo && isRobot(senderInfo.user_id)" class="robot">{{ $t('机器人') }}</span>
                    <span v-if="senderInfo?.role == 'owner'" class="owner">{{ $t('群主') }}</span>
                    <span v-else-if="senderInfo?.role == 'admin'" class="admin">{{ $t('管理员') }}</span>
                    <span v-if="senderInfo?.title && senderInfo?.title != ''">{{ senderInfo?.title.replace(/[\u202A-\u202E\u2066-\u2069]/g, '') }}</span>
                </template>
                <span v-if="isDev && data._from_local_db" class="dev-local-tag">
                    {{ $t('本地') }}
                </span>
                <a v-if="data.sender.card || data.sender.nickname">
                    {{ data.sender.card ? data.sender.card : data.sender.nickname }}
                </a>
                <a v-else>
                    {{ isMe ? authStore.loginInfo.nickname : chatStore.chatInfo.show.name }}
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
            </header>
            <div v-move="moveOptions"
                @v-move-left.prevent="$emit('leftMove', data)"
                @v-move-right.prevent="$emit('rightMove', data)">
                <!-- 消息体 -->
                <template v-if="data.message.length === 0">
                    <span class="msg-text" style="opacity: 0.5">{{ $t('空消息') }}</span>
                </template>
                <!-- 超级表情 -->
                <template v-else-if="isSuperFaceMsg()">
                    <div class="msg-img face lottie-face alone">
                        <LazyLottie
                            :animation-link="Emoji.get(Number(data.message[0].id))!.superValue!"
                            :title="Emoji.get(Number(data.message[0].id))!.description" />
                    </div>
                </template>
                <template v-else-if="!hasCard()">
                    <div v-for="(item, index) in data.message"
                        :key="data.message_id + '-m-' + index"
                        :class="View.isMsgInline(item.type) ? 'msg-inline' : ''">
                        <div v-if="item.type === undefined" />
                        <span v-else-if="isDebugMsg" class="msg-text">{{ item }}</span>
                        <template v-else-if="item.type == 'text'">
                            <div v-if="hasMarkdown()" class="msg-md-title" />
                            <span v-else v-show="item.text !== ''"
                                class="msg-text" @click="textClick" v-html="textIndex[index]" />
                        </template>
                        <div v-else-if="item.type == 'markdown'" v-once
                            :id="getMdHTML(item.content, 'msg-md-' + data.message_id)"
                            class="msg-md" />
                        <img v-else-if="item.type == 'image' && item.file == 'marketface'"
                            :class=" imgStyle(data.message.length, Number(index), true) + ' msg-mface'"
                            :src="item.url"
                            :alt="item.summary"
                            @load="imageLoaded"
                            @error="imgLoadFail">
                        <img v-else-if="item.type == 'mface'"
                            :class=" imgStyle(data.message.length, Number(index), true) + ' msg-mface'"
                            :src="item.url"
                            :alt="item.summary"
                            @load="imageLoaded"
                            @error="imgLoadFail">
                        <template v-else-if="item.type == 'image'">
                            <div v-show="shouldShowImagePlaceholder(item, Number(index))"
                                :title="$t('点击加载图片')"
                                :class="imgStyle(data.message.length, Number(index), isFace(item)) + ' msg-img-placeholder'"
                                @click="loadImage(item, Number(index))">
                                <font-awesome-icon
                                    :icon="['fas', imageLoading(getImageKey(Number(index), item.url)) ? 'spinner' : 'image']"
                                    :spin="imageLoading(getImageKey(Number(index), item.url))" />
                                <span>
                                    {{ imageLoading(getImageKey(Number(index), item.url)) ? $t('加载中') : $t('点击加载图片') }}
                                </span>
                            </div>
                            <img v-show="!shouldShowImagePlaceholder(item, Number(index))"
                                :title="(!item.summary || item.summary == '') ? $t('预览图片') : item.summary"
                                :alt="$t('图片')"
                                :class=" imgStyle(data.message.length, Number(index), isFace(item))"
                                :src="getImgSrc(item.url)"
                                data-type="image"
                                @load="imageLoaded"
                                @error="imgLoadFail"
                                @click="imgClick(item.url)">
                        </template>
                        <template v-else-if="item.type == 'face'">
                            <EmojiFace :emoji="Emoji.get(Number(item.id))" class="msg-face" />
                        </template>
                        <span v-else-if="item.type == 'bface'"
                            style="font-style: italic; opacity: 0.7">
                            [ {{ $t('图片') }}：{{ item.text }} ]
                        </span>
                        <div v-else-if="item.type == 'at'"
                            :class="getAtClass(item.qq)">
                            <a v-user-tooltip="() => getAtMember(item.qq)"
                                :data-id="item.qq"
                                :data-group="data.group_id">
                                {{ getAtName(item) }}
                            </a>
                        </div>
                        <div
                            v-else-if="item.type == 'file'" :class="'msg-file' + (isMe ? ' me' : '')">
                            <div>
                                <div>
                                    <a>
                                        <font-awesome-icon :icon="['fas', 'file']" />
                                        {{ chatStore.chatInfo.show.type == 'group' ? $t('群文件') : $t('离线文件') }}
                                    </a>
                                    <p>{{ loadFileBase( item, item.name ?? item.file_name, data.message_id) }}</p>
                                </div>
                                <i>{{ getSizeFromBytes(item.size ?? item.file_size) }}</i>
                            </div>
                            <div>
                                <font-awesome-icon
                                    :icon="['fas', 'angle-down']"
                                    @click="downloadFile(item, data.message_id)" />
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
                        <template v-else-if="item.type == 'record'">
                            <VoiceMsg
                                :item="item"
                                :message-id="String(data.message_id)"
                                :is-me="isMe" />
                        </template>
                        <template v-else-if="item.type == 'forward'">
                            <div class="msg-raw-forward"
                                @click="openMerge()">
                                <span>{{ $t('合并转发消息') }}</span>
                                <div class="forward-msg">
                                    <template v-if="item.content && item.content.length > 0">
                                        <div v-for="(i, indexItem) in item.content.slice(0, 3)"
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
                                                <span v-else-if="msg.type == 'record'">
                                                    [{{ $t('语音') }}]
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
                                    </template>
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
                        <template v-else-if="item.type == 'reply'">
                            <QuotePreview v-if="type != 'body'" :message-id="item.id"
                                :source-id="data.message_id" :is-me="isMe && type != 'merge'"
                                :remote="type != 'merge'"
                                @scroll-to-msg="$emit('scrollToMsg', $event)" />
                        </template>
                        <div v-else-if="item.type == 'poke'" v-once :class="showPock()">
                            <font-awesome-icon class="poke-hand" style="margin-right: 5px;" :icon="['fas', 'fa-hand-point-up']" />
                            {{ $t('戳了戳你') }}
                        </div>
                        <span v-else class="msg-unknown">{{ '( ' + $t('不支持的消息') + ': ' + item.type + ' )' }}</span>
                    </div>
                </template>
                <template v-else>
                    <JsonSegComp v-if="data.message.at(0)!.type === 'json'"
                        :data="data.message.at(0)!.data" />
                    <XmlSegComp v-else :id="data.message_id" :item="data.message.at(0)!.data" />
                </template>
                <!-- 链接预览框 -->
                <div v-if="!isDebugMsg && pageViewInfo && Object.keys(pageViewInfo).length > 0"
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
                                @error="linkViewPicErr"
                                @click="preImgClick(pageViewInfo.img)">
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
                        <div v-if="pageViewInfo.type == 'bilibili'"
                            class="link-view-bilibili"
                            @click="openLink(pageViewInfo.url)">
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
                        <div v-else-if="pageViewInfo.type == 'music163'" style="width: 100%;">
                            <div class="link-view-music163">
                                <div>
                                    <a>{{ pageViewInfo.data.info.name }}
                                        <a v-if="pageViewInfo.data.info.free != null">{{ $t('（试听）') }}</a>
                                    </a>
                                    <span>{{ pageViewInfo.data.info.author.join('/') }}</span>
                                </div>
                                <img :src="pageViewInfo.data.cover">
                                <font-awesome-icon
                                    :icon="['fas', 'play']"
                                    :class="{ light: pageViewInfo.data.cover_light }"
                                    @click="sendPlay({
                                        title: pageViewInfo.data.info.name,
                                        author: pageViewInfo.data.info.author,
                                        url: pageViewInfo.data.play_link,
                                        type: 'music163',
                                        cover: pageViewInfo.data.cover,
                                        free: pageViewInfo.data.info.free,
                                        time: pageViewInfo.data.info.time,
                                        data: pageViewInfo.data.id,
                                    })" />
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
                <TransitionGroup name="emoji-like">
                    <template v-for="info, id in data.emojis" :key="'respond-' + data.message_id + '-' + id">
                        <div :class="{
                            'me-send': info.includes(authStore.loginInfo.uin),
                        }">
                            <EmojiFace :emoji="Emoji.get(Number(id))!" />
                            <span>{{ info.length }}</span>
                        </div>
                    </template>
                </TransitionGroup>
            </div>
        </div>
        <code style="display: none">{{ data.raw_message }}</code>
    </div>
</template>

<script setup lang="ts">
import Option from '@renderer/function/option'
import markdownit from 'markdown-it'

import { MsgBodyFuns as ViewFuns } from '@renderer/function/model/msg-body'
import { watch, onMounted, nextTick, provide, inject, useTemplateRef, ref } from 'vue'
import { Connector } from '@renderer/function/connect'
import { useSettingsStore } from '@renderer/state/settings'
import { Logger, LogType, PopInfo, PopType } from '@renderer/function/base'
import { StringifyOptions } from 'querystring'
import { getMsgRawTxt, pokeAnime } from '@renderer/function/utils/msgUtil'
import {
    isRobot,
    openLink,
    sendStatEvent,
	vMenu,
	vMove,
	VMoveOptions,
} from '@renderer/function/utils/appUtil'
import { vUserTooltip } from '@renderer/function/tooltip'
import {
    getForegroundToneGridFromImageUrl,
    getSizeFromBytes,
    getTrueLang,
    getViewTime } from '@renderer/function/utils/systemUtil'
import { linkView } from '@renderer/function/utils/linkViewUtil'
import { MenuEventData, MergeStackData } from '@renderer/function/elements/information'
import { backend } from '@renderer/runtime/backend'
import { i18n } from '@renderer/main'
import { useUIStore } from '@renderer/state/ui'
import { useAuthStore } from '@renderer/state/auth'
import { useContactStore } from '@renderer/state/contact'
import { useChatStore } from '@renderer/state/chat'

const uiStore = useUIStore()
const authStore = useAuthStore()
const contactStore = useContactStore()
const chatStore = useChatStore()
const settingsStore = useSettingsStore()
import Emoji from '@renderer/function/model/emoji'
import EmojiFace from './EmojiFace.vue'
import LazyLottie from './LazyLottie.vue'
import { Img } from '@renderer/function/model/img'
import { dbGetImage, hashUrl } from '@renderer/function/utils/localHistoryUtil'
import JsonSegComp from './msg-component/JsonSegComp.vue'
import XmlSegComp from './msg-component/XmlSegComp.vue'
import VoiceMsg from './VoiceMsg.vue'
import QuotePreview from './QuotePreview.vue'
import { addMusic, MusicInfo } from './MusicPlayer.vue'

type Msg = any
type IUser = any

defineOptions({ name: 'MsgBody' })

const $t = i18n.global.t

const {
    data,
    selected,
    type,
    globalMe,
    imageListHeader,
    idPrefix,
} = defineProps<{
    data: any
    selected?: boolean
    type?: 'merge' | 'body'
    globalMe?: string
    imageListHeader?: Img | undefined
    idPrefix?: string
}>()

provide('message-content', data)

const { viewer: viewerRef } = inject<{ viewer: any }>('viewer', { viewer: null })

const emit = defineEmits<{
    scrollToMsg: [...args: any[]]
    imageLoaded: [...args: any[]]
    sendPoke: [...args: any[]]
    leftMove: [msg: Msg]
    rightMove: [msg: Msg]
    showMenu: [event: MenuEventData, msg: Msg]
}>()

const msgMain = useTemplateRef<HTMLDivElement>('msgMain')

const moveOptions: VMoveOptions<HTMLDivElement> = {
    moveHook: (_, move: number) => {
        const target = msgMain.value!
        target.style.transform = 'translateX(' + move + 'px)'
    },
    endHook: (_) => {
        const target = msgMain.value!

        target.style.transform = ''
        target.style.transition = 'all 0.3'
    },
    leftLimit: {
        value: uiStore.inch * 0.75,
        type: 'px'
    },
    rightLimit: {
        value: uiStore.inch * 0.75,
        type: 'px'
    },
    moveCondition: {
        minMove: {
            value: uiStore.inch * 0.5,
            type: 'px'
        }
    }
}

//#endregion

//#region == 响应式状态 ================================================================

const View = ViewFuns
const md = markdownit({ breaks: true })
const isMe = ref(false)
const isDev = import.meta.env.DEV
const msgBodyClass = ref('message-body')
const isDebugMsg = Option.get('debug_msg')
const linkViewStyle = ref('')
const pageViewInfo = ref(undefined as { [key: string]: any } | undefined)
const gotLink = ref(false)
const senderInfo = ref(null as any)
const trueLang = getTrueLang()
const textIndex = ref({} as { [key: string]: number })
const resolvedImages = ref({} as Record<string, string>)
const manualImageLoads = ref({} as Record<string, boolean>)
const pendingImageLoads = ref({} as Record<string, boolean>)

//#endregion

//#region == 工具函数 ================================================================

function getAtMember(id: number): IUser | number {
    const re = getUserById(id) ?? id
    return re
}
function getUserById(id: number): IUser | undefined {
    if (chatStore.chatInfo.show.type === 'group') {
        if (!chatStore.chatInfo.info.group_members) return id
        const user = chatStore.chatInfo.info.group_members.find((item: IUser) => item.user_id == id)
        if (user) return user
        else return id
    }else {
        const user = contactStore.userList.find((item: IUser) => item.user_id === id)
        if (user) return user
        else return id
    }
}

//#endregion

//#region == 方法函数 ================================================================

async function loadCachedImages() {
    const selfId = authStore.loginInfo?.uin
    if (!selfId) return
    for (const seg of data.message) {
        if (seg.type !== 'image' || !seg.url) continue
        await loadCachedImage(seg.url)
    }
}

async function loadCachedImage(url: string) {
    if (resolvedImages.value[url]) return resolvedImages.value[url]

    const selfId = authStore.loginInfo?.uin
    if (!selfId || !url) return undefined

    const urlHash = await hashUrl(url)
    const cached = await dbGetImage(selfId, urlHash)
    if (cached) {
        resolvedImages.value[url] =
            `data:${cached.mimeType};base64,${cached.data}`
        return resolvedImages.value[url]
    }

    return undefined
}

function getImgSrc(url: string): string {
    return resolvedImages.value[url] ?? backend.proxyUrl(url)
}

function getImageKey(index: number, url: string) {
    return `${data.message_id}-${index}-${url}`
}

function imageLoading(key: string) {
    return pendingImageLoads.value[key] === true
}

function shouldShowImagePlaceholder(item: { type: string, url: string }, index: number) {
    if (item.type !== 'image') return false
    if (settingsStore.sysConfig.opt_no_auto_load_image !== true) return false

    return manualImageLoads.value[getImageKey(index, item.url)] !== true
}

function getAtClass(who: number | string) {
    let back = 'msg-at'
    if (isMe.value && type != 'merge') {
        back += ' me'
    }
    if (authStore.loginInfo.uin == who || who == 'all') {
        back += ' atme'
    }
    return back
}

function getAtName(item: { [key: string]: any }) {
    if (item.qq == 'all') {
        return '@' + $t('全体成员')
    }
    if (item.text != undefined) {
        return item.text
    } else {
        for (let i = 0; i < chatStore.chatInfo.info.group_members.length; i++) {
            const user = chatStore.chatInfo.info.group_members[i]
            if (user.user_id == Number(item.qq)) {
                return ('@' + (user.card != '' && user.card != null? user.card: user.nickname))
            }
        }
        return '@' + item.qq
    }
}

function imgStyle(length: number, at: number, isFace: boolean) {
    let style = 'msg-img'
    if (type == 'body') {
        return style
    }
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
}

function imgClick(url: string) {
    if (viewerRef?.value && imageListHeader) {
        viewerRef.value.openBySrc(imageListHeader, url)
    }
}

async function loadImage(item: { url: string }, index: number) {
    const key = getImageKey(index, item.url)
    if (manualImageLoads.value[key] || pendingImageLoads.value[key]) return

    pendingImageLoads.value[key] = true
    try {
        if (data._from_local_db) {
            await loadCachedImage(item.url)
        }
        manualImageLoads.value[key] = true
    } finally {
        pendingImageLoads.value[key] = false
    }
}

function preImgClick(img: string) {
    if (viewerRef?.value) {
        viewerRef.value.open(new Img(img))
    }
}

async function imageLoaded(event: Event) {
    const img = event.target as HTMLImageElement

    if(backend.isMobile() && img.src && !img.src.startsWith('data:')
        && img.dataset.type === 'image') {
        img.src = await backend.proxyImageUrl(img.src)
        return
    }

    const vh = document.documentElement.clientHeight || document.body.clientHeight
    const imgHeight = img.naturalHeight || img.height
    let imgWidth = img.naturalWidth || img.width

    const aspectRatio = imgHeight / imgWidth

    if (aspectRatio > 2.5) {
        img.classList.add('long-img')
        try {
            const picLight = ( await getForegroundToneGridFromImageUrl(backend.proxyUrl(img.src), 0.4))[1][1] === 'light'
            if(picLight) {
                img.classList.add('light')
            }
        } catch {
            // do nothing
        }
    } else {
        if (imgHeight > vh * 0.35)
            imgWidth = (imgWidth * (vh * 0.35)) / imgHeight
    }

    img.style.setProperty('--width', `${imgWidth}px`)
    emit('imageLoaded', img.offsetHeight)
}

function imgLoadFail(event: Event) {
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
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    svg.setAttribute('viewBox', '0 0 512 512')
    svg.innerHTML =
        '<path d="M119.4 44.1c23.3-3.9 46.8-1.9 68.6 5.3l49.8 77.5-75.4 75.4c-1.5 1.5-2.4 3.6-2.3 5.8s1 4.2 2.6 5.7l112 104c2.9 2.7 7.4 2.9 10.5 .3s3.8-7 1.7-10.4l-60.4-98.1 90.7-75.6c2.6-2.1 3.5-5.7 2.4-8.8L296.8 61.8c28.5-16.7 62.4-23.2 95.7-17.6C461.5 55.6 512 115.2 512 185.1v5.8c0 41.5-17.2 81.2-47.6 109.5L283.7 469.1c-7.5 7-17.4 10.9-27.7 10.9s-20.2-3.9-27.7-10.9L47.6 300.4C17.2 272.1 0 232.4 0 190.9v-5.8c0-69.9 50.5-129.5 119.4-141z"/>'
    svg.style.width = '40px'
    svg.style.opacity = '0.8'
    svg.style.fill = 'var(--color-main)'
    if (isMe.value) {
        svg.style.fill = 'var(--color-font-r)'
    }
    parent.appendChild(svg)
    const span = document.createElement('span')
    span.innerText = $t('加载图片失败')
    span.style.marginTop = '10px'
    span.style.fontSize = '0.8rem'
    span.style.color = 'var(--color-font-2)'
    if (isMe.value) {
        span.style.color = 'var(--color-font-1-r)'
    }
    parent.appendChild(span)
    const a = document.createElement('a')
    a.innerText = $t('预览图片')
    a.target = '__blank'
    a.href = sender.src
    a.style.marginTop = '10px'
    a.style.fontSize = '0.7rem'
    a.style.color = 'var(--color-font-2)'
    if (isMe.value) {
        a.style.color = 'var(--color-font-1-r)'
    }
    parent.appendChild(a)
}

async function parseText(index: number) {

    let text = data.message[index].text

    const logger = new Logger()
    text = ViewFuns.parseText(text)
    const filtedText = text.replace(/(.)(\1{10,})/g, '$1<span style="opacity:0.7;margin-right:10px;">...</span>')
    if(filtedText != text) {
        const style = 'display:block;margin-top:10px;opacity:0.7;cursor:pointer;'
        text = filtedText + '<a style="' + style +'" data-raw="' + text + '" onclick="this.parentNode.innerText = this.dataset.raw;return false;">' + $t('显示原始消息') + '</a>'
    }

    if(type == 'body') {
        textIndex.value[index] = text
        return
    }

    const reg = /(http|https):\/\/[\w\-_]+(\.[\w\-_]+)+([\w\-.,@?^=%&:/~+#]*[\w\-@?^=%&/~+#])?/gi
    text = text.replaceAll(reg, '<a href="" data-link="$&" onclick="return false">$&</a>')
    const linkList = text.match(reg)
    if (linkList !== null && !gotLink.value && !isDebugMsg) {
        queueMicrotask(async() => {
            gotLink.value = true
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

            let linkData = null as any
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
                    linkData = await linkView[key](finaLink)
                }
            }
            if(!linkData) {
                if (!backend.isWeb()) {
                    let html = await backend.call('Onebot', 'sys:getHtml', true, finaLink)
                    if(html) {
                        const headEnd = html.indexOf('</head>')
                        html = html.slice(0, headEnd)
                        const ogRegex = /<meta\s+property="og:([^"]+)"\s+content="([^"]+)"\s*\/?>/g
                        const ogTags = {} as {[key: string]: string}
                        let match: string[] | null
                        while ((match = ogRegex.exec(html)) !== null) {
                            ogTags[`og:${match[1]}`] = match[2]
                        }
                        linkData = ogTags
                    }
                } else {
                    const response = await fetch(`${import.meta.env.VITE_APP_LINK_VIEW}/${encodeURIComponent(fistLink)}`)
                    if(response.ok) {
                        const res = await response.json()
                        if (res.status === undefined && Object.keys(res).length > 0) {
                            linkData = res
                        }
                    }
                }
            }

            logger.add(LogType.DEBUG, 'Link View: ', linkData)
            if(linkData) {
                loadLinkPreview(protocol + domain, linkData)
            }
        })
    }
    textIndex.value[index] = text
}

function loadLinkPreview(domain: string, res: any) {
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
                pageViewInfo.value = pageData
            }
        } else {
            pageViewInfo.value = res
        }
    }
}

function linkViewPicFin() {
    const img = document.getElementById(
        data.message_id + '-linkview-img',
    ) as HTMLImageElement
    if (img !== null) {
        const w = img.naturalWidth
        const h = img.naturalHeight
        if (w > h) {
            linkViewStyle.value = 'large'
        }
    }
}
function linkViewPicErr() {
    if(pageViewInfo.value)
        pageViewInfo.value.img = undefined
}

function hiddenUserInfo() {
    if (chatStore.chatInfo.info.now_member_info !== undefined) {
        chatStore.chatInfo.info.now_member_info = undefined
    }
}

function downloadFile(fileData: any, message_id: string) {
    let name = authStore.jsonMap.file_download?.private_name
    if(chatStore.chatInfo.show.type == 'group') {
        name = authStore.jsonMap.file_download?.name
    }
    Connector.send(name, {
        file_id: fileData.file_id,
        group_id: chatStore.chatInfo.show.type == 'group' ? chatStore.chatInfo.show.id : undefined,
    },
        'downloadFile_' + message_id + '_' + btoa(encodeURIComponent(fileData.name ?? fileData.file_name)),
    )
}

function textClick(event: Event) {
    const target = event.target as HTMLElement
    if (target.dataset.link) {
        const link = target.dataset.link
        openLink(link)
    }
}

function loadFileBase(
    fileData: any,
    name: string,
    message_id: StringifyOptions,
) {
    const ext = name.split('.').pop()
    const msg = chatStore.messageList.find(
        (item) => item.message_id === message_id,
    )
    if (ext && msg?.fileView == undefined) {
        const list = [
            'jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp',
            'mp4', 'avi', 'mkv', 'flv',
            'txt', 'md',
        ]
        if (list.includes(ext)) {
            msg.fileView = {}
            let dlName = authStore.jsonMap.file_download?.private_name
            if(chatStore.chatInfo.show.type == 'group') {
                dlName = authStore.jsonMap.file_download?.name
            }
            if(dlName) {
                Connector.send(dlName, {
                    file_id: fileData.file_id,
                    group_id: chatStore.chatInfo.show.type == 'group' ? chatStore.chatInfo.show.id : undefined,
                },
                    'loadFileBase_' + data.message_id + '_' + ext,
                )
            }
        }
    }
    return name
}

function getTxtUrl(view: any) {
    const url = view.url
    fetch(url)
        .then((r) => r.blob())
        .then((blob) => {
            const reader = new FileReader()
            reader.readAsText(blob, 'utf-8')
            reader.onload = function () {
                const txt = reader.result as string
                view.txt = txt.length > 300? txt.slice(0, 300) + '…': txt
            }
        })
}

function hasCard() {
    let hasCard = false
    data.message.forEach((item: any) => {
        if (item.type === 'json' || item.type === 'xml') {
            hasCard = true
        }
    })
    return hasCard
}

function hasMarkdown() {
    let hasMarkdown = false
    data.message.forEach((item: any) => {
        if (item.type === 'markdown') {
            hasMarkdown = true
        }
    })
    return hasMarkdown
}

function sendPoke() {
    emit('sendPoke', data.sender.user_id)
}

async function showPock() {
    if (data.message_id ==
        chatStore.messageList[chatStore.messageList.length - 1].message_id &&
        (new Date().getTime() - getViewTime(data.time)) / 1000 < 5) {
        let windowInfo = null as {
            x: number
            y: number
            width: number
            height: number
        } | null
        if (backend.isDesktop()) {
            windowInfo = await backend.call('Onebot', 'win:getWindowInfo', true)
        }
        const message = document.getElementById('chat-' + data.message_id)
        let item = document.getElementById('app')
        if (backend.isDesktop()) {
            item = message?.getElementsByClassName('poke-hand')[0] as HTMLImageElement
        }
        nextTick(() => {
            pokeAnime(item, windowInfo)
        })
    }
}

function isSuperFaceMsg() {
    if (settingsStore.sysConfig.use_super_face === false) return false
    if (data.message.length !== 1) return false
    const seg = data.message.at(0)
    if (seg.type !== 'face') return
    return Emoji.allSuperList.has(Number(seg.id))
}

function getMdHTML(str: string, id: string) {
    const html = md.render(str)
    const div = document.createElement('div')
    div.innerHTML = html
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

    setTimeout(() => {
        const body = document.getElementById(id)
        if(body) {
            body.innerHTML = ''
            body.appendChild(div)
        }
    }, 500)

    return id
}

function sendPlay(info: MusicInfo) {
    addMusic(info, 'current', true)
}

function openMerge(){
    const seg = data.message[0]
    if (!seg.content) {
        new PopInfo().add(PopType.ERR, $t('合并转发解析失败'))
        return
    }

    const mergeData: MergeStackData = {
        messageList: [],
        imageList: [],
        placeCache: 0,
        forwardMsg: data
    }

    mergeData.messageList = seg.content
    const imgList = [] as {
        index: number
        message_id: string
        img_url: string
    }[]
    let index = 0
    mergeData.messageList.forEach((item) => {
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
    mergeData.imageList = imgList

    chatStore.mergeMsgStack.push(mergeData)
}

function isFace(item: any) {
    if (item.asface) return true
    else if (item.subType == 7) return true
    else if (item.subType == 1) return true
    else if (item.sub_type == 7) return true
    else if (item.sub_type == 1) return true
    return false
}

//#endregion

//#region == 生命周期 ================================================================

onMounted(() => {
    isMe.value =
        Number(authStore.loginInfo.uin) ===
        Number(data.sender.user_id)
    if(globalMe) {
        isMe.value = globalMe == 'Y'
    }
    watch(
        () => chatStore.chatInfo.info.group_members.length,
        () => {
            senderInfo.value =
                chatStore.chatInfo.info.group_members.filter(
                    (item: any) => {
                        return item.user_id == data.sender.user_id
                    },
                )[0]
        },
    )
    senderInfo.value = chatStore.chatInfo.info.group_members.filter(
        (item: any) => {
            return item.user_id == data.sender.user_id
        },
    )[0]
    for (let i = 0; i < data.message.length; i++) {
        const item = data.message[i]
        if(item.type == 'text') {
            parseText(i)
        }
    }
    if (data._from_local_db && settingsStore.sysConfig.opt_no_auto_load_image !== true) {
        loadCachedImages()
    }
    if(isSuperFaceMsg()) {
        msgBodyClass.value += ' super-face'
    }
    if(type != 'body') {
        if(isMe.value && type != 'merge') {
            msgBodyClass.value += ' me'
        }
        if(settingsStore.sysConfig.opt_ind_message === true) {
            msgBodyClass.value += ' right'
        }
    }
})

//#endregion
</script>
<style>
    .dev-local-tag {
        display: inline-block;
        padding: 1px 7px !important;
        background: var(--color-card) !important;
        color: var(--color-font-2) !important;
    }
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
    .emoji-like-body .emoji {
        width: 20px;
        height: 20px;
        font-size: 1rem;
        margin: 0;
    }
    .emoji-like-body div.me-send{
        background-color: var(--color-main);
    }
    .emoji-like-body div.me-send:hover {
        background: var(--color-font);
    }
    .emoji-like-body > div.me-send span {
        color: var(--color-font-r);
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
        cursor: pointer;
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
        max-height: 30vh !important;
        width: fit-content;
        object-fit: contain;
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
        width: calc(100% + 60px);
        margin-right: -60px;
        display: flex;
    }
    .link-view-music163 div {
        display: flex;
        flex-direction: column;
        flex: 1;
    }
    .link-view-music163 img {
        width: 60px;
        height: 60px;
        border-radius: 7px;
        margin-left: 20px;
    }
    .link-view-music163 a {
        text-wrap: nowrap;
        font-weight: bold;
        margin: 0;
    }
    .link-view-music163 span {
        text-wrap: nowrap;
        font-size: 0.8rem;
        opacity: 0.7;
    }
    .link-view-music163 svg {
        --size: 20px;
        color: #545454;
        width: var(--size);
        height: var(--size);
        padding: calc(calc(60px - var(--size)) / 2);
        transform: translateX(-100%);
    }
    .link-view-music163 svg.light {
        color: #e5e5e5;
    }
</style>
