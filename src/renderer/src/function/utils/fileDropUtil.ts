/*
 * @FileDescription: 聊天面板拖放文件工具
 */

// QQ 能直接作为图片消息显示的格式；SVG、HEIC 等其他图片按文件发送
const inlineImageTypes = new Set([
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/bmp',
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
    const types = Array.from(dataTransfer?.types ?? [])
    return types.includes('Files') && !types.includes(internalDragType)
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
