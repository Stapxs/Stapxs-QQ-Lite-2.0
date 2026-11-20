/*
 * @FileDescription: 聊天面板拖放文件工具
 */

import { backend } from '@renderer/runtime/backend'
import type { ChunkFileSource } from '@renderer/function/utils/fileTransferUtil'

// QQ 能直接作为图片消息显示的格式；SVG、HEIC 等其他图片按文件发送
const inlineImageTypes = new Set([
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/bmp',
])

// 与 inlineImageTypes 对应的扩展名，用于从 Tauri 拖放路径推断图片类型
const inlineImageExts = new Map([
    ['jpg', 'image/jpeg'],
    ['jpeg', 'image/jpeg'],
    ['png', 'image/png'],
    ['gif', 'image/gif'],
    ['webp', 'image/webp'],
    ['bmp', 'image/bmp'],
])

// 页面内部发起的拖动（如消息图片）会带上 Files 类型，用这个类型把它们排除。
// 标记跟随拖动数据，拖动源中途被移除收不到 dragend 时也不会残留
const internalDragType = 'application/x-ssqq-internal-drag'

interface DroppedItem {
    kind: string
    getAsFile(): File | null
    webkitGetAsEntry?(): { isDirectory: boolean } | null
}

/**
 * 在 dragstart 中标记页面内部发起的拖动
 */
export function markInternalDrag(
    dataTransfer?: { setData(format: string, data: string): void } | null,
) {
    dataTransfer?.setData(internalDragType, '1')
}

/**
 * 拖动内容是否包含从页面外拖入的系统文件；
 * dragenter / dragover 阶段只能读取类型，读不到文件本身
 */
export function hasDraggedFiles(
    dataTransfer?: { types?: ArrayLike<string> } | null,
): boolean {
    const types = new Set(Array.from(dataTransfer?.types ?? []))
    return types.has('Files') && !types.has(internalDragType)
}

/**
 * 取出 drop 事件中的文件，跳过文件夹
 */
export function getDroppedFiles(
    dataTransfer?: { items?: ArrayLike<DroppedItem>, files?: ArrayLike<File> } | null,
): { files: File[], folders: number } {
    const items = Array.from(dataTransfer?.items ?? [])
    if (items.length === 0) {
        return { files: Array.from(dataTransfer?.files ?? []), folders: 0 }
    }
    const files: File[] = []
    let folders = 0
    for (const item of items) {
        if (item.kind !== 'file') continue
        // 文件夹同样以 File 出现但无法读取，只能在 drop 事件中同步识别
        if (item.webkitGetAsEntry?.()?.isDirectory) {
            folders++
            continue
        }
        const file = item.getAsFile()
        if (file) files.push(file)
    }
    return { files, folders }
}

export function isInlineImageFile(file: Pick<File, 'type'>): boolean {
    return inlineImageTypes.has(file.type.toLowerCase())
}

//#region == Tauri 拖放（macOS / Windows） ==================================
// Tauri 在 macOS / Windows 上默认接管系统拖放，HTML5 drop 事件不会触发，
// 只能通过 tauri 拖放事件拿到文件路径；Linux 端已禁用该处理器，仍走 HTML5 事件

/**
 * 当前环境是否需要使用 tauri 拖放事件
 */
export function usesTauriDragDrop(): boolean {
    return backend.type === 'tauri' && backend.platform !== 'linux'
}

export interface TauriDragDropHandlers {
    enter(paths: string[]): void
    over(): void
    leave(): void
    drop(paths: string[]): void
}

/**
 * 监听 tauri 拖放事件（tauri://drag-enter / drag-over / drag-drop / drag-leave）
 *
 * @returns 取消监听函数
 */
export async function listenTauriDragDrop(
    handlers: TauriDragDropHandlers,
): Promise<() => void> {
    const { getCurrentWebview } = await import('@tauri-apps/api/webview')
    return await getCurrentWebview().onDragDropEvent((event) => {
        const payload = event.payload
        if (payload.type === 'enter') {
            handlers.enter(payload.paths)
        } else if (payload.type === 'over') {
            handlers.over()
        } else if (payload.type === 'leave') {
            handlers.leave()
        } else if (payload.type === 'drop') {
            handlers.drop(payload.paths)
        }
    })
}

