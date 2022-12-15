<template>
    <div id="app">
        <div class="layui-tab layui-tab-brief main-body">
            <ul class="layui-tab-title">
                <li @click="changeTab('主页', 'Home', true)" :class="loginInfo.status ? 'hiden-home' : 'layui-this'">
                <!-- <svg-icon iconClass="#house-solid"></svg-icon> -->
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
                <li @click="changeTab('设置', 'Options', true)">
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
                                        <input type="checkbox" id="opt_save_password" onclick="changeSavePwd(this)">
                                        <a>{{ $t('home_card_save_pwd') }}</a>
                                    </label>
                                    <div style="flex: 1;"></div>
                                    <label class="default" style="justify-content: flex-end;">
                                        <input type="checkbox" id="opt_auto_connect" onclick="changeOpt(this)">
                                        <a>{{ $t('home_card_auto_con') }}</a>
                                    </label>
                                </div>
                                <a id="save_pwd_note" class="opt-tip login-tip" style="display: none;">
                                    {{ $t('home_card_tip', { name: $t('name') }) }}
                                </a>
                                <button id="connect_btn" class="ss-button" type="submit">{{ $t('home_card_connect')
                                }}</button>
                            </form>
                            <a href="https://github.com/Stapxs/Stapxs-QQ-Lite/blob/main/README.md#%E4%BD%BF%E7%94%A8"
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
        <!-- 消息主框体 -->
        <Chat
          ref="chat"
          v-if="loginInfo.status && runtimeData.chatInfo && runtimeData.chatInfo.show.id != 0"
          v-show="tags.showChat"
          :mumberInfo="runtimeData.chatInfo.info.now_member_info == undefined ? {} : runtimeData.chatInfo.info.now_member_info"
          :mergeList="runtimeData.mergeMessageList == undefined ? [] : runtimeData.mergeMessageList"
          :list= runtimeData.messageList
          :chat="runtimeData.chatInfo"></Chat>
    </div>
</template>

<script lang="ts">
import cmp from 'semver-compare'
import appInfo from '../package.json'
import app from '@/main'
import Option from '@/function/option'

import { defineComponent } from 'vue'
import { Connector, login as loginInfo } from '@/function/connect'
import { Logger } from '@/function/base'
import { runtimeData } from '@/function/msg'
import { BaseChatInfoElem } from '@/function/elements/information'
import { loadHistory } from '@/function/util'

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
            loadHistory: loadHistory,
            loginInfo: loginInfo,
            runtimeData: runtimeData,
            tags: {
                showChat: false
            }
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
            // // GA：发送页面路由统计
            // this.$gtag.pageview({
            //   page_path: '/' + view,
            //   page_title: name
            // })
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
                    group_sub_files: {}
                }
            }
            // 清空合并转发缓存
            runtimeData.mergeMessageList = []
            // 重置图片预览器状态
            // Object.assign(this.$data.imgView, this.$options.data().imgView)
            if (data.type == 'group') {
                // 获取自己在群内的资料
                Connector.send('get_group_member_info', { group_id: data.id, user_id: this.runtimeData.loginInfo.uin }, 'getUserInfoInGroup')
                // 获取群成员列表
                // PS：部分功能不返回用户名需要进来查找所以提前获取
                Connector.send('get_group_member_list', { group_id: data.id }, 'getGroupMemberList')
            }
        }
    },
    mounted () {
        const logger = new Logger()
        
        // 页面加载完成后
        window.onload = () => {
            const $cookies = app.config.globalProperties.$cookies

            // 初始化波浪动画
            this.waveAnimation(document.getElementById('login-wave'))
            // 加载 cookie 中的保存登陆信息
            if ($cookies.isKey('address')) {
                this.loginInfo.address = $cookies.get('address')
            }
            // 加载设置项
            runtimeData.sysConfig = Option.load()
            runtimeData.sysConfig.top_info = $cookies.get('top')
            // 初始化完成
            logger.debug(this.$t('log_welcome'))
            logger.debug(this.$t('log_runtime') + ': ' + process.env.NODE_ENV)
            // 加载谷歌统计功能
            // if (!Option.get('close_ga') && process.env.NODE_ENV == 'production') {
            //     bootstrap().then(() => {
            //         logger.debug(this.$t('log_GA_loaded'))
            //     })
            // } else if (process.env.NODE_ENV == 'development') {
            //     logger.debug(this.$t('log_GA_auto_closed'))
            // }
            // 检查版本
            const appVersion = appInfo.version
            const cacheVersion = app.config.globalProperties.$cookies.get('version')
            if (!app.config.globalProperties.$cookies.isKey('version') || cmp(appVersion, cacheVersion) == 1) {
                // 更新 cookie 中的版本信息并抓取更新日志
                app.config.globalProperties.$cookies.set('version', appVersion, '1m')
                logger.debug(this.$t('version_updated') + ': ' + cacheVersion + ' -> ' + appVersion)
                // TODO: 获取更新日志
            }
        }
    }
})
</script>
