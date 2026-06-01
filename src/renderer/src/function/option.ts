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
import { markRaw, defineAsyncComponent, reactive } from 'vue'
import { Logger, LogType, PopInfo, PopType } from './base'
import { useSettingsStore } from '@renderer/state/settings'
import { useUIStore } from '@renderer/state/ui'
import { useChatStore } from '@renderer/state/chat'
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
import { refreshFavicon } from './favicon'

let cacheConfigs: { [key: string]: any }

// =============== 附加设置结构 ===============

export type ExtraOptionItemType = 'switch' | 'select' | 'input'| 'password' | 'button'

export interface ExtraOptionItem {
    id: string
    label: string
    description?: string
    type: ExtraOptionItemType
    icon?: string | [string, string]
    /**
     * 绑定到配置中的键名；如需持久化并参与 Option.save / load，请提供。
     */
    optionKey?: string
    defaultValue?: any
    /**
     * 选项列表（仅 select 使用）
     */
    options?: { value: string | number | boolean; label: string }[]
    callback?: (value: any) => void
}

export interface ExtraOptionCard {
    id: string
    title: string
    description?: string
    items: ExtraOptionItem[]
}

/**
 * 附加设置卡片列表：供外部模块动态注册并在“附加”标签页中展示。
 */
export const extraOptionCards = reactive<ExtraOptionCard[]>([])

// 设置项的初始值，防止下拉菜单选项为空或者首次使用初始错误
export const optDefault: { [key: string]: any } = {
    // System
    address: '',
    top_info: {},
    save_password: '',
    notice_group: {},
    auto_connect: false,
    local_emoji_folder: null,
    connection_history: [],
    // View
    language: 'zh-CN',
    opt_dark: false,
    opt_auto_dark: true,
    theme_color: 0,
    opt_auto_win_color: false,
    chat_background: '',
    chat_background_blur: 0,
    chat_background_align: 'center',
    chat_background_fit: 'cover',
    chatview_name: '',
    opt_fast_animation: false,
    chat_more_blur: false,
    glass_effect: false,
    initial_scale: 0.85,
    fs_adaptation: 0,
    opt_always_top: false,
    opt_revolve: false,
    use_favicon_notice: true,
    use_super_face: true,
    opt_ind_message: false,
    // Function
    close_notice: false,
    bubble_sort_user: true,
    show_all_sessions: false,
    close_respond: false,
    msg_taill: '',
    quick_send: 'default',
    group_notice_type: 'none',
    send_face: false,
    use_breakline: true,
    send_key: 'none',
    close_ga: false,
    open_ga_bot: true,
    record_recent_emoji: '100times' as 'none' | 'order' | '100times' | '500times',
    enable_local_history: false,
    mixed_load_messages: false,
    disable_local_history_image_cache: false,
    // Dev
    msg_type: 2,
    log_level: 'err',
    debug_msg: false,
    custom_css: '',
    // Glagame
    openai_api: '',
    openai_token: '',
    openai_model: '',
    glagame_max_tokens: 1000000,
    glagame_favorability: false,
    glagame_prompt: `你是一个对话辅助助手，你将根据历史的对话内容生成可供玩家可以选择用来直接回复的内容。

- 玩家默认是温和、体贴、日常向、有点小俏皮。
- **不要**为玩家本人的消息生成回复，玩家本人的消息仅供上下文参考。
- 若对话之间时间相隔较久，可自然应对（如"刚看到消息"）。
- 避免引入与对话无关的新背景。

对话记录中含有玩家本人的消息，请根据提供的当前账号信息自行区分，可以适当模仿玩家的语言风格。`,
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
    show_all_sessions: clearGroupAssist,
    use_favicon_notice: setFaviconNotice,
    custom_css: injectCustomCss,
    opt_ind_message: updateChatPan
}

// =============== 附加设置注册接口 ===============

/**
 * 注册一个新的附加设置卡片。
 * 如果 id 已存在，则仅更新标题/描述并返回原有卡片。
 */
export function registerExtraOptionCard(card: {
    id: string
    title: string
    description?: string
}): ExtraOptionCard {
    const exist = extraOptionCards.find((c) => c.id === card.id)
    if (exist) {
        exist.title = card.title
        exist.description = card.description
        return exist
    }
    const created: ExtraOptionCard = {
        id: card.id,
        title: card.title,
        description: card.description,
        items: [],
    }
    extraOptionCards.push(created)
    return created
}

/**
 * 向指定附加设置卡片中注册一项设置。
 * 如果目标卡片不存在，将以 id 作为标题自动创建。
 *
 * - 提供 optionKey + defaultValue 时，会自动写入 optDefault，
 *   并在当前配置中缺失时填充与保存，确保后续加载不会被清理。
 */
