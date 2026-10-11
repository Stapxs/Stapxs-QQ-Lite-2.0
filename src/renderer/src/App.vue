<template>
    <div v-if="dev" id="dev-bar" :class="['dev-bar', 'onloading', {
        'win': backend.platform == 'win32'
    }]">
        Stapxs QQ Lite Development Mode
        {{ backend.platform ? ' / platform: ' + backend.platform : '' }}
        {{ ' / client: ' + appClient.type }}
        {{ ' / backend: ' + (authStore.jsonMap?.name ?? 'Not Connected') }}
        {{ ' / fps: ' + fps.value }}
    </div>
    <div v-if="tags.musicLyric != ''" class="lyric-bar">
        {{ tags.musicLyric }}
    </div>
    <div v-if="['linux', 'win32'].includes(backend.platform ?? '')"
        :class="['top-bar', {
            'win': backend.platform == 'win32' && dev
        }]"
        name="appbar"
        data-tauri-drag-region="true"
        @mousedown="handleAppbarMouseDown">
        <div class="bar-button" @click="barMainClick()" />
        <div class="space" />
        <div class="controller">
            <div class="min" @click="controllWin('minimize')">
                <font-awesome-icon :icon="['fas', 'minus']" />
            </div>
            <div class="close" @click="controllWin('close')">
                <font-awesome-icon :icon="['fas', 'xmark']" />
            </div>
        </div>
    </div>
    <div v-if="backend.platform == 'darwin'" class="controller mac-controller"
        data-tauri-drag-region="true" />
    <div id="load-view" class="load-view">
        <font-awesome-icon :icon="['fas', 'circle-notch']" />
    </div>
    <div id="base-app">
        <div class="main-body onloading">
            <ul id="side-bar" class="onloading" :style="{ 'padding-bottom': get('fs_adaptation') > 0 ? `${get('fs_adaptation')}px` : '' }">
                <li id="bar-home" :class="(tags.page == 'Home' ? 'active' : '') +
                    (loginInfo.status ? ' hiden-home' : '')"
                    @click="changeTab('主页', 'Home', false)">
                    <font-awesome-icon :icon="['fas', 'home']" />
                    <span>{{ $t('主页') }}</span>
                </li>
                <li id="bar-msg" :class="tags.page == 'Messages' ? 'active' : ''"
                    @click="changeTab('信息', 'Messages', true)">
                    <font-awesome-icon :icon="['fas', 'envelope']" />
                    <span>{{ $t('信息') }}</span>
                </li>
                <li id="bar-friends" :class="tags.page == 'Friends' ? 'active' : ''"
                    @click="changeTab('列表', 'Friends', true)">
                    <font-awesome-icon :icon="['fas', 'user']" />
                    <span>{{ $t('列表') }}</span>
                </li>
                <li v-if="useQzoneStore().qzoneFeedList.length > 0"
                    id="bar-qzone"
                    :class="tags.page == 'Qzone' ? 'active' : ''"
                    @click="changeTab('空间', 'Qzone', false)">
                    <font-awesome-icon :icon="['fas', 'star']" />
                    <span>{{ $t('空间') }}</span>
                </li>
                <div class="side-bar-space" />
                <li v-if="tags.currentMusic"
                    :class="['music-entry', {
                        'active': tags.showMusicPlayer,
                        'music-entry-always-hide': backend.isMobile()
                    }]"
                    @click="toggleMusicPlayer(undefined)">
                    <img class="music-entry-cover"
                        :src="tags.currentMusic.cover"
                        :alt="tags.currentMusic.title">
                    <font-awesome-icon v-if="tags.musicPlaying" :icon="['fas', 'play']"
                        :class="['music-entry-status', { light: tags.currentMusic.coverLight }]" />
                    <font-awesome-icon v-else :icon="['fas', 'pause']"
                        :class="['music-entry-status', { light: tags.currentMusic.coverLight }]" />
                </li>
                <li v-if="showFileManagerEntry" :class="{ 'active': tags.showFileManager }"
                    @click="toggleFileManager(undefined)">
                    <font-awesome-icon :icon="['fas', 'arrow-down']" />
                    <span>{{ $t('传输') }}</span>
                </li>
                <li :class="tags.page == 'Options' ? 'active' : ''" @click="changeTab('设置', 'Options', false)">
                    <font-awesome-icon :icon="['fas', 'gear']" />
                    <span>{{ $t('设置') }}</span>
                </li>
                <li v-if="tags.currentMusic"
                    :class="['music-entry-small', {
                        'active': tags.showMusicPlayer,
                        'music-entry-small-always-show': backend.isMobile()
                    }]"
                    @click="toggleMusicPlayer(undefined)">
                    <img class="music-entry-cover"
                        :src="tags.currentMusic.cover"
                        :alt="tags.currentMusic.title">
                    <font-awesome-icon v-if="tags.musicPlaying" :icon="['fas', 'play']"
                        :class="['music-entry-status', { light: tags.currentMusic.coverLight }]" />
                    <font-awesome-icon v-else :icon="['fas', 'pause']"
                        :class="['music-entry-status', { light: tags.currentMusic.coverLight }]" />
                </li>
            </ul>
            <div :style="{ 'height': get('fs_adaptation') > 0 ? `calc(100% - ${75 + Number(get('fs_adaptation'))}px)` : '' }">
                <div v-if="tags.page == 'Home'" id="homeTab" name="主页">
                    <div class="home-body">
                        <div v-if="!napcat" class="login-pan-card ss-card">
                            <font-awesome-icon :icon="['fas', 'circle-nodes']" />
                            <p>{{ $t('连接到 OneBot') }}</p>
                            <form @submit.prevent @submit="connect">
                                <template v-if="loginInfo.quickLogin == null || loginInfo.quickLogin.length == 0">
                                    <!-- 地址输入区域 -->
                                    <div v-if="!sse" class="address-input-container">
                                        <label class="address-input-wrapper">
                                            <font-awesome-icon :icon="['fas', 'link']" />
                                            <input id="sev_address" v-model="loginInfo.address" :placeholder="$t('连接地址')"
                                                class="ss-input" autocomplete="off" @input="onAddressInput">
                                            <!-- 历史选择按钮 -->
                                            <div v-if="(loginInfo.connectionHistory || []).length > 0"
                                                class="history-dropdown-trigger"
                                                @click="toggleHistoryDropdown($event)">
                                                <font-awesome-icon :icon="['fas', 'caret-down']" />
                                            </div>
                                        </label>
                                        <!-- 历史下拉列表 -->
                                        <div v-show="tags.showHistoryDropdown" class="history-dropdown-menu ss-card">
                                            <div v-for="(item, index) in (loginInfo.connectionHistory || [])"
                                                :key="index"
                                                class="history-dropdown-item"
                                                :class="{ 'selected': tags.selectedHistoryIndex === index }"
                                                @click="selectHistoryItem(index)">
                                                <div v-if="item.uin" class="history-item-avatar">
                                                    <img :src="`https://q1.qlogo.cn/g?b=qq&s=0&nk=${item.uin}`" :alt="item.nickname || '未知用户'">
                                                </div>
                                                <div class="history-item-content">
                                                    <span class="history-item-name">
                                                        {{ item.nickname ? `${item.nickname}` : $t('未知用户') }}
                                                    </span>
                                                    <span class="history-item-detail">
                                                        {{ item.uin }}
                                                    </span>
                                                </div>
                                                <div class="history-item-delete" @click.stop="deleteHistoryConnection(index, $event)">
                                                    <font-awesome-icon :icon="['fas', 'trash']" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </template>
                                <div v-else class="ss-card quick-login">
                                    <div class="title">
                                        <font-awesome-icon :icon="['fas', 'link']" />
                                        <span>{{ $t('来自局域网的服务') }}</span>
                                        <a @click="cancelQUickLogin">{{ $t('取消') }}</a>
                                    </div>
                                    <div class="list">
                                        <div v-for="item in loginInfo.quickLogin" :key="item.address + ':' + item.port"
                                            :class="(tags.quickLoginSelect == item.address + ':' + item.port) ? 'select' : ''"
                                            @click="selectQuickLogin(item.address + ':' + item.port)">
                                            <span>{{ item.address }}:{{ item.port }}</span>
                                            <div><div /></div>
                                        </div>
                                    </div>
                                </div>
                                <label>
                                    <font-awesome-icon :icon="['fas', 'lock']" />
                                    <input id="access_token" v-model="loginInfo.token" :placeholder="$t('连接密钥')"
                                        class="ss-input" type="password" autocomplete="off">
                                </label>
                                <div style="display: flex">
                                    <label class="default">
                                        <input id="in_" v-model="tags.savePassword" type="checkbox"
                                            name="save_password"
                                            @click="savePassword">
                                        <a>{{ $t('记住密码') }}</a>
                                    </label>
                                    <div style="flex: 1" />
                                    <label class="default" style="justify-content: flex-end">
                                        <input v-model="settingsStore.sysConfig.auto_connect" type="checkbox"
                                            name="auto_connect" @click="saveAutoConnect">
                                        <a>{{ $t('自动连接') }}</a>
                                    </label>
                                </div>
                                <button id="connect_btn" class="ss-button" type="submit"
                                    :disabled="loginInfo.creating"
                                    @mousemove="afd">
                                    <template v-if="!loginInfo.creating">
                                        {{ $t('连接') }}
                                    </template>
                                    <template v-else>
                                        <font-awesome-icon :icon="['fas', 'spinner']" spin />
                                    </template>
                                </button>
                            </form>
                            <a :href="`https://github.com/${repoName}#%E5%BF%AB%E9%80%9F%E4%BD%BF%E7%94%A8`"
                                target="_blank" style="margin-bottom: -20px">{{ $t('如何连接') }}</a>
                            <div class="wave-pan" style="margin-left: -30px">
                                <svg id="login-wave" xmlns="http://www.w3.org/2000/svg"
                                    xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 24 170 70"
                                    preserveAspectRatio="none" shape-rendering="auto">
                                    <defs>
                                        <path id="gentle-wave" d="M -160 44 c 30 0 58 -18 88 -18 s 58 18 88 18 s 58 -18 88 -18 s 58 18 88 18 v 44 h -352 Z" />
                                    </defs>
                                    <g class="parallax">
                                        <use xlink:href="#gentle-wave" x="83" y="0" />
                                        <use xlink:href="#gentle-wave" x="135" y="3" />
                                        <use xlink:href="#gentle-wave" x="185" y="5" />
                                        <use xlink:href="#gentle-wave" x="54" y="7" />
                                    </g>
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>
                <div v-if="tags.page == 'Messages'" id="messageTab">
                    <Messages :chat="chatStore.chatInfo" @user-click="changeChat" @load-history="loadHistory" />
                </div>
                <div v-if="tags.page == 'Friends'" id="friendTab">
                    <Friends :list="contactStore.userList" @load-history="loadHistory" @user-click="changeChat" />
                </div>
                <div v-if="tags.page == 'Qzone'" id="qzoneTab">
                    <Qzone />
                </div>
                <div class="opt-main-tab" style="opacity: 0">
                    <Options :show="tags.page == 'Options'" :class="tags.page == 'Options' ? 'active' : ''"
                        :config="settingsStore.sysConfig" />
                </div>
            </div>
        </div>
        <component :is="uiStore.pageView.chatView" v-if="
            loginInfo.status &&
                chatStore.chatInfo &&
                chatStore.chatInfo.show.id != 0"
            v-show="tags.showChat"
            ref="chat" :mumber-info="chatStore.chatInfo.info.now_member_info == undefined ?
                {} : chatStore.chatInfo.info.now_member_info"
            :merge-list="chatStore.mergeMessageList"
            :list="chatStore.messageList" :chat="chatStore.chatInfo"
            @user-click="changeChat" />
        <TransitionGroup class="app-msg" name="appmsg" tag="div">
            <div v-for="msg in appMsgs" :key="'appmsg-' + msg.id">
                <div><font-awesome-icon :icon="['fas', msg.svg]" /></div>
                <a>{{ msg.text }}</a>
                <div v-if="!msg.autoClose" @click="popInfo.remove(msg.id)">
                    <font-awesome-icon :icon="['fas', 'xmark']" />
                </div>
            </div>
        </TransitionGroup>
        <Transition name="music-player-float">
            <div v-show="tags.showMusicPlayer" class="global-music-player ss-card">
                <MusicPlayer
                    @open-panel="toggleMusicPlayer"
                    @update-lyric="updateMusicLyric"
                    @update-status="updateMusicStatus" />
            </div>
        </Transition>
        <Transition name="music-player-float">
            <div v-show="tags.showFileManager" class="global-music-player ss-card">
                <FileManager @open-panel="toggleFileManager" />
            </div>
        </Transition>
        <Transition name="modal">
            <div v-if="uiStore.popBoxList.length > 0" id="pop-box" class="pop-box">
                <div :class="'pop-box-body ss-card' +
                         (uiStore.popBoxList[0].full ? ' full' : '') +
                         (get('option_view_no_window') == true ? '' : ' window')"
                    :style="{ 'margin-bottom': get('fs_adaptation') > 0 ? `${40 + Number(get('fs_adaptation'))}px` : '' }">
                    <header v-show="uiStore.popBoxList[0].title != undefined">
                        <div v-if="uiStore.popBoxList[0].svg != undefined">
                            <font-awesome-icon :icon="['fas', uiStore.popBoxList[0].svg]" />
                        </div>
                        <a>{{ uiStore.popBoxList[0].title }}</a>
                        <font-awesome-icon v-if="uiStore.popBoxList[0].allowClose != false"
                            :icon="['fas', 'xmark']" @click="removePopBox" />
                    </header>
                    <div v-if="uiStore.popBoxList[0].html" v-html="uiStore.popBoxList[0].html" />
                    <component :is="uiStore.popBoxList[0].template" v-else :data="uiStore.popBoxList[0].data"
                        v-bind="uiStore.popBoxList[0].templateValue" />
                    <div v-show="uiStore.popBoxList[0].button" class="button">
                        <button v-for="(button, index) in uiStore.popBoxList[0].button"
                            :key="'pop-box-btn' + index" :class="'ss-button' + (button.master == true ? ' master' : '')"
                            @click="button.fun">
                            {{ button.text }}
                        </button>
                    </div>
                    <div class="pop-box-more">
                        <div v-for="index in uiStore.popBoxList.length" :key="'pop-more-' + index" :data-id="index"
                            :class="index > uiStore.popBoxList.length - 1 ? 'hid' : '' "
                            :style="{ 'margin': `-${2 * (index - 1)}px ${(20 * index - 1 - 2 * (index - 1))}px 0 ${(20 * index - 1 - 2 * (index - 1))}px` }" />
                    </div>
                </div>
                <div @click="popQuickClose(uiStore.popBoxList[0].allowQuickClose != false && uiStore.popBoxList[0].allowClose != false)" />
            </div>
        </Transition>
        <!-- 全局搜索栏 -->
        <GlobalSessionSearchBar />
        <NtViewer ref="ntViewer" />
        <!-- 提示工具 -->
        <Tooltips />
        <div id="mobile-css" />
    </div>
    <div id="main-bg" class="main-bg onloading"
        :style="{
            'background-image': toBackgroundImageStyle(settingsStore.sysConfig.chat_more_blur ? settingsStore.sysConfig.chat_background : ''),
            'background-position': settingsStore.sysConfig.chat_background_align ?? 'center',
            'background-size': settingsStore.sysConfig.chat_background_fit ?? 'cover',
            'opacity': 1 - Number(settingsStore.sysConfig.chat_background_blur) / 100 }" />
