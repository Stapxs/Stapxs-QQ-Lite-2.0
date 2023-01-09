const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
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
