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
    <div :class="'message' + (type ? ' ' + type : '') + (data.revoke ? ' revoke' : '') + (isMe ? ' me': '')" :data-raw="getMsgRawTxt(data.message)"
        :id="'chat-' + getSeq(data.message_id)" :data-sender="data.sender.user_id" :data-time="data.time"
        @mouseleave="hiddenUserInfo">
        <img :src="'https://q1.qlogo.cn/g?b=qq&s=0&nk=' + data.sender.user_id" v-show="!isMe || type == 'merge'">
        <div class="message-space" v-if="isMe && type != 'merge'"></div>
        <div :class="isMe ? (type == 'merge' ? 'message-body' : 'message-body me') : 'message-body'">
            <a v-if="data.sender.card || data.sender.nickname" v-show="!isMe || type == 'merge'">
                {{ data.sender.card ? data.sender.card : data.sender.nickname }}
            </a>
            <a v-else v-show="!isMe || type == 'merge'">
                {{ isMe ? runtimeData.loginInfo.nickname : runtimeData.chatInfo.show.name }}
            </a>
            <div>
                <!-- 回复指示框 -->
                <div v-if="data.source && data.source.seq" :class="isMe ? (type == 'merge' ? 'msg-replay' : 'msg-replay me') : 'msg-replay'"
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
                    <div v-if="item.type === undefined" ></div>
                    <span v-else-if="isDebugMsg" class="msg-text">{{ item }}</span>
                    <span v-else-if="item.type == 'text'" v-show="item.text !== ''" class="msg-text" v-html="parseText(item.text)"></span>
                    <img v-else-if="item.type == 'image'" :title="$t('chat_view_pic')" :alt="$t('chat_group_pic')" @load="scrollButtom" @error="imgLoadFail" @click="imgClick(data.message_id)" :class="imgStyle(data.message.length, index)" :src="item.url">
                    <img v-else-if="item.type == 'face'" :alt="item.text" class="msg-face" :src="require('./../assets/img/qq-face/' + item.id + '.gif')" :title="item.text">
                    <span v-else-if="item.type == 'bface'" style="font-style: italic;opacity: 0.7;">[ {{ $t('chat_fun_menu_pic') }}：{{ item.text }} ]</span>
                    <div v-else-if="item.type == 'at'" v-show="isAtShow(data.source, item.qq)" :class="getAtClass(item.qq)">
                        <a @mouseenter="showUserInfo" :data-id="item.qq" :data-group="data.group_id">{{ getAtName(item) }}</a>
                    </div>
                    <div v-else-if="item.type == 'file'" :class="'msg-file' + (isMe ? ' me' : '')">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><path d="M0 64C0 28.65 28.65 0 64 0H224V128C224 145.7 238.3 160 256 160H384V448C384 483.3 355.3 512 320 512H64C28.65 512 0 483.3 0 448V64zM256 128V0L384 128H256z"/></svg>
                        <div>
                            <div><p>{{ item.name }}</p><a>（{{ getSizeFromBytes(item.size) }}）</a></div><i>{{ item.md5 }}</i></div>
                            <div>
                                <svg @click="downloadFile(item, data.message_id)" v-if="item.downloadingPercentage === undefined" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><path d="M374.6 310.6l-160 160C208.4 476.9 200.2 480 192 480s-16.38-3.125-22.62-9.375l-160-160c-12.5-12.5-12.5-32.75 0-45.25s32.75-12.5 45.25 0L160 370.8V64c0-17.69 14.33-31.1 31.1-31.1S224 46.31 224 64v306.8l105.4-105.4c12.5-12.5 32.75-12.5 45.25 0S387.1 298.1 374.6 310.6z"/></svg>
                                <svg v-if="item.downloadingPercentage !== undefined" class="download-bar" xmlns="http://www.w3.org/2000/svg">
                                    <circle cx="50%" cy="50%" r="40%" stroke-width="15%" fill="none" stroke-linecap="round" />
                                    <circle cx="50%" cy="50%" r="40%" stroke-width="15%" fill="none" :stroke-dasharray="item.downloadingPercentage === undefined ?
                                    '0,10000' : `${Math.floor(2 * Math.PI * 25) * item.downloadingPercentage / 100},10000`" />
                                </svg>
                            </div>
                    </div>
                    <div v-else-if="item.type == 'video'" class="msg-video">
                        <video v-if="item.url" controls><source :src="item.url" type="video/mp4"></video>
                        <div v-else-if="!getVideo" :class="getVideoUrl(item, data.message_id)"></div>
                    </div>
                    <div v-else-if="item.type == 'xml'" v-html="View.buildXML(item.data, item.id, data.message_id)" @click="View.cardClick('xml-' + data.message_id)"></div>
                    <div v-else-if="item.type == 'json'" v-html="View.buildJSON(item.data, data.message_id)" @click="View.cardClick('json-' + data.message_id)">
                    </div>

                    <span v-else-if="item.type == 'forward'" class="msg-unknown" @click="View.getForwardMsg(item.id)">{{ $t('chat_show_forward') }}</span>
                    <div :data-seq="getSeq(item.id).toString()" @click="scrollToMsg(getSeq(item.id).toString())" v-else-if="item.type == 'reply'" :class="isMe ? (type == 'merge' ? 'msg-replay' : 'msg-replay me') : 'msg-replay'">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                        <path
                            d="M8.31 189.9l176-151.1c15.41-13.3 39.69-2.509 39.69 18.16v80.05C384.6 137.9 512 170.1 512 322.3c0 61.44-39.59 122.3-83.34 154.1c-13.66 9.938-33.09-2.531-28.06-18.62c45.34-145-21.5-183.5-176.6-185.8v87.92c0 20.7-24.31 31.45-39.69 18.16l-176-151.1C-2.753 216.6-2.784 199.4 8.31 189.9z">
                        </path>
                    </svg>
                    <a class="msg-unknown"> {{ $t('chat_jump_reply') }} </a>
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
import { Logger, PopInfo, PopType } from '@/function/base'
import app from '@/main'