</template>

<script setup lang="ts">
import Spacing from 'spacingjs/src/spacing'
import Option from '@renderer/function/option'
import Umami from '@stapxs/umami-logger-typescript'
import * as App from './function/utils/appUtil'
import anime from 'animejs'
import packageInfo from '../../../package.json'

import { computed, watch, onMounted, onUnmounted, shallowReactive, shallowRef, provide } from 'vue'
import { Connector, login as loginInfo, loadConnectionHistory, loadConnectionFromHistory, deleteConnectionHistory, decodeStoredToken } from '@renderer/function/connect'
import { Logger, popList, PopInfo, LogType } from '@renderer/function/base'
import { setLoginWaveTimer } from '@renderer/function/msg'
import { BaseChatInfoElem } from '@renderer/function/elements/information'
import { useConnectionStore } from '@renderer/state/connection'
import { useUIStore } from '@renderer/state/ui'
import { useSettingsStore } from '@renderer/state/settings'
import { useChatStore } from '@renderer/state/chat'
import { useContactStore } from '@renderer/state/contact'
import { useAuthStore } from '@renderer/state/auth'
import { Notify } from './function/notify'
import { updateBaseOnMsgList } from './function/utils/msgUtil'
import { isActiveTransferStatus } from './function/utils/fileTransferUtil'
import { getDeviceType, getForegroundToneFromImageUrl } from './function/utils/systemUtil'
import { uptime, i18n } from '@renderer/main'
import { backend } from './runtime/backend'
import {
    hydrateBackgroundImage,
    migrateInlineBackgroundImage,
    toBackgroundImageStyle,
} from '@renderer/function/utils/backgroundUtil'

