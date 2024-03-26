<!--
 * @FileDescription: 联系人 / 消息列表项模板
 * @Author: Stapxs
 * @Date: 2022/08/14
 * @Version: 1.0
-->

<template>
    <div :class="'friend-body' + (select ? ' active' : (menu ? ' onmenu' : ''))"
        :id="'user-' + (data.user_id ? data.user_id : data.group_id)"
        :data-name="data.user_id ? data.nickname : data.group_name" :data-nickname="data.user_id ? data.nickname : ''"
        :data-type="data.user_id ? 'friend' : 'group'">
        <div :class="(data.new_msg === true ? 'new' : '')"></div>
        <svg v-if="data.user_id == -10000"  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M224 0c-17.7 0-32 14.3-32 32V51.2C119 66 64 130.6 64 208v18.8c0 47-17.3 92.4-48.5 127.6l-7.4 8.3c-8.4 9.4-10.4 22.9-5.3 34.4S19.4 416 32 416H416c12.6 0 24-7.4 29.2-18.9s3.1-25-5.3-34.4l-7.4-8.3C401.3 319.2 384 273.9 384 226.8V208c0-77.4-55-142-128-156.8V32c0-17.7-14.3-32-32-32zm45.3 493.3c12-12 18.7-28.3 18.7-45.3H224 160c0 17 6.7 33.3 18.7 45.3s28.3 18.7 45.3 18.7s33.3-6.7 45.3-18.7z"/></svg>
        <img v-else loading="lazy" :title="getShowName()" :src="data.user_id ?
                    'https://q1.qlogo.cn/g?b=qq&s=0&nk=' + data.user_id :
                    'https://p.qlogo.cn/gh/' + data.group_id + '/' + data.group_id + '/0'">
        <div>
            <div>
                <p>{{getShowName()}}</p>
                <div style="flex:1"></div>
                <a class="time">{{ data.time !== undefined ? Intl.DateTimeFormat(trueLang,
                        { hour: "numeric", minute: "numeric" }).format(new Date(data.time)) : ''
                }}</a>
            </div>
            <div>
                <a>{{ data.raw_msg }}</a>
                <div style="margin-left:10px;display:flex;">
                    <svg v-if="data.always_top === true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512">
                        <path
                            d="M32 32C32 14.3 46.3 0 64 0H320c17.7 0 32 14.3 32 32s-14.3 32-32 32H290.5l11.4 148.2c36.7 19.9 65.7 53.2 79.5 94.7l1 3c3.3 9.8 1.6 20.5-4.4 28.8s-15.7 13.3-26 13.3H32c-10.3 0-19.9-4.9-26-13.3s-7.7-19.1-4.4-28.8l1-3c13.8-41.5 42.8-74.8 79.5-94.7L93.5 64H64C46.3 64 32 49.7 32 32zM160 384h64v96c0 17.7-14.3 32-32 32s-32-14.3-32-32V384z" />
                    </svg>
                </div>
            </div>
        </div>
    </div>
</template>
  
<script lang="ts">
import { defineComponent } from 'vue'
import { getTrueLang } from '@/function/util'

export default defineComponent({
    name: 'FriendBody',
    props: ['data', 'select', 'menu'],
    data () {
        return {
            trueLang: getTrueLang()
        }
    },
    methods: {
        getShowName() {
            const group = this.data.group_name
            const remark = this.data.remark
            const nickname = this.data.nickname
            if(group) return group
            else {
                if(!remark || remark == nickname) {
                    return nickname
                } else {
                    return remark + '（' + nickname + '）'
                }
            }
        }
    }
})
</script>
  