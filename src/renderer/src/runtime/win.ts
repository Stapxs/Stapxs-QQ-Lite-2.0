import { Logger } from '@renderer/function/base'
import { backend } from './backend'
import { shallowRef, computed, watchEffect, ComputedRef } from 'vue'
import horizontalCss from '@renderer/assets/css/append/mobile/append_mobile_horizontal.css?raw'
import verticalCss from '@renderer/assets/css/append/mobile/append_mobile_vertical.css?raw'
import option from '@renderer/function/option'

export type WinAction = 'maximize' | 'minimize' | 'unmaximize' | 'close'

const win = {
    _isTiling: shallowRef(false),
    _isMaximized: shallowRef(false),
    _needBar: undefined as any as ComputedRef<boolean>,
    _needMargin: undefined as any as ComputedRef<boolean>,

    /**
     * 初始化
     */
    async init() {
        const logger = new Logger()

        // computed 初始化
        this._needBar = computed(()=>{
            if (backend.isWeb()) return false
            return !win.tiling
        })
        this._needMargin = computed(()=>{
            if (backend.isWeb()) return false
            if (win.tiling) return false
            return !win.maximized
        })

        if (backend.platform === 'linux')
            win.tiling = await backend.call(undefined, 'win:isTiling', true)
        // 最大化检测
        backend.addListener(undefined, 'win:maximizedChanged',
            (_, data) => win.maximized = data
        )
		win.maximized = await backend.call(undefined, 'win:isMaximized', true)
        // 添加样式
        await this.loadAppendStyle()
        watchEffect(()=>{
            if (win.margin)
                document.body.classList.add('margin')
            else
                document.body.classList.remove('margin')

            if (win.withBar)
                document.body.classList.add('with-bar')
            else
                document.body.classList.remove('with-bar')
        })
        // 安全区域规划
        document.body.style.setProperty('--safe-area-bottom',
            (option.get('fs_adaptation') > 0 ? option.get('fs_adaptation') : 0) + 'px')
        document.body.style.setProperty('--safe-area-top', '0')
        document.body.style.setProperty('--safe-area-left', '0')
        document.body.style.setProperty('--safe-area-right', '0')
        // Capacitor：移动端初始化安全区域
        if (backend.isMobile()) {
            const safeArea = await backend.call('SafeArea', 'getSafeArea', true)
            if (safeArea) {
                logger.debug('安全区域：', safeArea)
                document.body.style.setProperty('--safe-area-top', safeArea.top + 'px')
                document.body.style.setProperty('--safe-area-bottom', safeArea.bottom + 'px')
                document.body.style.setProperty('--safe-area-left', safeArea.left + 'px')
                document.body.style.setProperty('--safe-area-right', safeArea.right + 'px')
            }
        }
    },

    /**
     * 窗口最小化
     */
    minimize() {
        this.control('minimize')
    },

    /**
     * 切换最大化
     */
    switchMaximize() {
        this.control(this.maximized ? 'unmaximize' : 'maximize')
    },

    /**
     * 关闭窗口
     */
    close() {
        this.control('close')
    },

    /**
     * 操控窗口
     * @param action
     */
    control(action: WinAction) {
        backend.call(undefined, `win:${action}`, false)
    },

    async loadAppendStyle() {
        const platform = backend.platform
        const logger = new Logger()
        logger.info('正在装载补充样式……')
        // UI 2.0 附加样式
        if (backend.isDesktop()) {
            await import('@renderer/assets/css/append/append_new.css')
            logger.info('UI 2.0 附加样式加载完成')
        }

        if(platform != undefined) {
            try {
                await import(`@renderer/assets/css/append/append_${platform}.css`)
                logger.info(`${platform} 平台附加样式加载完成`)
            } catch (error) {
                logger.info('未找到对应平台的附加样式：' + platform)
            }
        }

        // 添加手机端样式
        const updateCss = (appendCss = '') => {
            const cssStype = document.getElementById('mobile-css')

            const width = window.innerWidth
            const height = window.innerHeight
            if(cssStype) {
                if(width > 600) {
                    cssStype.innerHTML = (width > height ? horizontalCss : (horizontalCss + verticalCss)) + appendCss
                } else {
                    cssStype.innerHTML = horizontalCss + verticalCss + appendCss
                }
            }

            if(backend.isDesktop()) {
                backend.call(undefined, 'win:maximize', false)
                const topBar = document.getElementsByClassName('top-bar')[0] as HTMLElement
                if(topBar) {
                    topBar.style.display = 'none'
                }
            }
        }
        if(backend.isMobile()) {
            const styleTag = document.createElement('style')
            styleTag.id = 'mobile-css'
            document.head.appendChild(styleTag)
            updateCss()
            // 屏幕旋转事件处理
            window.addEventListener('resize', () => {
                updateCss()
            })
        }

        // 透明 UI 附加样式
        let subVersion = backend.release?.split('.') as any
        subVersion = subVersion ? Number(subVersion[2]) : 0
        if (backend.isDesktop() &&
            (platform == 'darwin' || (platform == 'win32' && subVersion > 22621))) {
            await import('@renderer/assets/css/append/append_vibrancy.css')
            logger.info('透明 UI 附加样式加载完成')
        }
        if (backend.isDesktop() && platform == 'linux') {
            const gnomeExtInfo = await backend.call(undefined, 'sys:getGnomeExt', true)
            if (gnomeExtInfo) {
                const info = await gnomeExtInfo
                if (
                    info['enable-all'] == 'true' ||
                    (info['whitelist'] != undefined &&
                        info['whitelist'].indexOf('stapxs-qq-lite')) > 0
                ) {
                    await import(
                        '@renderer/assets/css/append/append_vibrancy.css'
                    )
                    logger.info('透明 UI 附加样式加载完成')
                    await import(
                        '@renderer/assets/css/append/append_linux_vibrancy.css'
                    )
                    logger.info('Linux 透明 UI 附加样式加载完成')
                }
            }
        }
    },

    set tiling(value) {
        this._isTiling.value = value
    },

    /**
     * 是否为平铺桌面
     */
    get tiling() {
        return this._isTiling.value
    },

    /**
     * 是否为最大化
     */
    get maximized() {
        return this._isMaximized.value
    },

    set maximized(value) {
        this._isMaximized.value = value
    },

    get withBar() {
        return this._needBar.value
    },

    get margin() {
        return this._needMargin.value
    },
}

export default win