export function registerExtraOptionItem(cardId: string, item: ExtraOptionItem) {
    if (!cardId || !item || !item.id) return

    let card = extraOptionCards.find((c) => c.id === cardId)
    if (!card) {
        card = {
            id: cardId,
            title: cardId,
            items: [],
        }
        extraOptionCards.push(card)
    }

    // 去重：相同 id 直接替换
    const existIndex = card.items.findIndex((i) => i.id === item.id)
    if (existIndex >= 0) {
        card.items.splice(existIndex, 1, item)
    } else {
        card.items.push(item)
    }

    // 如需持久化，补充默认值并保存
    if (item.optionKey) {
        const key = item.optionKey
        if (Object.prototype.hasOwnProperty.call(item, 'defaultValue')) {
            if (optDefault[key] === undefined) {
                optDefault[key] = item.defaultValue
            }
            if (cacheConfigs && cacheConfigs[key] === undefined) {
                cacheConfigs[key] = item.defaultValue
                saveAll()
            }
        }
    }
}

function updateChatPan() {
    const uiStore = useUIStore()
    const chatStore = useChatStore()
    chatStore.chatInfo.show.id = 0
    uiStore.openSideBar = true
}


function setFaviconNotice(_: boolean) {
    refreshFavicon()
}

function injectCustomCss(value: string) {
    // 移除旧的自定义 CSS
    const oldStyle = document.getElementById('custom-css-inject')
    if (oldStyle) {
        document.head.removeChild(oldStyle)
    }

    // 如果有新的 CSS 内容，注入它
    if (value && value.trim() !== '') {
        const style = document.createElement('style')
        style.id = 'custom-css-inject'
        style.textContent = value
        document.head.appendChild(style)
        new Logger().add(LogType.UI, '已注入自定义 CSS')
    }
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
            updateWinColor(params, backend.platform == 'win32' ? 'windows' : 'macos')
        })
        loadWinColor()
    }
}

function setMsgType(value: any) {
    if (value) {
        const uiStore = useUIStore()
        uiStore.msgType = Number(value)
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
    const settingsStore = useSettingsStore()
    if (!settingsStore.firstLoad) {
        // 启用颜色渐变动画
        document.body.style.transition =
            'background, color, background-color .3s'
    } else {
        settingsStore.firstLoad = false
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
    // 如果主题色模式是自定，则刷新系统主题色
    getRaw('theme_color').then((themeColor) => {
        if(themeColor && themeColor > 10) {
            const colorUpdate = ('000000' + Number(themeColor).toString(16)).slice(-6)
            updateWinColor(colorUpdate, 'windows')
        }
    })
    // 刷新页面主题色
    const meta = document.getElementsByName('theme-color')[0]
    if (meta) {
        (meta as HTMLMetaElement).content = getComputedStyle(
            document.documentElement,
        ).getPropertyValue('--color-main')
    }
    // 记录
    settingsStore.darkMode = mode === 'dark'
    // Capacitor: 状态栏颜色（Android）
    if(backend.isMobile()) {
        backend.call('StatusBar', 'setStyle', false, { style: mode.toUpperCase() })
    }
    // Capacitor: VConsole 颜色
    if(backend.function && 'vConsole' in backend.function && backend.function.vConsole) {
        backend.function.vConsole.setOption('theme', mode)
    }
    // 刷新图标
    refreshFavicon()
}

/**
 * 设置主题色
 * @param id 主题色编号
 */
function changeTheme(id: number) {
    if(id < 10) {
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
    } else {
        const color = ('000000' + Number(id).toString(16)).slice(-6)
        updateWinColor(color, 'windows')
    }
    // 避免 css 未加载完
    setTimeout(refreshFavicon, 10)
}

/**
 * 切换聊天面板
 * @param name 文件名
 */
function changeChatView(name: string | undefined) {
    const uiStore = useUIStore()
    const safeName = (name || '').toString().replaceAll(/(^['"])|(['"]$)/g, '').trim()
    if (safeName) {
        uiStore.pageView.chatView = markRaw(
            defineAsyncComponent(
                () => import(`@renderer/pages/chat-view/${safeName}.vue`),
            ),
        )
    } else {
        uiStore.pageView.chatView = markRaw(
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
            try {
                options[key] = decodeURIComponent(value)
            } catch (e: unknown) {
                // 如果 decodeURIComponent 失败（比如 CSS 内容有特殊字符），直接使用原值
                options[key] = value
            }
            try {
                const result = JSON.parse(options[key])
                if (typeof result === 'object' && result !== null) {
                    options[key] = result
                }
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
        return backend.call('opt:get', name, true)
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
                            return Promise.resolve(opt[1])
                        }
                    }
                }
            }
        }
        return Promise.resolve(null)
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
                    case 'color':
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

        const uiStore = useUIStore()
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
                        uiStore.popBoxList.shift()
                    },
                },
            ],
        }
        uiStore.popBoxList.push(popInfo)
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
    const settingsStore = useSettingsStore()
    return (settingsStore.sysConfig[name] == undefined ||
        settingsStore.sysConfig[name] == optDefault[name]) ? '' : 'changed'
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
    extraOptionCards,
    registerExtraOptionCard,
    registerExtraOptionItem,
}
