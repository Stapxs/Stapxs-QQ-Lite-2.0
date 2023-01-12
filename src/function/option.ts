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

import { i18n } from '@/main'
import { markRaw, defineAsyncComponent } from 'vue'
import { runtimeData } from './msg'
import { initUITest } from './util'

let cacheConfigs: { [key: string]: any }

// 下拉菜单设置项的初始值，防止选项为空
const optDefault: { [key: string]: any } = {
    language: 'zh-CN',
    log_level: 'err',
    open_ga_bot: true
}

// =============== 设置项事件 ===============

const configFunction: { [key: string]: (value: any) => void } = {
    language: setLanguage,
    opt_dark: setDarkMode,
    theme_color: changeTheme,
    ui_test: changeUiTest,
    chatview_name: changeChatView
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
 * 加载语言文件并设置为当前的语言
 * @param name 语言文件名（不是实际语言代码）
 */
function setLanguage(name: string) {
    import(`../assets/l10n/${name}.json`).then(lang => {
        i18n.global.setLocaleMessage(name, lang)
    })
    app.config.globalProperties.$i18n.locale = name
    const htmlBody = document.querySelector('html')
    if (htmlBody !== null) {
        htmlBody.setAttribute('lang', name)
    }
}

/**
 * 设置暗黑模式
 * @param value 是否启用暗黑模式
 */
function setDarkMode(value: boolean) {
    // if (get('opt_auto_dark') === 'null' || !get('opt_auto_dark')) {
        if (value === true) {
            changeColorMode('dark')
        } else {
            changeColorMode('light')
        }
    // }
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
}

/**
 * 设置主题色
 * @param id 主题色编号
 */
function changeTheme(id: number) {
    document.documentElement.style.setProperty('--color-main', 'var(--color-main-' + id + ')')
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
                        options[opt[0]] = opt[1]
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
    const names = Object.keys(cacheConfigs)
    for (let i = 0; i < names.length; i++) {
        if (names[i] === name) {
            return cacheConfigs[names[i]]
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
function saveAll() {
    let str = ''
    Object.keys(cacheConfigs).forEach(key => {
        str += key + ':' + cacheConfigs[key] + '&'
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
