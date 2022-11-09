<template>
  <div v-if="tags.openChatInfo" class="chat-info-pan">
    <div class="ss-card chat-info">
      <header>
        <span v-if="chat.type === 'group'">{{ $t('chat.chat_info.group') }}</span>
        <span v-if="chat.type === 'user'">{{ $t('chat.chat_info.user') }}</span>
        <svg @click="openChatInfoPan" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512">
          <path
            d="M310.6 361.4c12.5 12.5 12.5 32.75 0 45.25C304.4 412.9 296.2 416 288 416s-16.38-3.125-22.62-9.375L160 301.3L54.63 406.6C48.38 412.9 40.19 416 32 416S15.63 412.9 9.375 406.6c-12.5-12.5-12.5-32.75 0-45.25l105.4-105.4L9.375 150.6c-12.5-12.5-12.5-32.75 0-45.25s32.75-12.5 45.25 0L160 210.8l105.4-105.4c12.5-12.5 32.75-12.5 45.25 0s12.5 32.75 0 45.25l-105.4 105.4L310.6 361.4z" />
        </svg>
      </header>
      <div :class="'chat-info-base ' + chat.type">
        <div>
          <img :src="chat.avatar">
          <div>
            <a>{{ chat.name }}</a>
            <span>{{ chat.id }}</span>
          </div>
          <div v-if="chat.type === 'group'">
            <svg :title="$t('chat.chat_info.is_owner')" v-if="chat.info.group.gOwner === Vue.loginInfo.uin"
              xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512">
              <path
                d="M309 106c11.4-7 19-19.7 19-34c0-22.1-17.9-40-40-40s-40 17.9-40 40c0 14.4 7.6 27 19 34L209.7 220.6c-9.1 18.2-32.7 23.4-48.6 10.7L72 160c5-6.7 8-15 8-24c0-22.1-17.9-40-40-40S0 113.9 0 136s17.9 40 40 40c.2 0 .5 0 .7 0L86.4 427.4c5.5 30.4 32 52.6 63 52.6H426.6c30.9 0 57.4-22.1 63-52.6L535.3 176c.2 0 .5 0 .7 0c22.1 0 40-17.9 40-40s-17.9-40-40-40s-40 17.9-40 40c0 9 3 17.3 8 24l-89.1 71.3c-15.9 12.7-39.5 7.5-48.6-10.7L309 106z" />
            </svg>
            <svg :title="$t('chat.chat_info.is_admin')"
              v-if="chat.info.group.gAdmins != undefined && chat.info.group.gAdmins.indexOf(Vue.loginInfo.uin) >= 0"
              xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512">
              <path
                d="M316.9 18C311.6 7 300.4 0 288.1 0s-23.4 7-28.8 18L195 150.3 51.4 171.5c-12 1.8-22 10.2-25.7 21.7s-.7 24.2 7.9 32.7L137.8 329 113.2 474.7c-2 12 3 24.2 12.9 31.3s23 8 33.8 2.3l128.3-68.5 128.3 68.5c10.8 5.7 23.9 4.9 33.8-2.3s14.9-19.3 12.9-31.3L438.5 329 542.7 225.9c8.6-8.5 11.7-21.2 7.9-32.7s-13.7-19.9-25.7-21.7L381.2 150.3 316.9 18z" />
            </svg>
          </div>
        </div>
        <div v-if="chat.type === 'group'">
          <header>
            <span>{{ $t('chat.chat_info.introduction') }}</span>
          </header>
          <span v-html="(chat.info.group.gIntro === undefined || chat.info.group.gIntro === '') ?
          $t('chat.chat_info.nointroduction') : chat.info.group.gIntro"></span>
          <div class="tags">
            <div v-for="item in chat.info.group.tags" :key="item.md">
              {{ item.tag }}
            </div>
          </div>
          <header v-if="chat.info.group.gAdmins !== undefined">
            <span>{{ $t('chat.member_type.admin') }}</span>
          </header>
          <div class="admin" v-if="chat.info.group.gAdmins !== undefined">
            <img v-for="(item, index) in chat.info.group.gAdmins" :key="'chatinfoadmin-' + item"
              :src="`https://q1.qlogo.cn/g?b=qq&s=0&nk=${item}`" :title="chat.info.group.ns[index]">
          </div>
        </div>
        <div v-else-if="chat.type === 'user'">
          <header>
            <span>{{ $t('chat.chat_info.lnick') }}</span>
          </header>
          <span v-html="(chat.info.user.lnick === undefined || chat.info.user.lnick === '') ?
          $t('chat.chat_info.nolnick') : chat.info.user.lnick"></span>
          <header>
            <span>{{ $t('chat.chat_info.outher') }}</span>
          </header>
          <div class="outher">
            <span>{{ $t('chat.chat_info.birthday') }}:
              <span>
                {{ Intl.DateTimeFormat(trueLang, {year:'numeric',month:"short",day:"numeric"}).format(
                new
                Date(`${chat.info.user.birthday.year}-${chat.info.user.birthday.month}-${chat.info.user.birthday.day}`)
                ) + ` (${this.$t('chat.chat_info.chinese_zodiac').split('|')[chat.info.user.shengxiao - 1]})` }}
              </span>
            </span>
            <span>{{ $t('chat.chat_info.address') }}:
              <span>
                {{ `${chat.info.user.country}-${chat.info.user.province}-${chat.info.user.city}` }}
              </span>
            </span>
          </div>
        </div>
      </div>
      <div v-if="chat.type === 'group'" class="layui-tab layui-tab-brief"
        style="overflow: hidden; display: flex;flex-direction: column;height: 100%;margin: 0;">
        <ul class="layui-tab-title chat-info-tab">
          <li class="layui-this">{{ $t('chat.chat_info.member') + `(${chat.info.group_members.length == undefined ? 0 : chat.info.group_members.length})` }}</li>
          <li>{{ $t('chat.chat_info.file') + `(${chat.info.group_files.total_cnt === undefined ? 0 :
          chat.info.group_files.total_cnt})` }}</li>
          <li>{{ $t('chat.chat_info.config') }}</li>
        </ul>
        <div class="chat-info-tab-body layui-tab-content">
          <div class="layui-tab-item layui-show chat-info-tab-member">
            <div v-for="item in chat.info.group_members" :key="'chatinfomlist-' + item.user_id">
              <img loading="lazy" :src="`https://q1.qlogo.cn/g?b=qq&s=0&nk=${item.user_id}`">
              <div>
                <a>{{ item.nickname }}</a>
                <svg v-if="item.role === 'owner'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512">
                  <path
                    d="M309 106c11.4-7 19-19.7 19-34c0-22.1-17.9-40-40-40s-40 17.9-40 40c0 14.4 7.6 27 19 34L209.7 220.6c-9.1 18.2-32.7 23.4-48.6 10.7L72 160c5-6.7 8-15 8-24c0-22.1-17.9-40-40-40S0 113.9 0 136s17.9 40 40 40c.2 0 .5 0 .7 0L86.4 427.4c5.5 30.4 32 52.6 63 52.6H426.6c30.9 0 57.4-22.1 63-52.6L535.3 176c.2 0 .5 0 .7 0c22.1 0 40-17.9 40-40s-17.9-40-40-40s-40 17.9-40 40c0 9 3 17.3 8 24l-89.1 71.3c-15.9 12.7-39.5 7.5-48.6-10.7L309 106z" />
                </svg>
                <svg v-if="item.role === 'admin'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512">
                  <path
                    d="M316.9 18C311.6 7 300.4 0 288.1 0s-23.4 7-28.8 18L195 150.3 51.4 171.5c-12 1.8-22 10.2-25.7 21.7s-.7 24.2 7.9 32.7L137.8 329 113.2 474.7c-2 12 3 24.2 12.9 31.3s23 8 33.8 2.3l128.3-68.5 128.3 68.5c10.8 5.7 23.9 4.9 33.8-2.3s14.9-19.3 12.9-31.3L438.5 329 542.7 225.9c8.6-8.5 11.7-21.2 7.9-32.7s-13.7-19.9-25.7-21.7L381.2 150.3 316.9 18z" />
                </svg>
              </div>
              <span>{{ item.user_id }}</span>
            </div>
          </div>
          <div class="layui-tab-item group-files" @scroll="fileLoad">
            <div v-for="item in chat.info.group_files.file_list" :key="'file-' + item.id">
              <FileBody :chat="chat" :item="item"></FileBody>
            </div>
            <div class="group-files-loader" v-show="chat.info.group_files !== undefined &&
            chat.info.group_files.next_index !== undefined &&
            chat.info.group_files.next_index !== 0">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
                <path
                  d="M120 256c0 30.9-25.1 56-56 56s-56-25.1-56-56s25.1-56 56-56s56 25.1 56 56zm160 0c0 30.9-25.1 56-56 56s-56-25.1-56-56s25.1-56 56-56s56 25.1 56 56zm104 56c-30.9 0-56-25.1-56-56s25.1-56 56-56s56 25.1 56 56s-25.1 56-56 56z" />
              </svg>
            </div>
          </div>
          <div class="layui-tab-item">3</div>
        </div>
      </div>
    </div>
    <div class="card-info-pan-bg"></div>
  </div>
</template>

<script>
import Vue from 'vue'
import FileBody from './FileBody.vue'

export default {
  name: 'InfoBody',
  props: ['tags', 'chat'],
  data () {
    return {
      Vue: Vue
    }
  },
  methods: {
    openChatInfoPan: function () {
      this.$emit('close', null)
    },
    fileLoad: function (event) {
      this.$emit('loadFile', event)
    }
  },
  components: { FileBody }
}
</script>
