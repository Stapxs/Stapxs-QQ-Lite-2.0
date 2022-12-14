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
    </div>
</template>
  
<script lang="ts">
import { defineComponent, ref } from 'vue'
import { runtimeData } from '@/function/msg'

export default defineComponent({
    name: 'NoticeBody',
    props: ['data'],
    data () {
        return {
            info: ref(this.data) as { [key: string]: any }
        }
    },
    mounted () {
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
  