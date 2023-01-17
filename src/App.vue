<template>
    <div id="app">
        <div class="layui-tab layui-tab-brief main-body">
            <ul class="layui-tab-title">
                <li @click="changeTab('主页', 'Home', true)" :class="loginInfo.status ? 'hiden-home' : 'layui-this'">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512">>
                        <path
                            d="M575.8 255.5c0 18-15 32.1-32 32.1h-32l.7 160.2c0 2.7-.2 5.4-.5 8.1V472c0 22.1-17.9 40-40 40H456c-1.1 0-2.2 0-3.3-.1c-1.4 .1-2.8 .1-4.2 .1H416 392c-22.1 0-40-17.9-40-40V448 384c0-17.7-14.3-32-32-32H256c-17.7 0-32 14.3-32 32v64 24c0 22.1-17.9 40-40 40H160 128.1c-1.5 0-3-.1-4.5-.2c-1.2 .1-2.4 .2-3.6 .2H104c-22.1 0-40-17.9-40-40V360c0-.9 0-1.9 .1-2.8V287.6H32c-18 0-32-14-32-32.1c0-9 3-17 10-24L266.4 8c7-7 15-8 22-8s15 2 21 7L564.8 231.5c8 7 12 15 11 24z" />
                    </svg>
                </li>
                <li id="bar-msg" @click="changeTab('信息', 'Messages', false)"
                    :class="!loginInfo.status ? '' : 'layui-this'">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                        <path
                            d="M464 64C490.5 64 512 85.49 512 112C512 127.1 504.9 141.3 492.8 150.4L275.2 313.6C263.8 322.1 248.2 322.1 236.8 313.6L19.2 150.4C7.113 141.3 0 127.1 0 112C0 85.49 21.49 64 48 64H464zM217.6 339.2C240.4 356.3 271.6 356.3 294.4 339.2L512 176V384C512 419.3 483.3 448 448 448H64C28.65 448 0 419.3 0 384V176L217.6 339.2z" />
                    </svg>
                </li>
                <li @click="changeTab('列表', 'Friends', false)">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
                        <path
                            d="M224 256c70.7 0 128-57.31 128-128s-57.3-128-128-128C153.3 0 96 57.31 96 128S153.3 256 224 256zM274.7 304H173.3C77.61 304 0 381.6 0 477.3c0 19.14 15.52 34.67 34.66 34.67h378.7C432.5 512 448 496.5 448 477.3C448 381.6 370.4 304 274.7 304z" />
                    </svg>
                </li>
                <div style="flex: 1;" class="side-bar-space"></div>
                <li @click="changeTab('设置', 'Options', true);Connector.send('get_version_info', {}, 'getVersionInfo')">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                        <path
                            d="M495.9 166.6C499.2 175.2 496.4 184.9 489.6 191.2L446.3 230.6C447.4 238.9 448 247.4 448 256C448 264.6 447.4 273.1 446.3 281.4L489.6 320.8C496.4 327.1 499.2 336.8 495.9 345.4C491.5 357.3 486.2 368.8 480.2 379.7L475.5 387.8C468.9 398.8 461.5 409.2 453.4 419.1C447.4 426.2 437.7 428.7 428.9 425.9L373.2 408.1C359.8 418.4 344.1 427 329.2 433.6L316.7 490.7C314.7 499.7 307.7 506.1 298.5 508.5C284.7 510.8 270.5 512 255.1 512C241.5 512 227.3 510.8 213.5 508.5C204.3 506.1 197.3 499.7 195.3 490.7L182.8 433.6C167 427 152.2 418.4 138.8 408.1L83.14 425.9C74.3 428.7 64.55 426.2 58.63 419.1C50.52 409.2 43.12 398.8 36.52 387.8L31.84 379.7C25.77 368.8 20.49 357.3 16.06 345.4C12.82 336.8 15.55 327.1 22.41 320.8L65.67 281.4C64.57 273.1 64 264.6 64 256C64 247.4 64.57 238.9 65.67 230.6L22.41 191.2C15.55 184.9 12.82 175.3 16.06 166.6C20.49 154.7 25.78 143.2 31.84 132.3L36.51 124.2C43.12 113.2 50.52 102.8 58.63 92.95C64.55 85.8 74.3 83.32 83.14 86.14L138.8 103.9C152.2 93.56 167 84.96 182.8 78.43L195.3 21.33C197.3 12.25 204.3 5.04 213.5 3.51C227.3 1.201 241.5 0 256 0C270.5 0 284.7 1.201 298.5 3.51C307.7 5.04 314.7 12.25 316.7 21.33L329.2 78.43C344.1 84.96 359.8 93.56 373.2 103.9L428.9 86.14C437.7 83.32 447.4 85.8 453.4 92.95C461.5 102.8 468.9 113.2 475.5 124.2L480.2 132.3C486.2 143.2 491.5 154.7 495.9 166.6V166.6zM256 336C300.2 336 336 300.2 336 255.1C336 211.8 300.2 175.1 256 175.1C211.8 175.1 176 211.8 176 255.1C176 300.2 211.8 336 256 336z" />
                    </svg>
                </li>
            </ul>
            <div class="layui-tab-content">
                <div :class="!loginInfo.status ? 'layui-tab-item layui-show' : 'layui-tab-item'"
                    :name="$t('home_title')">
                    <div class="home-body">
                        <div class="login-pan-card ss-card">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                                <path
                                    d="M380.6 365.6C401.1 379.9 416 404.3 416 432C416 476.2 380.2 512 336 512C291.8 512 256 476.2 256 432C256 423.6 257.3 415.4 259.7 407.8L114.1 280.4C103.8 285.3 92.21 288 80 288C35.82 288 0 252.2 0 208C0 163.8 35.82 128 80 128C101.9 128 121.7 136.8 136.2 151.1L320 77.52C321.3 34.48 356.6 0 400 0C444.2 0 480 35.82 480 80C480 117.9 453.7 149.6 418.4 157.9L380.6 365.6zM156.3 232.2L301.9 359.6C306.9 357.3 312.1 355.4 317.6 354.1L355.4 146.4C351.2 143.6 347.4 140.4 343.8 136.9L159.1 210.5C159.7 218 158.5 225.3 156.3 232.2V232.2z">
                                </path>
                            </svg>
                            <p>{{ $t('home_card_title') }}</p>
                            <form @submit.prevent @submit="connect">
                                <label>
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512">
                                        <path
                                            d="M172.5 131.1C228.1 75.51 320.5 75.51 376.1 131.1C426.1 181.1 433.5 260.8 392.4 318.3L391.3 319.9C381 334.2 361 337.6 346.7 327.3C332.3 317 328.9 297 339.2 282.7L340.3 281.1C363.2 249 359.6 205.1 331.7 177.2C300.3 145.8 249.2 145.8 217.7 177.2L105.5 289.5C73.99 320.1 73.99 372 105.5 403.5C133.3 431.4 177.3 435 209.3 412.1L210.9 410.1C225.3 400.7 245.3 404 255.5 418.4C265.8 432.8 262.5 452.8 248.1 463.1L246.5 464.2C188.1 505.3 110.2 498.7 60.21 448.8C3.741 392.3 3.741 300.7 60.21 244.3L172.5 131.1zM467.5 380C411 436.5 319.5 436.5 263 380C213 330 206.5 251.2 247.6 193.7L248.7 192.1C258.1 177.8 278.1 174.4 293.3 184.7C307.7 194.1 311.1 214.1 300.8 229.3L299.7 230.9C276.8 262.1 280.4 306.9 308.3 334.8C339.7 366.2 390.8 366.2 422.3 334.8L534.5 222.5C566 191 566 139.1 534.5 108.5C506.7 80.63 462.7 76.99 430.7 99.9L429.1 101C414.7 111.3 394.7 107.1 384.5 93.58C374.2 79.2 377.5 59.21 391.9 48.94L393.5 47.82C451 6.731 529.8 13.25 579.8 63.24C636.3 119.7 636.3 211.3 579.8 267.7L467.5 380z">
                                        </path>
                                    </svg>
                                    <input v-model="loginInfo.address" :placeholder="$t('home_card_address')"
                                        class="ss-input" id="sev_address" autocomplete="off">
                                </label>
                                <label>
                                    <svg style="padding: 0 2px;" xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 448 512">
                                        <path
                                            d="M80 192V144C80 64.47 144.5 0 224 0C303.5 0 368 64.47 368 144V192H384C419.3 192 448 220.7 448 256V448C448 483.3 419.3 512 384 512H64C28.65 512 0 483.3 0 448V256C0 220.7 28.65 192 64 192H80zM144 192H304V144C304 99.82 268.2 64 224 64C179.8 64 144 99.82 144 144V192z">
                                        </path>
                                    </svg>
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
                                <button id="connect_btn" class="ss-button" type="submit">{{ $t('home_card_connect')
                                }}</button>
                            </form>
                            <a href="https://github.com/Stapxs/Stapxs-QQ-Lite-2.0#%E5%BF%AB%E9%80%9F%E4%BD%BF%E7%94%A8"
                                target="_blank" style="margin-bottom: -20px;">{{ $t('home_card_how_to_connect') }}</a>
                            <div class="wave-pan" style="margin-left: -30px;">
                                <svg id="login-wave" class="waves-svg" xmlns="http://www.w3.org/2000/svg"
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
                <div id="messageTab" :class="loginInfo.status ? 'layui-tab-item layui-show' : 'layui-tab-item'">
                    <Messages
                        :chat="runtimeData.chatInfo"
                        @userClick="changeChat"
                        @loadHistory="loadHistory">
                    </Messages>
                </div>
                <div class="layui-tab-item">
                    <Friends
                        :list="runtimeData.userList"
                        @loadHistory="loadHistory"
                        @userClick="changeChat">
                    </Friends>
                </div>
                <div class="layui-tab-item">
                    <Options :config="runtimeData.sysConfig" :info="runtimeData.loginInfo" :status="loginInfo">
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
          :mergeList="runtimeData.mergeMessageList == undefined ? [] : runtimeData.mergeMessageList"
          :list= runtimeData.messageList
          :chat="runtimeData.chatInfo"
          @userClick="changeChat">
        </component>
        <TransitionGroup class="app-msg" name="ViewNotices" tag="div">
          <div v-for="msg in appMsgs" :key="'appmsg-' + msg.id">
            <div v-html="msg.svg"></div>
            <a>{{ msg.text }}</a>
            <div v-if="!msg.autoClose" @click="popInfo.remove(msg.id)">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512"><path d="M310.6 361.4c12.5 12.5 12.5 32.75 0 45.25C304.4 412.9 296.2 416 288 416s-16.38-3.125-22.62-9.375L160 301.3L54.63 406.6C48.38 412.9 40.19 416 32 416S15.63 412.9 9.375 406.6c-12.5-12.5-12.5-32.75 0-45.25l105.4-105.4L9.375 150.6c-12.5-12.5-12.5-32.75 0-45.25s32.75-12.5 45.25 0L160 210.8l105.4-105.4c12.5-12.5 32.75-12.5 45.25 0s12.5 32.75 0 45.25l-105.4 105.4L310.6 361.4z"/></svg>
            </div>
          </div>
        </TransitionGroup>

        <div class="pop-box" v-if="runtimeData.popBoxList.length > 0">
            <div class="pop-box-body ss-card"
                :style="'transform: translate(-50%, calc(-50% - ' + ((runtimeData.popBoxList.length > 3 ? 3 : runtimeData.popBoxList.length) * 10) + 'px))'">
                <header v-show="runtimeData.popBoxList[0].title != undefined">
                    <div
                        v-if="runtimeData.popBoxList[0].svg != undefined"
                        v-html="runtimeData.popBoxList[0].svg">
                    </div>
                    <a>{{ runtimeData.popBoxList[0].title }}</a>
                    <svg @click="removePopBox" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512"><path d="M310.6 361.4c12.5 12.5 12.5 32.75 0 45.25C304.4 412.9 296.2 416 288 416s-16.38-3.125-22.62-9.375L160 301.3L54.63 406.6C48.38 412.9 40.19 416 32 416S15.63 412.9 9.375 406.6c-12.5-12.5-12.5-32.75 0-45.25l105.4-105.4L9.375 150.6c-12.5-12.5-12.5-32.75 0-45.25s32.75-12.5 45.25 0L160 210.8l105.4-105.4c12.5-12.5 32.75-12.5 45.25 0s12.5 32.75 0 45.25l-105.4 105.4L310.6 361.4z"></path></svg>
                </header>
                <div v-html="runtimeData.popBoxList[0].html"></div>
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
            <div></div>
        </div>
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
import xss from 'xss'
import cmp from 'semver-compare'
import appInfo from '../package.json'
import app from '@/main'
import Option from '@/function/option'