import Options from '@renderer/pages/Options.vue'
import Friends from '@renderer/pages/Friends.vue'
import Messages from '@renderer/pages/Messages.vue'
import Qzone from '@renderer/pages/Qzone.vue'
import MusicPlayer, { getCurrentMusic } from './components/MusicPlayer.vue'
import FileManager, { panelVisible, closePanel, getDownloadTasks, getUploadTasks } from './components/FileManager.vue'
import GlobalSessionSearchBar from './components/GlobalSessionSearchBar.vue'
import NtViewer from './components/ViewerCom.vue'
import Tooltips from './components/tooltip/Tooltips.vue'
import { useQzoneStore } from './state/qzone'

// 注册组件实例
const ntViewer = shallowRef<InstanceType<typeof NtViewer> | null>(null)
provide('viewer', { viewer: ntViewer })

defineOptions({ name: 'App' })

const $t = i18n.global.t

// 静态值
const repoName = import.meta.env.VITE_APP_REPO_NAME
const appClient = backend
const dev = import.meta.env.DEV
const napcat = import.meta.env.VITE_NAPCAT
const sse = import.meta.env.VITE_APP_SSE_MODE == 'true'
const get = Option.get
const popInfo = new PopInfo()
const appMsgs = popList
const loadHistory = App.loadHistory
const isNarrowLayout = shallowRef(window.innerWidth <= 500)

