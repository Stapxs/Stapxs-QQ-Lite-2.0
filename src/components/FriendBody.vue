<template>
  <div :class="'friend-body' + ( select ? ' active' : '' )"
      :id="'user-' + (data.user_id ? data.user_id : data.group_id)"
      :data-name="data.user_id ? data.nickname : data.group_name"
      :data-nickname="data.user_id ? data.nickname : ''"
      :data-type="data.user_id ? 'friend' : 'group'">
    <div :class="(data.new_msg === true ? 'new' : '')"></div>
    <img loading="lazy"
    :title="data.group_name ? data.group_name :
         data.remark === data.nickname ? data.nickname : data.remark + '（' + data.nickname + '）'"
     :src="data.user_id ?
      'https://q1.qlogo.cn/g?b=qq&s=0&nk=' + data.user_id :
      'https://p.qlogo.cn/gh/' + data.group_id +'/' + data.group_id + '/0'">
    <div>
      <div>
        <p>{{data.group_name ? data.group_name :
         data.remark === data.nickname ? data.nickname : data.remark + '（' + data.nickname + '）'}}</p>
        <div style="flex:1"></div>
        <a class="time">{{ data.time !== undefined ? Intl.DateTimeFormat(trueLang, {hour:"numeric",minute:"numeric",second:"numeric"}).format(new Date(data.time)) : '' }}</a>
      </div>
      <div>
        <a>{{ data.raw_msg }}</a>
        <div style="margin-left:10px"></div>
      </div>
    </div>
  </div>
</template>

<script>
import { getTrueLang } from '../assets/js/util'

export default {
  name: 'FriendBody',
  props: ['data', 'select'],
  data () {
    return {
      trueLang: getTrueLang()
    }
  },
  methods: {}
}
</script>
