// 这个构建配置是给 Github Action 用的
// 以防止因为本地测试环境和 Pages 部署环境不同但是我老忘了改 ……

const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
    publicPath: '/Stapxs-QQ-Lite-2.0/',
    transpileDependencies: true,
    chainWebpack: config => { 
      config.plugins.delete('workbox'); 
    },
    pwa: {
        name: 'Stapxs QQ Lite'
    }
})
