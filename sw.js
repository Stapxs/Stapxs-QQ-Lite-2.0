const version = 'v1.2.8'

// SW 设置
const maxEntries = 100
const maxEntriesPic = 1000

// 引用 workbox-sw
importScripts('src/js/workbox/workbox-sw.js')
workbox.setConfig({modulePathPrefix: 'src/js/workbox/'})
workbox.core.setCacheNameDetails({
    prefix: 'sql-',
    suffix: version
})

// sw.js 本体不进行缓存
workbox.routing.registerRoute(new RegExp("sw.js"), new workbox.strategies.NetworkOnly())

// js、html 和 css 进行优先网络的缓存
workbox.routing.registerRoute(
    new RegExp(".(js|html|css|json)|src/.(png|svg)"),
    new workbox.strategies.NetworkFirst({
        // cache storage 名称和版本号
        cacheName: 'main-' + version,
        plugins: [
            // 使用 expiration 插件实现缓存条目数目和时间控制
            new workbox.expiration.ExpirationPlugin({
                // 最大保存项目
                maxEntries,
                // 缓存 30 天
                maxAgeSeconds: 30 * 24 * 60 * 60,
            }),
            // 使用 cacheableResponse 插件缓存状态码为 0 的请求
            new workbox.cacheableResponse.CacheableResponsePlugin({
                statuses: [0, 200],
            }),
        ],
    })
);

// QQ 表情进行缓存优先缓存
workbox.routing.registerRoute(
    new RegExp("src/qq-face/.*"),
    new workbox.strategies.CacheFirst({
        // cache storage 名称和版本号
        cacheName: 'src',
        plugins: [
            // 使用 expiration 插件实现缓存条目数目和时间控制
            new workbox.expiration.ExpirationPlugin({
                // 最大保存项目
                maxEntriesPic,
                // 缓存 30 天
                maxAgeSeconds: 30 * 24 * 60 * 60,
            }),
            // 使用 cacheableResponse 插件缓存状态码为 0 的请求
            new workbox.cacheableResponse.CacheableResponsePlugin({
                statuses: [0, 200],
            }),
        ],
    })
);

// QQ 头像、群头像进行缓存优先缓存
workbox.routing.registerRoute(
    new RegExp("https://p\.qlogo\.cn/gh/\d*/\d*/0|https://q1\.qlogo\.cn/g?b=qq&s=0&nk=\d*"),
    new workbox.strategies.CacheFirst({
        // cache storage 名称和版本号
        cacheName: 'avatar',
        plugins: [
            // 使用 expiration 插件实现缓存条目数目和时间控制
            new workbox.expiration.ExpirationPlugin({
                // 最大保存项目
                maxEntriesPic,
                // 缓存 7 天
                maxAgeSeconds: 7 * 24 * 60 * 60,
            }),
            // 使用 cacheableResponse 插件缓存状态码为 0 的请求
            new workbox.cacheableResponse.CacheableResponsePlugin({
                statuses: [0, 200],
            }),
        ],
    })
);

// Github 头像进行缓存优先缓存
workbox.routing.registerRoute(
    new RegExp("https://avatars.githubusercontent.com/.*"),
    new workbox.strategies.CacheFirst({
        // cache storage 名称和版本号
        cacheName: 'avatar',
        plugins: [
            // 使用 expiration 插件实现缓存条目数目和时间控制
            new workbox.expiration.ExpirationPlugin({
                // 最大保存项目
                maxEntriesPic,
                // 缓存 7 天
                maxAgeSeconds: 7 * 24 * 60 * 60,
            }),
            // 使用 cacheableResponse 插件缓存状态码为 0 的请求
            new workbox.cacheableResponse.CacheableResponsePlugin({
                statuses: [0, 200],
            }),
        ],
    })
);