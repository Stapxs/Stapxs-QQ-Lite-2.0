import App from './App'

import InfScroll from 'vue-infinite-scroll'
import VueCookies from 'vue-cookies'
import VueViewer from 'v-viewer'
import VueClipboard from 'vue-clipboard2'
import zh from '../src/assets/src/l10n/zh-CN.json'

import { createApp } from 'vue'
import { createI18n } from 'vue-i18n'

import 'layui/dist/css/layui.css'
import 'viewerjs/dist/viewer.css'
import '../src/assets/css/view.css'
import '../src/assets/css/chat.css'
import '../src/assets/css/msg.css'
import '../src/assets/css/options.css'

import 'layui/dist/layui.js'

// 载入 l10n
const messages = {
  'zh-CN': zh
}
// 初始化
const i18n = createI18n({
  locale: 'zh-CN',
  fallbackLocale: 'zh-CN',
  silentFallbackWarn: true,
  messages
})

const app = createApp(App)
app.use(InfScroll)
app.use(VueCookies)
app.use(VueViewer)
app.use(VueClipboard)
app.use(i18n)
app.mount('#app')
