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
    <div :class="'message' + (isMerge ? ' merge' : '') + (data.revoke ? ' revoke' : '') + (isMe ? ' me': '')" :data-raw="getMsgRawTxt(data.message)"
        :id="'chat-' + getSeq(data.message_id)" :data-sender="data.sender.user_id" :data-time="data.time"
        @mouseleave="hiddenUserInfo">
        <img :src="'https://q1.qlogo.cn/g?b=qq&s=0&nk=' + data.sender.user_id" v-show="!isMe || isMerge">
        <div class="message-space" v-if="isMe && !isMerge"></div>
        <div :class="isMe ? (isMerge ? 'message-body' : 'message-body me') : 'message-body'">
            <a v-show="!isMe || isMerge">{{ data.sender.card ? data.sender.card : data.sender.nickname }}{{
                    runtimeData.chatInfo.show.type !== 'group' ? (isMe ? runtimeData.loginInfo.nickname : runtimeData.chatInfo.show.name)
                        : ''
            }}</a>
            <div>
                <!-- 回复指示框 -->
                <div v-if="data.source" :class="isMe ? (isMerge ? 'msg-replay' : 'msg-replay me') : 'msg-replay'"
                    @click="scrollToMsg(data.source.seq)">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                        <path
                            d="M8.31 189.9l176-151.1c15.41-13.3 39.69-2.509 39.69 18.16v80.05C384.6 137.9 512 170.1 512 322.3c0 61.44-39.59 122.3-83.34 154.1c-13.66 9.938-33.09-2.531-28.06-18.62c45.34-145-21.5-183.5-176.6-185.8v87.92c0 20.7-24.31 31.45-39.69 18.16l-176-151.1C-2.753 216.6-2.784 199.4 8.31 189.9z">
                        </path>
                    </svg>
                    <a> {{ getRepInfo((data.source ? data.source.message : ''), data) }} </a>
                </div>
                <!-- 消息体 -->
                <div v-for="(item, index) in data.message" :class="View.isMsgInline(item.type) ? 'msg-inline' : ''" :key="data.message_id + '-m-' + index">
                    <span v-if="isDebugMsg" class="msg-text">{{ item }}</span>
                    <span v-else-if="item.type === 'text'" v-show="item.text !== ''" class="msg-text" v-html="parseText(item.text)"></span>
                    <img v-else-if="item.type === 'image'" :title="$t('chat_view_pic')" :alt="$t('chat_group_pic')" @click="imgClick(data.message_id)" :class="imgStyle(data.message.length, index)" :src="item.url">
                    <img v-else-if="item.type === 'face'" :alt="item.text" class="msg-face" :src="require('./../assets/img/qq-face/' + item.id + '.gif')" :title="item.text">
                    <span v-else-if="item.type === 'bface'" style="font-style: italic;opacity: 0.7;">[ {{ $t('chat_fun_menu_pic') }}：{{ item.text }} ]</span>
                    <div v-else-if="item.type === 'at'" v-show="isAtShow(data.source, item.qq)" :class="getAtClass(item.qq)">
                        <a @mouseenter="showUserInfo" :data-id="item.qq" :data-group="data.group_id">{{ item.text }}</a>
                    </div>
                    <div v-else-if="item.type === 'xml'" v-html="View.buildXML(item.data, item.id, data.message_id)" @click="View.cardClick('xml-' + data.message_id)"></div>
                    <div v-else-if="item.type === 'json'" v-html="View.buildJSON(item.data, data.message_id)" @click="View.cardClick('json-' + data.message_id)">
                    </div>
                    <span v-else class="msg-unknown">{{ '( ' + $t('chat_unsupported_msg') + ': ' + item.type + ' )'
                    }}</span>
                </div>
                <!-- 链接预览框 -->
                <div :class="'msg-link-view ' + linkViewStyle"
                    v-if="pageViewInfo !== undefined && Object.keys(pageViewInfo).length > 0">
                    <div :class="'bar' + (isMe ? ' me' : '')"></div>
                    <div>
                        <img :id="data.message_id + '-linkview-img'" @load="linkViewPicFin" alt="预览图片" title="查看图片"
                            :src="pageViewInfo.img" v-if="pageViewInfo.img !== undefined">
                        <div class="body">
                            <p>{{ pageViewInfo.site }}</p>
                            <span :href="pageViewInfo.url">{{ pageViewInfo.title }}</span>
                            <span>{{ pageViewInfo.desc }}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <code style="display: none;">{{ data.raw_message }}</code>
    </div>
</template>
  
<script lang="ts">

import Util from '@/function/util'
import Option from '@/function/option'

import { MsgBodyFuns as ViewFuns } from '@/function/model/msg-body'
import { defineComponent } from 'vue'
import { Connector } from '@/function/connect'
import { runtimeData } from '@/function/msg'
import { Logger } from '@/function/base'

