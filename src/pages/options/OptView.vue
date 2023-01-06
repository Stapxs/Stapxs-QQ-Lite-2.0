<!--
 * @FileDescription: 设置页面（界面子页面）
 * @Author: Stapxs
 * @Date: 2022/09/26
 * @Version: 1.0
-->

<template>
  <div class="opt-page">
    <div class="ss-card">
      <header>{{ $t('option_view_l10n') }}</header>
      <div class="l10n-info">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512"><path d="M0 128C0 92.7 28.7 64 64 64H256h48 16H576c35.3 0 64 28.7 64 64V384c0 35.3-28.7 64-64 64H320 304 256 64c-35.3 0-64-28.7-64-64V128zm320 0V384H576V128H320zM178.3 175.9c-3.2-7.2-10.4-11.9-18.3-11.9s-15.1 4.7-18.3 11.9l-64 144c-4.5 10.1 .1 21.9 10.2 26.4s21.9-.1 26.4-10.2l8.9-20.1h73.6l8.9 20.1c4.5 10.1 16.3 14.6 26.4 10.2s14.6-16.3 10.2-26.4l-64-144zM160 233.2L179 276H141l19-42.8zM448 164c11 0 20 9 20 20v4h44 16c11 0 20 9 20 20s-9 20-20 20h-2l-1.6 4.5c-8.9 24.4-22.4 46.6-39.6 65.4c.9 .6 1.8 1.1 2.7 1.6l18.9 11.3c9.5 5.7 12.5 18 6.9 27.4s-18 12.5-27.4 6.9l-18.9-11.3c-4.5-2.7-8.8-5.5-13.1-8.5c-10.6 7.5-21.9 14-34 19.4l-3.6 1.6c-10.1 4.5-21.9-.1-26.4-10.2s.1-21.9 10.2-26.4l3.6-1.6c6.4-2.9 12.6-6.1 18.5-9.8l-12.2-12.2c-7.8-7.8-7.8-20.5 0-28.3s20.5-7.8 28.3 0l14.6 14.6 .5 .5c12.4-13.1 22.5-28.3 29.8-45H448 376c-11 0-20-9-20-20s9-20 20-20h52v-4c0-11 9-20 20-20z"/></svg>
        <div>
          <span>{{ $t('l10n_name') }}<a>{{ isI10nExpired($t('l10n_version')) ? $t('option_view_l10n_expired') : '' }}</a></span>
          <span class="author">{{ $t('l10n_author_title') }}{{ $t('l10n_author') }}</span>
          <span>{{ $t('l10n_description') }}</span>
        </div>
      </div>
      <div class="opt-item">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M51.7 295.1l31.7 6.3c7.9 1.6 16-.9 21.7-6.6l15.4-15.4c11.6-11.6 31.1-8.4 38.4 6.2l9.3 18.5c4.8 9.6 14.6 15.7 25.4 15.7c15.2 0 26.1-14.6 21.7-29.2l-6-19.9c-4.6-15.4 6.9-30.9 23-30.9h2.3c13.4 0 25.9-6.7 33.3-17.8l10.7-16.1c5.6-8.5 5.3-19.6-.8-27.7l-16.1-21.5c-10.3-13.7-3.3-33.5 13.4-37.7l17-4.3c7.5-1.9 13.6-7.2 16.5-14.4l16.4-40.9C303.4 52.1 280.2 48 256 48C141.1 48 48 141.1 48 256c0 13.4 1.3 26.5 3.7 39.1zm407.7 4.6c-3-.3-6-.1-9 .8l-15.8 4.4c-6.7 1.9-13.8-.9-17.5-6.7l-2-3.1c-6-9.4-16.4-15.1-27.6-15.1s-21.6 5.7-27.6 15.1l-6.1 9.5c-1.4 2.2-3.4 4.1-5.7 5.3L312 330.1c-18.1 10.1-25.5 32.4-17 51.3l5.5 12.4c8.6 19.2 30.7 28.5 50.5 21.1l2.6-1c10-3.7 21.3-2.2 29.9 4.1l1.5 1.1c37.2-29.5 64.1-71.4 74.4-119.5zM512 256c0 141.4-114.6 256-256 256S0 397.4 0 256S114.6 0 256 0S512 114.6 512 256zM144.5 348.1c-2.1 8.6 3.1 17.3 11.6 19.4l32 8c8.6 2.1 17.3-3.1 19.4-11.6s-3.1-17.3-11.6-19.4l-32-8c-8.6-2.1-17.3 3.1-19.4 11.6zm92-20c-2.1 8.6 3.1 17.3 11.6 19.4s17.3-3.1 19.4-11.6l8-32c2.1-8.6-3.1-17.3-11.6-19.4s-17.3 3.1-19.4 11.6l-8 32zM343.2 113.7c-7.9-4-17.5-.7-21.5 7.2l-16 32c-4 7.9-.7 17.5 7.2 21.5s17.5 .7 21.5-7.2l16-32c4-7.9 .7-17.5-7.2-21.5z"/></svg>
        <div>
          <span>{{ $t('option_view_language') }}</span>
          <span>{{ $t('option_view_language_tip') }}</span>
        </div>
        <label>
          <select @change="save" name="language" v-model="runtimeData.sysConfig.language">
            <option v-for="item in languages" :value="item.value" :key="item.value">{{ item.name }}</option>
          </select>
        </label>
      </div>
    </div>
    <div class="ss-card">
      <header>{{ $t('option_view_theme') }}</header>
      <div class="opt-item">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><path d="M223.5 32C100 32 0 132.3 0 256S100 480 223.5 480c60.6 0 115.5-24.2 155.8-63.4c5-4.9 6.3-12.5 3.1-18.7s-10.1-9.7-17-8.5c-9.8 1.7-19.8 2.6-30.1 2.6c-96.9 0-175.5-78.8-175.5-176c0-65.8 36-123.1 89.3-153.3c6.1-3.5 9.2-10.5 7.7-17.3s-7.3-11.9-14.3-12.5c-6.3-.5-12.6-.8-19-.8z"/></svg>
        <div>
          <span>{{ $t('option_view_dark_mode') }}</span>
          <span>{{ $t('option_view_dark_mode_tip') }}</span>
        </div>
        <label class="ss-switch">
          <input type="checkbox" @change="save" name="opt_dark" v-model="runtimeData.sysConfig.opt_dark">
          <div><div></div></div>
        </label>
      </div>
      <div class="opt-item">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path d="M192 64C86 64 0 150 0 256S86 448 192 448H384c106 0 192-86 192-192s-86-192-192-192H192zM384 352c-53 0-96-43-96-96s43-96 96-96s96 43 96 96s-43 96-96 96z"/></svg>
        <div>
          <span>{{ $t('option_view_auto_dark') }}</span>
          <span>{{ $t('option_view_auto_dark_tip') }}</span>
        </div>
        <label class="ss-switch">
          <input type="checkbox" @change="save" name="opt_auto_dark" v-model="runtimeData.sysConfig.opt_auto_dark">
          <div><div></div></div>
        </label>
      </div>
      <div class="opt-item">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><path d="M192 64L160 0H128L96 64 64 0H48C21.5 0 0 21.5 0 48V256H384V48c0-26.5-21.5-48-48-48H224L192 64zM0 288v32c0 35.3 28.7 64 64 64h64v64c0 35.3 28.7 64 64 64s64-28.7 64-64V384h64c35.3 0 64-28.7 64-64V288H0zM192 464c-8.8 0-16-7.2-16-16s7.2-16 16-16s16 7.2 16 16s-7.2 16-16 16z"/></svg>
        <div>
          <span>{{ $t('option_view_theme_color') }}</span>
          <span>{{ $t('option_view_theme_color_tip') }}</span>
        </div>
        <div class="theme-color-col">
          <label v-for="(name, index) in colors" :title="name" :key="'color_id_' + index" class="ss-radio">
            <input type="radio" name="theme_color"
              @change="save"
              :data-id="index"
              :checked="runtimeData.sysConfig.theme_color === undefined ? index === 0 : Number(runtimeData.sysConfig.theme_color) === index">
            <div :style="'background: var(--color-main-' + index + ');'"><div></div></div>
          </label>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

import { runtimeData } from '../../function/msg'
import { runASWEvent as save } from '../../function/option'
import cmp from 'semver-compare'

import appInfo from '../../../package.json'
import languages from '../../assets/l10n/_l10nconfig.json'

export default defineComponent({
  name: 'ViewOptTheme',
  data () {
    return {
      runtimeData: runtimeData,
      save: save,
      languages: languages,
      // 别问我为什么微软是紫色的
      colors: ['林槐蓝', '墨竹青', '少女粉', '微软紫', '坏猫黄', '玄素黑']
    }
  },
  methods: {
    /**
     * 判断当前加载的语言是否是最新版本
     * @param version 
     */
    isI10nExpired (version: string) {
      const appVersion = appInfo.version
      if (cmp(appVersion, version) === 1) {
        return true
      }
      return false
    }
  }
})
</script>
