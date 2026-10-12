<!--
 * @FileDescription: 表情面板模板
 * @Author: Stapxs
 * @Date: missing
 * @Version: 1.0
-->

<template>
    <div class="ss-card face-pan">
        <BcTab>
            <div icon="fa-solid fa-face-laugh-squint">
                <div class="system-face-bar">
                    <template v-if="recentEmojisList.length > 0">
                        <div class="title">
                            <span>{{ $t('最近使用') }}</span>
                        </div>
                        <div class="face">
                            <template
                                v-for="num in recentEmojisList"
                                :key="num">
                                <div>
                                    <EmojiFace
                                        :emoji="Emoji.get(num)"
                                        @click="addBaseFace(num)" />
                                </div>
                            </template>
                        </div>
                    </template>
                    <div class="title">
                        <span>{{ $t('超级表情') }}</span>
                    </div>
                    <div class="face">
                        <template v-for="num in Emoji.superList" :key="num">
                            <div>
                                <EmojiFace
                                    :emoji="Emoji.get(num)"
                                    @click="addBaseFace(num)" />
                            </div>
                        </template>
                    </div>
                    <div class="title">
                        <span>{{ $t('小黄脸表情') }}</span>
                    </div>
                    <div class="face">
                        <template v-for="num in Emoji.normalList" :key="num">
                            <div>
                                <EmojiFace
                                    :emoji="Emoji.get(num)"
                                    @click="addBaseFace(num)" />
                            </div>
                        </template>
                    </div>
                    <div class="title">
                        <span>{{ $t('emoji 表情') }}</span>
                    </div>
                    <div class="face">
                        <div
                            v-for="num in Emoji.emojiList"
                            :key="num">
                            <EmojiFace
                                :emoji="Emoji.get(num)"
                                @click="addBaseFace(num)" />
                        </div>
                    </div>
                </div>
            </div>
            <div icon="fa-solid fa-heart">
                <div class="system-face-bar custom-face-bar" @scroll="stickersScroll">
                    <template v-if="recentCustomFacesList.length > 0">
                        <div class="title">
                            <span>{{ $t('最近使用') }}</span>
                        </div>
                        <div class="face">
                            <span
                                v-for="(url, num) in recentCustomFacesList"
                                :key="num"
                                v-tooltip="customFaceTooltip(url)">
                                <img
                                    loading="lazy"
                                    :src="url"
                                    :alt="'[' + $t('动画表情') + ']'"
                                    @click="addImgFace(url)">
                            </span>
                        </div>
                    </template>
                    <div class="title">
                        <span>{{ $t('收藏的表情') }}</span>
                        <font-awesome-icon
                            :icon="['fas', 'fa-rotate-right']"
                            @click="reloadRoamingStamp" />
                    </div>
                    <div class="face">
                        <div v-if="stickerStore.stickerCache && stickerStore.stickerCache.length <= 0"
                            class="ss-card">
                            <font-awesome-icon :icon="['fas', 'face-dizzy']" />
                            <span>{{ $t('一无所有') }}</span>
                        </div>
                        <template v-else-if="stickerStore.stickerCache && stickerStore.stickerCache.length > 0">
                            <span v-for="(url, index) in stickerStore.stickerCache" :key="'stickers-' + index">
                                <img
                                    v-show="url != 'end'"
                                    v-tooltip="customFaceTooltip(url)"
                                    loading="lazy"
                                    :src="url"
                                    :alt="'[' + $t('动画表情') + ']'"
                                    @click="addImgFace(url)">
                            </span>
                        </template>
                    </div>
                </div>
            </div>
            <div v-if="backend.isDesktop()" icon="fa-solid fa-folder-open">
                <div class="system-face-bar custom-face-bar">
                    <template v-if="recentLocalFacesList.length > 0">
                        <div class="title">
                            <span>{{ $t('最近使用') }}</span>
                        </div>
                        <div class="face">
                            <span v-for="(emoji, index) in recentLocalFacesList" :key="index">
                                <img
                                    v-tooltip="customFaceTooltip(emoji.url)"
                                    loading="lazy"
                                    :src="emoji.url"
                                    :alt="'[' + $t('动画表情') + ']'"
                                    @click="addLocalEmoji(emoji)">
                            </span>
                        </div>
                    </template>
                    <div class="title">
                        <span>{{ $t('本地表情') }}</span>
                        <font-awesome-icon
                            :icon="['fas', 'fa-folder-plus']"
                            :title="$t('选择文件夹')"
                            @click="selectLocalEmojiFolder" />
                        <font-awesome-icon
                            v-if="settingsStore.sysConfig.local_emoji_folder"
                            :icon="['fas', 'fa-rotate-right']"
                            :title="$t('重新加载')"
                            @click="reloadLocalEmojis" />
                    </div>
                    <div class="face">
                        <div v-if="!settingsStore.sysConfig.local_emoji_folder"
                            class="ss-card">
                            <font-awesome-icon :icon="['fas', 'folder-open']" />
                            <span>{{ $t('选择文件夹') }}</span>
                        </div>
                        <div v-else-if="settingsStore.sysConfig.local_emoji_folder && localEmojis.length <= 0"
                            class="ss-card">
                            <font-awesome-icon :icon="['fas', 'face-dizzy']" />
                            <span>{{ $t('暂无图片') }}</span>
                        </div>
                        <template v-else-if="settingsStore.sysConfig.local_emoji_folder && localEmojis.length > 0">
                            <span v-for="(emoji, index) in localEmojis" :key="index">
                                <img
                                    v-tooltip="customFaceTooltip(emoji.url)"
                                    loading="lazy"
                                    :src="emoji.url"
                                    :alt="'[' + $t('动画表情') + ']'"
                                    @click="addLocalEmoji(emoji)">
                            </span>
                        </template>
                    </div>
                </div>
            </div>
        </BcTab>
    </div>
