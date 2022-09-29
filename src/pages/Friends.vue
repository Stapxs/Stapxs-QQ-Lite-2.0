<template>
  <div class="friend-view">
    <div class="friend-list">
      <div>
        <div>
          <span>{{ $t('friend.title') }}</span><div style="flex: 1;"></div>
          <svg @click="reloadUser" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M496 48V192c0 17.69-14.31 32-32 32H320c-17.69 0-32-14.31-32-32s14.31-32 32-32h63.39c-29.97-39.7-77.25-63.78-127.6-63.78C167.7 96.22 96 167.9 96 256s71.69 159.8 159.8 159.8c34.88 0 68.03-11.03 95.88-31.94c14.22-10.53 34.22-7.75 44.81 6.375c10.59 14.16 7.75 34.22-6.375 44.81c-39.03 29.28-85.36 44.86-134.2 44.86C132.5 479.9 32 379.4 32 256s100.5-223.9 223.9-223.9c69.15 0 134 32.47 176.1 86.12V48c0-17.69 14.31-32 32-32S496 30.31 496 48z"/></svg>
        </div>
        <label>
          <input v-model="searchInfo" @input="search" type="text" :placeholder="$t('base.search')">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M500.3 443.7l-119.7-119.7c27.22-40.41 40.65-90.9 33.46-144.7C401.8 87.79 326.8 13.32 235.2 1.723C99.01-15.51-15.51 99.01 1.724 235.2c11.6 91.64 86.08 166.7 177.6 178.9c53.8 7.189 104.3-6.236 144.7-33.46l119.7 119.7c15.62 15.62 40.95 15.62 56.57 0C515.9 484.7 515.9 459.3 500.3 443.7zM79.1 208c0-70.58 57.42-128 128-128s128 57.42 128 128c0 70.58-57.42 128-128 128S79.1 278.6 79.1 208z"/></svg>
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
        <span>{{ $t('chat.space' )}}</span>
      </div>
    </div>
  </div>
</template>

<script>
import Vue from 'vue'
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
      this.listPage = 1
      const back = {
        type: data.user_id ? 'user' : 'group',
        id: data.user_id ? data.user_id : data.group_id,
        name: data.group_name ? data.group_name : data.remark === data.nickname ? data.nickname : data.remark + '（' + data.nickname + '）',
        avatar: data.user_id ? 'https://q1.qlogo.cn/g?b=qq&s=0&nk=' + data.user_id : 'https://p.qlogo.cn/gh/' + data.group_id + '/' + data.group_id + '/0'
      }
      // 更新聊天框
      this.$emit('userClick', back)
      // 追加到正在进行的消息列表内
      // this.$emit('addMessage', data)
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
        this.isSearch = false
        this.showData = this.list.slice(0, 10)
        this.listPage = 1
      }
    },
    getId: function (data) {
      return data.user_id ? data.user_id : data.group_id
    },
    reloadUser: function () {
      Vue.sendWs(Vue.createAPI('getFriendList', null, null))
      Vue.sendWs(Vue.createAPI('getGroupList', null, null))
    }
  },
  watch: {
    list: {
      handler: function (val) {
        this.showData = val.slice(0, 10)
        this.listPage = 1
      },
      deep: true
    }
  }
}
</script>
