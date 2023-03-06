/**
 * @type {import('@vue/cli-service').ProjectOptions}
 */

module.exports = {
    publicPath: process.env.NODEJS_ENV === 'github-actions'
        ? '/Stapxs-QQ-Lite-2.0/'
        : undefined
    ,
    transpileDependencies: true,
    configureWebpack: {
        module: {
            rules: [
                {
                    test: /\.txt$/i,
                    use: 'raw-loader',
                }
            ]
        }
    },
    pwa: {
        name: 'Stapxs QQ Lite',
        themeColor: '#606E7A',
        iconPaths: {
            faviconSVG: 'img/icons/icon.svg',
            favicon512: 'img/icons/icon.png',
            appleTouchIcon: 'img/icons/icon-for-fuck-apple.png',
            maskIcon: 'img/icons/icon-maskable.png'
        },
        manifestOptions: {
            description: "一个兼容 oicq-http 的非官方网页版 QQ 客户端，使用 Vue 重制的全新版本。",
            icons: [
                {
                    "src": "img/icons/icon.svg",
                    "sizes": "1080x1080",
                    "purpose": "any"
                },
                {
                    "src": "img/icons/icon.png",
                    "type": "image/png",
                    "sizes": "512x512"
                },
                {
                    "src": "img/icons/icon-maskable.png",
                    "sizes": "1024x1024",
                    "type": "image/png",
                    "purpose": "maskable"
                }
            ],
            related_applications: [
                {
                  "platform": "play",
                  "url": "https://play.google.com/store/apps/details?id=com.tencent.mobileqq",
                  "id": "com.tencent.mobileqq"
                },
                {
                    "platform": "itunes",
                    "url": "https://apps.apple.com/app/qq/id444934666"
                }
            ]
        }     
    },
    pluginOptions: {
        /**
         * Electron Builder 设置
         * @type {import('vue-cli-plugin-electron-builder').PluginOptions}
         */
        electronBuilder: {
            builderOptions: {
                appId: 'com.stapxs.qq-web',
                productName: 'Stapxs QQ Lite',
                copyright: 'Copyright © 2022-2023 Stapx Steve [林槐]',
                icon: 'public/img/icons/icon.png',

                directories: {
                    output: 'dist_electron/out'
                },
                
                linux: {
                    target: ['AppImage', 'pacman', 'tar.gz'],
                    maintainer: 'Stapx Steve [林槐]',
                    vendor: 'Stapxs Steve Team',
                    icon: 'public/img/icons/icon.png',
                    synopsis: '一个兼容 oicq-http 的非官方网页版 QQ 客户端。',
                    category: 'Network',
                    // TODO: 将来可能需要占用 QQ 自己的 MIME 类型
                    mimeTypes: ['application/x-stapxs-qq-lite'],
                    desktop: {
                        Type: 'Application',
                        Name: 'Stapxs QQ Lite',
                        GenericName: 'Stapxs QQ Lite Electron 客户端',
                        Comment: '一个兼容 oicq-http 的非官方网页版 QQ 客户端。',
                        Terminal: 'false',
                        Category: 'Network',
                        Icon: 'public/img/icons/icon.png',
                    }
                },

                win: {
                    target: 'portable',
                    icon: 'public/img/icons/icon.png',
                    legalTrademarks: 'Copyright © 2022-2023 Stapx Steve [林槐]',
                }
            }
        }
    }
}