</template>

<script setup lang="ts">
import {
    MsgItemElem,
    SQCodeElem,
} from '@renderer/function/elements/information'
import { computed, ComputedRef, Ref, ShallowRef, shallowRef } from 'vue'
import { Connector } from '@renderer/function/connect'
import { backend } from '@renderer/runtime/backend'
import Option from '@renderer/function/option'
import { PopInfo, PopType } from '@renderer/function/base'
import { Tab as BcTab } from 'vue3-bcui'
import Emoji from '@renderer/function/model/emoji'
import EmojiFace from './EmojiFace.vue'
import { VueCompData } from '@renderer/function/elements/vueComp'
import CustomFaceTooltip from './tooltip/CustomFaceTooltip.vue'
import { useLocalStorage, vTooltip } from '@renderer/function/utils/appUtil'
import app from '@renderer/main'
import { useStickerStore } from '@renderer/state/sticker'
import { useSettingsStore } from '@renderer/state/settings'
import { useAuthStore } from '@renderer/state/auth'

const { recordList: recentEmojisId, showList: recentEmojisList } =
    getRecentEmojiRecord<number>('recent-emojis-id')
const { recordList: recentCustomFacesId, showList: recentCustomFacesList } =
    getRecentEmojiRecord<string>('recent-custom-faces-id')
const { recordList: recentLocalFacesId, showList: _recentLocalFacesList } =
    getRecentEmojiRecord<string>('recent-local-faces-id')

const recentLocalFacesList = computed(()=>{
    const list: LocalEmoji[] = []
    for (const path of _recentLocalFacesList.value) {
        const emoji = localEmojis.value.find(e => e.path === path)
        if (!emoji) continue
        list.push(emoji)
    }
    return list
})

interface LocalEmoji {
    name: string
    path: string
    url: string
}

const popInfo = new PopInfo()
const stickerStore = useStickerStore()
const settingsStore = useSettingsStore()
const authStore = useAuthStore()

const stickerPage = shallowRef(1)
const localEmojis = shallowRef<LocalEmoji[]>([])

const emit = defineEmits<{
    addSpecialMsg: [data: SQCodeElem],
    sendMsg: [echo?: string]
}>()

// 加载漫游表情
if (
    stickerStore.stickerCache && stickerStore.stickerCache.length == 0 &&
    authStore.jsonMap.roaming_stamp
) {
    reloadRoamingStamp()
}
// 加载本地表情
if (backend.isDesktop() && settingsStore.sysConfig.local_emoji_folder) {
    reloadLocalEmojis()
}

function addSpecialMsg(json: MsgItemElem, addText: boolean) {
    emit('addSpecialMsg', {
        addText: addText,
        msgObj: json,
    })
}
function addBaseFace(id: number) {
    recordRecentEmoji(recentEmojisId, id)
    if (id < 5000)
        addSpecialMsg({ type: 'face', id: id }, true)
    else
        addSpecialMsg({ type: 'text', text: Emoji.get(id)!.value }, true)
}

//#region == 漫游表情相关函数 ===========
function reloadRoamingStamp() {
    stickerStore.stickerCache = undefined
    if (authStore.jsonMap.roaming_stamp.pagerType == 'full') {
        // 全量分页，返回所有内容
        Connector.send(
            authStore.jsonMap.roaming_stamp.name,
            { count: 48 },
            'getRoamingStamp_48',
        )
    } else {
        // 默认不分页，返回所有内容
        Connector.send(
            authStore.jsonMap.roaming_stamp.name,
            {},
            'getRoamingStamp',
        )
    }
}
function stickersScroll(e: Event) {
    const target = e.target as HTMLDivElement
    // 如果滚到了底部
    if (
        target.scrollHeight - target.scrollTop <
        target.clientHeight + 0.5
    ) {
        if (stickerStore.stickerCache) {
            if (authStore.jsonMap.roaming_stamp.pagerType == 'full' &&
                stickerStore.stickerCache[stickerStore.stickerCache.length - 1] != 'end') {
                const count = 48 + 48 * stickerPage.value
                // 全量分页，返回所有内容（napcat 行为）
                Connector.send(
                    authStore.jsonMap.roaming_stamp.name,
                    { count: count },
                    'getRoamingStamp_' + count,
                )
                stickerPage.value++
            }
        }
    }
}
function addImgFace(url: string) {
    recordRecentEmoji(recentCustomFacesId, url)
    addSpecialMsg(
        { type: 'image', file: url, subType: 1 },
        true,
    )
    // 直接发送表情
    if(settingsStore.sysConfig.send_face == true) {
        emit('sendMsg')
    }
}
//#endregion

