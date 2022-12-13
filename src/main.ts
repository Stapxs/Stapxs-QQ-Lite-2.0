// import infScroll from 'vue-infinite-scroll';
import VueCookies from 'vue3-cookies'
import VueViewer from 'v-viewer'
import VueClipboard from 'vue-clipboard2'
import infiniteScroll from 'vue3-infinite-scroll-better'

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

import zh from './assets/l10n/zh-CN.json'

// 载入 l10n
const messages = { 'zh-CN': zh }
// 初始化
export const i18n = createI18n({
  legacy: false,
  locale: 'zh-CN',
  fallbackLocale: 'zh-CN',
  silentFallbackWarn: true,
  messages
})

const app = createApp(App)
app.use(i18n)
// app.use(infScroll)
app.use(VueCookies)
app.use(VueViewer)
app.use(VueClipboard)
app.use(infiniteScroll)

app.mount('#app')
console.log(app)
export default app
