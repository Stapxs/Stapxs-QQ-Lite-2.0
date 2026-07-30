<template>
    <div class="qzone-permission-pan">
        <label :for="permissionModeInputId" class="sr-only">{{ $t('说说可见范围') }}</label>
        <select :id="permissionModeInputId"
            v-model="permission.mode"
            class="qzone-permission-select">
            <option value="public">
                {{ $t('所有人可见') }}
            </option>
            <option value="friends">
                {{ $t('好友可见') }}
            </option>
            <option value="allow_some">
                {{ $t('部分好友可见') }}
            </option>
            <option value="private">
                {{ $t('仅自己可见') }}
            </option>
            <option value="deny_some">
                {{ $t('部分好友不可见') }}
            </option>
        </select>
        <template v-if="showList">
            <label for="qzone-permission-search" class="sr-only">{{ $t('搜索联系人') }}</label>
            <input id="qzone-permission-search"
                v-model="searchText"
                class="ss-input qzone-permission-search"
                :placeholder="$t('搜索 ……')">
            <div class="qzone-permission-list">
                <div v-for="session in showSessions"
                    :key="session.user_id"
                    class="qzone-permission-item"
                    @click="toggleSession(session)">
                    <TinySessionBody :session="session as any" :selected="isSelected(session)" />
                </div>
            </div>
        </template>
    </div>
</template>

<script setup lang="ts">
    import { computed, reactive, ref } from 'vue'
    import TinySessionBody from '@renderer/components/TinySessionBody.vue'
    import { UserGroupElem } from '@renderer/function/elements/information'
    import { matchPinyin } from '@renderer/function/utils/pinyin'
    import { i18n } from '@renderer/main'

    defineOptions({ name: 'QzonePermissionPan' })

    const permission = defineModel<{
        mode: 'public' | 'friends' | 'allow_some' | 'private' | 'deny_some'
        userIds: number[]
    }>({ required: true })

    const { sessions } = defineProps<{
        sessions: UserGroupElem[]
    }>()

    const $t = i18n.global.t
    const searchText = ref('')
    const selectedMap = reactive(new Set<number>())
    const permissionModeInputId = `qzone-permission-mode-${Math.random().toString(36).slice(2, 9)}`
    const showList = computed(() => {
        return ['allow_some', 'deny_some'].includes(permission.value.mode)
    })

    for (const userId of permission.value.userIds) {
        selectedMap.add(userId)
    }

    const showSessions = computed(() => {
        const value = searchText.value.trim().toLowerCase()
        const filteredSessions = !value ? sessions : sessions.filter((session) => {
            const name = `${session.nickname}${session.remark ?? ''}`.toLowerCase()
            if (name.includes(value)) return true
            const id = Number(session.user_id)
            if (String(id).includes(value)) return true
            if (session.py_name && matchPinyin(session.py_name, value)) return true
            return false
        })

        return [...filteredSessions].sort((a, b) => {
            const aSelected = selectedMap.has(getSessionId(a))
            const bSelected = selectedMap.has(getSessionId(b))
            if (aSelected === bSelected) return 0
            return aSelected ? -1 : 1
        })
    })

    function getSessionId(session: UserGroupElem) {
        return Number(session.user_id)
    }

    function isSelected(session: UserGroupElem) {
        return selectedMap.has(getSessionId(session))
    }

    function toggleSession(session: UserGroupElem) {
        const id = getSessionId(session)
        if (selectedMap.has(id)) {
            selectedMap.delete(id)
        } else {
            selectedMap.add(id)
        }
        permission.value.userIds = Array.from(selectedMap.values())
    }
</script>

<style scoped>
    .qzone-permission-pan {
        display: flex;
        flex-direction: column;
        gap: 12px;
        min-height: 220px;
    }

    .qzone-permission-search {
        width: 100%;
        box-sizing: border-box;
    }

    .qzone-permission-list {
        overflow-y: scroll;
        overflow-x: hidden;
        min-height: 200px;
        max-height: 30vh;
        width: 40vw;
        padding: 8px;
    }

    .qzone-permission-item {
        width: 100%;
        cursor: pointer;
        border-radius: 8px;
    }

    .qzone-permission-item + .qzone-permission-item {
        margin-top: 6px;
    }

    .qzone-permission-select {
        background: var(--color-card);
        height: 35px;
        color: var(--color-font);
        border: none;
        border-radius: 8px;
        padding: 10px 12px;
        font-size: 0.9rem;
    }
</style>