//#region == 本地表情相关函数 ===========
/**
 * 选择文件夹
 */
async function selectLocalEmojiFolder() {
    const { $t } = app.config.globalProperties
    try {
        // 调用后端选择文件夹
        const folderPath = await backend.call(
            undefined,
            'sys:selectFolder',
            true
        )

        if (folderPath) {
            // 保存文件夹路径
            Option.save('local_emoji_folder', folderPath)
            popInfo.add(PopType.INFO, $t('已设置本地表情文件夹'))
            // 重新加载本地表情
            reloadLocalEmojis()
        }
    } catch (error) {
        popInfo.add(PopType.ERR, $t('选择文件夹失败'))
    }
}

/**
 * 重新加载本地表情
 */
async function reloadLocalEmojis() {
    try {
        const folderPath = settingsStore.sysConfig.local_emoji_folder
        if (!folderPath) {
            localEmojis.value = []
            return
        }

        // 调用后端读取文件夹中的图片
        const images = await backend.call(
            undefined,
            'sys:getLocalEmojis',
            true,
            folderPath
        )

        if (images && Array.isArray(images)) {
            // 对于 Tauri，需要使用 convertFileSrc 转换文件路径
            if (backend.type === 'tauri') {
                const { convertFileSrc } = await import('@tauri-apps/api/core')
                localEmojis.value = images.map((img: any) => ({
                    name: img.name,
                    path: img.path,
                    url: convertFileSrc(img.path),
                }))
            } else {
                localEmojis.value = images.map((img: any) => ({
                    name: img.name,
                    path: img.path,
                    url: img.url,
                }))
            }
        } else {
            localEmojis.value = []
        }
    } catch (error) {
        localEmojis.value = []
    }
}

/**
 * 添加本地表情到消息
 */
async function addLocalEmoji(emoji: LocalEmoji) {
    try {
        // 读取文件为 base64
        const base64String = await backend.call(
            undefined,
            'sys:readFileAsBase64',
            true,
            emoji.path
        )

        recordRecentEmoji(recentLocalFacesId, emoji.path)

        // 发送 base64 格式的图片
        addSpecialMsg(
            { type: 'image', file: 'base64://' + base64String, subType: 1 },
            true,
        )
        // 如果设置了直接发送表情
        if(settingsStore.sysConfig.send_face == true) {
            emit('sendMsg')
        }
    } catch (error) {
        const { $t } = app.config.globalProperties
        popInfo.add(PopType.ERR, $t('添加本地表情失败'))
    }
}
//#endregion

//#region == 最近表情相关函数 ===========
function getRecentEmojiRecord<T>(storeId: string): {
    recordList: Ref<T[]>
    showList: ComputedRef<T[]>
} {
    const recordList = useLocalStorage<T[]>(storeId, [])
    const showList = computed(() => {
        if (settingsStore.sysConfig.record_recent_emoji === 'none') {
            return []
        } else if (settingsStore.sysConfig.record_recent_emoji === 'order') {
            return recordList.value.slice(0, 30)
        } else {
            const timesMap = new Map<T, number>()
            for (const id of recordList.value) {
                timesMap.set(id, (timesMap.get(id) || 0) + 1)
            }
            return Array.from(timesMap.entries())
                .sort((a, b) => b[1] - a[1])
                .map((entry) => entry[0])
                .slice(0, 30)
        }
    })

    return {
        recordList,
        showList,
    }
}

function recordRecentEmoji<T>(recordList: ShallowRef<T[]>, id: T) {
    if (settingsStore.sysConfig.record_recent_emoji === 'none') return
    let limit: number
    switch (settingsStore.sysConfig.record_recent_emoji) {
        case 'order':
            limit = 30
            break
        case '100times':
            limit = 100
            break
        case '500times':
            limit = 500
            break
        default:
            throw new Error('Invalid recent emoji record setting')
    }
    const list = recordList.value
    if (settingsStore.sysConfig.record_recent_emoji === 'order') {
        const index = list.indexOf(id)
        if (index !== -1) {
            list.splice(index, 1)
        }
    }
    list.unshift(id)
    if (list.length > limit) {
        list.pop()
    }
    recordList.value = list
}
//#endregion

function customFaceTooltip(url: string): VueCompData<typeof CustomFaceTooltip> {
    return {
        comp: CustomFaceTooltip,
        props: { url }
    }
}
</script>