// 响应式状态
const connectionStore = useConnectionStore()
const uiStore = useUIStore()
const settingsStore = useSettingsStore()
const authStore = useAuthStore()
const contactStore = useContactStore()
const chatStore = useChatStore()
let musicSyncTimer = -1
const tags = shallowReactive({
    page: 'Home',
    showChat: false,
    isSavePwdClick: false,
    savePassword: false,
    quickLoginSelect: '',
    selectedHistoryIndex: -1,
    showHistoryDropdown: false,
    showMusicPlayer: false,
    showFileManager: false,
    currentMusic: null as null | { title: string, cover: string, coverLight: boolean },
    musicPlaying: false,
    musicLyric: '',
})
const fps = shallowRef({
    last: Date.now(),
    ticks: 0,
    value: 0,
})
const hasTransferTasks = computed(() => getDownloadTasks().length > 0 || getUploadTasks().length > 0)
const hasActiveTransferTasks = computed(() => {
    return [...getDownloadTasks(), ...getUploadTasks()].some((task) => {
        return isActiveTransferStatus(task.status)
    })
})
const showFileManagerEntry = computed(() => {
    if (isNarrowLayout.value) {
        return hasActiveTransferTasks.value
    }
    return hasTransferTasks.value
})

//#region == 方法函数 ====================================================================

function updateLayoutState() {
    isNarrowLayout.value = window.innerWidth <= 500
}

function toggleMusicPlayer(open: boolean | undefined) {
    if(open != undefined ) {
        tags.showMusicPlayer = open
    } else {
        tags.showMusicPlayer = !tags.showMusicPlayer
    }
    refreshCurrentMusic()
}
function toggleFileManager(open: boolean | undefined) {
    if(open != undefined) {
        tags.showFileManager = open
    } else {
        tags.showFileManager = !tags.showFileManager
    }
    // 同步状态到 FileManager 模块
    if (tags.showFileManager) {
        panelVisible.value = true
    } else {
        closePanel()
    }
}
function updateMusicLyric(lyric: string) {
    tags.musicLyric = lyric
}
function updateMusicStatus(isPlaying: boolean) {
    tags.musicPlaying = isPlaying
}

async function refreshCurrentMusic() {
    const nowMusic = getCurrentMusic()
    if (!nowMusic) {
        tags.currentMusic = null
        return
    }
    let coverLight = tags.currentMusic?.coverLight ?? true
    const cover = await backend.proxyImageUrl(nowMusic.cover)
    if(nowMusic.cover != tags.currentMusic?.cover) {
        coverLight = await getForegroundToneFromImageUrl(cover, 0.4) == 'light'
    }
    tags.currentMusic = {
        title: nowMusic.title,
        cover,
        coverLight
    }
}

function updateNapcatColor(token: string) {
    const logger = new Logger()
    // api/base/Theme 获取主题配置信息
    fetch('/api/Base/Theme', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
        }
    }).then(async (response) => {
        if(response.ok) {
            const data = await response.json()
            const media = window.matchMedia('(prefers-color-scheme: dark)')
            if(media.matches) {
                const colorHsl = data.data.dark['--heroui-primary']
                document.documentElement.style.setProperty('--color-main', `hsl(${colorHsl} / .3)`)
                document.documentElement.style.setProperty('--color-main-0', `hsl(${colorHsl} / .3)`)
            } else {
                const colorHsl = data.data.light['--heroui-primary']
                document.documentElement.style.setProperty('--color-main', `hsl(${colorHsl} / .1)`)
                document.documentElement.style.setProperty('--color-main-0', `hsl(${colorHsl} / .1)`)
            }
        } else {
            logger.error(null, 'Napcat 主题获取失败，状态码：' + response.status)
        }
    }).catch((error) => {
        logger.error(null, 'Napcat 主题请求失败：' + error)
    })
}

/**
 * electron 窗口操作
 */
function controllWin(name: string) {
    backend.call(undefined, 'win:' + name, false)
}

/**
 * 处理 appbar 鼠标按下事件（Linux 平台窗口拖拽）
 */
function handleAppbarMouseDown(event: MouseEvent) {
    // 只在 Linux + Tauri 平台生效
    if (backend.platform === 'linux' && backend.type === 'tauri') {
        // 检查是否点击了按钮或控制器
        const target = event.target as HTMLElement
        if (target.closest('.bar-button') || target.closest('.controller')) {
            return
        }
        // 调用 Tauri 拖拽命令
        backend.call(undefined, 'win:startDrag', false)
    }
}

/**
 * 发起连接
 */
function connect() {
    if(tags.quickLoginSelect != '') {
        // PS：快速连接的地址只会是局域网，所以默认 ws 协议
        loginInfo.address = 'ws://' + tags.quickLoginSelect
    }
    Connector.create(loginInfo.address, loginInfo.token)
}
function selectQuickLogin(address: string) {
    tags.quickLoginSelect = address
}
function cancelQUickLogin() {
    loginInfo.quickLogin = null
}

