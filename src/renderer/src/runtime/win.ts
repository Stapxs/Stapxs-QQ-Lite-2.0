import { backend } from './backend'
import { shallowRef, computed, watchEffect, ComputedRef } from 'vue'

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
