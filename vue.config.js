const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
    // publicPath: '/Stapxs-QQ-Lite-2.0/',
    transpileDependencies: true,
    chainWebpack: config => { 
      config.plugins.delete('workbox'); 
    },
    pwa: {
        name: 'Stapxs QQ Lite',
        // workboxPluginMode: 'InjectManifest',
        // workboxOptions:{
        //     swSrc: './src/service-worker.js'
        // }
    }
})
