function resolve(dir) {
    const path = require('path')
    return path.join(__dirname, '.', dir)
}

const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
    // publicPath: '/Stapxs-QQ-Lite-2.0/',
    transpileDependencies: true,
    pwa: {
        
    }
})
