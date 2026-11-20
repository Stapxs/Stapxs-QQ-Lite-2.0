import { defineConfig } from 'electron-vite'
import { viteStaticCopy } from 'vite-plugin-static-copy'

import * as viteConfig from './vite.config.ts'

export default defineConfig(({ command, mode }) => {
    const rendererConfigFn = viteConfig.configFactory('out/renderer')
    const rendererConfig = rendererConfigFn({ mode, command })

    return {
        main: {
            plugins: [
                viteStaticCopy({
                    targets: [
                        { src: 'src/electron/assets', dest: './' },
                    ]
                })
            ],
            build: {
                rollupOptions: {
                    input: 'src/electron/index.ts',
                }
            }
        },
        renderer: rendererConfig,
    }
})
