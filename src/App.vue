<template>
    <div class="top-bar" name="appbar" v-if="runtimeData.sysConfig.opt_no_window">
        <div class="bar-button" @click="barMainClick()"></div>
        <div class="space"></div>
        <div class="controller">
            <div @click="controllWin('minimize')" class="min"><font-awesome-icon :icon="['fas', 'minus']" /></div>
            <div @click="controllWin('close')" class="close"><font-awesome-icon :icon="['fas', 'xmark']" /></div>
        </div>
    </div>
    <div v-if="runtimeData.tags.platform == 'darwin'" class="controller mac-controller"></div>
    <div id="base-app">
        <div class="main-body">
            <ul :style="get('fs_adaptation') > 0 ? `padding-bottom: ${get('fs_adaptation')}px;` : ''">
                <li id="bar-home" @click="changeTab('主页', 'Home', true)"
                    :class="(tags.page == 'Home' ? 'active' : '') + (loginInfo.status ? ' hiden-home' : '')">
                    <font-awesome-icon :icon="['fas', 'home']"/>
                </li>
                <li id="bar-msg" @click="changeTab('信息', 'Messages', false)" :class="tags.page == 'Messages' ? 'active' : ''">
                    <font-awesome-icon :icon="['fas', 'envelope']"/>
                </li>
                <li id="bar-friends" @click="changeTab('列表', 'Friends', false)" :class="tags.page == 'Friends' ? 'active' : ''">
                    <font-awesome-icon :icon="['fas', 'user']"/>
                </li>
                <div class="side-bar-space"></div>
                <li @click="changeTab('设置', 'Options', true);Connector.send('get_version_info', {}, 'getVersionInfo')"
                    :class="tags.page == 'Options' ? 'active' : ''">
                    <font-awesome-icon :icon="['fas', 'gear']"/>
                </li>
            </ul>
            <div :style="get('fs_adaptation') > 0 ? `height: calc(100% - ${75 + Number(get('fs_adaptation'))}px);` : ''">
                <div :name="$t('home_title')" v-if="tags.page == 'Home'">
                    <div class="home-body">
                        <div class="login-pan-card ss-card">
                            <font-awesome-icon :icon="['fas', 'circle-nodes']"/>
                            <p>{{ $t('home_card_title') }}</p>
                            <form @submit.prevent @submit="connect">
                                <label>
                                    <font-awesome-icon :icon="['fas', 'link']"/>
                                    <input v-model="loginInfo.address" :placeholder="$t('home_card_address')"
                                        class="ss-input" id="sev_address" autocomplete="off">
                                </label>
                                <label>
                                    <font-awesome-icon :icon="['fas', 'lock']"/>
                                    <input v-model="loginInfo.token" :placeholder="$t('home_card_key')" class="ss-input"
                                        type="password" id="access_token" autocomplete="off">
                                </label>
                                <div style="display: flex;">
                                    <label class="default">
                                        <input id="in_" type="checkbox" name="save_password" @click="savePassword" v-model="tags.savePassword">
                                        <a>{{ $t('home_card_save_pwd') }}</a>
                                    </label>
                                    <div style="flex: 1;"></div>
                                    <label class="default" style="justify-content: flex-end;">
                                        <input type="checkbox" name="auto_connect" @click="saveAutoConnect" v-model="runtimeData.sysConfig.auto_connect">
                                        <a>{{ $t('home_card_auto_con') }}</a>
                                    </label>
                                </div>
                                <button @mousemove="afd" id="connect_btn" class="ss-button" type="submit">{{ $t('home_card_connect')
                                }}</button>
                            </form>
                            <a href="https://github.com/Stapxs/Stapxs-QQ-Lite-2.0#%E5%BF%AB%E9%80%9F%E4%BD%BF%E7%94%A8"
                                target="_blank" style="margin-bottom: -20px;">{{ $t('home_card_how_to_connect') }}</a>
                            <div class="wave-pan" style="margin-left: -30px;">
                                <svg id="login-wave" xmlns="http://www.w3.org/2000/svg"
                                    xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 24 170 70"
                                    preserveAspectRatio="none" shape-rendering="auto">
                                    <defs>
                                        <path id="gentle-wave"
                                            d="M -160 44 c 30 0 58 -18 88 -18 s 58 18 88 18 s 58 -18 88 -18 s 58 18 88 18 v 44 h -352 Z">
                                        </path>
                                    </defs>
                                    <g class="parallax">
                                        <use xlink:href="#gentle-wave" x="83" y="0"></use>
                                        <use xlink:href="#gentle-wave" x="135" y="3"></use>
                                        <use xlink:href="#gentle-wave" x="185" y="5"></use>
                                        <use xlink:href="#gentle-wave" x="54" y="7"></use>
                                    </g>
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>
                <div id="messageTab" v-if="tags.page == 'Messages'">
                    <Messages
                        :chat="runtimeData.chatInfo"
                        @userClick="changeChat"
                        @loadHistory="loadHistory">
                    </Messages>
                </div>
                <div v-if="tags.page == 'Friends'">
                    <Friends
                        :list="runtimeData.userList"
                        @loadHistory="loadHistory"
                        @userClick="changeChat">
                    </Friends>
                </div>
                <div class="opt-main-tab">
                    <Options
                        :class="tags.page == 'Options' ? 'active' : ''"
                        :config="runtimeData.sysConfig"
                        :info="runtimeData.loginInfo"
                        :status="loginInfo">
                    </Options>
                </div>
            </div>
        </div>
        <component
          ref="chat"
          v-if="loginInfo.status && runtimeData.chatInfo && runtimeData.chatInfo.show.id != 0"
          v-show="tags.showChat"
          :is="runtimeData.pageView.chatView"
          :mumberInfo="runtimeData.chatInfo.info.now_member_info == undefined ? {} : runtimeData.chatInfo.info.now_member_info"
          :mergeList="runtimeData.mergeMessageList"
          :list= runtimeData.messageList
          :chat="runtimeData.chatInfo"
          @userClick="changeChat">
        </component>
        <TransitionGroup class="app-msg" name="appmsg" tag="div">
          <div v-for="msg in appMsgs" :key="'appmsg-' + msg.id">
            <div><font-awesome-icon :icon="['fas', msg.svg]"/></div>
            <a>{{ msg.text }}</a>
            <div v-if="!msg.autoClose" @click="popInfo.remove(msg.id)">
                <font-awesome-icon :icon="['fas', 'xmark']"/>
            </div>
          </div>
        </TransitionGroup>
        <Transition>
            <div class="pop-box" v-if="runtimeData.popBoxList.length > 0">
                <div :class="'pop-box-body ss-card' + (runtimeData.popBoxList[0].full ? ' full' : '') + (get('option_view_no_window') == true ? '' : ' window')"
                    :style="'transform: translate(-50%, calc(-50% - ' + ((runtimeData.popBoxList.length > 3 ? 3 : runtimeData.popBoxList.length) * 10) + 'px));' + (get('fs_adaptation') > 0 ? ` margin-bottom: ${40 + Number(get('fs_adaptation'))}px;` : '')">
                    <header v-show="runtimeData.popBoxList[0].title != undefined">
                        <div
                            v-if="runtimeData.popBoxList[0].svg != undefined">
                            <font-awesome-icon :icon="['fas', runtimeData.popBoxList[0].svg]" />
                        </div>
                        <a>{{ runtimeData.popBoxList[0].title }}</a>
                        <font-awesome-icon @click="removePopBox" :icon="['fas','xmark']"/>
                    </header>
                    <div v-if="runtimeData.popBoxList[0].html" v-html="runtimeData.popBoxList[0].html"></div>
                    <component v-else
                        :data="runtimeData.popBoxList[0].data"
                        :is="runtimeData.popBoxList[0].template"
                        v-bind="runtimeData.popBoxList[0].templateValue">
                    </component>
                    <div class="button" v-show="runtimeData.popBoxList[0].button">
                        <button
                            v-for="(button, index) in runtimeData.popBoxList[0].button"
                            :class="'ss-button' + (button.master == true ? ' master' : '')"
                            :key="'pop-box-btn' + index"
                            @click="button.fun">
                            {{ button.text }}
                        </button>
                    </div>
                    <div class="pop-box-more">
                        <div
                            v-for="index in runtimeData.popBoxList.length"
                            :data-id="index"
                            :key="'pop-more-' + index"
                            :class="index > runtimeData.popBoxList.length - 1 ? 'hid' : ''"
                            :style="'margin:-' + (2*(index-1)) + 'px ' + ((20*index-1)-(2*(index-1))) + 'px 0 ' + ((20*index-1)-(2*(index-1))) + 'px;'">
                        </div>
                    </div>
                </div>
                <div @click="popQuickClose(runtimeData.popBoxList[0].allowQuickClose)"></div>
            </div>
        </Transition>
        <viewer
            class="viewer" ref="viewer"
            :options="viewerOpt"
            :images="runtimeData.chatInfo.info.image_list"
            @inited="viewerInited"
            @hide="viewerHide"
            @show="viewerShow">
            <template #default="scope">
              <img v-for="info in scope.images" :src="info.img_url" :key="'imgView-' + info.index">
            </template>
        </viewer>
    </div>
