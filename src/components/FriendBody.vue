<template>
  <div class="friend-body"
      :id="'user-' + (data.user_id ? data.user_id : data.group_id)"
      :data-name="data.user_id ? data.nickname : data.group_name"
      :data-nickname="data.user_id ? data.nickname : ''"
      :data-type="data.user_id ? 'friend' : 'group'">
    <img loading="lazy"
     :src="data.user_id ?
      'https://q1.qlogo.cn/g?b=qq&s=0&nk=' + data.user_id :
      'https://p.qlogo.cn/gh/' + data.group_id +'/' + data.group_id + '/0'">
    <div>
      <div>
        <p>{{data.group_name ? data.group_name :
         data.remark === data.nickname ? data.nickname : data.remark + '（' + data.nickname + '）'}}</p>
        <div style="flex:1"></div>
        <a class="time"></a>
      </div>
      <div>
        <a></a>
        <div style="margin-left:10px"></div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'FriendBody',
  props: ['data'],
  methods: {}
}
</script>
