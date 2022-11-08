/*
 * @FileDescription: 设置页面（功能子页面）
 * @Author: Stapxs
 * @Date: 2022/11/07
 * @Version: 1.0
*/

<template>
  <div class="opt-page">
    <div class="ss-card">
        <header>{{ $t('option.fun.notice') }}</header>
        <div class="opt-item">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path d="M301.1 34.8C312.6 40 320 51.4 320 64V448c0 12.6-7.4 24-18.9 29.2s-25 3.1-34.4-5.3L131.8 352H64c-35.3 0-64-28.7-64-64V224c0-35.3 28.7-64 64-64h67.8L266.7 40.1c9.4-8.4 22.9-10.4 34.4-5.3zM425 167l55 55 55-55c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9l-55 55 55 55c9.4 9.4 9.4 24.6 0 33.9s-24.6 9.4-33.9 0l-55-55-55 55c-9.4 9.4-24.6 9.4-33.9 0s-9.4-24.6 0-33.9l55-55-55-55c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0z"/></svg>
          <div>
            <span>{{ $t('option.dev.notice_close') }}</span>
            <span>{{ $t('option.dev.notice_close_tip') }}</span>
          </div>
          <label class="ss-switch">
            <input type="checkbox" @change="save" name="close_notice" v-model="config.close_notice">
            <div>
              <div></div>
            </div>
          </label>
        </div>
        <div class="opt-item" v-if="!config.close_notice">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M349.4 44.6c5.9-13.7 1.5-29.7-10.6-38.5s-28.6-8-39.9 1.8l-256 224c-10 8.8-13.6 22.9-8.9 35.3S50.7 288 64 288H175.5L98.6 467.4c-5.9 13.7-1.5 29.7 10.6 38.5s28.6 8 39.9-1.8l256-224c10-8.8 13.6-22.9 8.9-35.3s-16.6-20.7-30-20.7H272.5L349.4 44.6z"/></svg>
          <div>
            <span>{{ $t('option.dev.notice_all') }}</span>
            <span>{{ $t('option.dev.notice_all_tip') }}</span>
          </div>
          <label class="ss-switch">
            <input type="checkbox" @change="save" name="notice_all" v-model="config.notice_all">
            <div>
              <div></div>
            </div>
          </label>
        </div>
    </div>
    <div class="ss-card">
        <header>{{ $t('option.fun.chat') }}</header>
        <div class="opt-item">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M384 32C419.3 32 448 60.65 448 96V416C448 451.3 419.3 480 384 480H64C28.65 480 0 451.3 0 416V96C0 60.65 28.65 32 64 32H384zM384 80H64C55.16 80 48 87.16 48 96V416C48 424.8 55.16 432 64 432H384C392.8 432 400 424.8 400 416V96C400 87.16 392.8 80 384 80z"/></svg>
          <div>
            <span>{{ $t('option.dev.chat_nd') }}</span>
            <span>{{ ndt === 0 ? $t('option.dev.chat_nd_tip') : this.$t('option.dev.chat_nd_tip_1') }}</span>
          </div>
          <label class="ss-switch" v-if="ndt < 3">
            <input type="checkbox" @change="msgND" v-model="ndv">
            <div>
              <div></div>
            </div>
          </label>
        </div>
    </div>
  </div>
</template>

<script>
import { runASWEvent as save } from '../../assets/js/options'

export default {
  name: 'OptFunction',
  props: ['config'],
  data () {
    return {
      save: save,
      ndt: 0,
      ndv: false
    }
  },
  methods: {
    msgND: function () {
      this.ndt++
      setTimeout(() => {
        this.ndv = false
      }, 300)
    }
  }
}
</script>