</template>

<script lang="ts">
import Spacing from 'spacingjs/src/spacing'
import app from '@/main'
import Option from '@/function/option'
import Umami from '@stapxs/umami-logger-typescript'

import { defineComponent, defineAsyncComponent } from 'vue'
import { Connector, login as loginInfo } from '@/function/connect'
import { Logger, popList, PopInfo } from '@/function/base'
import { runtimeData, notificationList } from '@/function/msg'
import { BaseChatInfoElem } from '@/function/elements/information'
import * as App from './function/utils/appUtil'

import Options from '@/pages/Options.vue'
import Friends from '@/pages/Friends.vue'
import Messages from '@/pages/Messages.vue'
import Chat from '@/pages/Chat.vue'

export default defineComponent({
    name: 'App',
    components: {
        Options,
        Friends,
        Messages,
        Chat
    },
    data () {
        return {
            dev: process.env.NODE_ENV == 'development',
            Connector: Connector,
            defineAsyncComponent: defineAsyncComponent,
            save: Option.runASWEvent,
            get: Option.get,
            popInfo: new PopInfo(),
            appMsgs: popList,
            loadHistory: App.loadHistory,
            loginInfo: loginInfo,
            runtimeData: runtimeData,
            notificationList: notificationList,
            tags: {
                page: 'Home',
                showChat: false,
                isSavePwdClick: false,
                savePassword: false
            },
            viewerOpt: { inline: false, button: false, title: false, navbar: false, toolbar: { prev: true, rotateLeft: true, reset: true, rotateRight: true, next: true } },
            viewerBody: undefined as HTMLDivElement | undefined
        }
    },
    methods: {
        /**
         * electron 窗口操作
         */
        controllWin (name: string) {
            if (runtimeData.reader) {
                runtimeData.reader.send('win:' + name)
            }
        },
        
        /**
         * 发起连接
         */
        connect () {
            Connector.create(this.loginInfo.address, this.loginInfo.token)
        },

        /**
         * 切换主标签卡判定
         * @param name 页面名称
         * @param view 虚拟路径名称
         * @param show 是否显示聊天面板
         */
        changeTab (name: string, view: string, show: boolean) {
            // UM：发送页面路由分析
            Umami.trackPageView('/' + view)
            this.tags.showChat = !show
            this.tags.page = view
        },
        barMainClick() {
            if(loginInfo.status) {
                this.changeTab('信息', 'Messages', false)
            } else {
                this.changeTab('主页', 'Home', true)
            }
        },

        /**
         * 水波动画启动器
         * @param wave HTML 对象
         * @returns 动画循环器对象
         */
        waveAnimation (wave: HTMLElement | null) {
            if (wave) {
                let waves = wave.children[1].children
                let min = 20
                let max = 195
                let add = 1
                let timer = setInterval(() => {
                    // 遍历波浪体
                    for (var i = 0; i < waves.length; i++) {
                        let now = waves[i].getAttribute('x')
                        if (Number(now) + add > max) {
                            waves[i].setAttribute('x', min.toString())
                        } else {
                            waves[i].setAttribute('x', (Number(now) + add).toString())
                        }
                    }
                }, 50)
                return timer
            }
        },

        /**
         * 切换聊天对象状态
         * @param data 切换信息
         */
        changeChat (data: BaseChatInfoElem) {
            // 设置聊天信息
            this.runtimeData.chatInfo = {
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
                        pages: 0
                    }
                }
            }
            runtimeData.mergeMessageList = undefined    // 清空合并转发缓存
            runtimeData.tags.canLoadHistory = true      // 重置终止加载标志
            if (data.type == 'group') {
                // 获取自己在群内的资料
                Connector.send('get_group_member_info', { group_id: data.id, user_id: this.runtimeData.loginInfo.uin }, 'getUserInfoInGroup')
                // 获取群成员列表
                // PS：部分功能不返回用户名需要进来查找所以提前获取
                Connector.send('get_group_member_list', { group_id: data.id }, 'getGroupMemberList')
            }
            // 刷新系统消息
            Connector.send('get_system_msg', {}, 'getSystemMsg')

            // 清理通知
            if(runtimeData.reader) {
                runtimeData.reader.send('sys:closeAllNotice', data.id)
            }
        },

        /**
         * 图片查看器初始化
         * @param viewer viewer 对象
         */
        viewerInited (viewer: HTMLDivElement) {
            this.viewerBody = viewer
        },

        /**
         * 图片查看器事件
         */
        viewerHide () {
            runtimeData.tags.viewer.show = false
        },
        viewerShow () {
            runtimeData.tags.viewer.show = true
        },
        
        /**
         * 移除当前的全局弹窗
         */
        removePopBox () {
            runtimeData.popBoxList.shift()
        },

        /**
         * 保存密码
         * @param event 事件
         */
        savePassword(event: Event) {
            const sender = event.target as HTMLInputElement
            const value = sender.checked
            if(value) {
                Option.save('save_password', true)
                // 创建提示弹窗
                const popInfo = {
                    title: this.$t('popbox_tip'),
                    html: `<span>${this.$t('auto_connect_tip')}</span>`,
                    button: [
                        {
                            text: app.config.globalProperties.$t('btn_know'),
                            master: true,
                            fun: () => { runtimeData.popBoxList.shift() }
                        }
                    ]
                }
                runtimeData.popBoxList.push(popInfo)
            } else {
                Option.remove('save_password')
            }
        },

        /**
         * 保存自动连接
         * @param event 事件
         */
        saveAutoConnect(event: Event) {
            Option.runASWEvent(event)
            // 如果自动保存密码没开，那也需要开
            if(!runtimeData.sysConfig.save_password) {
                this.savePassword(event)
            }
        },

        /**
         * 快速关闭弹窗（点击空白处关闭）
         * @param allow 是否允许快速关闭
         */
        popQuickClose(allow: boolean | undefined) {
            if(allow != false) {
                runtimeData.popBoxList.shift()
            }
        },

        afd(event: MouseEvent) {
            // 只在愚人节时生效
            if(new Date().getMonth() == 3 && new Date().getDate() == 1) {
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
                do {
                    var x = Math.floor(Math.random() * docWidth)
                    var y = Math.floor(Math.random() * docHeight)
                } while (x + senderWidth > docWidth || y + senderHeight > docHeight || (x < mouseX && x + senderWidth > mouseX && y < mouseY && y + senderHeight > mouseY))
                // 设置按钮位置
                sender.style.left = x + 'px'
                sender.style.top = y + 'px'
            }
        }
    },
    mounted () {
        const logger = new Logger()
        window.moYu = () => { return 'undefined' }
        // 页面加载完成后
        window.onload = async () => {
            // 初始化全局参数
            runtimeData.tags.isElectron = (process.env.IS_ELECTRON as unknown) as boolean && window.require != undefined
            const electron = runtimeData.tags.isElectron ? window.require('electron') : null
            const reader = electron ? electron.ipcRenderer : null
            runtimeData.reader = reader
            if (reader) {
                runtimeData.tags.platform = await reader.invoke('sys:getPlatform')
                runtimeData.tags.release = await reader.invoke('sys:getRelease')
            }
            app.config.globalProperties.$viewer = this.viewerBody
            // 初始化波浪动画
            runtimeData.tags.loginWaveTimer = this.waveAnimation(document.getElementById('login-wave'))
            // AMAP：初始化高德地图
            window._AMapSecurityConfig =  process.env.VUE_APP_AMAP_SECRET
            // =========================================================================
            // 初始化功能
            App.createMenu()            // Electron：创建菜单
            App.createIpc()             // Electron：创建 IPC 通信
            App.loadAppendStyle()       // 加载额外样式
            // 加载开发者相关功能
            if (process.env.NODE_ENV == 'development') {
                document.title = 'Stapxs QQ Lite (Dev)'
                // 布局检查工具
                Spacing.start()
            }
            // 加载设置项
            runtimeData.sysConfig = Option.load()
            // PS：重新再应用部分需要加载完成后才能应用的设置
            Option.run('opt_dark', Option.get('opt_dark'))
            Option.run('opt_auto_dark', Option.get('opt_auto_dark'))
            Option.run('theme_color', Option.get('theme_color'))
            Option.run('opt_auto_win_color', Option.get('opt_auto_win_color'))
            if(Option.get('opt_no_window') == true) {
                const app = document.getElementById('base-app')
                if(app) app.classList.add('withBar')
            }
            Option.runAS('opt_auto_gtk', Option.get('opt_auto_gtk'))
            // 加载密码保存和自动连接
            loginInfo.address = runtimeData.sysConfig.address
            if(runtimeData.sysConfig.save_password && runtimeData.sysConfig.save_password != true) {
                loginInfo.token = runtimeData.sysConfig.save_password
                this.tags.savePassword = true
            }
            if(runtimeData.sysConfig.auto_connect == true) {
                this.connect()
            }
            // =========================================================================
            // 初始化完成
            logger.debug(this.$t('log_welcome'))
            logger.debug(this.$t('log_runtime') + ': ' + process.env.NODE_ENV)
            // UM：加载 Umami 统计功能
            if (!Option.get('close_ga') && process.env.NODE_ENV == 'production') {
                // 给页面添加一个来源域名方便在 electron 中获取
                const config = {
                    baseUrl: process.env.VUE_APP_MU_ADDRESS,
                    websiteId: process.env.VUE_APP_MU_ID
                } as any
                if(runtimeData.tags.isElectron) {
                    config.hostName = 'electron.stapxs.cn'
                }
                Umami.initialize(config)
            } else if (process.env.NODE_ENV == 'development') {
                logger.debug(this.$t('log_GA_auto_closed'))
            }
            App.checkUpdate()                // 检查更新
            App.checkOpenTimes()             // 检查打开次数
            App.checkNotice()                // 检查公告
            // 加载愚人节附加
            if(new Date().getMonth() == 3 && new Date().getDate() == 1) {
                document.getElementById('connect_btn')?.classList.add('afd')
            }
        }
    }
})
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
</style>
