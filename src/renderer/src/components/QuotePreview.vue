<template>
    <div ref="preview" :class="['msg-replay', { me: isMe }]">
        <button type="button" class="quote-open" :aria-label="label"
            @click.stop="activate" />
        <div v-if="original && !original.revoke">
            <span>{{ original.sender.card || original.sender.nickname }} {{ time }}</span>
            <font-awesome-icon :icon="['fas', 'turn-up']" />
        </div>
        <span v-if="original?.revoke" class="msg-unknown">{{ $t('消息已撤回') }}</span>
        <MsgBody v-else-if="body" :data="body" type="body"
            inert
            :global-me="isMe ? 'Y' : ''"
            :id-prefix="`quote-preview-${sourceId}-`" />
        <span v-else-if="original" class="quote-summary">{{ getMsgRawTxt(original) || $t('空消息') }}</span>
        <span v-else class="msg-unknown" aria-live="polite">
            {{ state?.status === 'loading' ? $t('正在加载引用消息……') :
                state?.status === 'error' ? $t('原消息暂不可用，点击重试') : $t('（查看回复消息）') }}
        </span>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import MsgBody from './MsgBody.vue'
import { i18n } from '@renderer/main'
import { useQuotedMessagesStore } from '@renderer/state/quotedMessages'
import { useChatStore } from '@renderer/state/chat'
import { getMsgRawTxt } from '@renderer/function/utils/msgUtil'
import { quotePreviewMessage } from '@renderer/function/utils/quotedMessage'
import { getTrueLang, getViewTime } from '@renderer/function/utils/systemUtil'

defineOptions({ name: 'QuotePreview' })
const props = defineProps<{
    messageId: string | number
    sourceId: string | number
    isMe: boolean
    remote: boolean
}>()
const emit = defineEmits<{ scrollToMsg: [id: string] }>()
const $t = i18n.global.t
const quotes = useQuotedMessagesStore()
const chatStore = useChatStore()
const preview = ref<HTMLElement | null>(null)
const visible = ref(false)
const state = computed(() => props.remote ? quotes.entry(props.messageId) : undefined)
const original = computed(() => state.value?.message ??
    chatStore.messageList.find(message => String(message.message_id) === String(props.messageId) &&
        Array.isArray(message.message) && message.sender))
const body = computed(() => quotePreviewMessage(original.value))
const label = computed(() => [$t('跳转到引用消息'), original.value && !original.value.revoke ?getMsgRawTxt(original.value) : ''].filter(Boolean).join(' '))
const time = computed(() => original.value && !original.value.revoke ?new Intl.DateTimeFormat(getTrueLang(), { month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric' })
        .format(getViewTime(Number(original.value.time))) : '')
let observer: IntersectionObserver | undefined

function prefetch() {
    if (props.remote && visible.value && quotes.canRequest && !original.value) {
        void quotes.load(props.messageId)
    }
}

function activate() {
    if (props.remote && state.value?.status === 'error') void quotes.load(props.messageId, true)
    emit('scrollToMsg', 'chat-' + props.messageId)
}

watch(() => [props.messageId, quotes.scopeVersion, quotes.canRequest, visible.value], prefetch)
onMounted(() => {
    if (typeof IntersectionObserver === 'undefined') {
        visible.value = true
        return
    }
    observer = new IntersectionObserver(entries => {
        visible.value = entries.some(entry => entry.isIntersecting)
    })
    if (preview.value) observer.observe(preview.value)
})
onUnmounted(() => observer?.disconnect())
</script>

<style scoped>
.msg-replay { position: relative; }
.quote-open { position: absolute; inset: 0; z-index: 1; border: 0; background: transparent; cursor: pointer; }
.quote-open:focus-visible { outline: 2px solid var(--color-main); outline-offset: -2px; }
.msg-replay > div:not(.body-only) { display: flex; }
.msg-replay > div:not(.body-only) span { margin-right: 25px; font-size: 0.75rem; opacity: 0.7; flex: 1; }
.msg-replay > div:not(.body-only) svg { height: 0.7rem; opacity: 0.7; }
.msg-replay :deep(.body-only span), .msg-replay :deep(.body-only a) { font-size: 0.8rem !important; }
.quote-summary { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
.msg-replay :deep(.body-only) { max-height: 160px; overflow: hidden; }
</style>
