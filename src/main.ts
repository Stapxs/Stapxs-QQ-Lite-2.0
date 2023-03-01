import VueCookies from 'vue3-cookies'
import VueViewer from 'v-viewer'
import VueClipboard from 'vue-clipboard2'
import InfiniteScroll from 'vue3-infinite-scroll-better'
import VueGtag from 'vue-gtag-next'

import App from './App.vue'

import { createApp } from 'vue'
import { createI18n } from 'vue-i18n'
import { version } from '../package.json'

import './registerServiceWorker'

import 'layui/dist/css/layui.css'
import 'layui/dist/layui.js'
import 'viewerjs/dist/viewer.css'

import './assets/css/view.css'
import './assets/css/chat.css'
import './assets/css/msg.css'
import './assets/css/options.css'
import './assets/css/sys_notice.css'

import zh from './assets/l10n/zh-CN.json'

// 载入 l10n
const messages = { 'zh-CN': zh }
// 初始化 i18n
export const i18n = createI18n({
  legacy: false,
  locale: 'zh-CN',
  fallbackLocale: 'zh-CN',
  silentFallbackWarn: true,
  messages
})

// 创建 App
const app = createApp(App)
app.use(i18n)
app.use(VueCookies)
app.use(VueViewer)
app.use(VueClipboard)
app.use(InfiniteScroll)
app.use(VueGtag)

app.mount('#app')
export default app

const strList = ['VERSION', 'WELCOME', 'HELLO']
const colorList = ['50534f', 'f9a633', '8076a3', 'f0a1a8', '92aa8a', '606E7A', '7abb7e', 'b573f7', 'ff5370', '99b3db', '677480']
const color = colorList[Math.floor(Math.random() * colorList.length)]
const str = strList[Math.floor(Math.random() * strList.length)]
console.log(`%c${str}%c Stapxs QQ Lite - ${version} ( ${process.env.NODE_ENV} ) `, `font-weight:bold;background:#${color};color:#fff;border-radius:7px 0 0 7px;display:inline-block;padding:7px 14px;margin:7px 0 7px 7px;`, 'background:#fff;color:#000;border-radius:0 7px 7px 0;display:inline-block;padding:7px 14px;margin:7px 7px 7px 0;');

console.log(app)