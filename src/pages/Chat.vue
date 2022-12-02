/*
 * @FileDescription: 消息框主体
 * @Author: Stapxs
 * @Date: 2022/08/14
 * @Version: 1.0
*/

<template>
  <div class="chat-pan" id="chat-pan">
    <div>
      <img :src="chat.avatar">
      <div>
        <p>{{ chat.name }}</p>
        <span>
          {{ list[list.length - 1] ? $t('chat_last_msg', {time: Intl.DateTimeFormat(trueLang, {hour:"numeric",minute:"numeric",second:"numeric"}).format(new Date(list[list.length - 1].time * 1000)) }) : $t('chat_no_msg')}}
          </span>
      </div>
      <div></div>
      <div>
        <svg @click="openChatInfoPan" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 512"><path d="M64 360c30.9 0 56 25.1 56 56s-25.1 56-56 56s-56-25.1-56-56s25.1-56 56-56zm0-160c30.9 0 56 25.1 56 56s-25.1 56-56 56s-56-25.1-56-56s25.1-56 56-56zM120 96c0 30.9-25.1 56-56 56S8 126.9 8 96S33.1 40 64 40s56 25.1 56 56z"/></svg>
      </div>
    </div>
    <div @scroll="chatScroll" id="msgPan" style="scroll-behavior: smooth;">
      <div class="note top" v-if="!runtimeData.tags.canLoadHistory">
        <span class="note-nomsg">{{ $t('chat_no_more_msg') }}</span>
      </div>
      <template v-for="(msg, index) in list">
        <MsgBody
          v-if="msg.post_type === 'message'"
          :key="msg.message_id"
          :data="msg"
          @scrollToMsg="scrollToMsg"
          @viewImg="viewImg"
          @contextmenu.native.prevent="showMsgMeun($event, msg)"></MsgBody>
        <NoticeBody
          v-if="msg.post_type === 'notice'"
          :key="'notice-' + index"
          :data="msg"></NoticeBody>
      </template>
    </div>
    <div v-show="tags.showBottomButton" @click="scrollBottom(true)">
      <div class="ss-card">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M256 32C114.6 32 .0272 125.1 .0272 240c0 49.63 21.35 94.98 56.97 130.7c-12.5 50.37-54.27 95.27-54.77 95.77c-2.25 2.25-2.875 5.734-1.5 8.734C1.979 478.2 4.75 480 8 480c66.25 0 115.1-31.76 140.6-51.39C181.2 440.9 217.6 448 256 448c141.4 0 255.1-93.13 255.1-208S397.4 32 256 32z"/></svg>
        <span v-if="NewMsgNum > 0">{{ NewMsgNum }}</span>
      </div>
    </div>
    <div>
      <!-- 顶部附加区 -->
      <div>
        <!-- 更多共附加区 -->
        <div>
          <!-- 表情面板 -->
          <FacePan v-show="details[1].open" @addSpecialMsg="addSpecialMsg"></FacePan>
        </div>
        <!-- 回复指示器 -->
        <div :class="tags.isReply ? 'replay-tag show' : 'replay-tag'">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M8.31 189.9l176-151.1c15.41-13.3 39.69-2.509 39.69 18.16v80.05C384.6 137.9 512 170.1 512 322.3c0 61.44-39.59 122.3-83.34 154.1c-13.66 9.938-33.09-2.531-28.06-18.62c45.34-145-21.5-183.5-176.6-185.8v87.92c0 20.7-24.31 31.45-39.69 18.16l-176-151.1C-2.753 216.6-2.784 199.4 8.31 189.9z"></path></svg>
          <span>{{ selectedMsg === null ? '' : (selectedMsg.sender.nickname + ': ' + selectedMsg.raw_message) }}</span>
          <div @click="cancelReply"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512"><path d="M310.6 361.4c12.5 12.5 12.5 32.75 0 45.25C304.4 412.9 296.2 416 288 416s-16.38-3.125-22.62-9.375L160 301.3L54.63 406.6C48.38 412.9 40.19 416 32 416S15.63 412.9 9.375 406.6c-12.5-12.5-12.5-32.75 0-45.25l105.4-105.4L9.375 150.6c-12.5-12.5-12.5-32.75 0-45.25s32.75-12.5 45.25 0L160 210.8l105.4-105.4c12.5-12.5 32.75-12.5 45.25 0s12.5 32.75 0 45.25l-105.4 105.4L310.6 361.4z"></path></svg></div>
        </div>
        <!-- 更多功能 -->
        <div :class="tags.showMoreDetail ? 'more-detail show' : 'more-detail'">
          <div :title="this.$t('chat_fun_menu_face')" @click="details[1].open = !details[1].open,tags.showMoreDetail = false">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M0 256C0 114.6 114.6 0 256 0C397.4 0 512 114.6 512 256C512 397.4 397.4 512 256 512C114.6 512 0 397.4 0 256zM256 432C332.1 432 396.2 382 415.2 314.1C419.1 300.4 407.8 288 393.6 288H118.4C104.2 288 92.92 300.4 96.76 314.1C115.8 382 179.9 432 256 432V432zM176.4 160C158.7 160 144.4 174.3 144.4 192C144.4 209.7 158.7 224 176.4 224C194 224 208.4 209.7 208.4 192C208.4 174.3 194 160 176.4 160zM336.4 224C354 224 368.4 209.7 368.4 192C368.4 174.3 354 160 336.4 160C318.7 160 304.4 174.3 304.4 192C304.4 209.7 318.7 224 336.4 224z"/></svg>
          </div>
        </div>
      </div>
      <div>
        <div @click="tags.showMoreDetail = !tags.showMoreDetail">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M432 256c0 17.69-14.33 32.01-32 32.01H256v144c0 17.69-14.33 31.99-32 31.99s-32-14.3-32-31.99v-144H48c-17.67 0-32-14.32-32-32.01s14.33-31.99 32-31.99H192v-144c0-17.69 14.33-32.01 32-32.01s32 14.32 32 32.01v144h144C417.7 224 432 238.3 432 256z"/></svg>
        </div>
        <div>
          <textarea
            id="main-input"
            type="text"
            v-model="msg"
            @paste="addImg"
            @keyup="mainKeyUp"
            @click="selectSQ(),selectSQIn()"></textarea>
          <div @click="sendMsg">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 512"><path d="M64 448c-8.188 0-16.38-3.125-22.62-9.375c-12.5-12.5-12.5-32.75 0-45.25L178.8 256L41.38 118.6c-12.5-12.5-12.5-32.75 0-45.25s32.75-12.5 45.25 0l160 160c12.5 12.5 12.5 32.75 0 45.25l-160 160C80.38 444.9 72.19 448 64 448z"/></svg>
          </div>
        </div>
      </div>
      <!-- 底部附加区 -->
      <div></div>
    </div>
    <!-- 合并转发消息预览器 -->
    <div :class="mergeList.length > 0 ? 'merge-pan show' : 'merge-pan'">
      <div @click="closeMergeMsg"></div>
      <div class="ss-card">
        <div>
          <svg style="margin-top: 5px;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M511.1 63.1v287.1c0 35.25-28.75 63.1-64 63.1h-144l-124.9 93.68c-7.875 5.75-19.12 .0497-19.12-9.7v-83.98h-96c-35.25 0-64-28.75-64-63.1V63.1c0-35.25 28.75-63.1 64-63.1h384C483.2 0 511.1 28.75 511.1 63.1z"/></svg>
          <span>{{ $t('chat_merge_msg') }}</span>
          <svg @click="closeMergeMsg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512"><path d="M310.6 361.4c12.5 12.5 12.5 32.75 0 45.25C304.4 412.9 296.2 416 288 416s-16.38-3.125-22.62-9.375L160 301.3L54.63 406.6C48.38 412.9 40.19 416 32 416S15.63 412.9 9.375 406.6c-12.5-12.5-12.5-32.75 0-45.25l105.4-105.4L9.375 150.6c-12.5-12.5-12.5-32.75 0-45.25s32.75-12.5 45.25 0L160 210.8l105.4-105.4c12.5-12.5 32.75-12.5 45.25 0s12.5 32.75 0 45.25l-105.4 105.4L310.6 361.4z"/></svg>
        </div>
        <div>
          <!-- 合并转发消息忽略是不是自己的判定 -->
          <MsgBody
            v-for="(msg, index) in mergeList"
            :key="'merge' + index"
            :data="msg"
            :isMerge="true"></MsgBody>
        </div>
      </div>
    </div>
    <!-- At 信息悬浮窗 -->
    <div class="mumber-info">
      <div v-if="Object.keys(mumberInfo).length > 0 && mumberInfo.error === undefined" class="ss-card" :style="getPopPost()">
        <img :src="'https://q1.qlogo.cn/g?b=qq&s=0&nk=' + mumberInfo.user_id">
        <div>
          <span name="id">{{ mumberInfo.user_id }}</span>
          <div>
            <a>{{  mumberInfo.card == '' ? mumberInfo.nickname : mumberInfo.card  }}</a>
            <div>
              <span v-if="mumberInfo.role !== 'member'">
                {{  $t('chat_member_type_' + mumberInfo.role)  }}
              </span>
              <span>Lv {{  mumberInfo.level  }}</span>
            </div>
          </div>
          <span> {{ $t('chat_join_time', {time: Intl.DateTimeFormat(trueLang, {year:'numeric',month:"short",day:"numeric"}).format(new Date(mumberInfo.join_time * 1000))})  }} </span>
        </div>
      </div>
    </div>
    <!-- 消息右击菜单 -->
    <div class="msg-menu">
      <div v-show="tags.showMsgMenu" class="msg-menu-bg" @click="closeMsgMenu"></div>
      <div :class="tags.showMsgMenu ? 'ss-card menu show' : 'ss-card menu'" id="msgMenu">
        <div @click="replyMsg" v-show="tags.menuDisplay.relpy">
           <div><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M511.1 63.1v287.1c0 35.25-28.75 63.1-64 63.1h-144l-124.9 93.68c-7.875 5.75-19.12 .0497-19.12-9.7v-83.98h-96c-35.25 0-64-28.75-64-63.1V63.1c0-35.25 28.75-63.1 64-63.1h384C483.2 0 511.1 28.75 511.1 63.1z"/></svg></div>
           <a>{{ $t('chat_msg_menu_reply') }}</a>
        </div>
        <!-- <div v-show="tags.menuDisplay.forward">
           <div><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M503.7 226.2l-176 151.1c-15.38 13.3-39.69 2.545-39.69-18.16V272.1C132.9 274.3 66.06 312.8 111.4 457.8c5.031 16.09-14.41 28.56-28.06 18.62C39.59 444.6 0 383.8 0 322.3c0-152.2 127.4-184.4 288-186.3V56.02c0-20.67 24.28-31.46 39.69-18.16l176 151.1C514.8 199.4 514.8 216.6 503.7 226.2z"/></svg></div>
           <a>{{ $t('chat_msg_menu_forward') }}</a>
        </div> -->
        <!-- <div v-show="tags.menuDisplay.select">
           <div><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512"><path d="M23.19 32C28.86 32 34.34 34.08 38.59 37.86L312.6 281.4C317.3 285.6 320 291.6 320 297.9C320 310.1 310.1 320 297.9 320H179.8L236.6 433.7C244.5 449.5 238.1 468.7 222.3 476.6C206.5 484.5 187.3 478.1 179.4 462.3L121.2 346L38.58 440.5C34.4 445.3 28.36 448 22.01 448C9.855 448 0 438.1 0 425.1V55.18C0 42.38 10.38 32 23.18 32H23.19z"/></svg></div>
           <a>{{ $t('chat_msg_menu_multiple_choice') }}</a>
        </div> -->
        <div @click="copyMsg" v-show="tags.menuDisplay.copy">
           <div><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><path d="M336 64h-53.88C268.9 26.8 233.7 0 192 0S115.1 26.8 101.9 64H48C21.5 64 0 85.48 0 112v352C0 490.5 21.5 512 48 512h288c26.5 0 48-21.48 48-48v-352C384 85.48 362.5 64 336 64zM192 64c17.67 0 32 14.33 32 32c0 17.67-14.33 32-32 32S160 113.7 160 96C160 78.33 174.3 64 192 64zM272 224h-160C103.2 224 96 216.8 96 208C96 199.2 103.2 192 112 192h160C280.8 192 288 199.2 288 208S280.8 224 272 224z"/></svg></div>
           <a>{{ $t('chat_msg_menu_copy') }}</a>
        </div>
        <!-- <div @click="copyMsg" v-show="tags.menuDisplay.copySelect">
           <div><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><path d="M336 64h-53.88C268.9 26.8 233.7 0 192 0S115.1 26.8 101.9 64H48C21.5 64 0 85.48 0 112v352C0 490.5 21.5 512 48 512h288c26.5 0 48-21.48 48-48v-352C384 85.48 362.5 64 336 64zM192 64c17.67 0 32 14.33 32 32c0 17.67-14.33 32-32 32S160 113.7 160 96C160 78.33 174.3 64 192 64zM272 224h-160C103.2 224 96 216.8 96 208C96 199.2 103.2 192 112 192h160C280.8 192 288 199.2 288 208S280.8 224 272 224z"/></svg></div>
           <a>{{ $t('chat_msg_menu_copy_select') }}</a>
        </div> -->
        <div @click="revokeMsg" v-show="tags.menuDisplay.revoke">
           <div><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512"><path d="M310.6 361.4c12.5 12.5 12.5 32.75 0 45.25C304.4 412.9 296.2 416 288 416s-16.38-3.125-22.62-9.375L160 301.3L54.63 406.6C48.38 412.9 40.19 416 32 416S15.63 412.9 9.375 406.6c-12.5-12.5-12.5-32.75 0-45.25l105.4-105.4L9.375 150.6c-12.5-12.5-12.5-32.75 0-45.25s32.75-12.5 45.25 0L160 210.8l105.4-105.4c12.5-12.5 32.75-12.5 45.25 0s12.5 32.75 0 45.25l-105.4 105.4L310.6 361.4z"/></svg></div>
           <a>{{ $t('chat_msg_menu_withdraw') }}</a>
        </div>
      </div>
    </div>
    <!-- 群 / 好友信息弹窗 -->
    <InfoBody :chat="chat" :tags="tags" @close="openChatInfoPan" @loadFile="fileLoad"></InfoBody>
    <!-- 图片发送器 -->
    <div class="img-sender" v-if="Vue.cacheImg != undefined && Vue.cacheImg.length > 0">
      <div class="card ss-card">
        <div class="hander">
          <span>{{ $t('chat_send_pic_title') }}</span>
          <button @click="sendMsg();Vue.cacheImg = undefined" class="ss-button">{{ $t('chat_send_pic_send') }}</button>
        </div>
        <div class="imgs">
          <div v-for="(img64, index) in Vue.cacheImg"
            :key="'sendImg-' + img64.substring(img64.length - 5, img64.length)">
            <div @click="deleteImg(index)">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512"><path d="M310.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L160 210.7 54.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L114.7 256 9.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L160 301.3 265.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L205.3 256 310.6 150.6z"/></svg>
            </div>
            <img :src="img64">
          </div>
        </div>
        <div class="sender">
          <input type="text" @paste="addImg" v-model="msg">
        </div>
      </div>
      <div class="bg" @click="Vue.cacheImg = undefined"></div>
    </div>
  </div>
