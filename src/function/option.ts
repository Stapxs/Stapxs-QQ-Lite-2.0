/*
 * @FileDescription: 设置功能模块
 * @Author: Stapxs
 * @Date: 
 *      2022/09/27
 *      2022/12/07
 * @Version: 
 *      1.0 - 初始版本
 *      1.5 - 重构为 ts 版本，代码格式优化
 * @Description: 设置功能相关模块
*/

import app from '@/main'
import languageConfig from '@/assets/l10n/_l10nconfig.json'

import { i18n } from '@/main'
import { markRaw, defineAsyncComponent } from 'vue'
import { Logger, LogType } from './base'
import { runtimeData } from './msg'
import { initUITest, getTrueLang, loadSystemThemeColor, loadWinColor, updateWinColor } from './util'

let cacheConfigs: { [key: string]: any }

// 设置项的初始值，防止下拉菜单选项为空或者首次使用初始错误
const optDefault: { [key: string]: any } = {
    opt_dark: false,
    language: 'zh-CN',
    log_level: 'err',
    open_ga_bot: true,
    initial_scale: 0.85,
    theme_color: 0,
    chat_background_blur: 0
}

// =============== 设置项事件 ===============

const configFunction: { [key: string]: (value: any) => void } = {
    language: setLanguage,
    opt_dark: setDarkMode,
    opt_auto_dark: setAutoDark,
    theme_color: changeTheme,
    ui_test: changeUiTest,
    chatview_name: changeChatView,
    initial_scale: changeInitialScale,
    msg_type: setMsgType,
    opt_auto_gtk: updateGTKColor,
    opt_auto_win_color: updateWinColorOpt
}

function updateWinColorOpt(value: boolean) {
    if(value == true) {
        const electron = (process.env.IS_ELECTRON as any) === true ? window.require('electron') : null
        const reader = electron ? electron.ipcRenderer : null
        if (reader) {
            reader.on('sys:WinColorChanged', (event, params) => {
                updateWinColor(params)
            })
        }
        loadWinColor()
    }
}

function updateGTKColor(value: boolean) {
    if(value == true) {
        loadSystemThemeColor()
    }
}

function setMsgType(value: any) {
    if(value && typeof value == 'number') {
        runtimeData.tags.msgType = value
    }
}

/**
 * 启用 UI 测试模式以便于翻译等需要浏览全部 UI 的行为
 * @param value 是否启用 UI 测试模式
 */
function changeUiTest(value: boolean) {
    if (value === true) {
        initUITest()
    }
}

/**
 * 修改移动端缩放比例
 * @param value 数值（0.1 - 5）
 */
function changeInitialScale(value: number) {
    const viewport = document.getElementById("viewport")
    if(viewport && value && value >= 0.1 && value <= 5) {
        (viewport as any).content = `width=device-width, initial-scale=${value}, maximum-scale=5, user-scalable=0`
    }
}

/**
 * 加载语言文件并设置为当前的语言
 * @param name 语言文件名（不是实际语言代码）
 */
function setLanguage(name: string) {
    // 加载主语言
    import(`../assets/l10n/${name}.json`).then(lang => {
        i18n.global.setLocaleMessage(name, lang)
    })
    app.config.globalProperties.$i18n.locale = name
    // 检查是否设置了备选语言
    let get = false
    for(let i=0; i<languageConfig.length; i++) {
        if(languageConfig[i].value == name && (languageConfig[i] as any).fallback) {
            const fbname = (languageConfig[i] as any).fallback
            import(`../assets/l10n/${fbname}.json`).then(lang => {
                i18n.global.setLocaleMessage(fbname, lang)
            })
            get = true
            app.config.globalProperties.$i18n.fallbackLocale = fbname
            break
        }
    }
    if(!get) {
        app.config.globalProperties.$i18n.fallbackLocale = 'zh-CN'
    }
    // 刷新 html 语言标签
    const htmlBody = document.querySelector('html')
    if (htmlBody !== null) {
        htmlBody.setAttribute('lang', getTrueLang())
    }
}

