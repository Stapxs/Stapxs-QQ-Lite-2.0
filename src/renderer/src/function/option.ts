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

import app from '@renderer/main'
import languageConfig from '@renderer/assets/l10n/_l10nconfig.json'

import { i18n } from '@renderer/main'
import { markRaw, defineAsyncComponent } from 'vue'
import { Logger, LogType, PopInfo, PopType } from './base'
import { runtimeData } from './msg'
import {
    loadWinColor,
    sendStatEvent,
    updateWinColor,
} from '@renderer/function/utils/appUtil'
import {
    getPortableFileLang,
    getTrueLang,
} from '@renderer/function/utils/systemUtil'
import { updateBaseOnMsgList } from './utils/msgUtil'
import { backend } from '@renderer/runtime/backend'

let cacheConfigs: { [key: string]: any }

// 设置项的初始值，防止下拉菜单选项为空或者首次使用初始错误
export const optDefault: { [key: string]: any } = {
    // System
    address: '',
    top_info: {},
    save_password: '',
    notice_group: {},
    auto_connect: false,
    // View
    language: 'zh-CN',
    opt_dark: false,
    opt_auto_dark: true,
    theme_color: 0,
    opt_auto_win_color: false,
    chat_background: '',
    chat_background_blur: 0,
    chatview_name: '',
    opt_fast_animation: false,
    initial_scale: 0.85,
    fs_adaptation: 0,
    opt_always_top: false,
    opt_revolve: false,
    merge_forward_width_type: false,
    // Function
    close_notice: false,
    bubble_sort_user: true,
    close_chat_pic_pan: false,
    close_respond: false,
    msg_taill: '',
    quick_send: 'default',
    group_notice_type: 'none',
    send_face: false,
    use_breakline: false,
    close_browser: false,
    close_ga: false,
    open_ga_bot: true,
    dont_parse_delete: false,
    // Dev
    msg_type: 2,
    log_level: 'err',
    debug_msg: false,
}

// =============== 设置项事件 ===============

const configFunction: { [key: string]: (value: any) => void } = {
    language: setLanguage,
    opt_dark: setDarkMode,
    opt_auto_dark: setAutoDark,
    theme_color: changeTheme,
    chatview_name: changeChatView,
    initial_scale: changeInitialScale,
    msg_type: setMsgType,
    opt_auto_win_color: updateWinColorOpt,
    opt_revolve: viewRevolve,
    opt_always_top: viewAlwaysTop,
    opt_fast_animation: updateFarstAnimation,
    bubble_sort_user: clearGroupAssist,
    merge_forward_width_type: setMergeForwardWidth,
}

function setMergeForwardWidth(value: boolean | null) {
    if (value === null) {
        value = false
    }
    let css: string
    if (value) {
        css = '17rem'
    } else {
        css = 'auto'
    }
    document.documentElement.style.setProperty(
        '--merge-forward-width',
        css,
    )
}

function clearGroupAssist() {
    updateBaseOnMsgList()
}

function updateFarstAnimation(value: boolean) {
    if(value) {
        // 创建 <style> 元素
        const style = document.createElement('style')
        style.textContent = `* {
            transition: .1s !important;
        }`
        style.id = 'disable-transitions'
        document.head.appendChild(style)
    } else {
        const style = document.getElementById('disable-transitions')
        if(style) {
            document.head.removeChild(style)
        }
    }
}

function viewAlwaysTop(value: boolean) {
    backend.call(undefined, 'win:alwaysTop', false, value)
}

function viewRevolve(value: boolean) {
    const baseApp = document.getElementById('base-app')
    if (baseApp && value) {
        if (baseApp.classList.contains('no-touch')) {
            baseApp.classList.remove('no-touch')
            // 把这个选项设置为 false
            save('opt_revolve', false)
        } else {
            baseApp.classList.add('no-touch')
            sendStatEvent('click_statistics', { name: 'touch_randomly' })
        }
    }
}