</template>

<script>
import Vue from 'vue'
import MsgBody from '../components/msg/MsgBody.vue'
import SendUtil from '../assets/js/sender.js'
import InfoBody from '../components/chat/InfoPan.vue'
import FacePan from '../components/chat/FacePan.vue'
import NoticeBody from '../components/msg/NoticeBody.vue'

import Option from '../assets/js/options'

import { parseMsgId, getTrueLang } from '../assets/js/util'
import { logger, popInfo } from '../assets/js/base'
import { connect as connecter } from '../assets/js/connect'
import { runtimeData } from '../assets/js/msg'

export default {
  name: 'Chat',
  props: ['chat', 'list', 'mergeList', 'mumberInfo', 'imgView'],
  components: { MsgBody, InfoBody, FacePan, NoticeBody },
  data () {
    return {
      Vue: Vue,
      runtimeData: runtimeData,
      trueLang: getTrueLang(),
      tags: {
        nowGetHistroy: false,
        showBottomButton: true,
        showMoreDetail: false,
        showMsgMenu: false,
        openedMenuMsg: null,
        openChatInfo: false,
        isReply: false,
        menuDisplay: {}
      },
      details: [{ open: false }, { open: false }],
      msgMenus: [],
      NewMsgNum: 0,
      listSize: 0,
      msg: '',
      msgCache: '',
      sendCache: [],
      selectedMsg: null,
      replyMsgInfo: null
    }
  },
  methods: {
    /**
     * 主聊天消息显示区滚动事件
     * @param { object } event 事件对象
     */
    chatScroll: function (event) {
      const body = event.target
      // 顶部
      if (body.scrollTop === 0 && this.list.length > 0) {
        this.loadMoreHistory()
      }
      // 底部
      if (body.scrollTop + body.clientHeight === body.scrollHeight) {
        this.NewMsgNum = 0
      }
      // 显示回到底部
      if (body.scrollTop < body.scrollHeight - body.clientHeight * 2) {
        this.tags.showBottomButton = true
      } else {
        this.tags.showBottomButton = false
      }
    },
    /**
     * 加载更多历史消息
     */
    loadMoreHistory: function () {
      if (!this.tags.nowGetHistroy && runtimeData.tags.canLoadHistory !== false) {
        // 获取列表第一条消息 ID
        const firstMsgId = this.list[0].message_id
        // 锁定加载防止反复触发
        this.tags.nowGetHistroy = true
        // 发起获取历史消息请求
        connecter.send(
          'get_chat_history',
          { 'message_id': firstMsgId },
          'getChatHistory'
        )
      }
    },
    /**
     * 滚动聊天框到指定位置
     * @param { int } where 位置（px）
     * @param { boolren } showAnimation 是否使用过渡动画
     */
    scrollTo: function (where, showAnimation) {
      const pan = document.getElementById('msgPan')
      if (showAnimation === false) {
        pan.style.scrollBehavior = 'unset'
      } else {
        pan.style.scrollBehavior = 'smooth'
      }
      pan.scrollTop = where
      pan.style.scrollBehavior = 'smooth'
    },
    scrollBottom: function (showAnimation) {
      const pan = document.getElementById('msgPan')
      this.scrollTo(pan.scrollHeight, showAnimation)
    },
    scrollToMsg: function (seq) {
      const msg = document.getElementById(seq)
      if (msg) {
        this.scrollTo(msg.offsetTop - msg.offsetHeight + 10)
        msg.style.transition = 'background 1s'
        msg.style.background = 'rgba(0, 0, 0, 0.06)'
        setTimeout(() => {
          msg.style.background = 'unset'
          setTimeout(() => {
            msg.style.transition = 'background .3s'
          }, 1100)
        }, 3000)
      } else {
        popInfo.add(popInfo.appMsgType.err, this.$t('pop_chat_msg_not_load'))
      }
    },
    viewImg: function (msgId) {
      this.$emit('viewImg', msgId)
    },
    /**
     * 格式化时间
     * @param { Date } time 时间
     */
    formatTime: function (time, like) {
      var format = require('date-format')
      return format.asString(like, time)
    },
    /**
     * 发送框按键事件
     * @param { object } event 事件
     */
    mainKeyUp: function (event) {
      // console.log(event.keyCode)
      if (!event.shiftKey && event.keyCode === 13) {
        // enter 发送消息
        this.msg = this.msgCache
        this.sendMsg()
      } else if (event.keyCode === 8) {
        // backspace 删除内容
        this.selectSQ()
      } else {
        // cache 非回车发送的输入消息已用于在回车发送时去除按下的回车（复盖为回车前的内容）
        this.msgCache = this.msg
      }
    },
    /**
     * 选中当前输入框光标位置前面的一个 SQCode
     */
    selectSQ: function () {
      var input = document.getElementById('main-input')
      // 如果文本框里本来就选中着什么东西就不触发了
      if (input.selectionStart === input.selectionEnd) {
        // PS：这儿用来对删除前方是否有 [SQ:n] 特殊结构进行判断以便自动选中
        var cursurPosition = -1
        if (typeof input.selectionStart === 'number') {
          cursurPosition = input.selectionStart
        }
        // PS：只取光标前面的部分消息
        const getSQCode = SendUtil.getSQList(this.msg.substring(0, cursurPosition))
        if (getSQCode !== null) {
          const selectionStart = (this.msg.substring(0, cursurPosition)).lastIndexOf(getSQCode[getSQCode.length - 1])
          if (selectionStart !== -1 &&
            selectionStart + getSQCode[getSQCode.length - 1].length === this.msg.substring(0, cursurPosition).length) {
            this.$nextTick(() => {
              input.selectionStart = selectionStart
              input.selectionEnd = this.msg.substring(0, cursurPosition).length
            })
          }
        }
      }
    },
    /**
     * 选中光标在其内部的那个 SQLCode
     */
    selectSQIn: function () {
      var input = document.getElementById('main-input')
      // 如果文本框里本来就选中着什么东西就不触发了
      if (input.selectionStart === input.selectionEnd) {
        var cursurPosition = -1
        if (typeof input.selectionStart === 'number') {
          cursurPosition = input.selectionStart
        }
        // 获取所有的 SQCode
        const getSQCode = SendUtil.getSQList(this.msg)
        if (getSQCode != null) {
          // 遍历寻找 SQCode 位置区间包括光标位置的 SQCode
          getSQCode.forEach((item) => {
            const start = this.msg.indexOf(item)
            const end = start + item.length
            if (start !== -1 && cursurPosition > start && cursurPosition < end) {
              this.$nextTick(() => {
                input.selectionStart = start
                input.selectionEnd = end
              })
            }
          })
        }
      }
    },
    /**
     * 显示右击菜单
     * @param { object } event 事件
     */
    showMsgMeun: function (event, data) {
      this.selectedMsg = data
      if (Option.get('log_level') === 'debug') {
        console.log(data)
      }
      const menu = document.getElementById('msgMenu')
      const msg = event.currentTarget
      // const sender = event.srcElement
      // if (sender.className === 'msg-text') {
      //   // 如果是文本，不打开菜单方便使用原生复制功能
      //   event.returnValue = true
      //   return
      // }
      // 检查消息，确认菜单显示状态
      if (data.sender.user_id === runtimeData.loginInfo.uin ||
        runtimeData.onChat.info.me.role === 'admin' ||
        runtimeData.onChat.info.me.role === 'owner') {
        // 自己的消息、管理员和群主会显示撤回
        this.tags.menuDisplay.revoke = true
      }
      // 鼠标位置
      const pointEvent = event || window.event
      const pointX = pointEvent.layerX
      const pointY = pointEvent.clientY
      // 移动菜单位置
      menu.style.marginLeft = pointX + 'px'
      menu.style.marginTop = pointY + 'px'
      // 出界判定
      const menuWidth = menu.clientWidth
      const menuHeight = menu.clientHeight
      const msgWidth = msg.offsetWidth
      const bodyHeight = document.body.clientHeight
      if (pointX + menuWidth > msgWidth + 27) {
        menu.style.marginLeft = (msgWidth + 27 - menuWidth) + 'px'
      }
      if (pointY + menuHeight > bodyHeight - 10) {
        menu.style.marginTop = (bodyHeight - menuHeight - 10) + 'px'
      }
      // 显示菜单
      this.tags.showMsgMenu = true
      // 设置消息背景
      this.tags.openedMenuMsg = msg
      msg.style.background = '#00000008'
    },
    initMenuDisplay: function () {
      this.tags.menuDisplay = {
        relpy: true,
        forward: true,
        select: false,
        copy: true,
        copySelect: false,
        revoke: false
      }
    },
    replyMsg: function () {
      const msg = this.selectedMsg
      if (this.selectedMsg !== null) {
        const msgId = msg.message_id
        // 添加回复内容
        // PS：这儿还是用就的回复方式 …… 因为新的调用不友好。回复消息不会被加入文本行，在消息发送器内有特殊判定。
        this.addSpecialMsg({msgObj: {type: 'reply', id: msgId}, addText: false, addTop: true})
        // 显示回复指示器
        this.tags.isReply = true
        // 聚焦输入框
        document.getElementById('main-input').focus()
        // 关闭消息菜单
        this.closeMsgMenu()
      }
    },
    cancelReply: function () {
      // 去除回复消息缓存
      this.sendCache = this.sendCache.filter((item) => {
        return item.type !== 'reply'
      })
      this.tags.isReply = false
    },
    copyMsg: function () {
      const that = this
      const msg = this.selectedMsg
      if (this.selectedMsg !== null) {
        this.$copyText(msg.raw_message).then(function (e) {
          popInfo.add(popInfo.appMsgType.info, that.$t('pop_chat_msg_menu_copy_success'), true)
          that.closeMsgMenu()
        }, function (e) {
          logger.error('复制消息失败：' + e)
          popInfo.add(popInfo.appMsgType.err, that.$t('pop_chat_msg_menu_copy_err'), true)
        })
      }
    },
    revokeMsg: function () {
      const msg = this.selectedMsg
      if (this.selectedMsg !== null) {
        const msgId = msg.message_id
        connecter.send('delete_msg', {'message_id': msgId})
        // 关闭消息菜单
        this.closeMsgMenu()
      }
    },
    getPopPost: function () {
      const x = this.mumberInfo.x === undefined ? '0' : this.mumberInfo.x
      const y = this.mumberInfo.y === undefined ? '0' : this.mumberInfo.y
      return 'margin-left:' + x + 'px;margin-top:' + y + 'px;'
    },
    hiddenUserInfo: function () {
      this.$emit('hiddenUserInfo', null)
    },
    closeMsgMenu: function () {
      // 关闭菜单
      this.tags.showMsgMenu = false
      // 清理消息背景
      this.tags.openedMenuMsg.style.background = 'unset'
      // 重置菜单显示状态
      this.initMenuDisplay()
    },
    closeMergeMsg: function () {
      this.$emit('cleanMerge', null)
    },
    /**
     * 打开好友/群组信息页面
     */
    openChatInfoPan: function () {
      this.tags.openChatInfo = !this.tags.openChatInfo
      // 加载一些需要显示的消息，有部分判断是用来防止反复加载已存在内容的
      if (this.tags.openChatInfo) {
        // 加载基础信息
        if (this.chat.type === 'group' && this.chat.info.group.gc !== this.chat.id) {
          const url = `https://qinfo.clt.qq.com/cgi-bin/qun_info/get_group_info_all?gc=${this.chat.id}&bkn=${runtimeData.loginInfo.bkn}`
          connecter.send(
            'http_proxy',
            {'url': url},
            'getMoreGroupInfo'
          )
        } else if (this.chat.type === 'user' && this.chat.info.user.uin !== this.chat.id) {
          const url = 'https://find.qq.com/proxy/domain/cgi.find.qq.com/qqfind/find_v11?backver=2'
          const info = `bnum=15&pagesize=15&id=0&sid=0&page=0&pageindex=0&ext=&guagua=1&gnum=12&guaguan=2&type=2&ver=4903&longitude=116.405285&latitude=39.904989&lbs_addr_country=%E4%B8%AD%E5%9B%BD&lbs_addr_province=%E5%8C%97%E4%BA%AC&lbs_addr_city=%E5%8C%97%E4%BA%AC%E5%B8%82&keyword=${this.chat.id}&nf=0&of=0&ldw=${runtimeData.loginInfo.bkn}`
          connecter.send(
            'http_proxy',
            { 'url': url, 'method': 'post', 'data': info },
            'getMoreUserInfo'
          )
        }
        // 加载群成员列表
        if (this.chat.type === 'group' &&
        (Object.keys(this.chat.info.group_members).length === 0 || this.chat.info.group_members.length <= 0 || this.chat.info.group_members[0].group_id !== this.chat.id)) {
          connecter.send(
            'get_group_member_list',
            {'group_id': this.chat.id},
            'getGroupMemberList'
          )
        }
        // 加载群公告列表
        if (this.chat.type === 'group') {
          const url = `https://web.qun.qq.com/cgi-bin/announce/get_t_list?bkn=${runtimeData.loginInfo.bkn}&qid=${this.chat.id}&ft=23&s=-1&n=20`
          connecter.send(
            'http_proxy',
            { 'url': url },
            'getGroupNotices'
          )
        }
        // 加载群文件列表
        if (this.chat.type === 'group' && Object.keys(this.chat.info.group_files).length === 0) {
          const url = `https://pan.qun.qq.com/cgi-bin/group_file/get_file_list?gc=${this.chat.id}&bkn=${runtimeData.loginInfo.bkn}&start_index=0&cnt=30&filter_code=0&folder_id=%2F&show_onlinedoc_folder=0`
          connecter.send(
            'http_proxy',
            { 'url': url },
            'getGroupFiles'
          )
        }
      }
    },
    /**
     * 加载更多文件
     */
    fileLoad: function (event) {
      const sender = event.srcElement
      if (sender.scrollTop + sender.clientHeight >= sender.scrollHeight && this.chat.info.group_files.next_index !== 0 &&
        this.chat.info.group_files.next_index !== this.chat.info.group_files.total_cnt) {
        const url = `https://pan.qun.qq.com/cgi-bin/group_file/get_file_list?gc=${this.chat.id}&bkn=${runtimeData.loginInfo.bkn}&start_index=${this.chat.info.group_files.next_index}&cnt=30&filter_code=0&folder_id=%2F&show_onlinedoc_folder=0`
        connecter.send(
          'http_proxy',
          { 'url': url },
          'getMoreGroupFiles'
        )
      }
    },
    /**
     * 根据 index 删除图片
     * @param { number } index 图片编号
     */
    deleteImg: function (index) {
      console.log(index)
      console.log(Vue.cacheImg)
      Vue.cacheImg.splice(index, 1)
      this.$forceUpdate()
      console.log(Vue.cacheImg)
    },
    /**
     * 添加特殊消息结构
     * @param { object } obj obj
     */
    addSpecialMsg: function (data) {
      // data 结构：
      // const data = {
      //   addText: false,    // 是否添加到输入框内
      //   addTop: false,     // 添加到头部
      //   msgObj: {}         // 消息结构
      // }
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
    /**
     * 添加图片缓存
     * @param { object } e 事件
     */
    addImg: function (e) {
      const that = this
      // 判断粘贴类型
      if (!(e.clipboardData && e.clipboardData.items)) {
        return
      }
      for (let i = 0, len = e.clipboardData.items.length; i < len; i++) {
        let item = e.clipboardData.items[i]
        if (item.kind === 'file') {
          let blob = item.getAsFile()
          if (blob.type.indexOf('image/') >= 0 && blob.size !== 0) {
            popInfo.add(popInfo.appMsgType.info, this.$t('pop_chat_image_processing'))
            if (blob.size < 3145728) {
              // 转换为 Base64
              var reader = new FileReader()
              reader.readAsDataURL(blob)
              reader.onloadend = function () {
                var base64data = reader.result
                if (Option.get('close_chat_pic_pan') === true) {
                  // 在关闭图片插入面板的模式下将直接以 SQCode 插入输入框
                  const data = {
                    addText: true,
                    msgObj: {
                      type: 'image',
                      file: 'base64://' + base64data.substring(base64data.indexOf('base64,') + 7, base64data.length)
                    }
                  }
                  that.addSpecialMsg(data)
                } else {
                  // 记录图片信息
                  if (Vue.cacheImg === undefined) {
                    Vue.cacheImg = []
                  }
                  // 只要你内存够猛，随便 cache 图片，这边就不做限制了
                  Vue.cacheImg.push(base64data)
                }
              }
              popInfo.add(popInfo.appMsgType.info, this.$t('pop_chat_image_ok'))
            } else {
              popInfo.add(popInfo.appMsgType.info, this.$t('pop_chat_image_toooo_big'))
            }
            // 阻止默认行为
            e.preventDefault()
          }
        }
      }
    },
    /**
     * 发送消息
     */
    sendMsg: function () {
      // 为了减少对于复杂图文排版页面显示上的工作量，对于非纯文本的消息依旧处理为纯文本，如：
      // "这是一段话[SQ:0]，[SQ:1] 你要不要来试试 Stapxs QQ Lite？"
      // 其中 [SQ:n] 结构代表着这是特殊消息以及这个消息具体内容在消息缓存中的 index，像是这样：
      // const sendCache = [{type:"face",id:1},{type:"at",qq:1007028430}]
      //                     ^^^^^^ 0 ^^^^^^    ^^^^^^^^^^ 1 ^^^^^^^^^^
      // 在发送操作触发之后，将会解析此条字符串排列出最终需要发送的消息结构用于发送。
      let msg = SendUtil.parseMsg(this.msg, this.sendCache)
      if (msg !== null && msg.length > 0) {
        switch (this.chat.type) {
          case 'group': connecter.send('send_group_msg', {'group_id': this.chat.id, 'message': msg}, 'sendMsgBack'); break
          case 'user': connecter.send('send_private_msg', {'user_id': this.chat.id, 'message': msg}, 'sendMsgBack'); break
        }
      }
      // 发送后事务
      this.msg = ''
      this.sendCache = []
      this.scrollBottom()
      this.cancelReply()
    }
  },
  watch: {
    list: function () {
      // =================== 刷新统计数据 ===================

      // 判断新消息数量
      if (this.tags.showBottomButton && !this.tags.nowGetHistroy && this.listSize > 0) {
        this.NewMsgNum += this.list.length - this.listSize
      }
      // 超过 100 条消息时 shift 出一条
      if (this.list.length > 100 && !this.tags.nowGetHistroy) {
        this.list.shift()
      }
      // 刷新列表长度记录
      this.listSize = this.list.length

      // =================== 渲染监听操作 ===================

      // 渲染前的数据
      const pan = document.getElementById('msgPan')
      const height = pan.scrollHeight
      const top = pan.scrollTop
      // 渲染后操作
      this.$nextTick(() => {
        // 加载历史记录锁定滚动条位置
        if (this.tags.nowGetHistroy) {
          const newPan = document.getElementById('msgPan')
          this.scrollTo(newPan.scrollHeight - height, false)
          this.tags.nowGetHistroy = false
        } else {
          // 解除锁定加载
          this.tags.nowGetHistroy = false
        }
        // 新消息自动下滚
        const newPan = document.getElementById('msgPan')
        if (top === height - newPan.clientHeight) {
          // 刚刚页面在最底部
          this.scrollBottom(true)
        }
        // 刷新图片列表
        let getImgList = []
        this.list.forEach((item) => {
          if (item.message !== undefined) {
            item.message.forEach((msg) => {
              if (msg.type === 'image' && !msg.asface) {
                const index = (parseMsgId(item.message_id)).seqid
                const info = [index, item.message_id, msg.url]
                getImgList.push(info)
              }
            })
          }
        })
        this.imgView.srcList = getImgList
        // 处理跳入跳转预设
        // 如果 onChat 的 jump 参数不是 undefined
        // 则意味着这次加载历史记录的同时需要跳转到指定的消息
        if (runtimeData.onChat.jump !== undefined) {
          logger.debug('进入跳转至消息：' + runtimeData.onChat.jump)
          this.scrollToMsg('chat-' + parseMsgId(runtimeData.onChat.jump).seqid)
          Vue.set(runtimeData.onChat, 'jump', undefined)
        }
      })
    },
    chat: function () {
      // 重置部分状态数据
      this.tags = this.$options.data().tags
      this.msgMenus = this.$options.data().msgMenus
      this.sendCache = []
      this.initMenuDisplay()
    }
  },
  mounted () {
    // 初始化菜单显示标志
    // PS：这儿我只是因为嫌菜单显示标志太长了写在 data 里 return 丑得一批所以单独出来了
    // (来自 2022/12/1 看到代码迷惑的 SS)
    this.initMenuDisplay()
  }
}
</script>
