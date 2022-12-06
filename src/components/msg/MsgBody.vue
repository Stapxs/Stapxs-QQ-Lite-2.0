<!--
 * @FileDescription: 消息组件
 * @Author: Stapxs
 * @Date: 2022/08/03
 * @Version: 1.0
 * @Note: 此组件也负责子组件的渲染
 -->

<template>
  <div
      :class="'message' + (isMerge ? ' merge' : '')"
      :data-raw="getMsgRawTxt(data.message)"
      :id="'chat-' + getSeq(data.message_id)"
      :data-sender="data.sender.user_id"
      :data-time="data.time"
      @mouseleave="hiddenUserInfo">
    <img :src="'https://q1.qlogo.cn/g?b=qq&s=0&nk=' + data.sender.user_id" v-show="!isMe || isMerge">
    <div class="message-space" v-if="isMe && !isMerge"></div>
    <div :class="isMe ? (isMerge ? 'message-body' : 'message-body me') : 'message-body'">
      <a v-show="!isMe || isMerge">{{ data.sender.card ? data.sender.card : data.sender.nickname }}{{ runtimeData.onChat.type !== 'group' ? (isMe ? runtimeData.loginInfo.nickname : runtimeData.onChat.name) : '' }}</a>
      <div>
        <!-- 回复指示框 -->
        <div
            v-if="data.source"
            :class="isMe ? (isMerge ? 'msg-replay' : 'msg-replay me') : 'msg-replay'"
            @click="scrollToMsg(data.source.seq)">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M8.31 189.9l176-151.1c15.41-13.3 39.69-2.509 39.69 18.16v80.05C384.6 137.9 512 170.1 512 322.3c0 61.44-39.59 122.3-83.34 154.1c-13.66 9.938-33.09-2.531-28.06-18.62c45.34-145-21.5-183.5-176.6-185.8v87.92c0 20.7-24.31 31.45-39.69 18.16l-176-151.1C-2.753 216.6-2.784 199.4 8.31 189.9z"></path></svg>
          <a> {{ getRepInfo((data.source ? data.source.message : ''), data) }} </a>
        </div>
        <!-- 消息体 -->
        <div v-for="(item, index) in data.message" :class="View.isMsgInline(item.type) ? 'msg-inline' : ''" :key="data.message_id + '-m-' + index">
          <span v-if="isDebugMsg" class="msg-text">{{item}}</span>
          <span v-else-if="item.type === 'text'" v-show="item.text !== ''" class="msg-text" v-html="parseText(item.text)"></span>
          <img v-else-if="item.type === 'image'" :title="$t('chat_view_pic')" :alt="$t('chat_group_pic')" @click="imgClick(data.message_id)" :class="imgStyle(data.message.length, index)" :src="item.url">
          <img v-else-if="item.type === 'face'" :alt="item.text" class="msg-face" :src="require('./../../assets/src/qq-face/' + item.id + '.gif')" :title="item.text">
          <span v-else-if="item.type === 'bface'" style="font-style: italic;opacity: 0.7;">[ {{ $t('chat_fun_menu_pic') }}：{{ item.text }} ]</span>
          <div v-else-if="item.type === 'at'" v-show="isAtShow(data.source, item.qq)" :class="getAtClass(item.qq)">
            <a @mouseenter="showUserInfo" :data-id="item.qq" :data-group="data.group_id">{{ item.text }}</a>
          </div>
          <div v-else-if="item.type === 'xml'"
            v-html="View.buildXML(item.data, item.id, data.message_id)"
            @click="View.xmlClick('xml-' + data.message_id)"></div>
            <div v-else-if="item.type === 'json'"
              v-html="View.buildJSON(item.data, data.message_id)"
              @click="View.xmlClick('json-' + data.message_id)">
            </div>
            <span v-else class="msg-unknown">{{ '( ' + $t('chat_unsupported_msg') + ': ' + item.type + ' )' }}</span>
        </div>
        <!-- 链接预览框 -->
        <div :class="'msg-link-view ' + linkViewStyle" v-if="data.page_info !== undefined && Object.keys(data.page_info).length > 0">
          <div :class="'bar' + (isMe ? ' me' : '')"></div>
          <div>
            <img :id="data.message_id + '-linkview-img'" @load="linkViewPicFin" alt="预览图片" title="查看图片" :src="data.page_info.img" v-if="data.page_info.img !== undefined">
            <div class="body">
              <p>{{ data.page_info.site }}</p>
              <span :href="data.page_info.url">{{ data.page_info.title }}</span>
              <span>{{ data.page_info.desc }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    <code style="display: none;">{{ data.raw_message }}</code>
  </div>
</template>

<script>
import Vue from 'vue'
import Util from '../../assets/js/util'
import Option from '../../assets/js/options'
import { MsgBodyFuns as ViewFuns } from '../../assets/js/msg-body'

import { connect as connecter } from '../../assets/js/connect'
import { runtimeData } from '../../assets/js/msg'
import { logger } from '../../assets/js/base'

export default {
  name: 'MsgBody',
  props: ['data', 'isMerge'],
  data () {
    return {
      isMe: false,
      isDebugMsg: Option.get('debug_msg'),
      linkViewStyle: '',
      View: ViewFuns,
      runtimeData: runtimeData
    }
  },
  methods: {
    /**
     * 获取消息的纯文本信息
     * Note: 此方法可能会被遗弃（由于 oicq 会返回纯文本消息）
     * @param { object } message 消息对象
     */
    getMsgRawTxt: function (message) {
      return Util.getMsgRawTxt(message)
    },
    /**
     * 在有回复的情况下判断是否隐藏重复 at 消息
     * @param { object } message 消息体
     * @param { long } at at user_id
     */
    isAtShow: function (source, at) {
      if (source !== undefined) {
        return !(at === source.user_id)
      }
      return true
    },
    getAtClass: function (who) {
      let back = 'msg-at'
      if (this.isMe && !(this.isMerge)) {
        back += ' me'
      }
      if (Vue.loginInfo.uin === who) {
        back += ' atme'
      }
      return back
    },
    scrollToMsg: function (id) {
      this.$emit('scrollToMsg', 'chat-' + id)
    },
    /**
     * 处理图片显示需要的样式，顺便添加图片列表
     * @param { int } length 消息段数
     * @param { int } at 图片在消息中的位置
     */
    imgStyle: function (length, at) {
      // 处理样式
      if (length === 1) { return 'msg-img alone' }
      if (at === 0) { return 'msg-img top' }
      if (at === length - 1) { return 'msg-img button' }
      return 'msg-img'
    },
    imgClick: function (msgId) {
      this.$emit('viewImg', msgId)
    },
    getSeq: function (id) {
      return Util.parseMsgId(id).seqid
    },
    /**
     * 处理纯文本消息和链接预览
     * @param { string } text 纯文本消息
     */
    parseText: function (text) {
      text = ViewFuns.parseText(text)
      // 链接判定
      const reg = /(http|ftp|https):\/\/[\w\-_]+(\.[\w\-_]+)+([\w\-\.,@?^=%&:/~\+#]*[\w\-\@?^=%&/~\+#])?/gi //eslint-disable-line
      text = text.replaceAll(reg, '<a href="$&" target="_blank">$&</a>')
      let fistLink = text.match(reg)
      if (fistLink !== null && this.data.page_info === undefined) {
        this.$set(this.data, 'page_info', {})
        fistLink = fistLink[0]
        // GA：上传使用链接预览功能的事件用于统计
        const reg1 = /\/\/(.*?)\//g
        const getDom = fistLink.match(reg1)
        if (getDom !== null) {
          // Vue.$gtag.event('link_view', {domain: RegExp.$1})
        } else {
          // Vue.$gtag.event('link_view')
        }
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
              this.$set(this.data, 'page_info', pageData)
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
    linkViewPicFin: function () {
      const img = document.getElementById(this.data.message_id + '-linkview-img')
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
     * @param { object } event 消息事件
     */
    showUserInfo: function (event) {
      const sender = event.currentTarget
      const id = sender.dataset.id
      const group = sender.dataset.group
      // 获取鼠标位置
      const pointEvent = event || window.event
      const pointX = pointEvent.layerX
      const pointY = pointEvent.clientY
      // TODO: 出界判定不做了怪麻烦的
      // 请求用户信息
      connecter.send('getGroupMemberInfo', { group_id: group, user_id: id },
        'getGroupMemberInfo_' + pointX + '_' + pointY)
    },
    hiddenUserInfo: function () {
      this.$parent.hiddenUserInfo()
    },
    getRepInfo: function (msg, data) {
      const list = this.runtimeData.onChat.info.group_members.filter((item) => {
        return Number(item.user_id) === Number(data.source.user_id)
      })
      if (list.length === 1) {
        return (list[0].card !== '' ? list[0].card : list[0].nickname) + ': ' + msg
      }
      return msg
    }
  },
  mounted: function () {
    // 初始化 isMe 参数
    this.isMe = Number(runtimeData.loginInfo.uin) === Number(this.data.sender.user_id)
  }
}
</script>
