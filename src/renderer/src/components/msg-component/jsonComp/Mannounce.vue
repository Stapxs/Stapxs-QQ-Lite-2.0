<template>
    <div v-if="success" class="msg-json mannounce">
        <div class="bottom-bar">
            <font-awesome-icon :icon="['fas', 'bullhorn']" />
            <span>{{ parsedContent.title }}</span>
        </div>
        <span>{{ parsedContent.content }}</span>
        <img v-if="parsedContent.img" :src="parsedContent.img.url" alt=""
            @click="viewImg()">
    </div>
    <span v-else class="msg-unknown">{{
        '( ' + $t('加载失败') + ': ' + id + ' )'
    }}</span>
</template>

<script setup lang="ts">
import ViewerCom from '@renderer/components/ViewerCom.vue';
import { Logger } from '@renderer/function/base'
import { Img } from '@renderer/function/model/img'
import { inject, ShallowRef } from 'vue'
import * as z from 'zod'

const { data: jsonData, id } = defineProps<{
    data: string,
    id: string,
}>()

const viewer = inject<{ viewer: ShallowRef<InstanceType<typeof ViewerCom> | null> }>('viewer')

const base64Code = z.base64().transform((str) => {
    const binary = atob(str)
    const bytes = Uint8Array.from(binary, (ch) => ch.codePointAt(0)!)
    return new TextDecoder().decode(bytes)
})

const mannounce = z
    .object({
        app: z.literal('com.tencent.mannounce'),
        meta: z.object({
            mannounce: z.object({
                title: base64Code,
                text: base64Code,
                pic: z.optional(
                    z.array(
                        z.object({
                            url: z.string(),
                            width: z.number(),
                            height: z.number(),
                        }),
                    ),
                ),
            }),
        }),
    })
    .transform((o) => {
        const out: {
            title: string
            content: string
            img?: {
                url: string
                width: number
                height: number
            }
        } = {
            title: o.meta.mannounce.title,
            content: o.meta.mannounce.text,
        }
        if (o.meta.mannounce.pic?.length === 1) {
            out['img'] = {
                url: `https://gdynamic.qpic.cn/gdynamic/${o.meta.mannounce.pic[0].url}/0`,
                width: o.meta.mannounce.pic[0].width,
                height: o.meta.mannounce.pic[0].height,
            }
        }
        return out
    })

const json = JSON.parse(jsonData)
const parsedData = mannounce.safeParse(json)
const success = parsedData.success
const parsedContent = parsedData.data!

if (!success) {
    new Logger().error(parsedData.error, 'Card Parse Error')
}

function viewImg(): void {
    const viewerInstance = viewer?.viewer.value
    if (!viewerInstance) return
    viewerInstance.open(new Img(parsedContent.img!.url))
}
</script>

<style scoped>
.mannounce {
    padding: 10px 5px 0 5px;
}
.mannounce > span {
    opacity: 1 !important;
}
.bottom-bar {
    margin: -15px -10px 10px -10px !important;
    background: var(--color-main) !important;
    border-radius: 7px !important;
    color: var(--color-font-r);
}
.bottom-bar > svg,
.bottom-bar > span {
    opacity: 1 !important;
}
</style>
