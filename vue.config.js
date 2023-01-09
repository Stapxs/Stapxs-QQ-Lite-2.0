const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
    // publicPath: '/Stapxs-QQ-Lite-2.0/',
    transpileDependencies: true,
    configureWebpack: {
        module: {
            rules: [
                {
                    test: /\.txt$/i,
                    use: 'raw-loader',
                },
            ],
        }
    },
    pwa: {
        name: 'Stapxs QQ Lite'
    }
})
