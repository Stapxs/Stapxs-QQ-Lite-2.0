<template>
  <div class="friend-view">
    <div class="friend-list">
      <div>
        <div><span style="border-radius: 7px;">消息</span></div>
      </div>
      <div id="list">
        <FriendBody v-for="item in list" :key="'in' + item.user_id ? item.user_id : item.group_id" :data="item"
          @click.native="userClick(item)"></FriendBody>
      </div>
    </div>
    <div>
      <div class="ss-card">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
          <path
            d="M447 56.25C443.5 42 430.7 31.1 416 31.1H96c-14.69 0-27.47 10-31.03 24.25L3.715 304.9C1.247 314.9 0 325.2 0 335.5v96.47c0 26.51 21.49 48 48 48h416c26.51 0 48-21.49 48-48v-96.47c0-10.32-1.247-20.6-3.715-30.61L447 56.25zM352 352H160L128 288H72.97L121 96h270l48.03 192H384L352 352z" />
        </svg>
        <span>选择联系人开始聊天</span>
      </div>
    </div>
  </div>
</template>

<script>
import FriendBody from '../components/FriendBody.vue'

export default {
  name: 'Messages',
  props: ['list'],
  components: { FriendBody },
  methods: {
    userClick (data) {
      const back = {
        type: data.user_id ? 'user' : 'group',
        id: data.user_id ? data.user_id : data.group_id,
        name: data.group_name ? data.group_name : data.remark === data.nickname ? data.nickname : data.remark + '（' + data.nickname + '）',
        avatar: data.user_id ? 'https://q1.qlogo.cn/g?b=qq&s=0&nk=' + data.user_id : 'https://p.qlogo.cn/gh/' + data.group_id + '/' + data.group_id + '/0'
      }
      // 更新聊天框
      this.$emit('userClick', back)
    },
    addMesage: function (data) {
      this.list.unshift(data)
    }
  }
}
</script>
