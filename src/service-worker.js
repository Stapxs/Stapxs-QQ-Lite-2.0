const version = 'v2.0.0-test'

const maxEntries = 100
const maxEntriesPic = 1000

// importScripts('https://storage.googleapis.com/workbox-cdn/releases/4.3.1/workbox-sw.js')

self.__precacheManifest = [].concat(self.__precacheManifest || [])
workbox.precaching.suppressWarnings()
workbox.precaching.precacheAndRoute(self.__precacheManifest, {})

workbox.core.setCacheNameDetails({
    prefix: 'sql-',
    suffix: version
})