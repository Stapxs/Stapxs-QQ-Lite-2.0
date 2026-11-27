<template>
    <div :class="'merge-pan' + (chatStore.mergeMsgStack.length > 0 ? ' show' : '')">
        <div @click="closeMergeMsg" />
        <div class="ss-card">
            <div>
                <font-awesome-icon style="margin-top: 5px" :icon="['fas', 'message']" />
                <span>{{ $t('合并消息') }}</span>
                <font-awesome-icon v-if="stack.length <= 1" :icon="['fas', 'xmark']" @click="exitMergeMsg" />
                <font-awesome-icon v-else :icon="['fas', 'angles-left']" @click="exitMergeMsg" />
            </div>
            <div v-if="nowData === undefined">
                <!-- 无内容 -->
            </div>
            <TransitionGroup v-else :name="settingsStore.sysConfig.opt_fast_animation ? '' : 'msglist'" tag="div">
                <template v-for="(msgIndex, index) in nowData.messageList" :key="'merge-' + nowData.forwardMsg.message[0].id + '-' + index">
                    <NoticeBody v-if=" isShowTime( nowData.messageList[index - 1] ?
                                    nowData.messageList[index - 1].time : undefined, msgIndex.time, index == 0)"
                        :id="uuid()"
                        :key="'notice-time-' + index"
                        :data="{ sub_type: 'time', time: msgIndex.time }" />
                    <!-- [已删除]消息 -->
                    <NoticeBody
                        v-else-if="isDeleteMsg(msgIndex)"
                        :key="'delete-' + msgIndex.message_id"
                        :data="{ sub_type: 'delete' }" />
                    <!-- 合并转发消息忽略是不是自己的判定 -->
                    <MsgBody
                        :data="msgIndex"
                        :type="'merge'"
                        :image-list-header="mergeImgHead" />
                </template>
            </TransitionGroup>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { v4 as uuid } from 'uuid'
    import { computed, ref, watch, onMounted } from 'vue'

    import MsgBody from '@renderer/components/MsgBody.vue'
    import NoticeBody from '@renderer/components/NoticeBody.vue'

    import { createMessageImageList } from '@renderer/function/msg'
    import { i18n } from '@renderer/main'
    import { useSettingsStore } from '@renderer/state/settings'
    import { type MergeStackData } from '@renderer/function/elements/information'
    import { isDeleteMsg, isShowTime } from '@renderer/function/utils/msgUtil'
    import { useChatStore } from '@renderer/state/chat'

    defineOptions({ name: 'MergePan' })

    const $t = i18n.global.t

    const chatStore = useChatStore()
    const settingsStore = useSettingsStore()
    const stack = chatStore.mergeMsgStack
    const nowData = ref<MergeStackData | undefined>()
    const mergeImgHead = computed(() => createMessageImageList(nowData.value?.messageList ?? []))

    /**
     * 退出一层合并转发弹窗
     */
    function exitMergeMsg() {
        stack.length--
    }

    /**
     * 关闭合并转发弹窗
     */
    function closeMergeMsg() {
        stack.length = 0
    }

    function isMergeOpen() {
        return stack.length > 0
    }

    defineExpose({ closeMergeMsg, isMergeOpen })

    onMounted(() => {
        watch(
            () => chatStore.mergeMsgStack.length,
            () => {
                // 最后一个保留下来做展开关闭动画
                if (stack.length === 0) {
                    // 清理下垃圾
                    chatStore.mergeMessageImgList = undefined
                }
                else nowData.value = stack.at(-1)
            }
        )
        watch(
            () => nowData.value?.imageList,
            () => {
                if (chatStore.mergeMsgStack.length === 0 || nowData.value?.imageList === undefined) return
                chatStore.mergeMessageImgList = nowData.value.imageList
            }
        )
    })
</script>

<style scoped>
    /* 消息动画 */
    .msglist-move {
        transition: all 0.3s;
    }

    .msglist-enter-active {
        transition: all 0.4s;
    }

    .msglist-leave-active {
        transition: all 0.2s;
    }

    .msglist-enter-from {
        transform: translateX(-50px);
        opacity: 0;
    }

    .msglist-leave-to {
        opacity: 0;
    }
</style>
