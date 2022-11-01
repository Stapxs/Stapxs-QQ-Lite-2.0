import Vue from 'vue'
import App from './App'

import 'layui/dist/css/layui.css'
import 'layui/dist/layui.js'
import 'viewerjs/dist/viewer.css'

import '../src/assets/css/view.css'
import '../src/assets/css/chat.css'
import '../src/assets/css/msg.css'
import '../src/assets/css/options.css'

import infScroll from 'vue-infinite-scroll'
import VueCookies from 'vue-cookies'
import VueViewer from 'v-viewer'
import VueXss from 'vue-xss'
import VueI18n from 'vue-i18n'
Vue.use(infScroll)
Vue.use(VueCookies)
Vue.use(VueViewer)
Vue.use(VueXss, {whiteList: {}, stripIgnoreTag: true})
Vue.use(VueI18n)

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
// 消息组件
Vue.appMsgType = {
  info: ['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M256 0C114.6 0 0 114.6 0 256s114.6 256 256 256s256-114.6 256-256S397.4 0 256 0zM232 152C232 138.8 242.8 128 256 128s24 10.75 24 24v128c0 13.25-10.75 24-24 24S232 293.3 232 280V152zM256 400c-17.36 0-31.44-14.08-31.44-31.44c0-17.36 14.07-31.44 31.44-31.44s31.44 14.08 31.44 31.44C287.4 385.9 273.4 400 256 400z"/></svg>'],
  err: ['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M256 512c141.4 0 256-114.6 256-256S397.4 0 256 0S0 114.6 0 256S114.6 512 256 512zM175 175c9.4-9.4 24.6-9.4 33.9 0l47 47 47-47c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9l-47 47 47 47c9.4 9.4 9.4 24.6 0 33.9s-24.6 9.4-33.9 0l-47-47-47 47c-9.4 9.4-24.6 9.4-33.9 0s-9.4-24.6 0-33.9l47-47-47-47c-9.4-9.4-9.4-24.6 0-33.9z"/></svg>']
}

// 载入 l10n
import zh from '../src/assets/src/l10n/zh-CN.json'
const messages = {
  'zh-CN': zh
}
// 载入时间格式化设置
// date: {year:'numeric',month:"short",day:"numeric"},
// time: {hour:"numeric",minute:"numeric",second:"numeric"}
// 初始化
const i18n = new VueI18n({
  locale: 'zh-CN',
  fallbackLocale: 'zh-CN',
  silentFallbackWarn: true,
  messages
})

const app = new Vue({
  i18n,
  el: '#app',
  components: { App },
  template: '<App/>'
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
    logger.add(logger.logMode.ws, 'PUT：' + str)
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