function updateWinColorOpt(value: boolean) {
    if (value == true) {
        backend.addListener(undefined, 'sys:WinColorChanged', (_, params) => {
            updateWinColor(params)
        })
        loadWinColor()
    }
}

function setMsgType(value: any) {
    if (value) {
        runtimeData.tags.msgType = Number(value)
    }
}

/**
 * 修改移动端缩放比例
 * @param value 数值（0.5 - 1.5）
 */
function changeInitialScale(value: number) {
    const viewport = document.getElementById('viewport')
    if (viewport && value && value >= 0.5 && value <= 1.5) {
        (viewport as any).content =
            `width=device-width, initial-scale=${value}, maximum-scale=5, user-scalable=0`
    } else {
        (viewport as any).content =
            'width=device-width, initial-scale=0.85, maximum-scale=5, user-scalable=0'
    }
}

/**
 * 加载语言文件并设置为当前的语言
 * @param name 语言文件名（不是实际语言代码）
 */
function setLanguage(name: string) {
    // 加载语言文件
    const lang = getPortableFileLang(name)
    i18n.global.setLocaleMessage(name, lang)
    app.config.globalProperties.$i18n.locale = name
    // 检查是否设置了备选语言
    let get = false
    for (let i = 0; i < languageConfig.length; i++) {
        if (
            languageConfig[i].value == name &&
            (languageConfig[i] as any).fallback
        ) {
            const fbname = (languageConfig[i] as any).fallback
            const fbLang = getPortableFileLang(fbname)
            i18n.global.setLocaleMessage(fbname, fbLang)
            get = true
            app.config.globalProperties.$i18n.fallbackLocale = fbname
            break
        }
    }
    if (!get) {
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
    if (value == true) {
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
                    new Logger().add(
                        LogType.UI,
                        '正在自动切换颜色模式为：' + prefersDarkMode,
                    )
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
        if (opt) opt.style.display = 'none'
    } else {
        if (opt) opt.style.display = 'flex'
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
        document.body.style.transition =
            '0.3s'
    } else {
        runtimeData.tags.firstLoad = false
    }
    // 切换颜色
    const match_list = ['color-.*.css', 'prism-.*.css', 'append-.*.css']
    const css_list = document.getElementsByTagName('link')
    for (let i = 0; i < css_list.length; i++) {
        const name = css_list[i].href
        match_list.forEach((value) => {
            if (name.match(value) != null) {
                // 检查切换的文件是否可以被访问到
                if (name != undefined) {
                    let newName = name
                    if (name.indexOf('dark') > -1) {
                        newName = name.replace('dark', 'light')
                    } else {
                        newName = name.replace('light', 'dark')
                    }
                    const xhr = new XMLHttpRequest()
                    xhr.open('HEAD', newName, false)
                    xhr.send()
                    if (xhr.status != 200) {
                        // 无法访问到对应的颜色模式文件，放弃切换
                        new PopInfo().add(
                            PopType.ERR,
                            '无法切换颜色模式：访问颜色模式文件失败。',
                        )
                        return
                    }
                }
                const newLink = document.createElement('link')
                newLink.setAttribute('rel', 'stylesheet')
                newLink.setAttribute('type', 'text/css')
                if (mode === 'dark') {
                    newLink.setAttribute('href', name.replace('light', 'dark'))
                } else {
                    newLink.setAttribute('href', name.replace('dark', 'light'))
                }
                const head = document.getElementsByTagName('head').item(0)
                if (head !== null) {
                    head.replaceChild(newLink, css_list[i])
                }
            }
        })
    }
    // 刷新页面主题色
    const meta = document.getElementsByName('theme-color')[0]
    if (meta) {
        (meta as HTMLMetaElement).content = getComputedStyle(
            document.documentElement,
        ).getPropertyValue('--color-main')
    }
    // 记录
    runtimeData.tags.darkMode = mode === 'dark'
    // Capacitor: 状态栏颜色（Android）
    if(backend.isMobile()) {
        backend.call('StatusBar', 'setStyle', false, { style: mode.toUpperCase() })
    }
    // Capacitor: VConsole 颜色
    if(backend.function && 'vConsole' in backend.function && backend.function.vConsole) {
        backend.function.vConsole.setOption('theme', mode)
    }
}

/**
 * 设置主题色
 * @param id 主题色编号
 */
function changeTheme(id: number) {
    document.documentElement.style.setProperty(
        '--color-main',
        'var(--color-main-' + id + ')',
    )
    const meta = document.getElementsByName('theme-color')[0]
    if (meta) {
        (meta as HTMLMetaElement).content = getComputedStyle(
            document.documentElement,
        ).getPropertyValue('--color-main-' + id)
    }
}

/**
 * 切换聊天面板
 * @param name 文件名
 */
function changeChatView(name: string | undefined) {
    if (name && name != '') {
        runtimeData.pageView.chatView = markRaw(
            defineAsyncComponent(
                () => import(`@renderer/pages/chat-view/${name}.vue`),
            ),
        )
    } else {
        runtimeData.pageView.chatView = markRaw(
            defineAsyncComponent(() => import('@renderer/pages/Chat.vue')),
        )
    }
}

// =============== 设置基础功能 ===============

/**
 * 读取并序列化 localStorage 中的设置项（electron 读取 electron-store 存储）
 * @returns 设置项集合
 */
export async function load(): Promise<{ [key: string]: any }> {
    let data = {} as { [key: string]: any }

    if ('electron' == backend.type) {
        data = backend.callSync('opt:getAll')
    } else if('tauri' == backend.type) {
        data = await backend.call(undefined, 'opt:getAll', true)
        // 处理下 json 字符串
        Object.keys(data).forEach((key) => {
            const value = data[key]
            if (typeof value == 'string') {
                try {
                    data[key] = JSON.parse(value)
                } catch (e: unknown) {
                    // ignore
                }
            }
        })
    } else {
        const str = localStorage.getItem('options')
        if (str != null) {
            const list = str.split('&')
            for (let i = 0; i <= list.length; i++) {
                if (list[i] !== undefined) {
                    const opt: string[] = list[i].split(':')
                    if (opt.length === 2) {
                        data[opt[0]] = opt[1]
                    }
                }
            }
        }
    }
    return loadOptData(data)
}

function loadOptData(data: { [key: string]: any }) {
    const options: { [key: string]: any } = {}
    Object.keys(data).forEach((key) => {
        const value = data[key]
        if (value === 'true' || value === 'false') {
            options[key] = value === 'true'
        } else if (value === 'null') {
            options[key] = null
        } else if (typeof value == 'string') {
            options[key] = decodeURIComponent(value)
            try {
                options[key] = JSON.parse(options[key])
            } catch (e: unknown) {
                // ignore
            }
        } else {
            options[key] = value
        }
        // 执行设置项操作
        run(key, options[key])
    })
    let optChanged = false
    // 初始化不存在的需要进行初始化的值
    Object.keys(optDefault).forEach((key) => {
        if (options[key] === undefined) {
            optChanged = true
            options[key] = optDefault[key]
        }
    })
    // 删除不存在的设置项
	const needless: string[] = []
	for (const key in options) {
		if (optDefault[key] === undefined)
			needless.push(key)
	}
    if (!import.meta.env.DEV){
        for (const key of needless) {
			delete options[key]
		}
    }else if (needless.length > 0) {
		new PopInfo().add(
			PopType.INFO,
			'发现' + needless.length + '条未使用的配置属性',
			false,
		)
	}
    
    // 保存
    if (optChanged) {
        saveAll(options)
    }
    // 保存返回
    cacheConfigs = options
    return options
}

/**
 * 执行设置项对应的方法
 * @param name 设置项名称
 * @param value 设置项值
 */
export function run(name: string, value: any) {
    if (typeof configFunction[name] === 'function') configFunction[name](value)
}

/**
 * 获取设置项值
 * @param name 设置项名称
 * @returns 设置项值（如果没有则为 null）
 */
export function get(name: string): any {
    if (cacheConfigs) {
        const names = Object.keys(cacheConfigs)
        for (let i = 0; i < names.length; i++) {
            if (names[i] === name) {
                const get = cacheConfigs[names[i]]
                try {
                    return JSON.parse(get)
                } catch (e: unknown) {
                    return get
                }
            }
        }
    }
    return null
}

/**
 * 获取原始设置项值
 * @param name 设置项名称
 * @returns 设置项值（如果没有则为 null）
 * @description <strong>注意：</strong>
 * 此方法获取原始设置项值，不会对值进行 T/F 转换、JSON 解析、URL 解码等操作；
 * 在 Web 端和 Capacitor 端使用时由于存储在 WebStorage 中，需要特别注意预防上述未转换导致的错误。
 */
export function getRaw(name: string) {
    if ('electron' == backend.type) {
        return backend.callSync('opt:get', name)
    } else if('tauri' == backend.type) {
        return backend.call(undefined, 'opt:get', true, name)
    } else {
        // 解析拆分并执行各个设置项的初始化方法
        const str = localStorage.getItem('options')
        if (str != null) {
            const list = str.split('&')
            for (let i = 0; i <= list.length; i++) {
                if (list[i] !== undefined) {
                    const opt: string[] = list[i].split(':')
                    if (opt.length === 2) {
                        if (name == opt[0]) {
                            return opt[1]
                        }
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
export function saveAll(config = {} as { [key: string]: any }) {
    if (Object.keys(config).length == 0) {
        Object.assign(config, cacheConfigs)
    }
    let str = ''
    Object.keys(config).forEach((key) => {
        const isObject = typeof config[key] == 'object'
        str +=
            key +
            ':' +
            encodeURIComponent(
                isObject ? JSON.stringify(config[key]) : config[key],
            ) +
            '&'
    })
    str = str.substring(0, str.length - 1)
    localStorage.setItem('options', str)

    // electron：将配置保存
    if (backend.isDesktop()) {
        const saveConfig = config
        Object.keys(config).forEach((key) => {
            const isObject = typeof config[key] == 'object'
            saveConfig[key] = isObject ? JSON.stringify(config[key]): config[key]
        })
        backend.call(undefined, 'opt:saveAll', false,
            backend.type == 'tauri' ? { data: saveConfig } : saveConfig)
    }
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
    if (sender != null) {
        const type = sender.nodeName
        const name = sender.getAttribute('name')
        let value = null as any
        switch (type) {
            case 'SELECT': {
                value = (sender as HTMLSelectElement).options[
                    (sender as HTMLSelectElement).selectedIndex
                ].value
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
        if (name !== null) {
            runAS(name, value)
        }
    }
    // 有些设置项需要重启/刷新
    if (sender.dataset.reload == 'true') {
        const { $t } = app.config.globalProperties
        const html =
            '<span>' +
            $t('此操作将在重启应用后生效，现在就要重启吗？') +
            '</span>'

        const popInfo = {
            svg: 'trash-arrow-up',
            html: html,
            title: $t('重启应用'),
            button: [
                {
                    text: app.config.globalProperties.$t('确定'),
                    fun: () => {
                        if (backend.isDesktop()) {
                            backend.call(undefined, 'win:relaunch', false)
                        } else {
                            location.reload()
                        }
                    },
                },
                {
                    text: app.config.globalProperties.$t('取消'),
                    master: true,
                    fun: () => {
                        runtimeData.popBoxList.shift()
                    },
                },
            ],
        }
        runtimeData.popBoxList.push(popInfo)
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

// ================ 工具方法 ================
export function checkDefault(name: string) {
    return (runtimeData.sysConfig[name] == undefined ||
        runtimeData.sysConfig[name] == optDefault[name]) ? '' : 'changed'
}

export default {
    get,
    getRaw,
    load,
    save,
    run,
    runAS,
    runASWEvent,
    remove,
    checkDefault,
}
