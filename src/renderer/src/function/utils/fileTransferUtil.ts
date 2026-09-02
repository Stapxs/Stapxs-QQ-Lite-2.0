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

const activeTransferStatuses = new Set([
    'pending',
    'downloading',
    'uploading',
    'finalizing',
])

export function isActiveTransferStatus(status: string): boolean {
    return activeTransferStatuses.has(status)
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
        binary += String.fromCharCode(...bytes.subarray(offset, offset + blockSize))
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

    try {
        for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
            throwIfAborted(signal)
            const start = chunkIndex * options.chunkSize
            const end = Math.min(start + options.chunkSize, file.size)
            const chunk = file.slice(start, end)
            const chunkData = arrayBufferToBase64(await chunk.arrayBuffer())
            throwIfAborted(signal)

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
