<!--
 * @FileDescription: 页面主框架
 * @Author: Stapxs
 * @Date: 2022/07/29
 * @Version: 1.0
 -->

<template>
  <div id="app">
    <div class="layui-tab layui-tab-brief main-body">
      <ul class="layui-tab-title">
        <li @click="changeChat" :class="login.status ? '' : 'layui-this'" :style="login.status ? 'margin-top: calc(-100% + 5px);' : ''">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512">
            <path
              d="M575.8 255.5C575.8 273.5 560.8 287.6 543.8 287.6H511.8L512.5 447.7C512.5 450.5 512.3 453.1 512 455.8V472C512 494.1 494.1 512 472 512H456C454.9 512 453.8 511.1 452.7 511.9C451.3 511.1 449.9 512 448.5 512H392C369.9 512 352 494.1 352 472V384C352 366.3 337.7 352 320 352H256C238.3 352 224 366.3 224 384V472C224 494.1 206.1 512 184 512H128.1C126.6 512 125.1 511.9 123.6 511.8C122.4 511.9 121.2 512 120 512H104C81.91 512 64 494.1 64 472V360C64 359.1 64.03 358.1 64.09 357.2V287.6H32.05C14.02 287.6 0 273.5 0 255.5C0 246.5 3.004 238.5 10.01 231.5L266.4 8.016C273.4 1.002 281.4 0 288.4 0C295.4 0 303.4 2.004 309.5 7.014L564.8 231.5C572.8 238.5 576.9 246.5 575.8 255.5L575.8 255.5z" />
          </svg>
        </li>
        <li @click="changeChat(false)" :class="!login.status ? '' : 'layui-this'">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
            <path
              d="M464 64C490.5 64 512 85.49 512 112C512 127.1 504.9 141.3 492.8 150.4L275.2 313.6C263.8 322.1 248.2 322.1 236.8 313.6L19.2 150.4C7.113 141.3 0 127.1 0 112C0 85.49 21.49 64 48 64H464zM217.6 339.2C240.4 356.3 271.6 356.3 294.4 339.2L512 176V384C512 419.3 483.3 448 448 448H64C28.65 448 0 419.3 0 384V176L217.6 339.2z" />
          </svg>
        </li>
        <li @click="changeChat(false)">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
            <path
              d="M224 256c70.7 0 128-57.31 128-128s-57.3-128-128-128C153.3 0 96 57.31 96 128S153.3 256 224 256zM274.7 304H173.3C77.61 304 0 381.6 0 477.3c0 19.14 15.52 34.67 34.66 34.67h378.7C432.5 512 448 496.5 448 477.3C448 381.6 370.4 304 274.7 304z" />
          </svg>
        </li>
        <div style="flex: 1;"></div>
        <li @click="changeChat">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
            <path
              d="M495.9 166.6C499.2 175.2 496.4 184.9 489.6 191.2L446.3 230.6C447.4 238.9 448 247.4 448 256C448 264.6 447.4 273.1 446.3 281.4L489.6 320.8C496.4 327.1 499.2 336.8 495.9 345.4C491.5 357.3 486.2 368.8 480.2 379.7L475.5 387.8C468.9 398.8 461.5 409.2 453.4 419.1C447.4 426.2 437.7 428.7 428.9 425.9L373.2 408.1C359.8 418.4 344.1 427 329.2 433.6L316.7 490.7C314.7 499.7 307.7 506.1 298.5 508.5C284.7 510.8 270.5 512 255.1 512C241.5 512 227.3 510.8 213.5 508.5C204.3 506.1 197.3 499.7 195.3 490.7L182.8 433.6C167 427 152.2 418.4 138.8 408.1L83.14 425.9C74.3 428.7 64.55 426.2 58.63 419.1C50.52 409.2 43.12 398.8 36.52 387.8L31.84 379.7C25.77 368.8 20.49 357.3 16.06 345.4C12.82 336.8 15.55 327.1 22.41 320.8L65.67 281.4C64.57 273.1 64 264.6 64 256C64 247.4 64.57 238.9 65.67 230.6L22.41 191.2C15.55 184.9 12.82 175.3 16.06 166.6C20.49 154.7 25.78 143.2 31.84 132.3L36.51 124.2C43.12 113.2 50.52 102.8 58.63 92.95C64.55 85.8 74.3 83.32 83.14 86.14L138.8 103.9C152.2 93.56 167 84.96 182.8 78.43L195.3 21.33C197.3 12.25 204.3 5.04 213.5 3.51C227.3 1.201 241.5 0 256 0C270.5 0 284.7 1.201 298.5 3.51C307.7 5.04 314.7 12.25 316.7 21.33L329.2 78.43C344.1 84.96 359.8 93.56 373.2 103.9L428.9 86.14C437.7 83.32 447.4 85.8 453.4 92.95C461.5 102.8 468.9 113.2 475.5 124.2L480.2 132.3C486.2 143.2 491.5 154.7 495.9 166.6V166.6zM256 336C300.2 336 336 300.2 336 255.1C336 211.8 300.2 175.1 256 175.1C211.8 175.1 176 211.8 176 255.1C176 300.2 211.8 336 256 336z" />
          </svg>
        </li>
      </ul>
      <div class="layui-tab-content">
        <div :class="!login.status ? 'layui-tab-item layui-show' : 'layui-tab-item'" name="主页">
          <div class="home-body">
            <div class="login-pan-card ss-card">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                <path
                  d="M380.6 365.6C401.1 379.9 416 404.3 416 432C416 476.2 380.2 512 336 512C291.8 512 256 476.2 256 432C256 423.6 257.3 415.4 259.7 407.8L114.1 280.4C103.8 285.3 92.21 288 80 288C35.82 288 0 252.2 0 208C0 163.8 35.82 128 80 128C101.9 128 121.7 136.8 136.2 151.1L320 77.52C321.3 34.48 356.6 0 400 0C444.2 0 480 35.82 480 80C480 117.9 453.7 149.6 418.4 157.9L380.6 365.6zM156.3 232.2L301.9 359.6C306.9 357.3 312.1 355.4 317.6 354.1L355.4 146.4C351.2 143.6 347.4 140.4 343.8 136.9L159.1 210.5C159.7 218 158.5 225.3 156.3 232.2V232.2z">
                </path>
              </svg>
              <p>连接到 OICQ HTTP</p>
              <form @submit.prevent @submit="connect">
                <label>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512">
                    <path
                      d="M172.5 131.1C228.1 75.51 320.5 75.51 376.1 131.1C426.1 181.1 433.5 260.8 392.4 318.3L391.3 319.9C381 334.2 361 337.6 346.7 327.3C332.3 317 328.9 297 339.2 282.7L340.3 281.1C363.2 249 359.6 205.1 331.7 177.2C300.3 145.8 249.2 145.8 217.7 177.2L105.5 289.5C73.99 320.1 73.99 372 105.5 403.5C133.3 431.4 177.3 435 209.3 412.1L210.9 410.1C225.3 400.7 245.3 404 255.5 418.4C265.8 432.8 262.5 452.8 248.1 463.1L246.5 464.2C188.1 505.3 110.2 498.7 60.21 448.8C3.741 392.3 3.741 300.7 60.21 244.3L172.5 131.1zM467.5 380C411 436.5 319.5 436.5 263 380C213 330 206.5 251.2 247.6 193.7L248.7 192.1C258.1 177.8 278.1 174.4 293.3 184.7C307.7 194.1 311.1 214.1 300.8 229.3L299.7 230.9C276.8 262.1 280.4 306.9 308.3 334.8C339.7 366.2 390.8 366.2 422.3 334.8L534.5 222.5C566 191 566 139.1 534.5 108.5C506.7 80.63 462.7 76.99 430.7 99.9L429.1 101C414.7 111.3 394.7 107.1 384.5 93.58C374.2 79.2 377.5 59.21 391.9 48.94L393.5 47.82C451 6.731 529.8 13.25 579.8 63.24C636.3 119.7 636.3 211.3 579.8 267.7L467.5 380z">
                    </path>
                  </svg>
                  <input v-model="login.address" placeholder="连接地址" class="ss-input" id="sev_address" autocomplete="off">
                </label>
                <label>
                  <svg style="padding: 0 2px;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
                    <path
                      d="M80 192V144C80 64.47 144.5 0 224 0C303.5 0 368 64.47 368 144V192H384C419.3 192 448 220.7 448 256V448C448 483.3 419.3 512 384 512H64C28.65 512 0 483.3 0 448V256C0 220.7 28.65 192 64 192H80zM144 192H304V144C304 99.82 268.2 64 224 64C179.8 64 144 99.82 144 144V192z">
                    </path>
                  </svg>
                  <input v-model="login.token" placeholder="许可令牌" class="ss-input" type="password" id="access_token"
                    autocomplete="off">
                </label>
                <div style="display: flex;">
                  <label class="default">
                    <input type="checkbox" id="opt_save_password" onclick="changeSavePwd(this)">
                    <a>记住密码</a>
                  </label>
                  <div style="flex: 1;"></div>
                  <label class="default" style="justify-content: flex-end;">
                    <input type="checkbox" id="opt_auto_connect" onclick="changeOpt(this)">
                    <a>自动连接</a>
                  </label>
                </div>
                <a id="save_pwd_note" class="opt-tip login-tip" style="display: none;">
                  安全警告：Stapxs QQ Lite 将以明文保存您的密码，请确保您的设备安全。再次点击确认开启。
                </a>
                <button id="connect_btn" class="ss-button" type="submit">连接</button>
              </form>
              <a href="https://github.com/Stapxs/Stapxs-QQ-Lite/blob/main/README.md#%E4%BD%BF%E7%94%A8" target="_blank"
                style="margin-bottom: -20px;">如何连接</a>
              <div class="wave-pan" style="margin-left: -30px;">
                <svg id="login-wave" class="waves-svg" xmlns="http://www.w3.org/2000/svg"
                  xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 24 170 70" preserveAspectRatio="none"
                  shape-rendering="auto">
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
        <div :class="login.status ? 'layui-tab-item layui-show' : 'layui-tab-item'">
          <Messages :list="inList" @userClick="setChat" ref="inMessage"></Messages>
        </div>
        <div class="layui-tab-item">
          <Friends :list="userList" @userClick="setChat" @addMessage="addIn" @loadHistory="loadHistory"></Friends>
        </div>
        <div class="layui-tab-item">内容4</div>
      </div>
    </div>
    <Chat
      :chat="onChat"
      :list="messageList"
      v-if="login.status && onChat.id != ''"
      v-show="showChat"
      ref="chat"></Chat>
  </div>
