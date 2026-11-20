import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

/** Windows toasts need a file/HTTP image URL rather than an inline PNG. */
export function cacheNotificationIcon(source: string, cacheDir: string) {
    const prefix = 'data:image/png;base64,'
    if (!source.startsWith(prefix)) return source
    const bytes = Buffer.from(source.slice(prefix.length), 'base64')
    const name = createHash('sha256').update(bytes).digest('hex') + '.png'
    const target = join(cacheDir, name)
    if (!existsSync(target)) {
        mkdirSync(cacheDir, { recursive: true })
        writeFileSync(target, bytes)
    }
    return pathToFileURL(target).href
}
