<!--
 * @FileDescription: 联系人 / 消息列表项模板
 * @Author: Stapxs
 * @Date: 2022/08/14
 * @Version: 1.0
-->

<template>
    <div :id="'user-' + (data.user_id ?? data.group_id)"
        :class="'friend-body' + (select ? ' active' : menu ? ' onmenu' : '')"
        :data-name="data.user_id ? data.nickname : data.group_name"
        :data-nickname="data.user_id ? data.nickname : ''"
        :data-type="data.user_id ? 'friend' : 'group'">
        <div :class="data.new_msg === true ? 'new' : ''" />
        <font-awesome-icon v-if="data.user_id == -10000" :icon="['fas', 'bell']" />
        <font-awesome-icon v-else-if="data.user_id == -10001" :icon="['fas', 'user-group']" />
        <img v-else loading="lazy" :title="getShowName(data.group_name || data.nickname, data.remark)"
            :src="data.user_id ? 'https://q1.qlogo.cn/g?b=qq&s=0&nk=' + data.user_id :
                'https://p.qlogo.cn/gh/' + data.group_id + '/' + data.group_id + '/0'">
        <div>
            <div>
                <p>{{ getShowName(data.group_name || data.nickname, data.remark) }}</p>
                <div style="flex: 1" />
                <a class="time">{{ formatSessionTime(data.time) }}</a>
            </div>
            <div>
                <a v-if="data.highlight" class="highlight">
                    {{ data.highlight }}
                </a>
                <a :class="from == 'friend' ? 'nick' : ''">{{
                    from == 'friend' ? (data.longNick ?? '') : data.raw_msg
                }}</a>
                <div v-if="from == 'message'" style="margin-left: 10px; display: flex">
                    <font-awesome-icon v-if="data.always_top === true" :icon="['fas', 'thumbtack']" />
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { formatSessionTime } from '@renderer/function/utils/systemUtil'
import { getShowName } from '@renderer/function/utils/msgUtil'

defineOptions({ name: 'FriendBody' })

defineProps<{
    data: any
    select?: boolean
    menu?: boolean
    from?: string
}>()

</script>
