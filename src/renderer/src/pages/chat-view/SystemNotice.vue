<!--
 * @FileDescription: 聊天面板页面（系统消息面板）
 * @Author: Stapxs
 * @Date: 2023/01/09
 * @Version: 1.0 - 初始版本
 * @Description: 此面板为点击系统消息后单独显示的面板，用于覆盖聊天面板
-->

<template>
    <div id="chat-pan"
        :class="{
            'chat-pan': true,
            'sys-not-pan': true,
            'open': runtimeData.tags.openSideBar,
            'withBar': needBar()
        }">
        <div>
            <font-awesome-icon :icon="['fas', 'angle-left']" @click="exit" />
            <span>{{ $t('系统消息') }}</span>
        </div>
        <div class="sys-not-list">
            <template v-for="(notice, index) in runtimeData.systemNoticesList"
                :key="'sysNot-' + index">
                <div v-if="notice.request_type == 'friend'">
                    <div>
                        <img :src="'https://q1.qlogo.cn/g?b=qq&s=0&nk=' + notice.user_id">
                        <div>
                            <span>{{ notice.user_id }}
                                {{ $t('请求加为好友') }}</span>
                            <a>{{
                                Intl.DateTimeFormat(trueLang, {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: 'numeric',
                                    minute: 'numeric',
                                }).format(new Date(notice.time * 1000))
                            }}</a>
                            <a>{{ $t('留言：') + notice.comment }}</a>
                        </div>
                    </div>
                    <div>
                        <button class="ss-button"
                            @click="dealFriend(notice, false)">
                            {{ $t('拒绝') }}
                        </button>
                        <button class="ss-button"
                            @click="dealFriend(notice, true)">
                            {{ $t('同意') }}
                        </button>
                    </div>
                </div>
                <div v-else-if="notice.request_type == 'group'">
                    <div>
                        <img :src="'https://p.qlogo.cn/gh/' + notice.group_id + '/' + notice.group_id + '/0'">
                        <div>
                            <span>{{ getName(notice.user_id) }}
                                {{ $t('邀请你加入群聊') }}
                                {{ notice.group_id }}</span>
                            <a>{{
                                Intl.DateTimeFormat(trueLang, {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: 'numeric',
                                    minute: 'numeric',
                                }).format(new Date(notice.time * 1000))
                            }}</a>
                            <a>{{ $t('留言：') + notice.comment }}</a>
                        </div>
                    </div>
                    <div>
                        <button class="ss-button" @click="dealGroupAdd(notice, false)">
                            {{ $t('拒绝') }}
                        </button>
                        <button class="ss-button" @click="dealGroupAdd(notice, true)">
                            {{ $t('同意') }}
                        </button>
                    </div>
                </div>
                <div v-else v-show="dev">
                    <div>
                        <img>
                        <div>
                            <span>{{ $t('sys_notice_unknow') }}</span>
                            <a style="color: var(--color-font-2);word-wrap: anywhere;">
                                request: {{ notice.request_type }}; sub: {{ notice.sub_type }}
                            </a>
                        </div>
                    </div>
                </div>
            </template>
        </div>
    </div>
</template>

<script lang="ts">
    import { defineComponent } from 'vue'

    import { runtimeData } from '@renderer/function/msg'
    import { Connector } from '@renderer/function/connect'
    import { getTrueLang, needBar } from '@renderer/function/utils/systemUtil'
    import { backend } from '@renderer/runtime/backend'

    export default defineComponent({
        name: 'ChatSystemNotice',
        emits: ['userClick'],
        data() {
            return {
                backend,
                needBar,
                trueLang: getTrueLang(),
                runtimeData: runtimeData,
                dev: import.meta.env.DEV,
            }
        },
        methods: {
            /**
             * 返回按钮
             */
            exit() {
                this.$emit('userClick', { id: 0 })
            },

            /**
             * 处理好友申请
             * @param notice 申请信息
             * @param deal 同意 / 拒绝
             */
            dealFriend(notice: { flag: string }, deal: boolean) {
                Connector.send(
                    'set_friend_add_request',
                    {
                        flag: notice.flag,
                        approve: deal,
                    },
                    'setFriendAdd_' + notice.flag,
                )
            },

            /**
             * 处理入群申请
             * @param notice 申请信息
             * @param deal 同意 / 拒绝
             */
            dealGroupAdd(
                notice: { flag: string; sub_type: string },
                deal: boolean,
            ) {
                Connector.send(
                    'set_group_add_request',
                    {
                        flag: notice.flag,
                        approve: deal,
                        sub_type: notice.sub_type,
                    },
                    'setGroupAdd_' + notice.flag,
                )
            },

            getName(id: number) {
                return runtimeData.userList.filter(
                    (user) => user.user_id == id,
                )[0].nickname
            },
        },
    })
</script>
