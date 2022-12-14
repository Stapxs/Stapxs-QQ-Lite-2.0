<!--
 * @FileDescription: 设置页面（功能子页面）
 * @Author: Stapxs
 * @Date: 2022/11/07
 * @Version: 1.0
-->

<template>
  <div class="opt-page">
    <div class="ss-card">
        <header>{{ $t('option_fun_notice') }}</header>
        <div class="opt-item">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path d="M301.1 34.8C312.6 40 320 51.4 320 64V448c0 12.6-7.4 24-18.9 29.2s-25 3.1-34.4-5.3L131.8 352H64c-35.3 0-64-28.7-64-64V224c0-35.3 28.7-64 64-64h67.8L266.7 40.1c9.4-8.4 22.9-10.4 34.4-5.3zM425 167l55 55 55-55c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9l-55 55 55 55c9.4 9.4 9.4 24.6 0 33.9s-24.6 9.4-33.9 0l-55-55-55 55c-9.4 9.4-24.6 9.4-33.9 0s-9.4-24.6 0-33.9l55-55-55-55c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0z"/></svg>
          <div>
            <span>{{ $t('option_dev_notice_close') }}</span>
            <span>{{ $t('option_dev_notice_close_tip') }}</span>
          </div>
          <label class="ss-switch">
            <input type="checkbox" @change="save" name="close_notice" v-model="runtimeData.sysConfig.close_notice">
            <div>
              <div></div>
            </div>
          </label>
        </div>
        <div class="opt-item" v-if="!runtimeData.sysConfig.close_notice">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M349.4 44.6c5.9-13.7 1.5-29.7-10.6-38.5s-28.6-8-39.9 1.8l-256 224c-10 8.8-13.6 22.9-8.9 35.3S50.7 288 64 288H175.5L98.6 467.4c-5.9 13.7-1.5 29.7 10.6 38.5s28.6 8 39.9-1.8l256-224c10-8.8 13.6-22.9 8.9-35.3s-16.6-20.7-30-20.7H272.5L349.4 44.6z"/></svg>
          <div>
            <span>{{ $t('option_dev_notice_all') }}</span>
            <span>{{ $t('option_dev_notice_all_tip') }}</span>
          </div>
          <label class="ss-switch">
            <input type="checkbox" @change="save" name="notice_all" v-model="runtimeData.sysConfig.notice_all">
            <div>
              <div></div>
            </div>
          </label>
        </div>
    </div>
    <div class="ss-card">
        <header>{{ $t('option_fun_chat') }}</header>
        <div class="opt-item">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M459.5 440.6c9.5 7.9 22.8 9.7 34.1 4.4s18.4-16.6 18.4-29V96c0-12.4-7.2-23.7-18.4-29s-24.5-3.6-34.1 4.4L288 214.3V256v41.7L459.5 440.6zM256 352V256 128 96c0-12.4-7.2-23.7-18.4-29s-24.5-3.6-34.1 4.4l-192 160C4.2 237.5 0 246.5 0 256s4.2 18.5 11.5 24.6l192 160c9.5 7.9 22.8 9.7 34.1 4.4s18.4-16.6 18.4-29V352z"/></svg>
          <div>
            <span>{{ $t('option_dev_send_reget') }}</span>
            <span>{{ $t('option_dev_send_reget_tip') }}</span>
          </div>
          <label class="ss-switch">
            <input type="checkbox" @change="save" name="send_reget" v-model="runtimeData.sysConfig.send_reget">
            <div>
              <div></div>
            </div>
          </label>
        </div>
        <div class="opt-item">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M163.8 0H284.2c12.1 0 23.2 6.8 28.6 17.7L320 32h96c17.7 0 32 14.3 32 32s-14.3 32-32 32H32C14.3 96 0 81.7 0 64S14.3 32 32 32h96l7.2-14.3C140.6 6.8 151.7 0 163.8 0zM32 128H416L394.8 467c-1.6 25.3-22.6 45-47.9 45H101.1c-25.3 0-46.3-19.7-47.9-45L32 128zm192 64c-6.4 0-12.5 2.5-17 7l-80 80c-9.4 9.4-9.4 24.6 0 33.9s24.6 9.4 33.9 0l39-39V408c0 13.3 10.7 24 24 24s24-10.7 24-24V273.9l39 39c9.4 9.4 24.6 9.4 33.9 0s9.4-24.6 0-33.9l-80-80c-4.5-4.5-10.6-7-17-7z"/></svg>
          <div>
            <span>{{ $t('option_dev_chat_nd') }}</span>
            <span>{{ ndt === 0 ? $t('option_dev_chat_nd_tip') : $t('option_dev_chat_nd_tip_1') }}</span>
          </div>
          <label class="ss-switch" v-if="ndt < 3">
            <input type="checkbox" @change="msgND" v-model="ndv">
            <div>
              <div></div>
            </div>
          </label>
        </div>
        <div class="opt-item">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M64 32C28.7 32 0 60.7 0 96V416c0 35.3 28.7 64 64 64H448c35.3 0 64-28.7 64-64V96c0-35.3-28.7-64-64-64H64zM175 175c9.4-9.4 24.6-9.4 33.9 0l47 47 47-47c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9l-47 47 47 47c9.4 9.4 9.4 24.6 0 33.9s-24.6 9.4-33.9 0l-47-47-47 47c-9.4 9.4-24.6 9.4-33.9 0s-9.4-24.6 0-33.9l47-47-47-47c-9.4-9.4-9.4-24.6 0-33.9z"/></svg>
          <div>
            <span>{{ $t('option_dev_chat_pic_pan') }}</span>
            <span>{{ $t('option_dev_chat_pic_pan_tip') }}</span>
          </div>
          <label class="ss-switch">
            <input type="checkbox" @change="save" name="close_chat_pic_pan" v-model="runtimeData.sysConfig.close_chat_pic_pan">
            <div>
              <div></div>
            </div>
          </label>
        </div>
    </div>
    <div class="ss-card">
        <header>{{ $t('option_fun_ga') }}</header>
        <div class="opt-item" :style="runtimeData.sysConfig.close_ga !== true ? 'background: var(--color-card-1);' : ''">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512"><path d="M0 336c0 79.5 64.5 144 144 144H512c70.7 0 128-57.3 128-128c0-61.9-44-113.6-102.4-125.4c4.1-10.7 6.4-22.4 6.4-34.6c0-53-43-96-96-96c-19.7 0-38.1 6-53.3 16.2C367 64.2 315.3 32 256 32C167.6 32 96 103.6 96 192c0 2.7 .1 5.4 .2 8.1C40.2 219.8 0 273.2 0 336z"/></svg>
          <div>
            <span>{{ $t('option_fun_ga_turn') }}</span>
            <span>{{ $t('option_fun_ga_turn_tip') }}</span>
          </div>
          <label class="ss-switch">
            <input type="checkbox" @change="save" name="close_ga" v-model="runtimeData.sysConfig.close_ga">
            <div>
              <div></div>
            </div>
          </label>
        </div>
        <div class="tip" v-if="runtimeData.sysConfig.close_ga !== true">
          {{ $t('option_fun_ga_tip') }}
        </div>
        <div class="opt-item" v-if="runtimeData.sysConfig.close_ga !== true">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M429.6 92.1c4.9-11.9 2.1-25.6-7-34.7s-22.8-11.9-34.7-7l-352 144c-14.2 5.8-22.2 20.8-19.3 35.8s16.1 25.8 31.4 25.8H224V432c0 15.3 10.8 28.4 25.8 31.4s30-5.1 35.8-19.3l144-352z"/></svg>
          <div>
            <span>{{ $t('option_fun_ga_user') }}</span>
            <span>{{ $t('option_fun_ga_user_tip') }}</span>
          </div>
          <label class="ss-switch">
            <input type="checkbox" @change="save" name="open_ga_user" v-model="runtimeData.sysConfig.open_ga_user">
            <div>
              <div></div>
            </div>
          </label>
        </div>
        <div class="opt-item" v-if="runtimeData.sysConfig.close_ga !== true">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512"><path d="M252.3 11.7c-15.6-15.6-40.9-15.6-56.6 0l-184 184c-15.6 15.6-15.6 40.9 0 56.6l184 184c15.6 15.6 40.9 15.6 56.6 0l184-184c15.6-15.6 15.6-40.9 0-56.6l-184-184zM248 224c0 13.3-10.7 24-24 24s-24-10.7-24-24s10.7-24 24-24s24 10.7 24 24zM96 248c-13.3 0-24-10.7-24-24s10.7-24 24-24s24 10.7 24 24s-10.7 24-24 24zm128 80c13.3 0 24 10.7 24 24s-10.7 24-24 24s-24-10.7-24-24s10.7-24 24-24zm128-80c-13.3 0-24-10.7-24-24s10.7-24 24-24s24 10.7 24 24s-10.7 24-24 24zM224 72c13.3 0 24 10.7 24 24s-10.7 24-24 24s-24-10.7-24-24s10.7-24 24-24zm96 392c0 26.5 21.5 48 48 48H592c26.5 0 48-21.5 48-48V240c0-26.5-21.5-48-48-48H472.5c13.4 26.9 8.8 60.5-13.6 82.9L320 413.8V464zm160-88c-13.3 0-24-10.7-24-24s10.7-24 24-24s24 10.7 24 24s-10.7 24-24 24z"/></svg>
          <div>
            <span>{{ $t('option_fun_ga_bot') }}</span>
            <span>{{ $t('option_fun_ga_bot_tip') }}</span>
          </div>
          <label class="ss-switch">
            <input type="checkbox" @change="save" name="open_ga_bot" v-model="runtimeData.sysConfig.open_ga_bot">
            <div>
              <div></div>
            </div>
          </label>
        </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { runASWEvent as save } from '@/function/option'
import { runtimeData } from '@/function/msg'

export default defineComponent({
  name: 'ViewOptFunction',
  data () {
    return {
        runtimeData: runtimeData,
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
})
</script>
