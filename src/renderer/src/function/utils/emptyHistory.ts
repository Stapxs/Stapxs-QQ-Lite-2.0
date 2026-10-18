/** 被撤回的历史消息在 NapCat 中表现为 message 为空数组的记录，但仍占用分页条数 */
export function isEmptyHistoryPage(messages: any[]): boolean {
    return messages.length > 0 && messages.every(message =>
        Array.isArray(message?.message) && message.message.length === 0,
    )
}

/** 全量分页模式下，最新一页全部为空记录时继续向前扩大窗口 */
export async function expandEmptyHistoryPage(
    initial: any[],
    loadMore: (count: number) => Promise<any[] | undefined>,
    isActive: () => boolean,
): Promise<any[] | undefined> {
    let messages = initial
    // 限制自动请求次数，剩余的占位记录仍可手动上拉加载
    for (let page = 0; page < 10 && isEmptyHistoryPage(messages); page++) {
        if (!isActive()) return undefined
        const older = await loadMore(messages.length + 20)
        if (!isActive()) return undefined
        // 后端封顶、返回重复窗口或已无更早消息时停止，避免死循环
        if (!older || older.length <= messages.length) break
        messages = older
    }
    return isActive() ? messages : undefined
}
