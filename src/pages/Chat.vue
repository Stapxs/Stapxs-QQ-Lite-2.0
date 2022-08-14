<template>
  <div class="chat-pan">
    <div>
      <img :src="chat.avatar">
      <div>
        <p>{{ chat.name }}</p>
        <span>
          {{ list[list.length - 1] ? '上次消息 - ' + this.formatTime(new Date(list[list.length - 1].time)) : '暂无消息'}}
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
      <div class="note-base" v-if="!canLoadHistory">
        <span class="note-nomsg">没有更多消息了</span>
      </div>
      <MsgBody v-for="msg in list" :key="msg.message_id" :data="msg"></MsgBody>
    </div>
    <div v-show="showBottomButton" @click="scrollBottom(true)">
      <div class="ss-card">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><path d="M192 384c-8.188 0-16.38-3.125-22.62-9.375l-160-160c-12.5-12.5-12.5-32.75 0-45.25s32.75-12.5 45.25 0L192 306.8l137.4-137.4c12.5-12.5 32.75-12.5 45.25 0s12.5 32.75 0 45.25l-160 160C208.4 380.9 200.2 384 192 384z"/></svg>
        <span v-if="NewMsgNum > 0">{{ NewMsgNum }}</span>
      </div>
    </div>
    <div>
      <div>
        <div>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M432 256c0 17.69-14.33 32.01-32 32.01H256v144c0 17.69-14.33 31.99-32 31.99s-32-14.3-32-31.99v-144H48c-17.67 0-32-14.32-32-32.01s14.33-31.99 32-31.99H192v-144c0-17.69 14.33-32.01 32-32.01s32 14.32 32 32.01v144h144C417.7 224 432 238.3 432 256z"/></svg>
        </div>
        <div>
          <input type="text" v-model="msg" @keyup.enter="sendMsg">
          <div>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 512"><path d="M64 448c-8.188 0-16.38-3.125-22.62-9.375c-12.5-12.5-12.5-32.75 0-45.25L178.8 256L41.38 118.6c-12.5-12.5-12.5-32.75 0-45.25s32.75-12.5 45.25 0l160 160c12.5 12.5 12.5 32.75 0 45.25l-160 160C80.38 444.9 72.19 448 64 448z"/></svg>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import MsgBody from '../components/MsgBody.vue'
import Vue from 'vue'
export default {
  name: 'Chat',
  props: ['chat', 'list'],
  components: { MsgBody },
  data () {
    return {
      canLoadHistory: true,
      nowGetHistroy: false,
      showBottomButton: true,
      NewMsgNum: 0,
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
      if (body.scrollTop === 0) {
        this.loadMoreHistory()
      }
      // 显示回到底部
      if (body.scrollTop < body.scrollHeight - body.clientHeight * 4) {
        this.showBottomButton = true
      } else {
        this.showBottomButton = false
      }
    },
    /**
     * 加载更多历史消息
     */
    loadMoreHistory: function () {
      if (!this.nowGetHistroy && this.canLoadHistory) {
        // 获取列表第一条消息 ID
        const firstMsgId = this.list[0].message_id
        // 锁定加载防止反复触发
        this.nowGetHistroy = true
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
    setNoMoreHistory: function () {
      this.canLoadHistory = false
    },
    /**
     * 格式化时间
     * @param { Date } time 时间
     */
    formatTime: function (time) {
      var format = require('date-format')
      return format.asString('hh:mm:ss', time)
    },
    /**
     * 发送消息
     */
    sendMsg: function () { }
  },
  watch: {
    list: function () {
      const pan = document.getElementById('msgPan')
      const height = pan.scrollHeight
      const top = pan.scrollTop
      if (this.nowGetHistroy) {
        this.$nextTick(() => {
          const newPan = document.getElementById('msgPan')
          this.scrollTo(newPan.scrollHeight - height, false)
          this.nowGetHistroy = false
        })
      } else {
        // 解除锁定加载
        this.nowGetHistroy = false
      }
      this.$nextTick(() => {
        const newPan = document.getElementById('msgPan')
        if (top === height - newPan.clientHeight) {
          // 刚刚页面在最底部
          this.scrollBottom(true)
        }
      })
    }
  }
}
</script>
