import VueCookies from 'vue3-cookies'
import VueViewer from 'v-viewer'
import VueClipboard from 'vue-clipboard2'
import InfiniteScroll from 'vue3-infinite-scroll-better'
import VueGtag from 'vue-gtag-next'

import App from './App.vue'

import { createApp } from 'vue'
import { createI18n } from 'vue-i18n'

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
console.log(app)
export default app