import { defineComponent, defineAsyncComponent } from 'vue'
import { Connector, login as loginInfo } from '@/function/connect'
import { Logger, popList, PopInfo } from '@/function/base'
import { runtimeData } from '@/function/msg'
import { BaseChatInfoElem } from '@/function/elements/information'
import { loadHistory, getTrueLang, gitmojiToEmoji, openLink } from '@/function/util'
import { DomainConfig, useState } from 'vue-gtag-next'

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
            Connector: Connector,
            defineAsyncComponent: defineAsyncComponent,
            save: Option.runASWEvent,
            popInfo: new PopInfo(),
            appMsgs: popList,
            loadHistory: loadHistory,
            loginInfo: loginInfo,
            runtimeData: runtimeData,
            tags: {
                showChat: false,
                isSavePwdClick: false,
                savePassword: false
            },
            viewerOpt: { inline: false, button: false, title: false, toolbar: { prev: true, rotateLeft: true, reset: true, rotateRight: true, next: true } },
            viewerBody: undefined as HTMLDivElement | undefined
        }
    },
    methods: {
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
            // GA：发送页面路由分析
            this.$gtag.pageview({
              page_path: '/' + view,
              page_title: name
            })
            if (!show) {
                this.tags.showChat = true
            } else {
                this.tags.showChat = false
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
                    jin_info: { data: { msg_list: [] } }
                }
            }
            runtimeData.mergeMessageList = []           // 清空合并转发缓存
            runtimeData.tags.canLoadHistory = true      // 重置终止加载标志
            // 重置图片预览器状态
            // Object.assign(this.$data.imgView, this.$options.data().imgView)
            if (data.type == 'group') {
                // 获取自己在群内的资料
                Connector.send('get_group_member_info', { group_id: data.id, user_id: this.runtimeData.loginInfo.uin }, 'getUserInfoInGroup')
                // 获取群成员列表
                // PS：部分功能不返回用户名需要进来查找所以提前获取
                Connector.send('get_group_member_list', { group_id: data.id }, 'getGroupMemberList')
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
        }
    },
    mounted () {
        const logger = new Logger()
        
        // 页面加载完成后
        window.onload = () => {
            app.config.globalProperties.$viewer = this.viewerBody
            const $cookies = app.config.globalProperties.$cookies
            // 初始化波浪动画
            runtimeData.tags.loginWaveTimer = this.waveAnimation(document.getElementById('login-wave'))
            // 加载 cookie 中的保存登陆信息
            if ($cookies.isKey('address')) {
                this.loginInfo.address = $cookies.get('address')
            }
            // 加载设置项
            runtimeData.sysConfig = Option.load()
            runtimeData.sysConfig.top_info = $cookies.get('top')
            // PS：重新再应用一次暗黑模式，因为需要在页面加载完成后处理
            Option.runAS('opt_dark', Option.get('opt_dark'))
            // 加载密码保存和自动连接
            if(runtimeData.sysConfig.save_password && runtimeData.sysConfig.save_password != true) {
                loginInfo.token = runtimeData.sysConfig.save_password
                this.tags.savePassword = true
            }
            if(runtimeData.sysConfig.auto_connect == true) {
                this.connect()
            }
            // 初始化完成
            logger.debug(this.$t('log_welcome'))
            logger.debug(this.$t('log_runtime') + ': ' + process.env.NODE_ENV)
            // GA：加载谷歌分析功能
            if (!Option.get('close_ga') && process.env.NODE_ENV == 'production') {
                const { property } = useState()
                if (property) {
                    property.value = {
                        id: 'G-ZQ88GPJRGH'
                    } as DomainConfig
                }
            } else if (process.env.NODE_ENV == 'development') {
                logger.debug(this.$t('log_GA_auto_closed'))
            }
            // 检查版本
            const appVersion = appInfo.version
            const cacheVersion = app.config.globalProperties.$cookies.get('version')
            if (!app.config.globalProperties.$cookies.isKey('version') || cmp(appVersion, cacheVersion) == 1) {
                // 更新 cookie 中的版本信息并抓取更新日志
                app.config.globalProperties.$cookies.set('version', appVersion, '1m')
                logger.debug(this.$t('version_updated') + ': ' + cacheVersion + ' -> ' + appVersion)
                // 从 Github 获取更新日志
                const url = 'https://api.github.com/repos/stapxs/stapxs-qq-lite-2.0/commits'
                const fetchData = {
                    sha: process.env.NODE_ENV == 'development' ? 'dev' : 'main',
                    per_page: '5'
                } as Record<string, string>
                fetch(url + '?' + new URLSearchParams(fetchData).toString())
                    .then(response => response.json())
                    .then(data => {
                        const json =data[0]
                        // 动态生成更新记录部分
                        const div = document.createElement('div')
                        div.className = 'update-info'
                        // 标题
                        const title = document.createElement('span')
                        title.innerText = app.config.globalProperties.$t('update_history')
                        const version = document.createElement('a')
                        version.innerText = 'v' + appVersion + ' - ' + fetchData.sha
                        div.appendChild(title)
                        div.appendChild(version)

                        const titlediv = document.createElement('div')
                        titlediv.className = 'title'
                        const ava = document.createElement('img')
                        ava.src = json.author.avatar_url
                        const name = document.createElement('a')
                        name.innerText = json.commit.author.name
                        name.href = json.author.html_url
                        const time = document.createElement('span')
                        time.innerText = Intl.DateTimeFormat(getTrueLang(),
                            { year: 'numeric', month: 'short', day: 'numeric' })
                            .format(new Date(json.commit.author.date))
                        titlediv.appendChild(ava)
                        titlediv.appendChild(name)
                        titlediv.appendChild(time)
                        div.appendChild(titlediv)

                        // 内容
                        const updateInfo = json.commit.message.split('\n')
                        const condiv = document.createElement('div')
                        condiv.className = 'info'
                        const updatetitle = document.createElement('span')
                        updatetitle.innerText = ' ' + updateInfo[0]
                        condiv.appendChild(updatetitle)
                        const textdiv = document.createElement('div')
                        for (let i = 1; i < updateInfo.length; i++) {
                            const baseinfodiv = document.createElement('div')
                            const baseinfo = document.createElement('span')
                            let text = updateInfo[i]
                            if(text.startsWith(':')) {
                                const end = text.substring(1).indexOf(':')
                                const name = text.substring(0, end + 2)
                                const emj = gitmojiToEmoji(name)
                                console.log(name + ' / ' + emj)
                                if(emj != undefined) {
                                    text = text.replace(name, emj)
                                }
                            }
                            baseinfo.innerText = text
                            baseinfodiv.appendChild(baseinfo)
                            textdiv.appendChild(baseinfodiv)
                        }
                        if (updateInfo.length > 1) {
                            condiv.appendChild(textdiv)
                        }

                        div.appendChild(condiv)

                        // 构建 popBox 内容
                        const popInfo = {
                            html: div.outerHTML,
                            button: [
                                {
                                    text: app.config.globalProperties.$t('btn_see'),
                                    fun: () => openLink('https://github.com/Stapxs/Stapxs-QQ-Lite-2.0/commit/' + json.sha)
                                },{
                                    text: app.config.globalProperties.$t('btn_know'),
                                    master: true,
                                    fun: () => { runtimeData.popBoxList.shift() }
                                }
                            ]
                        }
                        runtimeData.popBoxList.push(popInfo)
                    })
                    .catch(function (e) {
                        console.log(e)
                    })
            }
            // 检查打开次数
            if ($cookies.isKey('times')) {
                const getTimes = Number($cookies.get('times')) + 1
                $cookies.set('times', getTimes, '1m')
                if (getTimes % 50 == 0) {
                    // 构建 HTML
                    let html = '<div style="display:flex;flex-direction:column;padding:10px 5%;align-items:center;">'
                    html += '<svg style="height:2rem;fill:var(--color-font);margin-bottom:20px;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M16 0H144c5.3 0 10.3 2.7 13.3 7.1l81.1 121.6c-49.5 4.1-94 25.6-127.6 58.3L2.7 24.9C-.6 20-.9 13.7 1.9 8.5S10.1 0 16 0zM509.3 24.9L401.2 187.1c-33.5-32.7-78.1-54.2-127.6-58.3L354.7 7.1c3-4.5 8-7.1 13.3-7.1H496c5.9 0 11.3 3.2 14.1 8.5s2.5 11.5-.8 16.4zM432 336c0 97.2-78.8 176-176 176s-176-78.8-176-176s78.8-176 176-176s176 78.8 176 176zM264.4 241.1c-3.4-7-13.3-7-16.8 0l-22.4 45.4c-1.4 2.8-4 4.7-7 5.1L168 298.9c-7.7 1.1-10.7 10.5-5.2 16l36.3 35.4c2.2 2.2 3.2 5.2 2.7 8.3l-8.6 49.9c-1.3 7.6 6.7 13.5 13.6 9.9l44.8-23.6c2.7-1.4 6-1.4 8.7 0l44.8 23.6c6.9 3.6 14.9-2.2 13.6-9.9l-8.6-49.9c-.5-3 .5-6.1 2.7-8.3l36.3-35.4c5.6-5.4 2.5-14.8-5.2-16l-50.1-7.3c-3-.4-5.7-2.4-7-5.1l-22.4-45.4z"/></svg>'
                    html += `<span>${this.$t('popbox_open_times_1', { times: getTimes })}</span>`
                    html += `<span>${this.$t('popbox_open_times_2')}</span>`
                    html += '</div>'
                    const popInfo = {
                        title: this.$t('popbox_ohh'),
                        svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path d="M316.9 18C311.6 7 300.4 0 288.1 0s-23.4 7-28.8 18L195 150.3 51.4 171.5c-12 1.8-22 10.2-25.7 21.7s-.7 24.2 7.9 32.7L137.8 329 113.2 474.7c-2 12 3 24.2 12.9 31.3s23 8 33.8 2.3l128.3-68.5 128.3 68.5c10.8 5.7 23.9 4.9 33.8-2.3s14.9-19.3 12.9-31.3L438.5 329 542.7 225.9c8.6-8.5 11.7-21.2 7.9-32.7s-13.7-19.9-25.7-21.7L381.2 150.3 316.9 18z"/></svg>',
                        html: html,
                        button: [
                            {
                                text: app.config.globalProperties.$t('btn_open_times_no'),
                                fun: () => { runtimeData.popBoxList.shift() }
                            }, {
                                text: app.config.globalProperties.$t('btn_open_times_ok'),
                                master: true,
                                fun: () => { openLink('https://github.com/Stapxs/Stapxs-QQ-Lite-2.0');runtimeData.popBoxList.shift(); }
                            }
                        ]
                    }
                    runtimeData.popBoxList.push(popInfo)
                }
            } else {
                $cookies.set('times', 1, '1m')
            }
            // 获取公告通知
            const url = 'https://lib.stapxs.cn/download/stapxs-qq-lite/notice-config.json'
            const fetchData = {} as Record<string, string>
            fetch(url + '?' + new URLSearchParams(fetchData).toString())
                .then(response => response.json())
                .then(data => {
                    // 获取已显示过的公告 ID
                    let noticeShow = [] as number[]
                    if ($cookies.isKey('notice_show')) {
                        noticeShow = $cookies.get('notice_show').split(',')
                    }
                    // 解析公告列表
                    data.forEach((notice: any) => {
                        let isShowInDate = false
                        if(!notice.show_date) {
                            isShowInDate = true
                        }
                        else if(typeof notice.show_date == 'string' && new Date().toDateString() === new Date(notice.show_date).toDateString()) {
                            isShowInDate = true
                        } else if(typeof notice.show_date == 'object') {
                            notice.show_date.forEach((date: number) => {
                                if(new Date().toDateString() === new Date(date).toDateString()) {
                                    isShowInDate = true
                                }
                            })
                        }
                        if (notice.version == 2 &&noticeShow.indexOf((notice.id).toString()) < 0 && isShowInDate) {
                            // 加载公告弹窗列表
                            for (let i = 0; i < notice.pops.length; i++) {
                                // 添加弹窗
                                const info = notice.pops[i]
                                const popInfo = {
                                    title: info.title,
                                    html: info.html ? info.html : '',
                                    button: [
                                        {
                                            text: (notice.pops.length > 1 && i != notice.pops.length - 1) ? app.config.globalProperties.$t('btn_next') : app.config.globalProperties.$t('btn_yes'),
                                            master: true,
                                            fun: () => {
                                                // 添加已读记录
                                                if (noticeShow.indexOf(notice.id) < 0) {
                                                    noticeShow.push(notice.id)
                                                }
                                                $cookies.set('notice_show', noticeShow, '1m')
                                                // 关闭弹窗
                                                runtimeData.popBoxList.shift()
                                            }
                                        }
                                    ]
                                }
                                runtimeData.popBoxList.push(popInfo)
                            }
                        }
                    })
                })
        }
    }
})
</script>

<style>
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
    opacity: 0;
    transform: translateX(-20px);
  }
</style>