function pathBaseName(path: string): string {
    return path.split(/[\\/]/).pop() || path
}

function mimeFromPath(path: string): string {
    const ext = path.split('.').pop()?.toLowerCase() ?? ''
    return inlineImageExts.get(ext) ?? ''
}

function base64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i)
    }
    return bytes
}

interface TauriPathStat {
    is_dir: boolean
    size: number
    ok: boolean
}

/**
 * 以本地路径为 backing 的 File：size 来自 stat，内容按需分块读取，
 * 避免发送大文件时把整个文件载入内存
 */
class TauriPathFile extends File implements ChunkFileSource {
    private readonly filePath: string
    private readonly byteSize: number

    constructor(path: string, name: string, size: number, type: string) {
        super([], name, { type })
        this.filePath = path
        this.byteSize = size
    }

    override get size(): number {
        return this.byteSize
    }

    override async arrayBuffer(): Promise<ArrayBuffer> {
        return await this.readChunk(0, this.byteSize)
    }

    override slice(): Blob {
        // 切片会得到空数据，上传通道请使用 readChunk 按需读取
        throw new Error('TauriPathFile 不支持 slice，请使用 readChunk')
    }

    async readChunk(start: number, end: number): Promise<ArrayBuffer> {
        if (end <= start) return new ArrayBuffer(0)
        const base64 = await backend.call(undefined, 'sys:readFileRange', true, {
            path: this.filePath,
            start,
            length: end - start,
        })
        if (typeof base64 !== 'string') {
            throw new Error(`读取文件失败：${this.name}`)
        }
        return base64ToUint8Array(base64).buffer as ArrayBuffer
    }
}

/**
 * 把 tauri 拖放事件提供的文件路径转换为 File 对象：
 * 图片需要完整内容（输入框预览与压缩），普通文件封装为按需读取
 */
export async function getTauriDroppedFiles(
    paths: string[],
): Promise<{ files: File[], folders: number, failed: number }> {
    const stats = await backend.call(undefined, 'sys:statPaths', true, paths)
    const files: File[] = []
    let folders = 0
    let failed = 0
    for (let i = 0; i < paths.length; i++) {
        const stat: TauriPathStat | undefined = stats?.[i]
        if (!stat || !stat.ok) {
            failed++
            continue
        }
        if (stat.is_dir) {
            folders++
            continue
        }
        const name = pathBaseName(paths[i])
        const type = mimeFromPath(paths[i])
        if (inlineImageTypes.has(type)) {
            // eslint-disable-next-line no-await-in-loop -- 逐张读取，控制内存占用
            const base64 = await backend.call(undefined, 'sys:readFileAsBase64', true, paths[i])
            if (typeof base64 === 'string') {
                files.push(new File([base64ToUint8Array(base64)], name, { type }))
            } else {
                failed++
            }
        } else {
            files.push(new TauriPathFile(paths[i], name, stat.size, type))
        }
    }
    return { files, folders, failed }
}
//#endregion

/**
 * 记录拖动当前经过的元素，用于判断文件是否已拖出页面。
 * dragenter 先于上一个元素的 dragleave 触发；拖动中被移除的元素不会再触发
 * dragleave，所以每次离开时顺带清理已脱离文档的元素。
 */
export class FileDragTargets {
    private readonly targets = new Set<EventTarget>()

    enter(target: EventTarget | null) {
        if (target) this.targets.add(target)
    }

    /**
     * @returns 拖动是否仍在页面内
     */
    leave(target: EventTarget | null): boolean {
        if (target) this.targets.delete(target)
        for (const item of this.targets) {
            if ((item as Partial<Node>).isConnected === false) {
                this.targets.delete(item)
            }
        }
        return this.targets.size > 0
    }

    clear() {
        this.targets.clear()
    }
}