/**
 * 地址输入框变化时
 */
function onAddressInput() {
    // 用户手动修改地址时，取消历史选择
    if (tags.selectedHistoryIndex >= 0) {
        tags.selectedHistoryIndex = -1
    }
}

/**
 * 切换历史下拉显示
 */
function toggleHistoryDropdown(event: Event) {
    event.stopPropagation()
    event.preventDefault()
    tags.showHistoryDropdown = !tags.showHistoryDropdown
}

/**
 * 点击外部关闭下拉菜单
 */
function handleClickOutside(event: Event) {
    if (!tags.showHistoryDropdown) return

    const target = event.target as HTMLElement
    const container = document.querySelector('.address-input-container')

    if (container && !container.contains(target)) {
        tags.showHistoryDropdown = false
    }
}

/**
 * 选择历史连接
 */
function selectHistoryItem(index: number) {
    tags.selectedHistoryIndex = index

    // 选中了历史连接
    if (loginInfo.connectionHistory && loginInfo.connectionHistory[index]) {
        const item = loginInfo.connectionHistory[index]
        loadConnectionFromHistory(item)
    }

    tags.showHistoryDropdown = false
}

/**
 * 删除历史连接
 */
function deleteHistoryConnection(index: number, event?: Event) {
    if (event) {
        event.preventDefault()
        event.stopPropagation()
    }
    deleteConnectionHistory(index)
    // 如果删除的是当前选中的，取消选择
    if (tags.selectedHistoryIndex === index) {
        tags.selectedHistoryIndex = -1
    } else if (tags.selectedHistoryIndex > index) {
        // 如果删除的在当前选中之前，索引需要减1
        tags.selectedHistoryIndex--
    }
}

/**
 * 切换主标签卡判定
 * @param name 页面名称
 * @param view 虚拟路径名称
 * @param show 是否显示聊天面板
 */
function changeTab(_: string, view: string, show: boolean) {
    // UM：发送页面路由分析
    if (
        !Option.get('close_ga') &&
        !dev
    ) {
        Umami.trackPageView('/' + view)
    }
    tags.showChat = show
    tags.page = view
    // 附加操作
    const optTab = document.getElementsByClassName('opt-main-tab')[0] as HTMLDivElement
    switch (view) {
        case 'Options': {
            Connector.send('get_version_info', {}, 'getVersionInfo')
            if (optTab) {
                optTab.style.opacity = '1'
            }
            break
        }
        case 'Home': {
            if (optTab) {
                optTab.style.opacity = '0'
            }
            break
        }
    }
}
function barMainClick() {
    if (loginInfo.status) {
        changeTab('信息', 'Messages', true)
    } else {
        changeTab('主页', 'Home', false)
    }
}

/**
 * 水波动画启动器
 * @param wave HTML 对象
 * @returns 动画循环器对象
 */
function waveAnimation(wave: HTMLElement | null) {
    if (wave) {
        const waves = wave.children[1].children
        const min = 20
        const max = 195
        const add = 1
        const timer = setInterval(() => {
            // 遍历波浪体
            for (let i = 0; i < waves.length; i++) {
                const now = waves[i].getAttribute('x')
                if (Number(now) + add > max) {
                    waves[i].setAttribute('x', min.toString())
                } else {
                    waves[i].setAttribute(
                        'x',
                        (Number(now) + add).toString(),
                    )
                }
            }
        }, 50)
        return timer
    }
    return -1
}

/**
 * 刷新页面 fps 数据
 * @param timestamp 时间戳
 */
function rafLoop() {
    fps.value.ticks += 1
    //每30帧统计一次帧率
    if (fps.value.ticks >= 30) {
        const now = Date.now()
        const diff = now - fps.value.last
        const value = Math.round(1000 / (diff / fps.value.ticks))
        fps.value.last = now
        fps.value.ticks = 0
        fps.value.value = value
    }
    requestAnimationFrame(rafLoop)
}

/**
 * 切换聊天对象状态
 * @param data 切换信息
 */
function changeChat(data: BaseChatInfoElem) {
    // 设置聊天信息
    chatStore.chatInfo = {
        show: data,
        info: {
            group_info: {},
            user_info: {},
            me_info: {},
            group_members: [],
            group_files: {},
            group_sub_files: {},
            jin_info: {
                list: [] as { [key: string]: any }[],
                pages: 0,
            },
        },
    }
    chatStore.mergeMessageList = undefined // 清空合并转发缓存
    uiStore.canLoadHistory = true // 重置终止加载标志
    uiStore.loadHistoryFail = false // 重置加载失败标志
    if (data.type == 'group') {
        // 获取自己在群内的资料
        Connector.send(
            'get_group_member_info',
            {
                group_id: data.id,
                user_id: authStore.loginInfo.uin,
            },
            'getUserInfoInGroup',
        )
        // 获取群成员列表
        // PS：部分功能不返回用户名需要进来查找所以提前获取
        Connector.send(
            'get_group_member_list',
            { group_id: data.id, no_cache: true },
            'getGroupMemberList',
        )
    }

    // 清理通知
    backend.call(undefined, 'sys:closeAllNotice', false, String(data.id))
}

/**
 * 移除当前的全局弹窗
 */
function removePopBox() {
    uiStore.popBoxList[0]?.onClose?.()
    uiStore.popBoxList.shift()
}

/**
 * 保存密码
 * @param event 事件
 */
function savePassword(event: Event) {
    const sender = event.target as HTMLInputElement
    const value = sender.checked
    if (value) {
        Option.save('save_password', true)
        // 创建提示弹窗
        const popInfo = {
            title: $t('提醒'),
            html: `<span>${$t('连接密钥将以明文存储在浏览器 Cookie 中，请确保设备安全以防止密钥泄漏。')}</span>`,
            button: [
                {
                    text: $t('知道了'),
                    master: true,
                    fun: () => {
                        uiStore.popBoxList.shift()
                    },
                },
            ],
        }
        uiStore.popBoxList.push(popInfo)
    } else {
        Option.remove('save_password')
    }
}

