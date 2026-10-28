export type CallOneBotAction = (
    action: string,
    params: Record<string, unknown>,
    timeoutMs?: number,
) => Promise<any>

export type UploadFileStreamOptions = {
    action: string
    streamId: string
    fileName: string
    chunkSize: number
    fileRetentionMs: number
    chunkTimeoutMs: number
    completeTimeoutMs: number
}

/**
 * 支持按需读取分块数据的文件源（如 Tauri 拖入的路径文件），
 * 上传时按分块读取内容，避免大文件整体载入内存
 */
export interface ChunkFileSource {
    readChunk(start: number, end: number): Promise<ArrayBuffer>
}

const activeTransferStatuses = new Set([
    'pending',
    'downloading',
    'uploading',
    'finalizing',
])

export function isActiveTransferStatus(status: string): boolean {
    return activeTransferStatuses.has(status)
}

/**
 * 为浏览器托管的跨域下载补全文件名。
 * 跨域链接上的 download 属性会被浏览器忽略，文件名只能来自服务端；
 * QQ 文件服务器（NapCat 返回的 ftn 链接）根据 fname 参数生成 Content-Disposition，
 * 该参数为空时浏览器只能用 URL 路径命名，导致文件名和扩展名丢失。
 */
export function withDownloadFileName(url: URL, name: string): URL {
    // 只处理 QQ 文件服务器，其他服务的 fname 可能另有含义或受签名保护
    const isQQFileServer = url.hostname.endsWith('.ftn.qq.com') &&
        url.pathname.startsWith('/ftn_handler/')
    if (!name || !isQQFileServer || url.searchParams.get('fname') !== '') return url
    // QQ 文件服务器不会把 + 还原为空格，不能用 URLSearchParams 的表单编码
    const result = new URL(url.href)
    result.search = url.search.replace(
        /([?&])fname=(?=&|$)/,
        (_, prefix: string) => `${prefix}fname=${encodeURIComponent(name)}`,
    )
    return result
}

export function getOneBotResponseError(response: any): string | undefined {
    if (response?.status === 'ok' && Number(response?.retcode ?? 0) === 0) {
        return undefined
    }
    return response?.message || response?.wording ||
        (response?.retcode !== undefined? `retcode ${response.retcode}`: 'OneBot request failed')
}

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer)
    const blockSize = 0x8000
    let binary = ''
    for (let offset = 0; offset < bytes.length; offset += blockSize) {
        binary += String.fromCodePoint(...bytes.subarray(offset, offset + blockSize))
    }
    return btoa(binary)
}

function throwIfAborted(signal?: AbortSignal) {
    if (signal?.aborted) {
        throw new DOMException('Upload cancelled', 'AbortError')
    }
}

export async function uploadFileStream(
    file: Blob,
    options: UploadFileStreamOptions,
    callAction: CallOneBotAction,
    onProgress: (loaded: number, total: number) => void,
    signal?: AbortSignal,
): Promise<string> {
    if (!Number.isFinite(options.chunkSize) || options.chunkSize <= 0) {
        throw new Error('Upload chunk size must be greater than zero')
    }
    const totalChunks = Math.max(1, Math.ceil(file.size / options.chunkSize))
    // Tauri 路径文件没有本地 backing data，优先使用 readChunk 按需读取
    const chunkedSource = file as Blob & Partial<ChunkFileSource>
    const readChunk = typeof chunkedSource.readChunk === 'function'? chunkedSource.readChunk.bind(chunkedSource): undefined

    try {
        for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
            throwIfAborted(signal)
            const start = chunkIndex * options.chunkSize
            const end = Math.min(start + options.chunkSize, file.size)
            // eslint-disable-next-line no-await-in-loop -- Read one chunk at a time to keep memory usage bounded.
            const chunkData = readChunk? arrayBufferToBase64(await readChunk(start, end)): arrayBufferToBase64(await file.slice(start, end).arrayBuffer())
            throwIfAborted(signal)

            // eslint-disable-next-line no-await-in-loop -- Wait for each chunk response to keep progress ordered and stop on failure.
            const response = await callAction(options.action, {
                stream_id: options.streamId,
                chunk_data: chunkData,
                chunk_index: chunkIndex,
                total_chunks: totalChunks,
                file_size: file.size,
                filename: options.fileName,
                file_retention: options.fileRetentionMs,
            }, options.chunkTimeoutMs)
            const error = getOneBotResponseError(response)
            if (error) throw new Error(error)
            onProgress(end, file.size)
        }

        throwIfAborted(signal)
        const completeResponse = await callAction(options.action, {
            stream_id: options.streamId,
            is_complete: true,
        }, options.completeTimeoutMs)
        throwIfAborted(signal)
        const completeError = getOneBotResponseError(completeResponse)
        if (completeError) throw new Error(completeError)

        const filePath = completeResponse?.data?.file_path
        if (typeof filePath !== 'string' || filePath.length === 0) {
            throw new Error('OneBot did not return an uploaded file path')
        }
        return filePath
    } catch (error) {
        void callAction(options.action, {
            stream_id: options.streamId,
            reset: true,
        }, options.chunkTimeoutMs).catch(() => undefined)
        throw error
    }
}
