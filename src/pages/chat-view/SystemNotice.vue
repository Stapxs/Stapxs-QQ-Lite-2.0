<!--
 * @FileDescription: 聊天面板页面（系统消息面板）
 * @Author: Stapxs
 * @Date: 2023/01/09
 * @Version: 1.0 - 初始版本
 * @Description: 此面板为点击系统消息后单独显示的面板，用于覆盖聊天面板
-->

<template>
    <div :class="'chat-pan' + (runtimeData.tags.openSideBar ? ' open': '') + ' sys-not-pan'" id="chat-pan">
        <div>
            <svg @click="exit" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><path d="M41.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l192 192c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L109.3 256 278.6 86.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-192 192z"/></svg>
            <span>系统消息</span>
        </div>
        <div class="sys-not-list">
            <template v-for="(notice, index) in runtimeData.systemNoticesList" :key="'sysNot-' + index">
                <div v-if="notice.request_type == 'friend' && notice.sub_type == 'add'"
                    class="sys_not_new_friend">
                    <span>新朋友</span>
                    <div>
                        <img :src="'https://q1.qlogo.cn/g?b=qq&s=0&nk=' + notice.user_id">
                        <div>
                            <span>{{ notice.nickname }}</span>
                            <div>
                                <span>{{ (notice.sex == 'female' ? '♀ ' : '♂ ') + notice.age }}</span>
                                <span>{{ notice.comment }}</span>
                            </div>
                            <span>{{ $t('sys_notice_new_friedd_from') + notice.source }}</span>
                        </div>
                    </div>
                </div>
            </template>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

import { runtimeData } from '@/function/msg';

export default defineComponent({
    name: 'ChatSystemNotice',
    components: {},
    data() {
        return {
            runtimeData: runtimeData
        }
    },
    methods: {
        exit() {
            this.$emit('userClick', {id: 0})
        }
    }
})
</script>