/**
 * 保存自动连接
 * @param event 事件
 */
function saveAutoConnect(event: Event) {
    Option.runASWEvent(event)
    // 如果自动保存密码没开，那也需要开
    if (!settingsStore.sysConfig.save_password) {
        savePassword(event)
    }
}

/**
 * 快速关闭弹窗（点击空白处关闭）
 * @param allow 是否允许快速关闭
 */
function popQuickClose(allow: boolean | undefined) {
    if (allow != false) {
        uiStore.popBoxList[0]?.onClose?.()
        uiStore.popBoxList.shift()
    } else {
        const animeBody = document.getElementById('pop-box')
        const timeLine = anime.timeline({ targets: animeBody })
        // 使用 animejs 实现一个沿中心左右摇晃的动画，摇晃三次
        timeLine.add({
            rotate: [
                { value: -1, duration: 75, easing: 'easeInOutSine' },
                { value: 1, duration: 150, easing: 'easeInOutSine' },
                { value: 0, duration: 75, easing: 'easeInOutSine' },
            ],
            duration: 200,
            easing: 'easeInOutSine',
            loop: 3,
        })
    }
}

function afd(event: MouseEvent) {
    // 只在愚人节时生效
    if (new Date().getMonth() == 3 && new Date().getDate() == 1) {
        const sender = event.target as HTMLButtonElement
        // 获取文档整体宽高
        const docWidth = document.documentElement.clientWidth
        const docHeight = document.documentElement.clientHeight
        // 获取按钮宽高
        const senderWidth = sender.offsetWidth
        const senderHeight = sender.offsetHeight
        // 获取鼠标位置
        const mouseX = event.clientX
        const mouseY = event.clientY
        // 在宽高里随机抽一个位置，不能超出文档，不能让按钮在鼠标下
        let x, y
        do {
            x = Math.floor(Math.random() * docWidth)
            y = Math.floor(Math.random() * docHeight)
        } while (
            x + senderWidth > docWidth ||
            y + senderHeight > docHeight ||
            (x < mouseX &&
                x + senderWidth > mouseX &&
                y < mouseY &&
                y + senderHeight > mouseY)
        )
        // 设置按钮位置
        sender.style.left = x + 'px'
        sender.style.top = y + 'px'
    }
}

//#endregion

//#region == 生命周期 ====================================================================

