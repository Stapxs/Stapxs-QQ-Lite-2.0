<!--
 - @FileDescription: 设置页面（群/好友设置页面）
 - @Author: Stapxs
 - @Date: 2023/2/7
 - @Version: 1.0 - 初始版本
-->

<template>
    <div class="info-pan-set" style="padding:0">
        <!-- 公用设置 -->
        <!-- 群设置 -->
        <template v-if="type == 'group'">
            <div class="opt-item"
                v-if="(chat.info.group_info.gOwner && chat.info.group_info.gOwner === runtimeData.loginInfo.uin) || (chat.info.group_info.gAdmins && chat.info.group_info.gAdmins.indexOf(runtimeData.loginInfo.uin) >= 0)">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512">
                    <path
                        d="M64 32C28.7 32 0 60.7 0 96V416c0 35.3 28.7 64 64 64H512c35.3 0 64-28.7 64-64V96c0-35.3-28.7-64-64-64H64zm80 256h64c44.2 0 80 35.8 80 80c0 8.8-7.2 16-16 16H80c-8.8 0-16-7.2-16-16c0-44.2 35.8-80 80-80zm96-96c0 35.3-28.7 64-64 64s-64-28.7-64-64s28.7-64 64-64s64 28.7 64 64zm128-32H496c8.8 0 16 7.2 16 16s-7.2 16-16 16H368c-8.8 0-16-7.2-16-16s7.2-16 16-16zm0 64H496c8.8 0 16 7.2 16 16s-7.2 16-16 16H368c-8.8 0-16-7.2-16-16s7.2-16 16-16zm0 64H496c8.8 0 16 7.2 16 16s-7.2 16-16 16H368c-8.8 0-16-7.2-16-16s7.2-16 16-16z">
                    </path>
                </svg>
                <div>
                    <span>{{ $t('chat_chat_info_group_name') }}</span>
                    <span>{{ $t('chat_chat_info_group_name_tip') }}</span>
                </div>
                <input class="ss-input" style="width:150px" type="text" @keyup="setGroupName"
                    v-model="runtimeData.chatInfo.show.name">
            </div>
            <div class="opt-item">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
                    <path
                        d="M64 32C28.7 32 0 60.7 0 96V416c0 35.3 28.7 64 64 64H288V368c0-26.5 21.5-48 48-48H448V96c0-35.3-28.7-64-64-64H64zM448 352H402.7 336c-8.8 0-16 7.2-16 16v66.7V480l32-32 64-64 32-32z" />
                </svg>
                <div>
                    <span>{{ $t('chat_chat_info_group_card') }}</span>
                    <span>{{ $t('chat_chat_info_group_card_tip') }}</span>
                </div>
                <input class="ss-input" style="width:150px" type="text" @keyup="setGroupCard" v-model="runtimeData.chatInfo.info.me_info.card">
            </div>
        </template>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { runtimeData } from '@/function/msg'
import { Connector } from '@/function/connect'

export default defineComponent({
    name: 'ViewOptInfo',
    props: ['type', 'chat'],
    data() {
        return {
            runtimeData: runtimeData
        }
    },
    methods: {
        /**
         * 设置群名片
         * @param event 按键事件
         */
        setGroupCard(event: KeyboardEvent) {
            if (event.key === 'Enter') {
                Connector.send(
                    'set_group_card', 
                    {
                        group_id: this.chat.show.id,
                        user_id: runtimeData.loginInfo.uin,
                        card: runtimeData.chatInfo.info.me_info.card
                    },
                    'setGroupCard'
                )
            }
        },

        /**
         * 设置群名
         * @param event 按键事件
         */
        setGroupName(event: KeyboardEvent) {
            if (event.key === 'Enter' && runtimeData.chatInfo.show.name != '') {
                Connector.send(
                    'set_group_name', 
                    {
                        group_id: this.chat.show.id,
                        group_name: runtimeData.chatInfo.show.name
                    },
                    'setGroupName'
                )
            }
        }
    }
})
</script>

<style scoped>
.opt-item:hover input[type="text"] {
    background: var(--color-card-2);
    transition: background .2s;
}
</style>
