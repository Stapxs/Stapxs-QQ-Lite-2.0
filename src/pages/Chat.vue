/*
 * @FileDescription: 消息框主体
 * @Author: Stapxs
 * @Date: 2022/08/14
 * @Version: 1.0
*/

<template>
  <div class="chat-pan">
    <div>
      <img :src="chat.avatar">
      <div>
        <p>{{ chat.name }}</p>
        <span>
          {{ list[list.length - 1] ? $t('chat.last_msg', {time: $d(new Date(list[list.length - 1].time), 'time')}) : $t('chat.no_msg')}}
          </span>
      </div>
      <div></div>
      <div>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512">
          <path
            d="M310.6 246.6l-127.1 128C176.4 380.9 168.2 384 160 384s-16.38-3.125-22.63-9.375l-127.1-128C.2244 237.5-2.516 223.7 2.438 211.8S19.07 192 32 192h255.1c12.94 0 24.62 7.781 29.58 19.75S319.8 237.5 310.6 246.6z" />
        </svg>
      </div>
    </div>
    <div @scroll="chatScroll" id="msgPan" style="scroll-behavior: smooth;">
      <div class="note-base" v-if="!tags.canLoadHistory">
        <span class="note-nomsg">{{ $t('chat.no_more_msg') }}</span>
      </div>
      <MsgBody
        v-for="msg in list"
        :key="msg.message_id"
        :data="msg"
        @scrollToMsg="scrollToMsg"
        @viewImg="viewImg"
        @contextmenu.native.prevent="showMsgMeun"></MsgBody>
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
        <!-- 更多功能 -->
        <div :class="tags.showMoreDetail ? 'more-detail show' : 'more-detail'">
          <div v-for="(item, index) in details"
            :key="index"
            :title="item.text"
            :onclick="item.fun"
            v-html="item.svg"></div>
        </div>
      </div>
      <div>
        <div @click="tags.showMoreDetail = !tags.showMoreDetail">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M432 256c0 17.69-14.33 32.01-32 32.01H256v144c0 17.69-14.33 31.99-32 31.99s-32-14.3-32-31.99v-144H48c-17.67 0-32-14.32-32-32.01s14.33-31.99 32-31.99H192v-144c0-17.69 14.33-32.01 32-32.01s32 14.32 32 32.01v144h144C417.7 224 432 238.3 432 256z"/></svg>
        </div>
        <div>
          <textarea
            type="text"
            v-model="msg"
            @paste="addImg"
            @keyup="mainKeyUp"></textarea>
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
          <span>{{ $t('chat.merge_msg') }}</span>
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
              <span v-if="$t('chat.member_type.' + mumberInfo.role) !== ''">
                {{  $t('chat.member_type.' + mumberInfo.role)  }}
              </span>
              <span>Lv {{  mumberInfo.level  }}</span>
            </div>
          </div>
          <span> {{ $t('chat.join_time', {time: $d(new Date(mumberInfo.join_time * 1000), 'date')})  }} </span>
        </div>
      </div>
    </div>
    <!-- 消息右击菜单 -->
    <div class="msg-menu">
      <div v-show="tags.showMsgMenu" class="msg-menu-bg" @click="closeMsgMenu"></div>
      <div :class="tags.showMsgMenu ? 'ss-card menu show' : 'ss-card menu'" id="msgMenu">
        <div v-for="(item, index) in msgMenus" v-show="item.display" :key="'msgM-' + index">
           <div v-html="item.svg"></div>
           <a>{{ item.text }}</a>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import MsgBody from '../components/MsgBody.vue'
import Vue from 'vue'

import { parseMsgId } from '../assets/js/util.js'