/**
 * 设置暗黑模式
 * @param value 是否启用暗黑模式
 */
function setDarkMode(value = true) {
    if (value === true) {
        changeColorMode('dark')
    } else {
        changeColorMode('light')
    }
}

/**
 * 设置自动暗黑模式
 * @param value 是否启用自动暗黑模式
 */
function setAutoDark(value: boolean) {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const opt = document.getElementById('opt_view_dark')
    if(value == true) {
        // 刷新一次颜色模式
        if (media.matches) {
            setDarkMode()
        } else {
            setDarkMode(false)
        }
        // 创建颜色模式变化监听
        if (typeof media.addEventListener === 'function') {
            media.addEventListener('change', (e) => {
                if (get('opt_auto_dark')) {
                    const prefersDarkMode = e.matches
                    new Logger().add(LogType.UI, '正在自动切换颜色模式为：' + prefersDarkMode)
                    if (prefersDarkMode) {
                        setDarkMode()
                    } else {
                        setDarkMode(false)
                    }
                    // 刷新主题色
                    runAS('opt_auto_win_color', get('opt_auto_win_color'))
                }
            })
        }
        // 将颜色模式设置项移除
        if(opt) opt.style.display = 'none'
    } else {
        if(opt) opt.style.display = 'flex'
        setDarkMode(Boolean(get('opt_dark')))
    }
}

/**
 * 修改颜色模式
 * @param mode 颜色模式
 */
function changeColorMode(mode: string) {
    if (!runtimeData.tags.firstLoad) {
        // 启用颜色渐变动画
        document.body.style.transition = 'background, color, background-color .3s'
    } else {
        runtimeData.tags.firstLoad = false
    }
    // 切换颜色
    const match_list = ['color-.*.css', 'prism-.*.css']
    const css_list = document.getElementsByTagName("link")
    for (let i = 0; i < css_list.length; i++) {
        const name = css_list[i].href
        match_list.forEach(function (value) {
            if (name.match(value) != null) {
                const newLink = document.createElement("link")
                newLink.setAttribute("rel", "stylesheet")
                newLink.setAttribute("type", "text/css")
                if (mode === "dark") {
                    newLink.setAttribute("href", name.replace('light', 'dark'))
                } else {
                    newLink.setAttribute("href", name.replace('dark', 'light'))
                }
                const head = document.getElementsByTagName("head").item(0)
                if(head !== null) {
                    head.replaceChild(newLink, css_list[i])
                }
            }
        })
    }
    // 刷新页面主题色
    const meta = document.getElementsByName('theme-color')[0]
    if(meta) {
        (meta as HTMLMetaElement).content = getComputedStyle(document.documentElement)
            .getPropertyValue('--color-main')
    }
}

/**
 * 设置主题色
 * @param id 主题色编号
 */
function changeTheme(id: number) {
    document.documentElement.style.setProperty('--color-main', 'var(--color-main-' + id + ')')
    const meta = document.getElementsByName('theme-color')[0]
    if(meta) {
        (meta as HTMLMetaElement).content = getComputedStyle(document.documentElement)
            .getPropertyValue('--color-main-' + id)
    }
}

/**
 * 切换聊天面板
 * @param name 文件名
 */
function changeChatView(name: string | undefined) {
    if(name && name != '') {
        runtimeData.pageView.chatView = 
        markRaw(defineAsyncComponent(() => import(`@/pages/chat-view/${name}.vue`)))
    } else {
        runtimeData.pageView.chatView = 
        markRaw(defineAsyncComponent(() => import(`@/pages/Chat.vue`)))
    }
}

// =============== 设置基础功能 ===============

/**
 * 读取并序列化 cookie 中的设置项
 * @returns 设置项集合
 */
