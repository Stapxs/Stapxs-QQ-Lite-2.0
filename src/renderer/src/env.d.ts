/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

declare module 'vue3-danmaku'
declare module '*.vue' {
    import type { DefineComponent } from 'vue'
    // eslint-disable-next-line
    const component: DefineComponent<{}, {}, any>
    export default component
}

declare interface Window {
    moYu: any
    _AMapSecurityConfig: string | undefined
    createMap: (key: string | undefined, msgId: string, point: {
        lat: number,
        lng: number
    }) => void
    __TAURI_INTERNALS__: any
}

// po 文件，按字符串处理
declare module '*.po' {
    const value: string
    export default value
}

declare module '*.yaml' {
    const content: any
    export default content
}

declare module '*.yml' {
    const content: any
    export default content
}

declare module '@renderer/assets/img/qq-face/public/assets/qq_emoji/_index.json' {
    const content: {
        emojiId: string,
        describe: '' | `/${string}`,
        assets: {
            type: number,
            path: string,
            name: string,
        }[]
    }[]
    export default content
}[]
