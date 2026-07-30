import { backend } from '@renderer/runtime/backend'
import { ref } from 'vue'

const objectUrls = new Map<string, string>()
const backgroundUrlVersion = ref(0)
const dbName = 'ssqq-local-assets'
const dbVersion = 1
const imageStoreName = 'images'
const chatBackgroundKey = 'chat_background'
const chatBackgroundUrl = `ssqq-background://${chatBackgroundKey}`

export interface LocalImageInfo {
    path: string
    url?: string
}

export function getBackgroundImageUrl(
    value: string | null | undefined,
    _version = backgroundUrlVersion.value,
) {
    if (!value) return ''
    if (value.startsWith('ssqq-background://')) {
        return objectUrls.get(value) ?? ''
    }
    if (value.startsWith('data:') || value.startsWith('blob:') || value.startsWith('file:')) {
        return value
    }
    if (backend.type === 'tauri') {
        return objectUrls.get(value) ?? value
    }
    return value
}

export function toBackgroundImageStyle(value: string | null | undefined) {
    const url = getBackgroundImageUrl(value)
    return url ? `url("${url.replaceAll('\\', '\\\\').replaceAll('"', '\\"')}")` : ''
}

export async function resolveLocalImageUrl(image: LocalImageInfo) {
    if (backend.type === 'tauri') {
        const { convertFileSrc } = await import('@tauri-apps/api/core')
        const url = convertFileSrc(image.path)
        objectUrls.set(image.path, url)
        return url
    }
    return image.url ?? image.path
}

export function rememberLocalImageUrl(path: string, url: string) {
    objectUrls.set(path, url)
    backgroundUrlVersion.value += 1
}

export async function saveBrowserBackgroundImage(file: Blob) {
    const db = await openAssetDb()
    await putImageBlob(db, chatBackgroundKey, file)
    return chatBackgroundUrl
}

export async function migrateInlineBackgroundImage(value: string | null | undefined) {
    if (!value?.startsWith('data:image')) return null
    const response = await fetch(value)
    const blob = await response.blob()
    const backgroundUrl = await saveBrowserBackgroundImage(blob)
    rememberLocalImageUrl(backgroundUrl, URL.createObjectURL(blob))
    return backgroundUrl
}

export async function hydrateBackgroundImage(value: string | null | undefined) {
    if (!value?.startsWith('ssqq-background://') || objectUrls.has(value)) {
        return
    }
    const db = await openAssetDb()
    const blob = await getImageBlob(db, chatBackgroundKey)
    if (!blob) return
    const url = URL.createObjectURL(blob)
    rememberLocalImageUrl(value, url)
}

function openAssetDb() {
    return new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open(dbName, dbVersion)
        request.onupgradeneeded = () => {
            const db = request.result
            if (!db.objectStoreNames.contains(imageStoreName)) {
                db.createObjectStore(imageStoreName)
            }
        }
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
    })
}

function putImageBlob(db: IDBDatabase, key: string, file: Blob) {
    return new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(imageStoreName, 'readwrite')
        transaction.objectStore(imageStoreName).put(file, key)
        transaction.oncomplete = () => resolve()
        transaction.onerror = () => reject(transaction.error)
    })
}

function getImageBlob(db: IDBDatabase, key: string) {
    return new Promise<Blob | undefined>((resolve, reject) => {
        const transaction = db.transaction(imageStoreName, 'readonly')
        const request = transaction.objectStore(imageStoreName).get(key)
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
    })
}