</template>

<script>
import Vue from 'vue'

import Main from './assets/js/main'
import Util from './assets/js/util'

import Friends from './pages/Friends.vue'
import Chat from './pages/Chat.vue'
import Messages from './pages/Messages.vue'

export default {
  name: 'App',
  // 应用组件
  components: {
    Friends,
    Chat,
    Messages
  },
  // 应用全局参数
  data () {
    return {
      version: '2.0.0',
      onChat: { type: '', id: '', name: '', avatar: '' },
      login: { address: '', token: '', status: '' },
      showChat: false,
      messageList: [],
      userList: [],
      inList: []
    }
  },
  // 应用方法
  methods: {
    // 连接相关
    connect: function () {
      Vue.ws = new WebSocket('ws://' + this.login.address + '?access_token=' + this.login.token)
      Vue.ws.onopen = () => {
        Vue.log(Vue.logMode.ws, '连接成功')
        this.login.status = true
        // 加载初始化数据
        Main.loadBaseInfo()
      }
      Vue.ws.onmessage = (e) => {
        // Vue.log(Vue.logMode.debug, 'GET：' + e.data)
        this.parse(e.data)
      }
      Vue.ws.onclose = (e) => {
        Vue.log(Vue.logMode.ws, '连接关闭')
        this.login.status = false
        if (e.code !== 1000) {
          Vue.log(Vue.logMode.err, '连接失败：' + e.code)
        } else {
          Vue.log(Vue.logMode.debug, '连接关闭：' + e.code)
        }
      }
    },
    parse: function (str) {
      const msg = JSON.parse(str)
      if (msg.echo !== undefined) {
        switch (msg.echo) {
          case 'getLoginInfo': Vue.loginInfo = msg.data; break // 获取基本信息
          case 'getGroupList': this.userList = Util.mergeList(this.userList, msg.data); break // 获取群列表
          case 'getFriendList': this.userList = Util.mergeList(this.userList, msg.data); break // 获取好友列表
          case 'getChatHistoryFist': { // 首次获取消息记录
            this.messageList = msg.data
            setTimeout(() => {
              this.$refs.chat.scrollBottom()
            }, 500)
            break
          }
          case 'getChatHistory': { // 追加获取消息记录
            const items = msg.data
            items.pop() // 去除最后一条重复的消息
            if (items.length < 1) {
              this.$refs.chat.setNoMoreHistory()
              return
            }
            this.messageList = Util.mergeList(items, this.messageList)
            break
          }
        }
      } else {
        switch (msg.post_type) {
          case 'message': this.newMsg(msg); break // 接收到消息
        }
      }
    },
    // 标签卡相关
    setChat: function (data) {
      this.onChat.type = data.type
      this.onChat.id = data.id
      this.onChat.name = data.name
      this.onChat.avatar = data.avatar
      this.onChat.msg = []
      if (this.messageList.length > 0) {
        this.$refs.chat.canLoadHistory = true
      }
    },
    changeChat: function (info) {
      if (!info) {
        this.showChat = true
      } else {
        this.showChat = false
      }
    },
    // 用户列表交互相关
    addIn: function (data) {
      this.$refs.inMessage.addMesage(data)
    },
    // 消息相关
    loadHistory: function (info) {
      if (!Main.loadHistoryMessage(info.id, info.type)) {
        // 加载历史消息失败（构建消息 ID 失败）
      }
    },
    newMsg: function (data) {
      const id = data.from_id ? data.from_id : data.group_id
      if (id === this.onChat.id) {
        // 当前聊天窗口
        this.messageList.push(data)
      }
    }
  }
}
</script>

<style>
</style>