export default defineComponent({
    name: 'MsgBody',
    props: ['data', 'isMerge'],
    data () {
        return {
            isMe: false,
            isDebugMsg: Option.get('debug_msg'),
            linkViewStyle: '',
            View: ViewFuns,
            runtimeData: runtimeData,
            pageViewInfo: undefined as { [key: string]: any } | undefined,
            gotLink: false
        }
    },
    methods: {
        /**
         * 获取消息的纯文本（此方法可能会被遗弃）
         * @param message 消息对象
         */
        getMsgRawTxt (message: any) {
            return Util.getMsgRawTxt(message)
        },

        /**
         * 判断是否需要隐藏重复的 At
         * @param source 回复信息
         * @param at at 信息
         */
        isAtShow (source: any, at: any) {
            if (source !== undefined) {
                return !(at === source.user_id)
            }
            return true
        },

        /**
         * 根据消息状态获取 At 消息实际的 CSS class
         * @param who 
         */
        getAtClass (who: number) {
            let back = 'msg-at'
            if (this.isMe && !(this.isMerge)) {
                back += ' me'
            }
            if (runtimeData.loginInfo.uin === who) {
                back += ' atme'
            }
            return back
        },

        /**
         * 滚动到指定消息
         * @param id 消息 ID
         */
        scrollToMsg (id: string) {
            this.$emit('scrollToMsg', 'chat-' + id)
        },

        /**
         * 处理图片显示需要的样式，顺便添加图片列表
         * @param length 消息段数
         * @param at 图片在消息中的位置
         */
        imgStyle (length: number, at: number) {
            // 处理样式
            if (length === 1) { return 'msg-img alone' }
            if (at === 0) { return 'msg-img top' }
            if (at === length - 1) { return 'msg-img button' }
            return 'msg-img'
        },

        /**
         * 图片点击
         * @param msgId 消息 ID
         */
        imgClick (msgId: string) {
            this.$emit('viewImg', msgId)
        },

        /**
         * 获取消息 ID 的 seq
         * @param id 消息 ID
         */
        getSeq (id: string) {
            return Util.parseMsgId(id).seqid
        },

        /**
         * 处理纯文本消息和链接预览
         * @param text 纯文本消息
         */
        parseText (text: string) {
            const logger = new Logger()

            text = ViewFuns.parseText(text)
            // 链接判定
            const reg = /(http|ftp|https):\/\/[\w\-_]+(\.[\w\-_]+)+([\w\-\.,@?^=%&:/~\+#]*[\w\-\@?^=%&/~\+#])?/gi //eslint-disable-line
            text = text.replaceAll(reg, '<a href="$&" target="_blank">$&</a>')
            let linkList = text.match(reg)
            if (linkList !== null && !this.gotLink) {
                this.gotLink = true
                const fistLink = linkList[0]
                // GA：上传使用链接预览功能的事件用于统计
                // const reg1 = /\/\/(.*?)\//g
                // const getDom = fistLink.match(reg1)
                // if (getDom !== null) {
                //     Vue.$gtag.event('link_view', { domain: RegExp.$1 })
                // } else {
                //     Vue.$gtag.event('link_view')
                // }
                // 获取链接预览
                fetch('https://api.stapxs.cn/Page-Info?address=' + fistLink)
                    .then(res => res.json())
                    .then(res => {
                        if (res.status === undefined && Object.keys(res).length > 0) {
                            logger.debug(this.$t('chat_link_view_success') + ': ' + res['og:title'])
                            const pageData = {
                                site: res['og:site_name'] === undefined ? '' : res['og:site_name'],
                                title: res['og:title'] === undefined ? '' : res['og:title'],
                                desc: res['og:description'] === undefined ? '' : res['og:description'],
                                img: res['og:image'],
                                link: res['og:url']
                            }
                            this.pageViewInfo = pageData
                        }
                    })
                    .catch(error => {
                        if (error) {
                            logger.error(this.$t('chat_link_view_fail') + ': ' + fistLink)
                        }
                    })
            }
            // 返回
            return text
        },

        /**
         * 对链接预览的图片长宽进行判定以确定显示样式
         */
        linkViewPicFin () {
            const img = document.getElementById(this.data.message_id + '-linkview-img') as HTMLImageElement
            if (img !== null) {
                const w = img.naturalWidth
                const h = img.naturalHeight
                if (w > h) {
                    this.linkViewStyle = 'large'
                }
            }
        },

        /**
         * 当鼠标悬停在 at 消息上时显示被 at 人的消息悬浮窗
         * @param event 消息事件
         */
        showUserInfo (event: Event) {
            const sender = event.currentTarget as HTMLDivElement
            const id = sender.dataset.id
            const group = sender.dataset.group
            // 获取鼠标位置
            const pointEvent = event as MouseEvent || window.event as MouseEvent
            const pointX = pointEvent.offsetX
            const pointY = pointEvent.clientY
            // TODO: 出界判定不做了怪麻烦的
            // 请求用户信息
            Connector.send('getGroupMemberInfo', { group_id: group, user_id: id },
                'getGroupMemberInfo_' + pointX + '_' + pointY)
        },

        /**
         * 隐藏 At 信息面板
         */
        hiddenUserInfo () {
            if(runtimeData.chatInfo.info.now_member_info !== undefined) {
                runtimeData.chatInfo.info.now_member_info = undefined
            }
        },

        /**
         * 获取回复内容（拼接名字和消息内容）
         * @param msg 消息对象
         * @param data 回复信息
         */
        getRepInfo (msg: any, data: any) {
            const list = this.runtimeData.chatInfo.info.group_members.filter((item) => {
                return Number(item.user_id) === Number(data.source.user_id)
            })
            if (list.length === 1) {
                return (list[0].card !== '' ? list[0].card : list[0].nickname) + ': ' + msg
            }
            return msg
        }
    },
    mounted () {
        // 初始化 isMe 参数
        this.isMe = Number(runtimeData.loginInfo.uin) === Number(this.data.sender.user_id)
    }
})
</script>