onMounted(() => {
    const logger = new Logger()
    window.moYu = () => { return '\x75\x6e\x64\x65\x66\x69\x6e\x65\x64' }

    // 添加全局点击事件监听，用于关闭下拉菜单
    document.addEventListener('click', handleClickOutside)
    window.addEventListener('resize', updateLayoutState)
    updateLayoutState()
    refreshCurrentMusic()
    musicSyncTimer = window.setInterval(() => {
        refreshCurrentMusic()
    }, 1000)

    // 监听 FileManager 面板状态
    watch(() => panelVisible.value, (val) => {
        tags.showFileManager = val
    })
    watch(showFileManagerEntry, (val) => {
        if (!val && tags.showFileManager) {
            toggleFileManager(false)
        }
    }, { immediate: true })

    // 页面加载完成后
    window.onload = async () => {
        await backend.init() // Desktop：初始化客户端功能

        if(import.meta.env.DEV) {
            // eslint-disable-next-line
            console.log('[ SSystem Bootloader Complete took ' + (new Date().getTime() - uptime) + 'ms, welcome to sar-dos on stapxs-qq-lite.su ]')
        } else {
            // eslint-disable-next-line
            console.log('[ SSystem Bootloader Complete took ' + (new Date().getTime() - uptime) + 'ms, welcome to ssqq on stapxs-qq-lite.user ]')
        }
        // 初始化波浪动画
        setLoginWaveTimer(waveAnimation(
            document.getElementById('login-wave'),
        ))
        // AMAP：初始化高德地图
        window._AMapSecurityConfig = import.meta.env.VITE_APP_AMAP_SECRET
        // =============================================================
        // 初始化功能
        App.createMenu() // Electron：创建菜单
        App.createIpc() // Electron：创建 IPC 通信
        // 加载开发者相关功能
        if (dev) {
            document.title = 'Stapxs QQ Lite (Dev)'
            // 布局检查工具
            Spacing.start()
            // FPS 检查
            rafLoop()
        }
        // 加载设置项
        const loadedConfig = await Option.load()
        const migratedBackground = await migrateInlineBackgroundImage(loadedConfig.chat_background)
        if (migratedBackground) {
            loadedConfig.chat_background = migratedBackground
            Option.runAS('chat_background', migratedBackground)
        }
        settingsStore.sysConfig = loadedConfig
        if (!migratedBackground) hydrateBackgroundImage(settingsStore.sysConfig.chat_background)
        if(dev) {
            logger.debug('stapxs-qq-lite.su:$/mnt/boot/dawnHunt/bin/core --pour /mnt/app/bin/main', true)
            logger.system('[ dawnHuntCore Version: 1.0 Beta, dawnHuntDB: 2025-04-24 ]')
        } else {
            logger.debug('stapxs-qq-lite.user:$/mnt/app/bin/main', true)
        }
        logger.add(LogType.DEBUG, '系统配置', settingsStore.sysConfig)
        // PS：重新再应用部分需要加载完成后才能应用的设置
        Option.run('opt_dark', Option.get('opt_dark'))
        Option.run('opt_auto_dark', Option.get('opt_auto_dark'))
        Option.run('theme_color', Option.get('theme_color'))
        // 流体玻璃样式附加设置
        if (Option.get('glass_effect')) {
            const app = document.getElementById('app')
            const body = document.body
            if(app && body) {
                body.style.setProperty('background', 'rgba(var(--color-bg-rgb), 0.5)', 'important')
                app.style.borderRadius = '25px'
            }
        }
        if (['linux', 'win32'].includes(backend.platform ?? '')) {
            const app = document.getElementById('base-app')
            if (app) app.classList.add('withBar')
        }
        // 基础初始化完成
        logger.system('欢迎回来，开发者。Stapxs QQ Lite 正处于 ' + (dev ? 'development' : 'production') + ' 模式。正在为您加载更多功能。')
        const loadView = document.getElementById('load-view')
        loadView?.remove()
        setTimeout(() => {
            const mainBody = document.getElementById('base-app')?.children[0]
            const mainBg = document.getElementById('main-bg')
            mainBody?.classList.remove('onloading')
            mainBg?.classList.remove('onloading')
            setTimeout(() => {
                const sideBar = document.getElementById('side-bar')
                sideBar?.classList.remove('onloading')
                setTimeout(() => {
                    const devBar = document.getElementById('dev-bar')
                    devBar?.classList.remove('onloading')
                }, 400)
            }, 400)
        }, 100)
        // 加载移动平台特性
        App.loadMobile()
        // 加载额外样式
        App.loadAppendStyle()
        document.body.style.setProperty('--safe-area-bottom',
            (Option.get('fs_adaptation') > 0 ? Option.get('fs_adaptation') : 0) + 'px')
        document.body.style.setProperty('--safe-area-top', '0')
        document.body.style.setProperty('--safe-area-left', '0')
        document.body.style.setProperty('--safe-area-right', '0')
        // Capacitor：移动端初始化安全区域
        if (backend.isMobile()) {
            // 我把 viewer 挂在 body 上，所以css也得改到 body 上
            const safeArea = await backend.call('SafeArea', 'getSafeArea', true)
            if (safeArea) {
                logger.add(LogType.DEBUG, '安全区域：', safeArea)
                document.body.style.setProperty('--safe-area-top', safeArea.top + 'px')
                document.body.style.setProperty('--safe-area-bottom', safeArea.bottom + 'px')
                document.body.style.setProperty('--safe-area-left', safeArea.left + 'px')
                document.body.style.setProperty('--safe-area-right', safeArea.right + 'px')
                // 图片查看器安全区域
                document.body.style.setProperty('--safe-area--viewer-top', safeArea.top + 'px')
            }
        }
        // 加载密码保存和自动连接
        loginInfo.address = settingsStore.sysConfig.address
        // 加载连接历史
        loginInfo.connectionHistory = loadConnectionHistory()
        if (
            settingsStore.sysConfig.save_password !== undefined &&
            settingsStore.sysConfig.save_password !== true
        ) {
            loginInfo.token = decodeStoredToken(settingsStore.sysConfig.save_password) ?? ''
            tags.savePassword = true
        }
        if (settingsStore.sysConfig.auto_connect == true) {
            connect()
        }
        if(napcat) {
            logger.info('Stapxs QQ Lite 处于 Napcat 模式 ……')
            const token = localStorage.getItem('token')
            if(token) {
                // api/Debug/create 获取连接配置信息
                fetch('/api/Debug/create', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + token
                    }
                }).then(async (response) => {
                    if(response.ok) {
                        const data = await response.json()
                        // 获取当前页面的根 URL
                        const rootUrl = window.location.origin
                        loginInfo.address = rootUrl.replace('http', 'ws') + '/api/Debug/ws'
                        loginInfo.token = data.data.token
                        connect()
                    } else {
                        logger.error(null, 'Napcat 快速连接失败，状态码：' + response.status)
                    }
                }).catch((error) => {
                    logger.error(null, 'Napcat 快速连接请求失败：' + error)
                })
                updateNapcatColor(token)
                window.addEventListener('storage', (event) => {
                    if(event.key === 'theme') {
                        updateNapcatColor(token)
                    }
                })
            }
        }
        // 服务发现
        backend.call('Onebot', 'sys:findService', false)
        backend.call('OneBot', 'sys:frontLoaded', false)
        // =============================================================
        // 初始化完成
        // 创建 popstate
        if(backend.platform == 'web' && (getDeviceType() === 'Android' || getDeviceType() === 'iOS')) {
            window.addEventListener('popstate', () => {
                if(!loginInfo.status || uiStore.openSideBar) {
                    // 离开提醒
                    const popInfo = {
                        title: $t('提醒'),
                        html: `<span>${$t('离开 Stapxs QQ Lite？')}</span>`,
                        button: [
                            {
                                text: $t('取消'),
                                fun: () => {
                                    uiStore.popBoxList.shift()
                                    history.pushState('ssqqweb', '', location.href)
                                },
                            },
                            {
                                text: $t('离开'),
                                master: true,
                                fun: () => {
                                    uiStore.popBoxList.shift()
                                    history.back()
                                },
                            },
                        ],
                    }
                    uiStore.popBoxList.push(popInfo)
                } else {
                    // 内部的页面返回处理，此处使用 watch backTimes 监听
                    connectionStore.backTimes += 1
                    history.pushState('ssqqweb', '', location.href)
                }
            });
            if (history.state != 'ssqqweb') {
                history.pushState('ssqqweb', '', location.href)
            }
        }
        // UM：加载 Umami 统计功能
        if (!Option.get('close_ga') && !dev) {
            const config = {
                baseUrl: import.meta.env.VITE_APP_MU_ADDRESS,
                websiteId: import.meta.env.VITE_APP_MU_ID
            } as any
            // 给页面添加一个来源域名方便在非 web 端获取统计信息
            if(!backend.isWeb()) {
                config.hostName = backend.type + '.stapxs.cn'
            } else if(napcat) {
                config.hostName = 'napcat.stapxs.cn'
            }
            Umami.initialize(config)
            // 上报一些应用基础信息
            App.sendIdentifyData({
                'app_version': import.meta.env.VITE_APP_CLIENT_TAG + ',' + packageInfo.version,
                'os_version': backend.release,
                'os_arch': backend.arch,
            })
        } else if (dev) {
            logger.system('开发者，由于 Stapxs QQ Lite 运行在调试模式下，分析组件并未初始化 …… 系统将无法捕获开发者阁下的访问状态，请悉知。')
        }
        App.checkUpdate() // 检查更新
        App.checkOpenTimes() // 检查打开次数
        App.checkNotice() // 检查公告
        // 加载愚人节附加
        if (new Date().getMonth() == 3 && new Date().getDate() == 1) {
            document.getElementById('connect_btn')?.classList.add('afd')
        }
        // 其他状态监听
        watch(() => contactStore.baseOnMsgList, () => {
            // macOS：刷新 Touch Bar 列表
            if (backend.isDesktop()) {
                const list = [] as
                    { id: number, name: string, image?: string }[]
                contactStore.baseOnMsgList.forEach((item) => {
                    list.push({
                        id: item.user_id ? item.user_id : item.group_id,
                        name: item.group_name ? item.group_name : item.remark === item.nickname ? item.nickname : item.remark + '（' + item.nickname + '）',
                        image: item.user_id ? 'https://q1.qlogo.cn/g?b=qq&s=0&nk=' + item.user_id : 'https://p.qlogo.cn/gh/' + item.group_id + '/' + item.group_id + '/0'
                    })
                })
                backend.call(undefined, 'sys:flushOnMessage', false, list)
            }

            // 刷新列表
            updateBaseOnMsgList()
        }, { deep: true })
        // 更新标题
        const titleList = [
            '也试试 Icalingua Plus Plus 吧！',
            '点击阅读《社交功能限制提醒》',
            '登录失败，Code 45',
            '你好世界！',
            '这只是个普通的彩蛋！'
        ]
        const title = titleList[Math.floor(Math.random() * titleList.length)]
        if(backend.platform == 'web') {
            document.title = title + '- Stapxs QQ Lite'
        } else {
            document.title = title
            backend.call(undefined, 'win:setTitle', false, title)
        }
    }
    // 页面关闭前
    window.onbeforeunload = () => {
        logger.system('开发者阁下—— 唔，阁下离开的太匆忙了！让我来帮开发者阁下收拾下东西吧。')
        new Notify().clear()
        if(import.meta.env.DEV) {
            Connector.close()
        }
    }
})

