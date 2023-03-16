<!--
 * @FileDescription: 聊天面板页面（系统消息面板）
 * @Author: Stapxs
 * @Date: 2023/01/09
 * @Version: 1.0 - 初始版本
 * @Description: 此面板为点击系统消息后单独显示的面板，用于覆盖聊天面板
-->

<template>
    <div id="chat-pan"
    :class="'chat-pan sys-not-pan' + (runtimeData.tags.openSideBar ? ' open': '') + (runtimeData.sysConfig.opt_no_window ? ' withBar': '')">
        <div>
            <svg @click="exit" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><path d="M41.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l192 192c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L109.3 256 278.6 86.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-192 192z"/></svg>
            <span>{{ $t('sys_notice') }}</span>
        </div>
        <div class="sys-not-list">
            <template v-for="(notice, index) in runtimeData.systemNoticesList" :key="'sysNot-' + index">
                <div v-if="notice.request_type == 'friend' && notice.sub_type == 'add'"
                    class="sys_not_new_friend">
                    <span>{{ $t('sys_notice_new_friend') }}</span>
                    <div>
                        <div>
                            <img :src="'https://q1.qlogo.cn/g?b=qq&s=0&nk=' + notice.user_id">
                            <div>
                                <span>{{ notice.nickname }}</span>
                                <div>
                                    <span>{{ (notice.sex == 'female' ? '♀ ' : '♂ ') + notice.age }}</span>
                                    <br>
                                    <span>{{ notice.comment }}</span>
                                </div>
                                <span>{{ $t('sys_notice_new_friend_from') + notice.source }}</span>
                            </div>
                        </div>
                        <div>
                            <button @click="dealFriend(notice, false)" class="ss-button">{{ $t('btn_reject') }}</button>
                            <button @click="dealFriend(notice, true)" class="ss-button">{{ $t('btn_accept') }}</button>
                        </div>
                    </div>
                </div>
                <div v-else-if="notice.request_type == 'group' && notice.sub_type == 'add'"
                    class="sys_not_new_friend">
                    <span>{{ $t('sys_notice_new_group_nmember') }}</span>
                    <div>
                        <div>
                            <img :src="'https://q1.qlogo.cn/g?b=qq&s=0&nk=' + notice.user_id">
                            <div>
                                <span>{{ notice.nickname }}</span>
                                <div>
                                    <span style="display: none;"></span>
                                    <span :style="notice.comment == '' ? 'font-style: italic;' : ''">{{ notice.comment == '' ? $t('sys_notice_new_group_nmember_no_comment') : notice.comment }}</span>
                                </div>
                                <span>{{ $t('sys_notice_new_group_nmember_add') + notice.group_name }}</span>
                            </div>
                        </div>
                        <div>
                            <button @click="dealGroupAdd(notice, false)" class="ss-button">{{ $t('btn_reject') }}</button>
                            <button @click="dealGroupAdd(notice, true)" class="ss-button">{{ $t('btn_accept') }}</button>
                        </div>
                    </div>
                </div>
                <div v-else v-show="NODE_ENV == 'development'" class="sys_not_new_friend">
                    <span>不支持的消息类型</span>
                    <a style="color: var(--color-font-2);word-wrap: anywhere;">{{ JSON.stringify(notice) }}</a>
                </div>
            </template>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

import { runtimeData } from '@/function/msg'
import { Connector } from '@/function/connect'

export default defineComponent({
    name: 'ChatSystemNotice',
    components: {},
    data() {
        return {
            runtimeData: runtimeData,
            NODE_ENV: process.env.NODE_ENV
        }
    },
    methods: {
        /**
         * 返回按钮
         */
        exit() {
            this.$emit('userClick', {id: 0})
        },

        /**
         * 处理好友申请
         * @param notice 申请信息
         * @param deal 同意 / 拒绝
         */
        dealFriend(notice:any, deal: boolean) {
            Connector.send(
                'set_friend_add_request',
                {
                    flag: notice.flag,
                    approve: deal
                },
                'setFriendAdd'
            )
        },

        /**
         * 处理入群申请
         * @param notice 申请信息
         * @param deal 同意 / 拒绝
         */
        dealGroupAdd(notice:any, deal: boolean) {
            Connector.send(
                'set_group_add_request',
                {
                    flag: notice.flag,
                    approve: deal,
                    sub_type: notice.sub_type
                },
                'setGroupAdd'
            )
        }
    },
    mounted()  {
        this.$watch(() => runtimeData.systemNoticesList, () => {
            if(runtimeData.systemNoticesList && runtimeData.systemNoticesList.length <= 0) {
                this.exit()
            }
        })
    }
})
</script>
