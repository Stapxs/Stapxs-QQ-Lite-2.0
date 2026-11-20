<!--
 * @FileDescription: 搜索列表用的会话本体
 * @Author: Mr.Lee
 * @Date:
 *      2025/08/02
 * @Version:
 *      1.0 - 初始版本
 * @Description:
 *      该组件用于展示会话列表的元素。转发和收纳盒设置需要用。直接套用FriendBody开销太大，这个更轻量级
-->
<template>
    <div :key=" 'tiny-' + String(session.group_id ?? session.user_id)"
        class="tiny-session-body"
        :class="{
            'selected': selected,
        }">
        <div />
        <img loading="lazy"
            :title="getShowName(session.group_name || session.nickname, session.remark)"
            :src="session.user_id ? getUserAvatar(session.user_id, authStore.jsonMap) :
                'https://p.qlogo.cn/gh/' + session.group_id + '/' + session.group_id + '/0'">
        <div>
            <p>
                {{ getShowName(session.group_name || session.nickname, session.remark) }}
            </p>
            <div v-if="from === 'global-search' && session.raw_msg">
                <span>{{ session.raw_msg }}</span>
            </div>
            <div v-else>
                <span v-if="session.group_id">{{ $t('群组') }}</span>
                <span v-else-if="session.user_id">{{ $t('好友') }}</span>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { UserGroupElem, UserFriendElem } from '@renderer/function/elements/information'
import { getShowName } from '@renderer/function/utils/msgUtil'
import { getUserAvatar } from '@renderer/function/utils/userAvatar'
import { useAuthStore } from '@renderer/state/auth'

const authStore = useAuthStore()

type Session = UserGroupElem & UserFriendElem

const {
    session,
    selected = false,
    from,
} = defineProps<{
    session: Session,
    selected?: boolean,
    from?: 'global-search'
}>()
</script>
