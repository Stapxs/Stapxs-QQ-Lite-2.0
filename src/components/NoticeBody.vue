<!--
 * @FileDescription: 通知消息模板
 * @Author: Stapxs
 * @Date: 2022/12/04
 * @Version: 1.0
-->

<template>
    <div class="note">
        <div class="note-recall note-base" v-if="data.sub_type === 'recall'">
            <a>{{ info.name }}</a>
            <span>{{ $t('chat_notice_recall') }}</span>
            <div>

            </div>
        </div>
        <div class="note-time note-base" v-if="data.sub_type === 'time'">
            <a>{{
                Intl.DateTimeFormat(trueLang, getTimeConfig(new Date(data.time * 1000)))
                    .format(new Date(data.time * 1000))
            }}</a>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'
import { runtimeData } from '@/function/msg'
import { getTrueLang } from '@/function/util'

export default defineComponent({
    name: 'NoticeBody',
    props: ['data'],
    data() {
        return {
            trueLang: getTrueLang(),
            info: ref(this.data) as { [key: string]: any }
        }
    },
    methods: {
        getTimeConfig(date: Date) {
            let base = { hour: "numeric", minute: "numeric", second: "numeric" } as Intl.DateTimeFormatOptions
            const nowDate = new Date()
            const todayDate = new Date().setHours(0, 0, 0, 0)
            const paramsDate = date.setHours(0, 0, 0, 0)
            if(todayDate != paramsDate) {
                if (nowDate.getFullYear() == date.getFullYear() && nowDate.getMonth() == date.getMonth()) {
                    base.weekday = 'short'
                } else if(nowDate.getFullYear() == date.getFullYear()) {
                    base.day = 'numeric'
                    base.month = 'short'
                } else {
                    base.day = 'numeric'
                    base.month = 'short'
                    base.year = 'numeric'
                }
            }
            return base
        }
    },
    mounted() {
        if (this.info.sub_type === 'recall') {
            // 补全撤回者信息
            if (runtimeData.chatInfo.show.type === 'group') {
                const id = this.info.operator_id
                // 寻找群成员信息
                if (runtimeData.chatInfo.info.group_members !== undefined) {
                    const back = runtimeData.chatInfo.info.group_members.filter((item) => {
                        return item.user_id === Number(id)
                    })
                    if (back.length === 1) {
                        this.info.name = back[0].card === '' ? back[0].nickname : back[0].card
                    } else {
                        this.info.name = id
                    }
                } else {
                    this.info.name = id
                }
            } else {
                this.info.name = runtimeData.chatInfo.show.name
            }
        }
    }
})
</script>
