import { computed, ref, shallowRef, watch } from 'vue'
import { defineStore } from 'pinia'
import { Connector, login } from '@renderer/function/connect'
import { normalizeMessagesForPreview } from '@renderer/function/msg'
import { buildMsgList } from '@renderer/function/utils/msgUtil'
import { QuotedMessageLoader, QuoteRequestError, requestQuotedMessage } from '@renderer/function/utils/quotedMessage'
import type { QuoteEntry } from '@renderer/function/utils/quotedMessage'
import { useAuthStore } from './auth'
import { useChatStore } from './chat'

export const useQuotedMessagesStore = defineStore('quoted-messages', () => {
    const authStore = useAuthStore()
    const chatStore = useChatStore()
    const cachedEntries = shallowRef(new Map<string, QuoteEntry>())
    const scopeVersion = ref(0)
    const canRequest = computed(() => login.status && Boolean(authStore.loginInfo.uin) &&
        Boolean(chatStore.chatInfo.show.id) && Boolean(authStore.jsonMap))

    const loader = new QuotedMessageLoader(async (id, isActive) => {
        if (!canRequest.value) throw new QuoteRequestError('unavailable')
        return requestQuotedMessage({
            id,
            session: { ...chatStore.chatInfo.show, selfId: authStore.loginInfo.uin },
            action: authStore.jsonMap?.get_message?.name ?? 'get_msg',
            call: (action, params, timeout) => Connector.callRawApi(action, params, timeout),
            normalize: raw => normalizeMessagesForPreview(buildMsgList([raw])),
            isActive,
        })
    }, () => { cachedEntries.value = new Map(loader.entries) })

    // Synchronous invalidation also catches A -> B -> A within a single Vue tick.
    watch(() => [login.status, login.address, authStore.loginInfo.uin, authStore.jsonMap,
        chatStore.chatInfo.show, chatStore.chatInfo.show.type, chatStore.chatInfo.show.id], () => {
        loader.reset()
        scopeVersion.value++
    }, { flush: 'sync' })

    function localMessage(id: string | number) {
        return chatStore.messageList.find(message => String(message.message_id) === String(id) &&
            Array.isArray(message.message) && message.sender)
    }

    function entry(id: string | number) {
        // Subscribe to cache snapshots without making message objects deep reactive.
        const cached = cachedEntries.value.get(String(id))
        if (cached?.message?.revoke) return cached
        const local = localMessage(id)
        return local ? { status: 'ready' as const, message: local } : cached
    }

    function load(id: string | number, retry = false) {
        const local = localMessage(id)
        if (local) return Promise.resolve(local)
        return loader.load(id, retry)
    }

    function revoke(id: string | number) { loader.revoke(id) }

    return { scopeVersion, canRequest, entry, load, revoke }
})
