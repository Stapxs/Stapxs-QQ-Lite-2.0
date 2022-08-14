<template>
  <div class="friend-view">
    <div class="friend-list">
      <div>
        <span>联系人</span>
        <label>
          <input v-model="searchInfo" @input="search" type="text" placeholder="搜索 ……">
        </label>
      </div>
      <div id="list"
      v-infinite-scroll="addLoad"
      infinite-scroll-disabled="loading"
      infinite-scroll-distance="10"
      infinite-scroll-immediate-check="false">
        <FriendBody
          v-for="item in showData"
          :key="'fb-' + (item.user_id ? item.user_id : item.group_id)"
          :data="item"
          @click.native="userClick(item)"></FriendBody>
      </div>
    </div>
    <div>
      <div class="ss-card">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M447 56.25C443.5 42 430.7 31.1 416 31.1H96c-14.69 0-27.47 10-31.03 24.25L3.715 304.9C1.247 314.9 0 325.2 0 335.5v96.47c0 26.51 21.49 48 48 48h416c26.51 0 48-21.49 48-48v-96.47c0-10.32-1.247-20.6-3.715-30.61L447 56.25zM352 352H160L128 288H72.97L121 96h270l48.03 192H384L352 352z"/></svg>
        <span>选择联系人开始聊天</span>
      </div>
    </div>
  </div>
</template>

<script>
import Util from '../assets/js/util'

import FriendBody from '../components/FriendBody.vue'

export default {
  name: 'Friends',
  props: ['list'],
  data () {
    return {
      listPage: 1,
      loading: false,
      showData: [],
      isSearch: false,
      searchInfo: ''
    }
  },
  components: { FriendBody },
  methods: {
    /**
     * 点击联系人事件
     * @param { object } item 联系人数据
     */
    userClick (data) {
      this.isSearch = false
      this.searchInfo = ''
      this.showData = this.list.slice(0, 10)
      const back = {
        type: data.user_id ? 'user' : 'group',
        id: data.user_id ? data.user_id : data.group_id,
        name: data.group_name ? data.group_name : data.remark === data.nickname ? data.nickname : data.remark + '（' + data.nickname + '）',
        avatar: data.user_id ? 'https://q1.qlogo.cn/g?b=qq&s=0&nk=' + data.user_id : 'https://p.qlogo.cn/gh/' + data.group_id + '/' + data.group_id + '/0'
      }
      // 更新聊天框
      this.$emit('userClick', back)
      // 追加到正在进行的消息列表内
      this.$emit('addMessage', data)
      // 获取历史消息
      this.$emit('loadHistory', back)
    },
    /**
     * 分段加载回调
     */
    addLoad: function () {
      if (!this.isSearch) {
        this.loading = true
        this.showData = Util.mergeList(this.showData, this.list.slice(this.listPage * 10, (this.listPage + 1) * 10))
        this.listPage++
        this.loading = false
      }
    },
    /**
     * 搜索输入事件
     */
    search: function (event) {
      if (event.target.value !== '') {
        this.isSearch = true
        this.showData = this.list.filter(item => {
          const name = (item.user_id ? item.nickname : item.group_name).toLowerCase()
          const id = item.user_id ? item.user_id : item.group_id
          return name.indexOf((event.target.value).toLowerCase()) !== -1 || id.toString() === event.target.value
        })
      } else {
        this.showData = this.list.slice(0, 10)
        this.isSearch = false
      }
    },
    getId: function (data) {
      return data.user_id ? data.user_id : data.group_id
    }
  },
  watch: {
    list: {
      handler (val) {
        this.showData = val.slice(0, 10)
      },
      deep: true
    }
  }
}
</script>
