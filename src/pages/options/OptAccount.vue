/*
 * @FileDescription: 设置页面（账号子页面）
 * @Author: Stapxs
 * @Date: 2022/09/29
 * @Version: 1.0
*/

<template>
  <div class="opt-page">
    <div v-if="info != null" class="ss-card account-info">
      <img :src="'https://q1.qlogo.cn/g?b=qq&s=0&nk=' + info.account.uin">
      <div>
        <div>
          <span>{{ info.account.nickname }}</span>
          <span>{{ info.account.uin }}</span>
        </div>
        <span>{{ uinfo.info.lnick }}</span>
      </div>
      <svg :title="$t('base.exit')" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M160 96c17.7 0 32-14.3 32-32s-14.3-32-32-32H96C43 32 0 75 0 128V384c0 53 43 96 96 96h64c17.7 0 32-14.3 32-32s-14.3-32-32-32H96c-17.7 0-32-14.3-32-32l0-256c0-17.7 14.3-32 32-32h64zM504.5 273.4c4.8-4.5 7.5-10.8 7.5-17.4s-2.7-12.9-7.5-17.4l-144-136c-7-6.6-17.2-8.4-26-4.6s-14.5 12.5-14.5 22v72H192c-17.7 0-32 14.3-32 32l0 64c0 17.7 14.3 32 32 32H320v72c0 9.6 5.7 18.2 14.5 22s19 2 26-4.6l144-136z"/></svg>
    </div>
    <div class="ss-card">
      <header>{{ $t('option.account.config') }}</header>
    </div>
  </div>
</template>

<script>
import Vue from 'vue'
import { runASWEvent as save } from '../../assets/js/options'

export default {
  name: 'OptAccount',
  props: ['config', 'login', 'uinfo'],
  data () {
    return {
      save: save,
      info: null
    }
  },
  methods: {

  },
  watch: {
    login: function () {
      if (this.login === true) {
        this.$nextTick(() => {
          // 获取登陆信息
          this.info = Vue.loginInfo
        })
      }
    }
  }
}
</script>
