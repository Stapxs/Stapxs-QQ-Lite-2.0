<!--
 * @FileDescription: 群成员消息悬浮窗
 * @Author: Mr.Lee
 * @Date: 2025/09/01
 *        2026/01/03
 * @Version: 1.0
 *           2.0 并入新式提示工具系统
-->
<template>
    <div v-if="userInfo" class="member-info ss-card"
        :class="{
            leave: typeof userInfo === 'number',
        }">
        <!-- 已退群 -->
        <template v-if="typeof userInfo === 'number'">
            <div>
                <img :src="'https://q1.qlogo.cn/g?b=qq&s=0&nk=' + userInfo">
                <div>
                    <span name="id">{{ userInfo }}</span>
                    <div>
                        <a>{{ $t('已退群( {userId} )', { userId: userInfo }) }}</a>
                    </div>
                </div>
            </div>
        </template>
        <!-- 群成员 -->
        <template v-else>
            <div>
                <img :src="getUserAvatar(userInfo.user_id, chatStore.chatInfo.show.type === 'user' ? authStore.jsonMap : undefined)">
                <div>
                    <span name="id">{{ userInfo.user_id }}</span>
                    <div>
                        <a>{{ userInfo.card ? userInfo.card : userInfo.nickname }}</a>
                        <span :class="titleClass">
                            <template v-if="userInfo?.is_robot">
                                {{ $t('机器人') }}
                            </template>
                            <template v-if="userInfo?.role == 'owner'">
                                {{ $t('群主') }}
                            </template>
                            <template v-if="userInfo?.role == 'admin'">
                                {{ $t('管理员') }}
                            </template>
                            <template v-if="userInfo?.level">
                                {{ 'Lv.' + userInfo.level }}
                            </template>
                        </span>
                        <span v-if="userInfo?.is_robot" class="robot">{{ $t('机器人') }}</span>
                        <span v-if="userInfo?.role == 'owner'" class="owner">{{ $t('群主') }}</span>
                        <span v-else-if="userInfo?.role == 'admin'" class="admin">{{ $t('管理员') }}</span>
                    </div>
                </div>
            </div>
            <div class="member">
                <div>
                    <template v-if="userInfo.banTime">
                        <font-awesome-icon style="color: var(--color-red)" :icon="['fas', 'fa-volume-mute']" />
                        {{ $t('禁言中') }}
                    </template>
                </div>
                <span v-if="userInfo.join_time">
                    {{
                        $t('{time} 加入群聊', {
                            time: Intl.DateTimeFormat(getTrueLang(), {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                            }).format(
                                new Date(userInfo.join_time * 1000),
                            ),
                        })
                    }}
                </span>
            </div>
        </template>
    </div>
</template>

<script setup lang="ts">
import { getTrueLang } from '@renderer/function/utils/systemUtil';
import { getUserAvatar } from '@renderer/function/utils/userAvatar'
import { useAuthStore } from '@renderer/state/auth'
import { useChatStore } from '@renderer/state/chat'

const authStore = useAuthStore()
const chatStore = useChatStore()

type IUser = any

const { user: userProp } = defineProps<{
    user: IUser | number | (() => IUser | number)
}>()

let userInfo: IUser | number
if (typeof userProp === 'function') {
    userInfo = userProp()
} else {
    userInfo = userProp
}

const titleClass = {
    'user-title': true,
    'robot': userInfo?.is_robot,
    'owner': userInfo?.role == 'owner',
    'admin': userInfo?.role == 'admin',
}
</script>

<style scoped>
.tooltip-enter-active, .tooltip-leave-active {
    transition: opacity 0.2s, transform 0.2s;
    transform-origin: top;
}
.tooltip-enter-from, .tooltip-leave-to {
    opacity: 0;
    transform: scaleY(0) translate(-20px, calc(-100% - 0.8rem));
}
.tooltip-enter-to, .tooltip-leave-from {
    opacity: 1;
    transform: scaleY(1) translate(-20px, calc(-100% - 0.8rem));
}
</style>
