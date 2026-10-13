import { i18n } from '../main'
import VConsole from 'vconsole'

import { IpcRenderer } from '@electron-toolkit/preload'
import { InvokeArgs, InvokeOptions } from '@tauri-apps/api/core'
import { CapacitorGlobal } from '@capacitor/core'
import { Logger, LogType, PopInfo, PopType } from '../function/base'
import { useSettingsStore } from '@renderer/state/settings'

const logger = new Logger()
const popInfo = new PopInfo()

type CapacitorPluginRegistry = Record<string, Record<string, (...args: any[]) => any>>
type BackendListenerHandle = {
    ready: Promise<boolean>
    remove: () => void
}

export const backend = {
    type: 'web' as 'electron' | 'tauri' | 'capacitor' | 'web',
    platform: undefined as 'win32' | 'darwin' | 'linux' | 'android' | 'ios' | 'web' | undefined,
    release: '',
    arch: '' as string | undefined,
    proxy: undefined as number | undefined,

    function: undefined as IpcRenderer |
    {
        invoke: <T>(cmd: string, args?: InvokeArgs, options?: InvokeOptions) => Promise<T>
    } | {
        capacitor: CapacitorGlobal & Record<string, any>,
        plugins: CapacitorPluginRegistry,
        vConsole: VConsole
    } | undefined,
    listener: undefined as ((event: string, ...args: any[]) => any) | undefined,

    isDesktop() {
        return this.type == 'electron' || this.type == 'tauri'
    },
    isMobile() {
        return this.type == 'capacitor'
    },
    isWeb() {
        return this.type == 'web'
    },

    /**
     * 代理 URL 转换
     * @param url 需要转换的 URL
     * @returns 转换后的 URL
     */
    proxyUrl(url: string) {
        if (this.proxy && url && url.startsWith('http')) {
            return `http://localhost:${this.proxy}/proxy?url=${encodeURIComponent(url)}`
        } else {
            return url
        }
    },

    /**
     * 代理图片 URL 转换
     * 此方法在移动端还会会向后端直接索要图片的 base64 数据，以解决移动端的跨域问题
     * @param url 需要转换的 URL
     * @returns 转换后的 URL（移动端返回 data:image/...）
     */
    async proxyImageUrl(url: string) {
        if (this.isMobile() && url) {
            const dataUrl = await this.call('Onebot', 'sys:getImageData', true, { url })
            if (typeof dataUrl === 'string' && dataUrl.startsWith('data:image')) {
                return dataUrl
            }
            logger.add(LogType.DEBUG, '移动端图片代理失败，回退到普通代理 URL', { url })
        }
        return this.proxyUrl(url)
    },

    /**
     * 反代理 URL 转换
     * @param url 需要转换的 URL
     * @returns 转换后的 URL
     */
    unProxyUrl(url: string) {
        if (this.proxy && url && url.startsWith('http://localhost')) {
            const urlObj = new URL(url)
            if (urlObj.pathname == '/proxy') {
                const realUrl = urlObj.searchParams.get('url')
                if (realUrl) {
                    return decodeURIComponent(realUrl)
                }
            }
        }
        return url
    },

    /**
     * 初始化后端功能
     *
     * @returns {Promise<void>}
     */
    async init() {
        const $t = i18n.global.t
        if (window.electron != undefined) {
            this.type = 'electron';
            this.function = window.electron.ipcRenderer;
            this.listener = window.electron.ipcRenderer.on;
        } else if (window.__TAURI_INTERNALS__ != undefined) {
            this.type = 'tauri';
            this.function = {
                invoke: (await import('@tauri-apps/api/core')).invoke
            }
            this.listener = (await import('@tauri-apps/api/event')).listen;
        } else if (window.Capacitor != undefined && window.Capacitor.isNativePlatform()) {
            this.type = 'capacitor';
            const capacitor = window.Capacitor as CapacitorGlobal & Record<string, any>
            const plugins = (capacitor.Plugins ?? {}) as CapacitorPluginRegistry
            this.function = {
                capacitor,
                plugins,
                vConsole: new VConsole({
                    theme: useSettingsStore().darkMode ? 'dark' : 'light',
                })
            }
            this.listener = (type: string, name: string, callBack: (...args: any[]) => void) => {
                plugins[type]?.addListener?.(name, callBack)
            }
        }


        this.platform = await this.call(undefined, 'sys:getPlatform', true)
        const releaseData = await this.call('Onebot', 'sys:getRelease', true)
        this.release = releaseData?.release || ''
        this.arch = releaseData?.arch || undefined

        if(this.type == 'web' && !this.platform) {
            this.platform = 'web'
        }

        if (!this.release) {
            let os = ''
            let version = ''

            // 优先使用 navigator.userAgentData（Chrome / Edge / Android）
            if ((navigator as any).userAgentData) {
                os = (navigator as any).userAgentData.platform || os
                try {
                    const highEntropy = await (navigator as any).userAgentData.getHighEntropyValues(['platformVersion'])
                    version = highEntropy.platformVersion || version
                } catch (e) {
                    // 如果获取失败，保持 Unknown
                }
            } else {
                // fallback: 使用 navigator.userAgent
                const ua = navigator.userAgent

                if (/Windows NT (\d+\.\d+)/.test(ua)) {
                    os = 'Windows'
                    version = ua.match(/Windows NT (\d+\.\d+)/)?.[1] ?? 'Unknown'
                } else if (/Mac OS X (\d+[_.]\d+[_.]?\d*)/.test(ua)) {
                    os = 'macOS'
                    version = ua.match(/Mac OS X (\d+[_.]\d+[_.]?\d*)/)?.[1]?.replace(/_/g, '.') ?? 'Unknown'
                } else if (/Android (\d+(\.\d+)?)/.test(ua)) {
                    os = 'Android'
                    version = ua.match(/Android (\d+(\.\d+)?)/)?.[1] ?? 'Unknown'
                } else if (/iPhone OS (\d+[_.]\d+[_.]?\d*)/.test(ua)) {
                    os = 'iOS'
                    version = ua.match(/iPhone OS (\d+[_.]\d+[_.]?\d*)/)?.[1]?.replace(/_/g, '.') ?? 'Unknown'
                } else if (/Linux/.test(ua)) {
                    os = 'Linux'
                    version = 'Unknown'
                }
            }
            this.release = `${os} ${version} (Web)`
        }
        this.proxy  = await this.call(undefined, 'sys:runProxy', true)
        if(this.type == 'tauri' && !this.proxy) {
            logger.error(null, 'Tauri 代理服务似乎没有正常启动，此服务异常将会影响应用内的大部分外部资源的加载。')
            popInfo.add(PopType.ERR, $t('Tauri 代理服务似乎没有正常启动'), false)
        }
    },

    /**
     * 调用后端方法
     *
     * #### 方法名称
     * 请使用统一的 electron 方法名称，其余平台会自动转换
     * - electron 将调用 sys: 前缀的名称如 > sys:getConfig
     * - capacitor 将调用去除 sys: 前缀的名称如 > getConfig
     * - tauri 将调用 sys_ 前缀加下划线小写的名称如 > sys_get_config
     *
     * #### 备注
     * - 在 capacitor 和 tauri 中。args 必须是一个对象，如果你传递了其他类型的参数，此方法会自行转换为 ```{data: args[0]}```; 请在后端获取 data 在进行处理。
     * - capacitor 的返回也必须是一个对象，此方法会主动将有且只有一个参数的返回值拆出来，不用特别在意获取。
     * - 返回值如有大多为 Promise（在 electron 中一定是），请使用 async/await 调用。
     *
     * ---
     *
     * @param type capacitor：插件名
     * @param name 方法名称
     * @param needBack electron：是否需要返回值
     * @param args 参数列表
     * @returns 返回值
     */
    async call(type: string | undefined, name: string, needBack: boolean, ...args: any[]) {
        if (this.function) {
            // 处理名称
            if (this.type == 'tauri') {
                name = name.replaceAll(':', '_').replace(/([A-Z])/g, '_$1').toLowerCase()
            }
            if (this.type == 'capacitor' && name.includes(':')) {
                name = name.split(':')[1]
            }
            // 调用对应方法
            try {
                if ('electron' == this.type && 'invoke' in this.function && 'send' in this.function) {
                    if (needBack) {
                        return await this.function.invoke(name, ...args)
                    } else {
                        this.function.send(name, ...args)
                        return undefined
                    }
                } else if ('tauri' == this.type && 'invoke' in this.function) {
                    // tauri 这边必须传入一个字典
                    if (args.length == 0 || Object.prototype.toString.call(args[0]) !== '[object Object]') {
                        args = [{ data: args[0] }]
                    }
                    return await this.function.invoke(name, args[0])
                } else if ('capacitor' == this.type && 'plugins' in this.function && 'capacitor' in this.function) {
                    // capacitor 这边必须传入一个字典
                    if (args.length == 0 || Object.prototype.toString.call(args[0]) !== '[object Object]') {
                        args = [{ data: args[0] }]
                    }
                    let functionGet = this.function.capacitor[name]
                    if (type != undefined && functionGet == undefined) {
                        functionGet = this.function.plugins[type][name] ?? this.function.capacitor[type][name]
                    }
                    const back = await functionGet(args[0])
                    if (Object.prototype.toString.call(back) === '[object Object]' && Object.keys(back).length == 1) {
                        return back[Object.keys(back)[0]]
                    } else {
                        return back
                    }
                }
            } catch (ex) {
                logger.add(LogType.DEBUG, `调用后端方法 ${(type ?? '') + ' - '}${name} 失败`, ex)
                return undefined
            }
        }
    },

    /**
     * 调用后端方法（同步）
     *
     * #### 注意：此方法目前只支持 electron 平台
     *
     * @param name 方法名称
     */
    callSync(name: string, ...args: any[]) {
        if (this.type == 'electron' && this.function && 'sendSync' in this.function) {
            return this.function.sendSync(name, ...args)
        } else {
            logger.add(LogType.ERR, '调用后端方法失败', new Error('此方法只支持 electron 平台'))
            return undefined
        }
    },

    /**
     * 添加后端监听，名称统一为 sys: 前缀
     * @param type capacitor：插件类型
     * @param name 事件名称
     * @param callBack 回调函数
     */
    addListener(
        type: string | undefined,
        name: string,
        callBack: (...args: any[]) => void,
    ): BackendListenerHandle {
        if(this.listener) {
            if(this.type === 'electron') {
                this.listener(name, callBack)
                return {
                    ready: Promise.resolve(true),
                    remove: () => this.removeListener(type, name, callBack),
                }
            } else if(this.type === 'tauri') {
                let active = true
                let unlisten: (() => void) | undefined
                const listenResult = this.listener(name, callBack)
                const ready = Promise.resolve(listenResult)
                    .then((callback) => {
                        if (typeof callback !== 'function') return false
                        if (active) {
                            unlisten = callback
                        } else {
                            callback()
                        }
                        return true
                    })
                    .catch((error) => {
                        logger.error(error as Error, `添加后端监听失败：${name}(${type})`)
                        return false
                    })
                return {
                    ready,
                    remove: () => {
                        active = false
                        unlisten?.()
                        unlisten = undefined
                    },
                }
            } else if(this.isMobile() && type) {
                this.listener(type, name, callBack)
                return {
                    ready: Promise.resolve(true),
                    remove: () => undefined,
                }
            }
        }
        logger.error(null, `添加后端监听失败：${name}(${type})`)
        return {
            ready: Promise.resolve(false),
            remove: () => undefined,
        }
    },

    /**
     * 移除后端监听
     * @param type capacitor：插件类型
     * @param name 事件名称
     * @param callBack 要移除的回调函数
     */
    removeListener(_type: string | undefined, name: string, callBack: (...args: any[]) => void) {
        if(this.isDesktop() && this.function && 'removeListener' in this.function) {
            this.function.removeListener(name, callBack)
            return
        }
        // Capacitor 和 Web 不支持移除监听
    },
}
