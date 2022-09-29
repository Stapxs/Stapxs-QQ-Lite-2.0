/*
 * @FileDescription: 设置页面（开发者子页面）
 * @Author: Stapxs
 * @Date: 2022/09/28
 * @Version: 1.0
*/

<template>
  <div class="opt-page">
    <div class="ss-card">
        <header>{{ $t('option.dev.dev') }}</header>
        <div class="opt-item">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><path d="M365.3 93.38l-74.63-74.64C278.6 6.742 262.3 0 245.4 0L64-.0001c-35.35 0-64 28.65-64 64l.0065 384c0 35.34 28.65 64 64 64H320c35.2 0 64-28.8 64-64V138.6C384 121.7 377.3 105.4 365.3 93.38zM336 448c0 8.836-7.164 16-16 16H64.02c-8.838 0-16-7.164-16-16L48 64.13c0-8.836 7.164-16 16-16h160L224 128c0 17.67 14.33 32 32 32h79.1V448zM96 280C96 293.3 106.8 304 120 304h144C277.3 304 288 293.3 288 280S277.3 256 264 256h-144C106.8 256 96 266.8 96 280zM264 352h-144C106.8 352 96 362.8 96 376s10.75 24 24 24h144c13.25 0 24-10.75 24-24S277.3 352 264 352z" /></svg>
          <div>
            <span>{{ $t('option.dev.log_level') }}</span>
            <span>{{ $t('option.dev.log_level_tip') }}</span>
          </div>
          <label>
            <select @change="save" name="log_level" v-model="config.log_level">
              <option value="err">{{ $t('option.dev.log_level_err') }}</option>
              <option value="info">{{ $t('option.dev.log_level_info') }}</option>
              <option value="all">{{ $t('option.dev.log_level_all') }}</option>
            </select>
          </label>
        </div>
        <div class="opt-item">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M320 192H128C118.5 192 109.8 197.7 105.1 206.4C102.2 215.1 103.9 225.3 110.4 232.3l96 104C210.9 341.2 217.3 344 224 344s13.09-2.812 17.62-7.719l96-104c6.469-7 8.188-17.19 4.375-25.91C338.2 197.7 329.5 192 320 192zM384 32H64C28.65 32 0 60.66 0 96v320c0 35.34 28.65 64 64 64h320c35.35 0 64-28.66 64-64V96C448 60.66 419.3 32 384 32zM400 416c0 8.82-7.178 16-16 16H64c-8.822 0-16-7.18-16-16V96c0-8.82 7.178-16 16-16h320c8.822 0 16 7.18 16 16V416z"/></svg>
          <div>
            <span>{{ $t('option.dev.msg_menu') }}</span>
            <span>{{ $t('option.dev.msg_menu_tip') }}</span>
          </div>
          <label class="ss-switch">
            <input type="checkbox" @change="save" name="msg_menu" v-model="config.msg_menu">
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
  name: 'OptDev',
  props: ['config'],
  data () {
    return {
      save: save
    }
  },
  methods: {}
}
</script>
