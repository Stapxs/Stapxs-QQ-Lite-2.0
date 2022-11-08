/*
 * @FileDescription: 设置页面（开发者子页面）
 * @Author: Stapxs
 * @Date: 2022/09/28
 * @Version: 1.0
*/

<template>
  <div class="opt-page">
    <div class="ss-card">
        <header>{{ $t('option.dev.connect') }}</header>
        <div class="opt-item">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M396.2 83.8c-24.4-24.4-64-24.4-88.4 0l-184 184c-42.1 42.1-42.1 110.3 0 152.4s110.3 42.1 152.4 0l152-152c10.9-10.9 28.7-10.9 39.6 0s10.9 28.7 0 39.6l-152 152c-64 64-167.6 64-231.6 0s-64-167.6 0-231.6l184-184c46.3-46.3 121.3-46.3 167.6 0s46.3 121.3 0 167.6l-176 176c-28.6 28.6-75 28.6-103.6 0s-28.6-75 0-103.6l144-144c10.9-10.9 28.7-10.9 39.6 0s10.9 28.7 0 39.6l-144 144c-6.7 6.7-6.7 17.7 0 24.4s17.7 6.7 24.4 0l176-176c24.4-24.4 24.4-64 0-88.4z"/></svg>
          <div>
            <span>{{ $t('option.dev.connect_beat') }}</span>
            <span>{{ $t('option.dev.connect_beat_tip') }}</span>
          </div>
          <label class="ss-switch">
            <input type="checkbox" @change="save" name="connect_beat" v-model="config.connect_beat">
            <div>
              <div></div>
            </div>
          </label>
        </div>
    </div>
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
        <div class="opt-item">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512"><path d="M320 0c17.7 0 32 14.3 32 32V96H480c35.3 0 64 28.7 64 64V448c0 35.3-28.7 64-64 64H160c-35.3 0-64-28.7-64-64V160c0-35.3 28.7-64 64-64H288V32c0-17.7 14.3-32 32-32zM208 384c-8.8 0-16 7.2-16 16s7.2 16 16 16h32c8.8 0 16-7.2 16-16s-7.2-16-16-16H208zm96 0c-8.8 0-16 7.2-16 16s7.2 16 16 16h32c8.8 0 16-7.2 16-16s-7.2-16-16-16H304zm96 0c-8.8 0-16 7.2-16 16s7.2 16 16 16h32c8.8 0 16-7.2 16-16s-7.2-16-16-16H400zM264 256c0-22.1-17.9-40-40-40s-40 17.9-40 40s17.9 40 40 40s40-17.9 40-40zm152 40c22.1 0 40-17.9 40-40s-17.9-40-40-40s-40 17.9-40 40s17.9 40 40 40zM48 224H64V416H48c-26.5 0-48-21.5-48-48V272c0-26.5 21.5-48 48-48zm544 0c26.5 0 48 21.5 48 48v96c0 26.5-21.5 48-48 48H576V224h16z"/></svg>
          <div>
            <span>{{ $t('option.dev.debug_msg') }}</span>
            <span>{{ $t('option.dev.debug_msg_tip') }}</span>
          </div>
          <label class="ss-switch">
            <input type="checkbox" @change="save" name="debug_msg" v-model="config.debug_msg">
            <div>
              <div></div>
            </div>
          </label>
        </div>
    </div>
    <div class="ss-card">
        <header>{{ $t('option.dev.outher') }}</header>
        <div class="opt-item">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M121 32C91.6 32 66 52 58.9 80.5L1.9 308.4C.6 313.5 0 318.7 0 323.9V416c0 35.3 28.7 64 64 64H448c35.3 0 64-28.7 64-64V323.9c0-5.2-.6-10.4-1.9-15.5l-57-227.9C446 52 420.4 32 391 32H121zm0 64H391l48 192H387.8c-12.1 0-23.2 6.8-28.6 17.7l-14.3 28.6c-5.4 10.8-16.5 17.7-28.6 17.7H195.8c-12.1 0-23.2-6.8-28.6-17.7l-14.3-28.6c-5.4-10.8-16.5-17.7-28.6-17.7H73L121 96z"/></svg>
          <div>
            <span>{{ $t('option.dev.ws_send') }}</span>
            <span>{{ $t('option.dev.ws_send_tip') }}</span>
          </div>
          <input class="ss-input" type="text" @keyup="sendTestWs" v-model="ws_text">
        </div>
        <div class="opt-item">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M256 32C114.6 32 .0272 125.1 .0272 240c0 47.63 19.91 91.25 52.91 126.2c-14.88 39.5-45.87 72.88-46.37 73.25c-6.625 7-8.375 17.25-4.625 26C5.818 474.2 14.38 480 24 480c61.5 0 109.1-25.75 139.1-46.25C191.1 442.8 223.3 448 256 448c141.4 0 255.1-93.13 255.1-208S397.4 32 256 32zM256.1 400c-26.75 0-53.12-4.125-78.38-12.12l-22.75-7.125l-19.5 13.75c-14.25 10.12-33.88 21.38-57.5 29c7.375-12.12 14.37-25.75 19.88-40.25l10.62-28l-20.62-21.87C69.82 314.1 48.07 282.2 48.07 240c0-88.25 93.25-160 208-160s208 71.75 208 160S370.8 400 256.1 400z"/></svg>
          <div>
            <span>{{ $t('option.dev.appmsg') }}</span>
            <span>{{ $t('option.dev.appmsg_tip') }}</span>
          </div>
          <input class="ss-input" type="text" @keyup="sendTestAppmsg" v-model="appmsg_text">
        </div>
    </div>
  </div>
</template>

<script>
import { runASWEvent as save } from '../../assets/js/options'
import { websocket as ws } from '../../assets/js/connect'
import { popInfo } from '../../assets/js/base'

export default {
  name: 'OptDev',
  props: ['config'],
  data () {
    return {
      save: save,
      ws_text: '',
      appmsg_text: ''
    }
  },
  methods: {
    sendTestWs: function (event) {
      // 发送测试 WS 消息
      if (event.keyCode === 13 && this.ws_text !== '') {
        const info = JSON.parse(this.ws_text)
        this.ws_text = ''
        // 修改 echo 防止被消息处理机处理
        info.echo = 'websocketTest'
        ws.send(JSON.stringify(info))
      }
    },
    sendTestAppmsg: function (event) {
      if (event.keyCode === 13 && this.appmsg_text !== '') {
        popInfo.add(popInfo.appMsgType.info, this.appmsg_text, false)
        this.appmsg_text = ''
      }
    }
  }
}
</script>