export default defineComponent({
    name: 'MsgBody',
    props: ['data', 'type'],
    data () {
        return {
            getSizeFromBytes: Util.getSizeFromBytes,
            isMe: false,
            isDebugMsg: Option.get('debug_msg'),
            linkViewStyle: '',
            View: ViewFuns,
            runtimeData: runtimeData,
            pageViewInfo: undefined as { [key: string]: any } | undefined,
            gotLink: false,
            getVideo: false
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
            if (source) {
                return !(at === source.user_id)
            }
            return true
        },

        /**
         * 根据消息状态获取 At 消息实际的 CSS class
         * @param who 
         */
        getAtClass (who: number | string) {
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
        getAtName (item: { [key: string]: any }) {
            if(item.text != undefined) {
                return item.text
            } else {
                for(let i=0; i<runtimeData.chatInfo.info.group_members.length; i++) {
                    const user = runtimeData.chatInfo.info.group_members[i]
                    if(user.user_id == Number(item.qq)) {
                        return '@' + (user.card != '' ? user.card : user.nickname)
                    }
                }
            }
        },

        /**
         * 滚动到指定消息
         * @param id 消息 seq
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
            const seq = Util.parseMsgId(msgId).seqid
            if(runtimeData.chatInfo.info.image_list !== undefined) {
                // 寻找实际的序号
                let num = -1
                for(let i = 0; i < runtimeData.chatInfo.info.image_list.length; i++) {
                    const item = runtimeData.chatInfo.info.image_list[i]
                    if(item.index == seq && item.message_id == msgId) {
                        num = i
                        break
                    }
                }
                // 显示
                const viewer = app.config.globalProperties.$viewer
                if(num >= 0 && viewer) {
                    viewer.view(num)
                    viewer.show()
                    runtimeData.tags.viewer.index = num
                } else {
                    new PopInfo().add(PopType.INFO, this.$t('pop_find_pic_fail'))
                }
            }
        },

        /**
         * 图片加载完成，滚到底部
         */
        scrollButtom () {
            this.$emit('scrollButtom', null)
        },

        /**
         * 图片加载失败
         */
        imgLoadFail (event: Event) {
            const sender = event.currentTarget as HTMLImageElement
            const parent = sender.parentNode as HTMLDivElement
            parent.style.display = 'flex'
            parent.style.flexDirection = 'column'
            parent.style.alignItems = 'center'
            parent.style.padding = '20px 50px'
            parent.style.border = '2px dashed var(--color-card-2)'
            parent.innerText = ''
            // 新建 svg
            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
            svg.setAttribute('viewBox', '0 0 512 512')
            svg.innerHTML = '<path d="M119.4 44.1c23.3-3.9 46.8-1.9 68.6 5.3l49.8 77.5-75.4 75.4c-1.5 1.5-2.4 3.6-2.3 5.8s1 4.2 2.6 5.7l112 104c2.9 2.7 7.4 2.9 10.5 .3s3.8-7 1.7-10.4l-60.4-98.1 90.7-75.6c2.6-2.1 3.5-5.7 2.4-8.8L296.8 61.8c28.5-16.7 62.4-23.2 95.7-17.6C461.5 55.6 512 115.2 512 185.1v5.8c0 41.5-17.2 81.2-47.6 109.5L283.7 469.1c-7.5 7-17.4 10.9-27.7 10.9s-20.2-3.9-27.7-10.9L47.6 300.4C17.2 272.1 0 232.4 0 190.9v-5.8c0-69.9 50.5-129.5 119.4-141z"/>'
            svg.style.width = '40px'
            svg.style.opacity = '0.8'
            svg.style.fill = 'var(--color-main)'
            if(this.isMe) {
            svg.style.fill = 'var(--color-font-r)'
            }
            parent.appendChild(svg)
            // 新建 span
            const span = document.createElement('span')
            span.innerText = this.$t('chat_load_img_fail')
            span.style.marginTop = '10px'
            span.style.fontSize = '0.8rem'
            span.style.color = 'var(--color-font-2)'
            if(this.isMe) {
                span.style.color = 'var(--color-font-1-r)'
            }
            parent.appendChild(span)
            // 链接
            const a = document.createElement('a')
            a.innerText = this.$t('chat_view_pic')
            a.target = '__blank'
            a.href = sender.src
            a.style.marginTop = '10px'
            a.style.fontSize = '0.7rem'
            a.style.color = 'var(--color-font-2)'
            if(this.isMe) {
                a.style.color = 'var(--color-font-1-r)'
            }
            parent.appendChild(a)
        },

        /**
         * 获取消息 ID 的 seq
         * @param id 消息 ID
         */
        getSeq (id: string) {
            const seq = Util.parseMsgId(id).seqid
            return seq ? seq : ''
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
                        // GA：上传使用链接预览功能的事件用于分析（成功）
                        const reg1 = /\/\/(.*?)\//g
                        const getDom = fistLink.match(reg1)
                        if (getDom !== null) {
                            this.$gtag.event('link_view', { domain: RegExp.$1, statue: true })
                        } else {
                            this.$gtag.event('link_view')
                        }
                    })
                    .catch(error => {
                        if (error) {
                            logger.error(this.$t('chat_link_view_fail') + ': ' + fistLink)
                            // GA：上传使用链接预览功能的事件用于分析（失败）
                            const reg1 = /\/\/(.*?)\//g
                            const getDom = fistLink.match(reg1)
                            if (getDom !== null) {
                                this.$gtag.event('link_view', { domain: RegExp.$1, statue: false })
                            } else {
                                this.$gtag.event('link_view')
                            }
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
        },

        /**
         * 下载消息中的文件
         * @param data 消息对象
         */
        downloadFile(data: any, message_id: string) {
            const onProcess = function (event: ProgressEvent): undefined {
                if (!event.lengthComputable) return
                data.downloadingPercentage = Math.floor(event.loaded / event.total * 100)
            }
            if(data.url) {
                // 消息中有文件链接的话就不用获取了 ……
                Util.downloadFile(data.url, data.name, onProcess)
            } else {
                // 获取下载链接
                Connector.send('get_file_url', {
                    id: runtimeData.chatInfo.show.id,
                    message_id: message_id,
                    fid: data.fid
                }, 'downloadFile_' + message_id + '_' + data.name)
            }
        },

        /**
         * 
         * @param msgId 消息 ID
         * @param fid 文件 ID
         */
        getVideoUrl(data: any, message_id: string) {
            this.getVideo = true
            Connector.send('get_video_url', {
                id: runtimeData.chatInfo.show.id,
                message_id: message_id,
                fid: data.fid,
                md5: data.md5
            }, 'getVideoUrl_' + message_id)
        }
    },
    mounted () {
        // 初始化 isMe 参数
        this.isMe = Number(runtimeData.loginInfo.uin) === Number(this.data.sender.user_id)
    }
})
</script>
