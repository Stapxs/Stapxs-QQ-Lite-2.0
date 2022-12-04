
/*
 * @FileDescription: 消息组件 for go-cqhttp
 * @Author: Stapxs
 * @Date: 2022/012/2
 * @Version: 1.0
 * @Note: 主要区别在于 gocqhttp 的消息并不解析展开
*/

<template>
  <MsgBody :data="data" :isMerge="isMerge" @viewImg="viewImg"></MsgBody>
</template>

<script>
import Vue from 'vue'
import MsgBody from '../MsgBody.vue'
import Util from '../../../assets/js/util'

export default {
  name: 'GOCQHttp',
  components: { MsgBody },
  props: ['data', 'isMerge'],
  mounted () {
    // 加载完成，对 data 进行一个简单的格式的化
    Vue.set(this.data, 'message', Util.parseCQ(this.data.message))
  },
  methods: {
    hiddenUserInfo: function () {
      this.$parent.hiddenUserInfo()
    },
    viewImg: function (msgId) {
      this.$emit('viewImg', msgId)
    }
  }
}
</script>
