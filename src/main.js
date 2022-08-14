import Vue from 'vue'
import App from './App'

import 'layui/dist/css/layui.css'
import 'layui/dist/layui.js'
import 'font-awesome/css/font-awesome.css'

import '../src/assets/css/view.css'
import '../src/assets/css/chat.css'
import '../src/assets/css/msg.css'

import { waveAnimation } from './assets/js/ui.js'

import infScroll from 'vue-infinite-scroll'
Vue.use(infScroll)

/* eslint-disable */
Vue.config.productionTip = false
// 日志组件
Vue.logMode = {
  ws: ["7abb7e", "fff", "WS"],
  ui: ["b573f7", "fff", "UI"],
  err: ["ff5370", "fff", "ERR"],
  ss: ["99b3db", "fff", "SS"],
  debug: ["677480", "fff", "DEBUG"],
}
Vue.log = function(mode, args) {
  console.log("%c" + mode[2] + "%c " + args,
    "background:#" + mode[0] + ";color:#" + mode[1] + 
    ";border-radius:7px 0 0 7px;display:inline-block;padding:2px 4px 2px 7px;", "")
}

const app = new Vue({
  el: '#app',
  components: { App },
  template: '<App/>',
  mounted() {
    Vue.log(Vue.logMode.debug, '欢迎使用 Stapxs QQ Lite！当前运行在调试模式。')
    // 初始化波浪动画
    waveAnimation(document.getElementById('login-wave'))
  }
})

// 构建请求结构
Vue.createAPI = function(action, params, echo) {
  let apiObj = {}
  apiObj.action = action
  if(params == null) {
      apiObj.params = {}
  } else {
      apiObj.params = params
  }
  if(echo == null) {
      apiObj.echo = action
  } else {
      apiObj.echo = echo
  }
  return JSON.stringify(apiObj)
}

// 发送 WS 请求
Vue.sendWs = function(str) {
    Vue.ws.send(str)
    Vue.log(Vue.logMode.ws, 'PUT：' + str)
}

// 构建消息 ID
Vue.buildMsgIdInfo = function(buffer) {
  var binary = ''
  var bytes = new Uint8Array(buffer)
  var len = bytes.byteLength
  for (var i=0; i<len; i++) {
      binary += String.fromCharCode(bytes[i])
  }
  return window.btoa(binary)
}