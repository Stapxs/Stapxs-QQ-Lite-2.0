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

                directories: {
                    output: 'dist_electron/out'
                },
                
                linux: {
                    target: process.env.NODEJS_ENV === 'github-actions' ? ['AppImage', 'tar.gz'] : 'pacman',
                    maintainer: 'Stapx Steve [林槐]',
                    vendor: 'Stapxs Steve Team',
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
                        Category: 'Application',
                        Icon: 'stapxs-qq-lite'
                    }
                },

                win: {
                    target: 'portable',
                    appId: 'com.stapxs.qq-web',
                    icon: 'public/img/icons/icon.png',
                    legalTrademarks: 'Copyright © 2022-2023 Stapx Steve [林槐]',
                },



                afterAllArtifactBuild: async (context) => {
                    // 如果环境参数中有 `github-actions`，则删除 `dist_electron/out` 目录下所有的
                    //  `*-unpacked` 目录和 `build` 开头的文件，便于 GitHub Actions 上传构建结果
                    if (process.env.NODEJS_ENV === 'github-actions') {
                        const fs = require('fs')
                        const path = require('path')
                        // 寻找所有需要删除的文件和目录
                        const delList = fs.readdirSync(context.outDir).filter((item) => {
                            return item.endsWith('-unpacked') || item.startsWith('build')
                        })
                        console.log('删除的目录和文件：', delList)
                        for (const item of delList) {
                            // 判断是文件还是目录
                            if (fs.statSync(path.join(context.outDir, item)).isDirectory()) {
                                fs.rmSync(path.join(context.outDir, item), { recursive: true })
                            } else {
                                fs.rmSync(path.join(context.outDir, item))
                            }
                        }
                    }
                    // 生成所有输出文件的 MD5 验证文件
                    const crypto = require('crypto')
                    const fs = require('fs')
                    const path = require('path')
                    const fileList = fs.readdirSync(context.outDir)
                    let md5List = []
                    for (const item of fileList) {
                        // 只包括 stapxs 开头的文件，忽略大小写，忽略文件夹
                        if (item.toLowerCase().startsWith('stapxs') && 
                            fs.statSync(path.join(context.outDir, item)).isFile()) {
                            const file = fs.readFileSync(path.join(context.outDir, item))
                            const md5Str = crypto.createHash('md5').update(file).digest('hex')
                            md5List.push(`${md5Str}  ${item}`)
                        }
                    }
                    fs.writeFileSync(path.join(context.outDir, 'md5sum.txt'), md5List.join('\n'))
                }
            }
        }
    }
}