onUnmounted(() => {
    // 移除全局点击事件监听器
    document.removeEventListener('click', handleClickOutside)
    window.removeEventListener('resize', updateLayoutState)
    if (musicSyncTimer > 0) {
        clearInterval(musicSyncTimer)
        musicSyncTimer = -1
    }
})

//#endregion
</script>

<style scoped>
/* 应用通知动画 */
.appmsg-move,
.appmsg-enter-active,
.appmsg-leave-active {
    transition: all 0.2s;
}

.appmsg-leave-active {
    position: absolute;
}

.appmsg-enter-from,
.appmsg-leave-to {
    transform: translateX(-20px);
    opacity: 0;
}

/* 标题栏变更动画 */
.appbar-enter-active,
.appbar-leave-active {
    transition: all 0.2s;
}

.appbar-enter-from,
.appbar-leave-to {
    transform: translateY(-60px);
}

/* 弹窗动画 */
.modal-enter-active {
    transition: opacity 0.2s ease-out;
}

.modal-leave-active {
    transition: opacity 0.2s ease-in;
}

.modal-leave-to {
    opacity: 0;
}

.modal-enter-active .pop-box-body {
    animation: panelSlideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.modal-leave-active .pop-box-body {
    animation: panelSlideDown 0.2s cubic-bezier(0.4, 0, 0.6, 1);
}

.music-entry-small {
    display: none;
}
.music-entry-cover {
    width: 25px;
    height: 25px;
    border-radius: 6px;
    object-fit: cover;
    margin: 10px;
}
.music-entry-status {
    transform: translateY(calc(-100% - 3px));
    margin-bottom: calc(-100% + 10px);
    background-color: transparent !important;
    color: #545454 !important;
}
.music-entry-status.light {
    color: #e5e5e5 !important;
}
.music-entry-always-hide {
    display: none !important;
}
.music-entry-small-always-show {
    display: flex !important;
    margin-bottom: 10px !important;
}
.music-entry-small-always-show img {
    width: 35px;
    height: 35px;
}
.music-entry-small-always-show svg {
    transform: translateY(calc(-100% - 10px));
}

.global-music-player {
    position: fixed;
    left: 90px;
    bottom: 20px;
    z-index: 33;
    width: 350px;
    max-height: min(72vh, 560px);
    box-shadow: 0 0 10px var(--color-shader);
    overflow: auto;
}

.music-player-float-enter-active,
.music-player-float-leave-active {
    transition: opacity 0.2s ease, transform 0.2s ease;
}

.music-player-float-enter-from,
.music-player-float-leave-to {
    opacity: 0;
    transform: translateY(12px);
}

@media (max-width: 700px) {
    .global-music-player {
        left: 100px;
        bottom: 60px;
        width: calc(100vw - 200px);
        max-height: min(66vh, 460px);
    }
}

@media (max-width: 500px) {
    .global-music-player {
        left: 20px !important;
        bottom: 60px;
        width: calc(100vw - 70px);
        max-height: min(66vh, 460px);
    }
    .music-entry-small {
        margin-bottom: 10px !important;
        display: flex;
    }
    .music-entry-small img {
        width: 35px;
        height: 35px;
    }
    .music-entry-small svg {
        transform: translateY(calc(-100% - 10px));
    }
    .music-entry {
        display: none;
    }
}

@keyframes panelSlideUp {
    from {
        transform: translate(-50%, -20%) scale(0.95);
        opacity: 0;
    }

    to {
        transform: translate(-50%, -50%) scale(1);
        opacity: 1;
    }
}

@keyframes panelSlideDown {
    from {
        transform: translate(-50%, -50%) scale(1);
        opacity: 1;
    }

    to {
        transform: translate(-50%, -5%) scale(0.98);
        opacity: 0;
    }
}
</style>
