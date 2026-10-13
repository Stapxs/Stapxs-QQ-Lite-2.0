<template>
    <div v-if="success" class="msg-json" @click="parsedContent.jumpUrl && openLink(parsedContent.jumpUrl)">
        <p>{{ parsedContent.title }}</p>
        <span>{{ parsedContent.desc }}</span>
        <img :src="parsedContent.img" alt="">
        <div class="bottom-bar">
            <img :src="parsedContent.icon" alt="">
            <span>{{ parsedContent.name }}</span>
        </div>
    </div>
    <span v-else class="msg-unknown">{{
        '( ' + $t('加载失败') + ': ' + id + ' )'
    }}</span>
</template>

<script setup lang="ts">
import { Logger, LogType } from '@renderer/function/base';
import { openLink } from '@renderer/function/utils/appUtil'
import * as z from 'zod'

const { data: jsonData, id } = defineProps<{
    data: string,
    id: string,
}>()

/**
 * 解包 Qzone 风格的嵌套 URL 链接
 * @param url 原始的完整 URL 字符串
 * @returns 解码后的内部链接，如果解析失败则返回 null
 */
function unpackNestedUrl(url: string): string | null {
    const logger = new Logger()
    try {
        const urlObj = new URL(url)

        // 1. 处理路径部分 (pathname)
        // 示例路径: /groupphoto/inqq/detail/https%3A%2F%2F...
        const pathname = urlObj.pathname

        // 寻找 "detail/" 之后的部分，这是常见的 Qzone 嵌套模式
        const detailMarker = 'detail/'
        const markerIndex = pathname.indexOf(detailMarker)

        if (markerIndex !== -1) {
            // 截取 detail/ 之后的所有内容
            const encodedPart = pathname.substring(
                markerIndex + detailMarker.length,
            )

            // 进行 URL 解码
            // 注意：decodeURIComponent 会处理 %3A, %2F, %26 等
            return decodeURIComponent(encodedPart)
        }

        return null
    } catch (error) {
        logger.error(error as Error, 'URL 解包失败')
        return null
    }
}

function getJumpUrl(jumpUrl: string | undefined, pcJumpUrl: string | undefined): string | undefined {
    const url = jumpUrl || pcJumpUrl
    if (url) {
        return unpackNestedUrl(url) ?? url
    } else return undefined
}

const feed = z
    .object({
        app: z.literal('com.tencent.feed.lua'),
        meta: z.object({
            feed: z.object({
                cover: z.string(),
                title: z.string(),
                tagIcon: z.string(),
                tagName: z.string(),
                forwardMessage: z.string().optional(),
                pcJumpUrl: z.string().optional(),
                jumpUrl: z.string().optional(),
            }),
        }),
        prompt: z.string(),
    })
    .transform((o) => ({
        title: o.meta.feed.title,
        jumpUrl: getJumpUrl(o.meta.feed.jumpUrl, o.meta.feed.pcJumpUrl),
        img: o.meta.feed.cover,
        icon: o.meta.feed.tagIcon,
        name: o.meta.feed.tagName,
        desc: o.meta.feed.forwardMessage,
    }))

const json = JSON.parse(jsonData)
const parsedData = feed.safeParse(json)
const success = parsedData.success
const parsedContent = parsedData.data!
if (!success) {
    new Logger().add(LogType.ERR, '卡片格式化失败：', {
        error: JSON.parse(parsedData.error.message),
        raw: json
    })
}
</script>
