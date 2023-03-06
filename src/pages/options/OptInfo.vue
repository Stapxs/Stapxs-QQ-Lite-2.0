<!--
 - @FileDescription: 设置页面（群/好友设置页面）
 - @Author: Stapxs
 - @Date: 2023/2/7
 - @Version: 1.0 - 初始版本
-->

<template>
    <div class="info-pan-set" style="padding:0">
        <!-- 公用设置 -->
        <div class="opt-item">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512">
                <path
                    d="M32 32C32 14.3 46.3 0 64 0H320c17.7 0 32 14.3 32 32s-14.3 32-32 32H290.5l11.4 148.2c36.7 19.9 65.7 53.2 79.5 94.7l1 3c3.3 9.8 1.6 20.5-4.4 28.8s-15.7 13.3-26 13.3H32c-10.3 0-19.9-4.9-26-13.3s-7.7-19.1-4.4-28.8l1-3c13.8-41.5 42.8-74.8 79.5-94.7L93.5 64H64C46.3 64 32 49.7 32 32zM160 384h64v96c0 17.7-14.3 32-32 32s-32-14.3-32-32V384z" />
            </svg>
            <div>
                <span>{{ $t('chat_chat_info_option_top') }}</span>
                <span>{{ $t('chat_chat_info_option_top_tip') }}</span>
            </div>
            <label class="ss-switch">
                <input type="checkbox" @change="saveTop" v-model="isTop">
                <div>
                    <div></div>
                </div>
            </label>
        </div>
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
import app from '@/main'
import Option from '@/function/option'

import { defineComponent } from 'vue'
import { runtimeData } from '@/function/msg'
import { UserGroupElem, UserFriendElem } from '@/function/elements/information'
import { Connector } from '@/function/connect'

export default defineComponent({
    name: 'ViewOptInfo',
    props: ['type', 'chat'],
    data() {
        return {
            runtimeData: runtimeData,
            isTop: false
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
        },

        /**
         * 保存置顶信息
         * @param event 点击事件
         */
        saveTop(event: Event) {
            const id = runtimeData.loginInfo.uin
            // 完整的 cookie JSON
            let topInfo = runtimeData.sysConfig.top_info as { [key: string]: number[] }
            if (topInfo == null) {
                topInfo = {}
            }
            // 本人的置顶信息
            let topList = topInfo[id]
            // 数据
            const sender = event.currentTarget as HTMLInputElement
            const value = sender.checked
            // 操作
            if (value) {
                if (topList) {
                    if (topList.indexOf(this.chat.show.id) < 0) {
                        topList.push(this.chat.show.id)
                    }
                } else {
                    topList = [this.chat.show.id]
                }
            } else {
                if (topList) {
                    topList.splice(topList.indexOf(this.chat.show.id), 1)
                }
            }
            // 刷新 cookie
            if (topList) {
                topInfo[id] = topList
                Option.save('top_info', topInfo)
            }
            // 为消息列表内的对象刷新置顶标志
            for (let i = 0; i < runtimeData.onMsgList.length; i++) {
                const item = runtimeData.onMsgList[i]
                if (item.user_id == this.chat.show.id || item.group_id == this.chat.show.id) {
                    runtimeData.onMsgList[i].always_top = value
                    break
                }
            }
            // 重新排序列表
            const newList = [] as (UserFriendElem & UserGroupElem)[]
            let topNum = 1
            runtimeData.onMsgList.forEach((item) => {
                // 排序操作
                if (item.always_top === true) {
                    newList.unshift(item)
                    topNum++
                } else if (item.new_msg === true) {
                    newList.splice(topNum - 1, 0, item)
                } else {
                    newList.push(item)
                }
            })
            runtimeData.onMsgList = newList
        },

        /**
         * 检查并修改 isTop
         */
        updateIsTop() {
            if (runtimeData.sysConfig.top_info != undefined) {
                let topList = runtimeData.sysConfig.top_info[runtimeData.loginInfo.uin]
                if (topList != undefined) {
                    this.isTop = topList.indexOf(this.chat.show.id) >= 0
                }
            }
        }
    },
    mounted() {
        this.updateIsTop()
        this.$watch(() => runtimeData.chatInfo.show.id, () => { this.$nextTick(this.updateIsTop) })
    }
})
</script>

<style scoped>
.opt-item:hover input[type="text"] {
    background: var(--color-card-2);
    transition: background .2s;
}
</style>
