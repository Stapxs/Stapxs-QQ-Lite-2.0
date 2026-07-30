import VueClipboard from 'vue-clipboard2'
import packageInfo from '../../../package.json'

import App from './App.vue'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createI18n } from 'vue-i18n'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { library } from '@fortawesome/fontawesome-svg-core'
import { fas } from '@fortawesome/free-solid-svg-icons'

import { faSquare, faHeart } from '@fortawesome/free-regular-svg-icons'

import './assets/css/view.css'
import './assets/css/chat.css'
import './assets/css/msg.css'
import './assets/css/options.css'
import './assets/css/sys_notice.css'

import { initAMapApiLoader } from '@vuemap/vue-amap'
import { getPortableFileLang } from './function/utils/systemUtil'
import { preloadPinyin } from './function/utils/pinyin'

// 初始化高德地图 API
initAMapApiLoader({
    key: import.meta.env.VITE_APP_AMAP_KEY,
    securityJsCode: import.meta.env.VITE_APP_AMAP_SECRET,
})

/* eslint-disable no-console */
const zh = getPortableFileLang('zh-CN')

// 载入 l10n
const messages = { 'zh-CN': zh }
// 初始化 i18n
export const i18n = createI18n({
    legacy: false,
    locale: 'zh-CN',
    fallbackLocale: 'zh-CN',
    silentFallbackWarn: true,
    messages,
})

// 创建 App
const app = createApp(App)
app.use(i18n)
app.use(createPinia())
app.use(VueClipboard)

library.add(fas)
library.add(faSquare, faHeart)
app.component('FontAwesomeIcon', FontAwesomeIcon)

app.mount('#app')
export default app
export const uptime = new Date().getTime()

preloadPinyin()

const strList = ['VERSION', 'WELCOME', 'HELLO']
const colorList = [
    '50534f',
    'f9a633',
    '8076a3',
    '92aa8a',
    '606e7a',
    '7abb7e',
    'b573f7',
    'ff5370',
    '99b3db',
    '677480',
]
const color = colorList[Math.floor(Math.random() * colorList.length)]
const str = strList[Math.floor(Math.random() * strList.length)]
console.log(
    `%c${str}%c Stapxs QQ Lite - ${packageInfo.version} ( ${import.meta.env.DEV ? 'development' : 'production'} ) `,
    `font-weight:bold;background:#${color};color:#fff;border-radius:7px 0 0 7px;padding:7px 14px;margin:7px 0 7px 7px;`,
    'background:#e3e8ec;color:#000;border-radius:0 7px 7px 0;display:inline-block;padding:7px 14px;margin:7px 7px 7px 0;',
)
if(import.meta.env.DEV) {
    console.log('[ SSystem Bootloader Loading …… core/sardos-core ]')
}
console.log('[ SSystem Bootloader Loading …… core/ssqq-core ]')