export function load(): { [key: string]: any } {
    const options: { [key: string]: any } = {}
    // 解析拆分 cookie 并执行各个设置项的初始化方法
    const str: string = app.config.globalProperties.$cookies.get('options')
    if (str != null) {
        const list = str.split('&')
        for (let i = 0; i <= list.length; i++) {
            if (list[i] !== undefined) {
                const opt: string[] = list[i].split(':')
                if (opt.length === 2) {
                    // 特殊处理被字符串化的布尔值
                    if (opt[1] === 'true' || opt[1] === 'false') {
                        options[opt[0]] = (opt[1] === 'true')
                    } else {
                        options[opt[0]] = decodeURIComponent(opt[1])
                    }
                    // 执行设置项操作
                    run(opt[0], opt[1])
                }
            }
        }
    }
    // 初始化不存在的需要进行初始化的值
    Object.keys(optDefault).forEach((key) => {
        if (options[key] === undefined) {
            options[key] = optDefault[key]
        }
    })
    // 保存返回
    cacheConfigs = options
    console.log(cacheConfigs)
    return options
}

/**
 * 执行设置项对应的方法
 * @param name 设置项名称
 * @param value 设置项值
 */
export function run(name: string, value: any) {
    if (typeof configFunction[name] === 'function')
        configFunction[name](value)
}

/**
 * 获取设置项值
 * @param name 设置项名称
 * @returns 设置项值（如果没有则为 null）
 */
export function get(name: string): any {
    if(cacheConfigs) {
        const names = Object.keys(cacheConfigs)
        for (let i = 0; i < names.length; i++) {
            if (names[i] === name) {
                return cacheConfigs[names[i]]
            }
        }
    }
    return null
}

/**
 * 从 cookie 中获取原始设置项值
 * @param name 设置项名称
 * @returns 设置项值（如果没有则为 null）
 */
export function getRaw(name: string) {
    // 解析拆分 cookie 并执行各个设置项的初始化方法
    const str: string = app.config.globalProperties.$cookies.get('options')
    if (str != null) {
        const list = str.split('&')
        for (let i = 0; i <= list.length; i++) {
            if (list[i] !== undefined) {
                const opt: string[] = list[i].split(':')
                if (opt.length === 2) {
                    if(name == opt[0]) {
                        return opt[1]
                    }
                }
            }
        }
    }
}

/**
 * 保存设置项
 * @param name 设置项名称
 * @param value 设置项值
 */
export function save(name: string, value: any) {
    cacheConfigs[name] = value
    saveAll()
}
export function saveAll(config = {} as {[key: string]: any}) {
    if(Object.keys(config).length == 0) {
        config = cacheConfigs
    }
    let str = ''
    Object.keys(config).forEach(key => {
        str += key + ':' + encodeURIComponent(config[key]) + '&'
    })
    str = str.substring(0, str.length - 1)
    app.config.globalProperties.$cookies.set('options', str, '1m')
}

/**
 * 保存并触发设置项操作
 * @param name 设置项名称
 * @param value 设置项值
 */
export function runAS(name: string, value: any) {
    save(name, value)
    run(name, value)
}

/**
 * 通过 DOM 事件保存并触发设置项操作
 * @param event DOM 事件
 */
export function runASWEvent(event: Event) {
    const sender = event.target as HTMLElement
    console.log(sender)
    if (sender != null) {
        const type = sender.nodeName
        const name = sender.getAttribute('name')
        let value = null
        switch (type) {
            case 'SELECT': {
                value = (sender as HTMLSelectElement)
                    .options[(sender as HTMLSelectElement).selectedIndex].value
                break
            }
            case 'INPUT': {
                switch ((sender as HTMLInputElement).type) {
                    case 'checkbox': {
                        value = (sender as HTMLInputElement).checked
                        break
                    }
                    case 'radio': {
                        value = sender.dataset.id
                        break
                    }
                    case 'range':
                    case 'number':
                    case 'text': {
                        value = (sender as HTMLInputElement).value
                        break
                    }
                }
                break
            }
        }
        console.log(type + '/' + name + ': ' + value)
        if (name !== null) {
            runAS(name, value)
        }
    }
}

/**
 * 删除设置项
 * @param name 设置项名称
 */
export function remove(name: string) {
    delete cacheConfigs[name]
    saveAll()
}

export default {
    get,
    load,
    save,
    runAS,
    runASWEvent,
    remove
}