export default {
  name: 'Chat',
  props: ['chat', 'list', 'mergeList', 'mumberInfo', 'imgView'],
  components: { MsgBody },
  data () {
    return {
      tags: {
        canLoadHistory: true,
        nowGetHistroy: false,
        showBottomButton: true,
        showMoreDetail: false,
        showMsgMenu: false,
        openedMenuMsg: null
      },
      details: [
        {
          svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M447.1 32h-384C28.64 32-.0091 60.65-.0091 96v320c0 35.35 28.65 64 63.1 64h384c35.35 0 64-28.65 64-64V96C511.1 60.65 483.3 32 447.1 32zM111.1 96c26.51 0 48 21.49 48 48S138.5 192 111.1 192s-48-21.49-48-48S85.48 96 111.1 96zM446.1 407.6C443.3 412.8 437.9 416 432 416H82.01c-6.021 0-11.53-3.379-14.26-8.75c-2.73-5.367-2.215-11.81 1.334-16.68l70-96C142.1 290.4 146.9 288 152 288s9.916 2.441 12.93 6.574l32.46 44.51l93.3-139.1C293.7 194.7 298.7 192 304 192s10.35 2.672 13.31 7.125l128 192C448.6 396 448.9 402.3 446.1 407.6z"/></svg>',
          text: this.$t('chat.fun_menu.pic'),
          fun: 'selectImg()'
        },
        {
          svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M0 256C0 114.6 114.6 0 256 0C397.4 0 512 114.6 512 256C512 397.4 397.4 512 256 512C114.6 512 0 397.4 0 256zM256 432C332.1 432 396.2 382 415.2 314.1C419.1 300.4 407.8 288 393.6 288H118.4C104.2 288 92.92 300.4 96.76 314.1C115.8 382 179.9 432 256 432V432zM176.4 160C158.7 160 144.4 174.3 144.4 192C144.4 209.7 158.7 224 176.4 224C194 224 208.4 209.7 208.4 192C208.4 174.3 194 160 176.4 160zM336.4 224C354 224 368.4 209.7 368.4 192C368.4 174.3 354 160 336.4 160C318.7 160 304.4 174.3 304.4 192C304.4 209.7 318.7 224 336.4 224z"/></svg>',
          text: this.$t('chat.fun_menu.face'),
          fun: 'emojiPan()'
        }
      ],
      msgMenus: [
        {
          svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M511.1 63.1v287.1c0 35.25-28.75 63.1-64 63.1h-144l-124.9 93.68c-7.875 5.75-19.12 .0497-19.12-9.7v-83.98h-96c-35.25 0-64-28.75-64-63.1V63.1c0-35.25 28.75-63.1 64-63.1h384C483.2 0 511.1 28.75 511.1 63.1z"/></svg>',
          text: this.$t('chat.msg_menu.reply'),
          fun: '',
          display: true
        },
        {
          svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M503.7 226.2l-176 151.1c-15.38 13.3-39.69 2.545-39.69-18.16V272.1C132.9 274.3 66.06 312.8 111.4 457.8c5.031 16.09-14.41 28.56-28.06 18.62C39.59 444.6 0 383.8 0 322.3c0-152.2 127.4-184.4 288-186.3V56.02c0-20.67 24.28-31.46 39.69-18.16l176 151.1C514.8 199.4 514.8 216.6 503.7 226.2z"/></svg>',
          text: this.$t('chat.msg_menu.forward'),
          fun: '',
          display: true
        },
        {
          svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512"><path d="M23.19 32C28.86 32 34.34 34.08 38.59 37.86L312.6 281.4C317.3 285.6 320 291.6 320 297.9C320 310.1 310.1 320 297.9 320H179.8L236.6 433.7C244.5 449.5 238.1 468.7 222.3 476.6C206.5 484.5 187.3 478.1 179.4 462.3L121.2 346L38.58 440.5C34.4 445.3 28.36 448 22.01 448C9.855 448 0 438.1 0 425.1V55.18C0 42.38 10.38 32 23.18 32H23.19z"/></svg>',
          text: this.$t('chat.msg_menu.multiple_choice'),
          fun: '',
          display: true
        },
        {
          svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><path d="M336 64h-53.88C268.9 26.8 233.7 0 192 0S115.1 26.8 101.9 64H48C21.5 64 0 85.48 0 112v352C0 490.5 21.5 512 48 512h288c26.5 0 48-21.48 48-48v-352C384 85.48 362.5 64 336 64zM192 64c17.67 0 32 14.33 32 32c0 17.67-14.33 32-32 32S160 113.7 160 96C160 78.33 174.3 64 192 64zM272 224h-160C103.2 224 96 216.8 96 208C96 199.2 103.2 192 112 192h160C280.8 192 288 199.2 288 208S280.8 224 272 224z"/></svg>',
          text: this.$t('chat.msg_menu.copy'),
          fun: '',
          display: true
        },
        {
          svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512"><path d="M310.6 361.4c12.5 12.5 12.5 32.75 0 45.25C304.4 412.9 296.2 416 288 416s-16.38-3.125-22.62-9.375L160 301.3L54.63 406.6C48.38 412.9 40.19 416 32 416S15.63 412.9 9.375 406.6c-12.5-12.5-12.5-32.75 0-45.25l105.4-105.4L9.375 150.6c-12.5-12.5-12.5-32.75 0-45.25s32.75-12.5 45.25 0L160 210.8l105.4-105.4c12.5-12.5 32.75-12.5 45.25 0s12.5 32.75 0 45.25l-105.4 105.4L310.6 361.4z"/></svg>',
          text: this.$t('chat.msg_menu.withdraw'),
          fun: '',
          display: false
        }
      ],
      NewMsgNum: 0,
      listSize: 0,
      msg: ''
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
      if (!this.tags.nowGetHistroy && this.tags.canLoadHistory) {
        // 获取列表第一条消息 ID
        const firstMsgId = this.list[0].message_id
        // 锁定加载防止反复触发
        this.tags.nowGetHistroy = true
        // 发起获取历史消息请求
        Vue.sendWs(
          Vue.createAPI(
            'getChatHistory',
            { 'message_id': firstMsgId },
            'getChatHistory'
          )
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
      } else {
        const data = {
          text: this.$t('chat.msg_not_load'),
          type: Vue.appMsgType.err,
          autoClose: true
        }
        this.$emit('message', data)
      }
    },
    viewImg: function (msgId) {
      this.$emit('viewImg', msgId)
    },
    setNoMoreHistory: function () {
      this.tags.canLoadHistory = false
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
     * 添加图片
     * @param { object } event 事件
     */
    addImg: function (event) {
      Vue.addImg(event)
    },
    /**
     * 发送框按键事件（仅用于判定发送）
     * @param { object } event 事件
     */
    mainKeyUp: function (event) {
      if (!event.shiftKey && event.keyCode === 13) {
        this.sendMsg()
      }
    },
    /**
     * 显示右击菜单
     * @param { object } event 事件
     */
    showMsgMeun: function (event) {
      const menu = document.getElementById('msgMenu')
      const msg = event.currentTarget
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
    },
    closeMergeMsg: function () {
      this.$emit('cleanMerge', null)
    },
    /**
     * 发送消息
     */
    sendMsg: function () {
      let json = null
      let msg = this.msg
      // TODO 暂时不处理图片，等待 tim 修改后端
      // 构建图片 CQ 码
      // if (Vue.cacheImg !== undefined && Vue.cacheImg.length > 0) {
      //   for (let i = 0; i < Vue.cacheImg.length; i++) {
      //     // 构建图片 CQ 码
      //     msg = '[CQ:image,file=base64://' + Vue.cacheImg[i].substring(Vue.cacheImg[i].indexOf('base64') + 7) + ']' + msg
      //   }
      // }
      if (msg !== '') {
        // 去除回车发送导致的结尾换行
        if (msg.slice(-1) === '\n') {
          msg = msg.substring(0, msg.length - 1)
        }
        switch (this.chat.type) {
          case 'group': json = Vue.createAPI('sendGroupMsg', {'group_id': this.chat.id, 'message': msg}, 'sendMsgBack'); break
          case 'user': json = Vue.createAPI('sendPrivateMsg', {'user_id': this.chat.id, 'message': msg}, 'sendMsgBack'); break
        }
        if (json != null) {
          Vue.sendWs(json)
          // PS: 渲染本条消息的功能由消息本请求的返回系统处理
        }
      }
      // 发送后事务
      this.msg = ''
      this.scrollBottom()
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
          item.message.forEach((msg) => {
            if (msg.type === 'image' && !msg.asface) {
              const index = (parseMsgId(item.message_id)).seqid
              const info = [index, item.message_id, msg.url]
              getImgList.push(info)
            }
          })
        })
        this.imgView.srcList = getImgList
      })
    },
    chat: function () {
      // 重置部分状态数据
      this.tags = this.$options.data().tags
      this.msgMenus = this.$options.data().msgMenus
    }
  }
}
</script>
