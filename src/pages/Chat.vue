/*
 * @FileDescription: 消息框主体
 * @Author: Stapxs
 * @Date: 2022/08/14
 * @Version: 1.0
*/

<template>
  <div class="chat-pan">
    <div>
      <img :src="chat.avatar">
      <div>
        <p>{{ chat.name }}</p>
        <span>
          {{ list[list.length - 1] ? $t('chat.last_msg', {time: Intl.DateTimeFormat(trueLang, {hour:"numeric",minute:"numeric",second:"numeric"}).format(new Date(list[list.length - 1].time)) }) : $t('chat.no_msg')}}
          </span>
      </div>
      <div></div>
      <div>
        <svg @click="openChatInfoPan" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 512"><path d="M64 360c30.9 0 56 25.1 56 56s-25.1 56-56 56s-56-25.1-56-56s25.1-56 56-56zm0-160c30.9 0 56 25.1 56 56s-25.1 56-56 56s-56-25.1-56-56s25.1-56 56-56zM120 96c0 30.9-25.1 56-56 56S8 126.9 8 96S33.1 40 64 40s56 25.1 56 56z"/></svg>
      </div>
    </div>
    <div @scroll="chatScroll" id="msgPan" style="scroll-behavior: smooth;">
      <div class="note-base" v-if="!tags.canLoadHistory">
        <span class="note-nomsg">{{ $t('chat.no_more_msg') }}</span>
      </div>
      <MsgBody
        v-for="msg in list"
        :key="msg.message_id"
        :data="msg"
        @scrollToMsg="scrollToMsg"
        @viewImg="viewImg"
        @contextmenu.native.prevent="showMsgMeun"></MsgBody>
    </div>
    <div v-show="tags.showBottomButton" @click="scrollBottom(true)">
      <div class="ss-card">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M256 32C114.6 32 .0272 125.1 .0272 240c0 49.63 21.35 94.98 56.97 130.7c-12.5 50.37-54.27 95.27-54.77 95.77c-2.25 2.25-2.875 5.734-1.5 8.734C1.979 478.2 4.75 480 8 480c66.25 0 115.1-31.76 140.6-51.39C181.2 440.9 217.6 448 256 448c141.4 0 255.1-93.13 255.1-208S397.4 32 256 32z"/></svg>
        <span v-if="NewMsgNum > 0">{{ NewMsgNum }}</span>
      </div>
    </div>
    <div>
      <!-- 顶部附加区 -->
      <div>
        <!-- 更多功能 -->
        <div :class="tags.showMoreDetail ? 'more-detail show' : 'more-detail'">
          <div v-for="(item, index) in details"
            :key="index"
            :title="item.text"
            :onclick="item.fun"
            v-html="item.svg"></div>
        </div>
      </div>
      <div>
        <div @click="tags.showMoreDetail = !tags.showMoreDetail">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M432 256c0 17.69-14.33 32.01-32 32.01H256v144c0 17.69-14.33 31.99-32 31.99s-32-14.3-32-31.99v-144H48c-17.67 0-32-14.32-32-32.01s14.33-31.99 32-31.99H192v-144c0-17.69 14.33-32.01 32-32.01s32 14.32 32 32.01v144h144C417.7 224 432 238.3 432 256z"/></svg>
        </div>
        <div>
          <textarea
            type="text"
            v-model="msg"
            @paste="addImg"
            @keyup="mainKeyUp"></textarea>
          <div @click="sendMsg">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 512"><path d="M64 448c-8.188 0-16.38-3.125-22.62-9.375c-12.5-12.5-12.5-32.75 0-45.25L178.8 256L41.38 118.6c-12.5-12.5-12.5-32.75 0-45.25s32.75-12.5 45.25 0l160 160c12.5 12.5 12.5 32.75 0 45.25l-160 160C80.38 444.9 72.19 448 64 448z"/></svg>
          </div>
        </div>
      </div>
      <!-- 底部附加区 -->
      <div></div>
    </div>
    <!-- 合并转发消息预览器 -->
    <div :class="mergeList.length > 0 ? 'merge-pan show' : 'merge-pan'">
      <div @click="closeMergeMsg"></div>
      <div class="ss-card">
        <div>
          <svg style="margin-top: 5px;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M511.1 63.1v287.1c0 35.25-28.75 63.1-64 63.1h-144l-124.9 93.68c-7.875 5.75-19.12 .0497-19.12-9.7v-83.98h-96c-35.25 0-64-28.75-64-63.1V63.1c0-35.25 28.75-63.1 64-63.1h384C483.2 0 511.1 28.75 511.1 63.1z"/></svg>
          <span>{{ $t('chat.merge_msg') }}</span>
          <svg @click="closeMergeMsg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512"><path d="M310.6 361.4c12.5 12.5 12.5 32.75 0 45.25C304.4 412.9 296.2 416 288 416s-16.38-3.125-22.62-9.375L160 301.3L54.63 406.6C48.38 412.9 40.19 416 32 416S15.63 412.9 9.375 406.6c-12.5-12.5-12.5-32.75 0-45.25l105.4-105.4L9.375 150.6c-12.5-12.5-12.5-32.75 0-45.25s32.75-12.5 45.25 0L160 210.8l105.4-105.4c12.5-12.5 32.75-12.5 45.25 0s12.5 32.75 0 45.25l-105.4 105.4L310.6 361.4z"/></svg>
        </div>
        <div>
          <!-- 合并转发消息忽略是不是自己的判定 -->
          <MsgBody
            v-for="(msg, index) in mergeList"
            :key="'merge' + index"
            :data="msg"
            :isMerge="true"></MsgBody>
        </div>
      </div>
    </div>
    <!-- At 信息悬浮窗 -->
    <div class="mumber-info">
      <div v-if="Object.keys(mumberInfo).length > 0 && mumberInfo.error === undefined" class="ss-card" :style="getPopPost()">
        <img :src="'https://q1.qlogo.cn/g?b=qq&s=0&nk=' + mumberInfo.user_id">
        <div>
          <span name="id">{{ mumberInfo.user_id }}</span>
          <div>
            <a>{{  mumberInfo.card == '' ? mumberInfo.nickname : mumberInfo.card  }}</a>
            <div>
              <span v-if="$t('chat.member_type.' + mumberInfo.role) !== ''">
                {{  $t('chat.member_type.' + mumberInfo.role)  }}
              </span>
              <span>Lv {{  mumberInfo.level  }}</span>
            </div>
          </div>
          <span> {{ $t('chat.join_time', {time: Intl.DateTimeFormat(trueLang, {year:'numeric',month:"short",day:"numeric"}).format(new Date(mumberInfo.join_time * 1000))})  }} </span>
        </div>
      </div>
    </div>
    <!-- 消息右击菜单 -->
    <div class="msg-menu">
      <div v-show="tags.showMsgMenu" class="msg-menu-bg" @click="closeMsgMenu"></div>
      <div :class="tags.showMsgMenu ? 'ss-card menu show' : 'ss-card menu'" id="msgMenu">
        <div v-for="(item, index) in msgMenus" v-show="item.display" :key="'msgM-' + index">
           <div v-html="item.svg"></div>
           <a>{{ item.text }}</a>
        </div>
      </div>
    </div>
    <!-- 群 / 好友信息弹窗 -->
    <div v-if="tags.openChatInfo" class="chat-info-pan">
      <div class="ss-card chat-info">
        <header>
          <span v-if="chat.type === 'group'">{{ $t('chat.chat_info.group') }}</span>
          <span v-if="chat.type === 'user'">{{ $t('chat.chat_info.user') }}</span>
          <svg @click="openChatInfoPan" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512"><path d="M310.6 361.4c12.5 12.5 12.5 32.75 0 45.25C304.4 412.9 296.2 416 288 416s-16.38-3.125-22.62-9.375L160 301.3L54.63 406.6C48.38 412.9 40.19 416 32 416S15.63 412.9 9.375 406.6c-12.5-12.5-12.5-32.75 0-45.25l105.4-105.4L9.375 150.6c-12.5-12.5-12.5-32.75 0-45.25s32.75-12.5 45.25 0L160 210.8l105.4-105.4c12.5-12.5 32.75-12.5 45.25 0s12.5 32.75 0 45.25l-105.4 105.4L310.6 361.4z"/></svg>
        </header>
        <div :class="'chat-info-base ' + chat.type">
          <div>
            <img :src="chat.avatar">
            <div>
              <a>{{ chat.name }}</a>
              <span>{{ chat.id }}</span>
            </div>
            <div v-if="chat.type === 'group'">
              <svg :title="$t('chat.chat_info.is_owner')" v-if="chat.info.group.gOwner === Vue.loginInfo.account.uin" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path d="M309 106c11.4-7 19-19.7 19-34c0-22.1-17.9-40-40-40s-40 17.9-40 40c0 14.4 7.6 27 19 34L209.7 220.6c-9.1 18.2-32.7 23.4-48.6 10.7L72 160c5-6.7 8-15 8-24c0-22.1-17.9-40-40-40S0 113.9 0 136s17.9 40 40 40c.2 0 .5 0 .7 0L86.4 427.4c5.5 30.4 32 52.6 63 52.6H426.6c30.9 0 57.4-22.1 63-52.6L535.3 176c.2 0 .5 0 .7 0c22.1 0 40-17.9 40-40s-17.9-40-40-40s-40 17.9-40 40c0 9 3 17.3 8 24l-89.1 71.3c-15.9 12.7-39.5 7.5-48.6-10.7L309 106z"/></svg>
              <svg :title="$t('chat.chat_info.is_admin')" v-if="chat.info.group.gAdmins != undefined && chat.info.group.gAdmins.indexOf(Vue.loginInfo.account.uin) >= 0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path d="M316.9 18C311.6 7 300.4 0 288.1 0s-23.4 7-28.8 18L195 150.3 51.4 171.5c-12 1.8-22 10.2-25.7 21.7s-.7 24.2 7.9 32.7L137.8 329 113.2 474.7c-2 12 3 24.2 12.9 31.3s23 8 33.8 2.3l128.3-68.5 128.3 68.5c10.8 5.7 23.9 4.9 33.8-2.3s14.9-19.3 12.9-31.3L438.5 329 542.7 225.9c8.6-8.5 11.7-21.2 7.9-32.7s-13.7-19.9-25.7-21.7L381.2 150.3 316.9 18z"/></svg>
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
              <img v-for="(item, index) in chat.info.group.gAdmins"
                :key="'chatinfoadmin-' + item"
                :src="`https://q1.qlogo.cn/g?b=qq&s=0&nk=${item}`"
                :title="chat.info.group.ns[index]">
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
                    new Date(`${chat.info.user.birthday.year}-${chat.info.user.birthday.month}-${chat.info.user.birthday.day}`)
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
        <div v-if="chat.type === 'group'" class="layui-tab layui-tab-brief" style="overflow: hidden; display: flex;flex-direction: column;height: 100%;margin: 0;">
        <ul class="layui-tab-title chat-info-tab">
          <li class="layui-this">{{ $t('chat.chat_info.member') + `(${chat.info.group_members.length})` }}</li>
          <li>{{ $t('chat.chat_info.file') + `(${chat.info.group_files.total_cnt})` }}</li>
          <li>{{ $t('chat.chat_info.config') }}</li>
        </ul>
        <div class="chat-info-tab-body layui-tab-content">
          <div class="layui-tab-item layui-show chat-info-tab-member">
            <div v-for="item in chat.info.group_members" :key="'chatinfomlist-' + item.user_id">
              <img loading="lazy" :src="`https://q1.qlogo.cn/g?b=qq&s=0&nk=${item.user_id}`">
              <div>
                <a>{{ item.nickname }}</a>
                <svg v-if="item.role === 'owner'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path d="M309 106c11.4-7 19-19.7 19-34c0-22.1-17.9-40-40-40s-40 17.9-40 40c0 14.4 7.6 27 19 34L209.7 220.6c-9.1 18.2-32.7 23.4-48.6 10.7L72 160c5-6.7 8-15 8-24c0-22.1-17.9-40-40-40S0 113.9 0 136s17.9 40 40 40c.2 0 .5 0 .7 0L86.4 427.4c5.5 30.4 32 52.6 63 52.6H426.6c30.9 0 57.4-22.1 63-52.6L535.3 176c.2 0 .5 0 .7 0c22.1 0 40-17.9 40-40s-17.9-40-40-40s-40 17.9-40 40c0 9 3 17.3 8 24l-89.1 71.3c-15.9 12.7-39.5 7.5-48.6-10.7L309 106z"/></svg>
                <svg v-if="item.role === 'admin'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path d="M316.9 18C311.6 7 300.4 0 288.1 0s-23.4 7-28.8 18L195 150.3 51.4 171.5c-12 1.8-22 10.2-25.7 21.7s-.7 24.2 7.9 32.7L137.8 329 113.2 474.7c-2 12 3 24.2 12.9 31.3s23 8 33.8 2.3l128.3-68.5 128.3 68.5c10.8 5.7 23.9 4.9 33.8-2.3s14.9-19.3 12.9-31.3L438.5 329 542.7 225.9c8.6-8.5 11.7-21.2 7.9-32.7s-13.7-19.9-25.7-21.7L381.2 150.3 316.9 18z"/></svg>
              </div>
              <span>{{ item.user_id }}</span>
            </div>
          </div>
          <div :class="'layui-tab-item group-files'" @scroll="fileLoad">
            <div v-for="item in chat.info.group_files.file_list" :key="'file-' + item.id" :class="item.type === 2 ? ' folder' : ''">
              <svg v-if="item.type === 2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M447.1 96h-172.1L226.7 50.75C214.7 38.74 198.5 32 181.5 32H63.1c-35.35 0-64 28.66-64 64v320c0 35.34 28.65 64 64 64h384c35.35 0 64-28.66 64-64V160C511.1 124.7 483.3 96 447.1 96zM463.1 416c0 8.824-7.178 16-16 16h-384c-8.822 0-16-7.176-16-16V96c0-8.824 7.178-16 16-16h117.5c4.273 0 8.293 1.664 11.31 4.688L255.1 144h192c8.822 0 16 7.176 16 16V416z"/></svg>
              <svg v-if="item.type === 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M384 32H64.01C28.66 32 .0085 60.65 .0065 96L0 415.1C-.002 451.3 28.65 480 64 480h232.1c25.46 0 49.88-10.12 67.89-28.12l55.88-55.89C437.9 377.1 448 353.6 448 328.1V96C448 60.8 419.2 32 384 32zM52.69 427.3C50.94 425.6 48 421.8 48 416l.0195-319.1C48.02 87.18 55.2 80 64.02 80H384c8.674 0 16 7.328 16 16v192h-88C281.1 288 256 313.1 256 344v88H64C58.23 432 54.44 429.1 52.69 427.3zM330.1 417.9C322.9 425.1 313.8 429.6 304 431.2V344c0-4.406 3.594-8 8-8h87.23c-1.617 9.812-6.115 18.88-13.29 26.05L330.1 417.9z"/></svg>
              <div class="main">
                <span>{{ toHtml(item.name) }}</span>
                <div>
                  <span :data-id="item.owner_uin">{{ toHtml(item.owner_name) }}</span>
                  <span>{{ item.create_time === 0 ? '-' : Intl.DateTimeFormat(trueLang, {year:'numeric',month:"short",day:"numeric"})
                    .format(new Date(item.create_time * 1000)) }}</span>
                  <span v-if="item.dead_time !== 0 && item.dead_time !== undefined">{{ (parseInt((item.dead_time - item.create_time) / 86400) - 1) + $t('chat.chat_info.dead_day') }}</span>
                  <span v-if="item.type === 2">{{ $t('chat.chat_info.file_num', {num: item.size}) }}</span>
                  <span v-if="item.type === 1">{{ getSize(item.size) }}</span>
                </div>
              </div>
              <div v-if="item.type === 1 && item.downloadingPercentage === undefined" class="download" @click="getFile(item)">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--! Font Awesome Pro 6.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2022 Fonticons, Inc. --><path d="M344 240h-56L287.1 152c0-13.25-10.75-24-24-24h-16C234.7 128 223.1 138.8 223.1 152L224 240h-56c-9.531 0-18.16 5.656-22 14.38C142.2 263.1 143.9 273.3 150.4 280.3l88.75 96C243.7 381.2 250.1 384 256.8 384c7.781-.3125 13.25-2.875 17.75-7.844l87.25-96c6.406-7.031 8.031-17.19 4.188-25.88S353.5 240 344 240zM256 0C114.6 0 0 114.6 0 256s114.6 256 256 256s256-114.6 256-256S397.4 0 256 0zM256 464c-114.7 0-208-93.31-208-208S141.3 48 256 48s208 93.31 208 208S370.7 464 256 464z"/></svg>
              </div>
              <svg v-if="item.downloadingPercentage !== undefined" class="download-bar" xmlns="http://www.w3.org/2000/svg">
                <circle cx="50%" cy="50%" r="40%" stroke-width="15%" fill="none" stroke-linecap="round"/>
                <circle cx="50%" cy="50%" r="40%" stroke-width="15%" fill="none"
                  :stroke-dasharray="item.downloadingPercentage === undefined ?
                    '0,10000' : `${Math.floor(2 * Math.PI * 25) * item.downloadingPercentage / 100},10000`"/>
              </svg>
              <!-- <div v-if="item.type === 2 && chat.info.group_sub_files.id === item.id">
              </div> -->
            </div>
            <div v-show="chat.info.group_files !== undefined &&
              chat.info.group_files.next_index !== undefined &&
              chat.info.group_files.next_index !== 0">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M120 256c0 30.9-25.1 56-56 56s-56-25.1-56-56s25.1-56 56-56s56 25.1 56 56zm160 0c0 30.9-25.1 56-56 56s-56-25.1-56-56s25.1-56 56-56s56 25.1 56 56zm104 56c-30.9 0-56-25.1-56-56s25.1-56 56-56s56 25.1 56 56s-25.1 56-56 56z"/></svg>
            </div>
          </div>
          <div class="layui-tab-item">3</div>
        </div>
      </div>
      </div>
      <div class="card-info-pan-bg"></div>
    </div>
  </div>
</template>

<script>
import MsgBody from '../components/MsgBody.vue'
import Vue from 'vue'

import { parseMsgId, getTrueLang, getSizeFromBytes, htmlDecodeByRegExp, getRandom } from '../assets/js/util.js'

export default {
  name: 'Chat',
  props: ['chat', 'list', 'mergeList', 'mumberInfo', 'imgView'],
  components: { MsgBody },
  data () {
    return {
      Vue: Vue,
      trueLang: getTrueLang(),
      getSize: getSizeFromBytes,
      toHtml: htmlDecodeByRegExp,
      tags: {
        canLoadHistory: true,
        nowGetHistroy: false,
        showBottomButton: true,
        showMoreDetail: false,
        showMsgMenu: false,
        openedMenuMsg: null,
        openChatInfo: false
      },
      details: [
        {
          svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M447.1 32h-384C28.64 32-.0091 60.65-.0091 96v320c0 35.35 28.65 64 63.1 64h384c35.35 0 64-28.65 64-64V96C511.1 60.65 483.3 32 447.1 32zM111.1 96c26.51 0 48 21.49 48 48S138.5 192 111.1 192s-48-21.49-48-48S85.48 96 111.1 96zM446.1 407.6C443.3 412.8 437.9 416 432 416H82.01c-6.021 0-11.53-3.379-14.26-8.75c-2.73-5.367-2.215-11.81 1.334-16.68l70-96C142.1 290.4 146.9 288 152 288s9.916 2.441 12.93 6.574l32.46 44.51l93.3-139.1C293.7 194.7 298.7 192 304 192s10.35 2.672 13.31 7.125l128 192C448.6 396 448.9 402.3 446.1 407.6z"/></svg>',
          text: this.$t('chat.fun_menu.pic'),
          fun: 'selectImg()'
        },
        {
          svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M0 256C0 114.6 114.6 0 256 0C397.4 0 512 114.6 512 256C512 397.4 397.4 512 256 512C114.6 512 0 397.4 0 256zM256 432C332.1 432 396.2 382 415.2 314.1C419.1 300.4 407.8 288 393.6 288H118.4C104.2 288 92.92 300.4 96.76 314.1C115.8 382 179.9 432 256 432V432zM176.4 160C158.7 160 144.4 174.3 144.4 192C144.4 209.7 158.7 224 176.4 224C194 224 208.4 209.7 208.4 192C208.4 174.3 194 160 176.4 160zM336.4 224C354 224 368.4 209.7 368.4 192C368.4 174.3 354 160 336.4 160C318.7 160 304.4 174.3 304.4 192C304.4 209.7 318.7 224 336.4 224z"/></svg>',
          text: this.$t('chat.fun_menu.face'),
          fun: 'emojiPan()'
        }
      ],
      msgMenus: [
        {
          svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M511.1 63.1v287.1c0 35.25-28.75 63.1-64 63.1h-144l-124.9 93.68c-7.875 5.75-19.12 .0497-19.12-9.7v-83.98h-96c-35.25 0-64-28.75-64-63.1V63.1c0-35.25 28.75-63.1 64-63.1h384C483.2 0 511.1 28.75 511.1 63.1z"/></svg>',
          text: this.$t('chat.msg_menu.reply'),
          fun: '',
          display: true
        },
        {
          svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M503.7 226.2l-176 151.1c-15.38 13.3-39.69 2.545-39.69-18.16V272.1C132.9 274.3 66.06 312.8 111.4 457.8c5.031 16.09-14.41 28.56-28.06 18.62C39.59 444.6 0 383.8 0 322.3c0-152.2 127.4-184.4 288-186.3V56.02c0-20.67 24.28-31.46 39.69-18.16l176 151.1C514.8 199.4 514.8 216.6 503.7 226.2z"/></svg>',
          text: this.$t('chat.msg_menu.forward'),
          fun: '',
          display: true
        },
        {
          svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512"><path d="M23.19 32C28.86 32 34.34 34.08 38.59 37.86L312.6 281.4C317.3 285.6 320 291.6 320 297.9C320 310.1 310.1 320 297.9 320H179.8L236.6 433.7C244.5 449.5 238.1 468.7 222.3 476.6C206.5 484.5 187.3 478.1 179.4 462.3L121.2 346L38.58 440.5C34.4 445.3 28.36 448 22.01 448C9.855 448 0 438.1 0 425.1V55.18C0 42.38 10.38 32 23.18 32H23.19z"/></svg>',
          text: this.$t('chat.msg_menu.multiple_choice'),
          fun: '',
          display: true
        },
        {
          svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><path d="M336 64h-53.88C268.9 26.8 233.7 0 192 0S115.1 26.8 101.9 64H48C21.5 64 0 85.48 0 112v352C0 490.5 21.5 512 48 512h288c26.5 0 48-21.48 48-48v-352C384 85.48 362.5 64 336 64zM192 64c17.67 0 32 14.33 32 32c0 17.67-14.33 32-32 32S160 113.7 160 96C160 78.33 174.3 64 192 64zM272 224h-160C103.2 224 96 216.8 96 208C96 199.2 103.2 192 112 192h160C280.8 192 288 199.2 288 208S280.8 224 272 224z"/></svg>',
          text: this.$t('chat.msg_menu.copy'),
          fun: '',
          display: true
        },
        {
          svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512"><path d="M310.6 361.4c12.5 12.5 12.5 32.75 0 45.25C304.4 412.9 296.2 416 288 416s-16.38-3.125-22.62-9.375L160 301.3L54.63 406.6C48.38 412.9 40.19 416 32 416S15.63 412.9 9.375 406.6c-12.5-12.5-12.5-32.75 0-45.25l105.4-105.4L9.375 150.6c-12.5-12.5-12.5-32.75 0-45.25s32.75-12.5 45.25 0L160 210.8l105.4-105.4c12.5-12.5 32.75-12.5 45.25 0s12.5 32.75 0 45.25l-105.4 105.4L310.6 361.4z"/></svg>',
          text: this.$t('chat.msg_menu.withdraw'),
          fun: '',
          display: false
        }
      ],
      NewMsgNum: 0,
      listSize: 0,
      msg: ''
    }
  },
  methods: {
    /**
     * 主聊天消息显示区滚动事件
     * @param { object } event 事件对象
     */
    chatScroll: function (event) {
      const body = event.target
      // 顶部
      if (body.scrollTop === 0 && this.list.length > 0) {
        this.loadMoreHistory()
      }
      // 底部
      if (body.scrollTop + body.clientHeight === body.scrollHeight) {
        this.NewMsgNum = 0
      }
      // 显示回到底部
      if (body.scrollTop < body.scrollHeight - body.clientHeight * 2) {
        this.tags.showBottomButton = true
      } else {
        this.tags.showBottomButton = false
      }
    },
    /**
     * 加载更多历史消息
     */
    loadMoreHistory: function () {
      if (!this.tags.nowGetHistroy && this.tags.canLoadHistory) {
        // 获取列表第一条消息 ID
        const firstMsgId = this.list[0].message_id
        // 锁定加载防止反复触发
        this.tags.nowGetHistroy = true
        // 发起获取历史消息请求
        Vue.sendWs(
          Vue.createAPI(
            'getChatHistory',
            { 'message_id': firstMsgId },
            'getChatHistory'
          )
        )
      }
    },
    /**
     * 滚动聊天框到指定位置
     * @param { int } where 位置（px）
     * @param { boolren } showAnimation 是否使用过渡动画
     */
    scrollTo: function (where, showAnimation) {
      const pan = document.getElementById('msgPan')
      if (showAnimation === false) {
        pan.style.scrollBehavior = 'unset'
      } else {
        pan.style.scrollBehavior = 'smooth'
      }
      pan.scrollTop = where
      pan.style.scrollBehavior = 'smooth'
    },
    scrollBottom: function (showAnimation) {
      const pan = document.getElementById('msgPan')
      this.scrollTo(pan.scrollHeight, showAnimation)
    },
    scrollToMsg: function (seq) {
      const msg = document.getElementById(seq)
      if (msg) {
        this.scrollTo(msg.offsetTop - msg.offsetHeight + 10)
      } else {
        const data = {
          text: this.$t('chat.msg_not_load'),
          type: Vue.appMsgType.err,
          autoClose: true
        }
        this.$emit('message', data)
      }
    },
    viewImg: function (msgId) {
      this.$emit('viewImg', msgId)
    },
    setNoMoreHistory: function () {
      this.tags.canLoadHistory = false
    },
    /**
     * 格式化时间
     * @param { Date } time 时间
     */
    formatTime: function (time, like) {
      var format = require('date-format')
      return format.asString(like, time)
    },
    /**
     * 添加图片
     * @param { object } event 事件
     */
    addImg: function (event) {
      Vue.addImg(event)
    },
    /**
     * 发送框按键事件（仅用于判定发送）
     * @param { object } event 事件
     */
    mainKeyUp: function (event) {
      if (!event.shiftKey && event.keyCode === 13) {
        this.sendMsg()
      }
    },
    /**
     * 显示右击菜单
     * @param { object } event 事件
     */
    showMsgMeun: function (event) {
      const menu = document.getElementById('msgMenu')
      const msg = event.currentTarget
      // 鼠标位置
      const pointEvent = event || window.event
      const pointX = pointEvent.layerX
      const pointY = pointEvent.clientY
      // 移动菜单位置
      menu.style.marginLeft = pointX + 'px'
      menu.style.marginTop = pointY + 'px'
      // 出界判定
      const menuWidth = menu.clientWidth
      const menuHeight = menu.clientHeight
      const msgWidth = msg.offsetWidth
      const bodyHeight = document.body.clientHeight
      if (pointX + menuWidth > msgWidth + 27) {
        menu.style.marginLeft = (msgWidth + 27 - menuWidth) + 'px'
      }
      if (pointY + menuHeight > bodyHeight - 10) {
        menu.style.marginTop = (bodyHeight - menuHeight - 10) + 'px'
      }
      // 显示菜单
      this.tags.showMsgMenu = true
      // 设置消息背景
      this.tags.openedMenuMsg = msg
      msg.style.background = '#00000008'
    },
    getPopPost: function () {
      const x = this.mumberInfo.x === undefined ? '0' : this.mumberInfo.x
      const y = this.mumberInfo.y === undefined ? '0' : this.mumberInfo.y
      return 'margin-left:' + x + 'px;margin-top:' + y + 'px;'
    },
    hiddenUserInfo: function () {
      this.$emit('hiddenUserInfo', null)
    },
    closeMsgMenu: function () {
      // 关闭菜单
      this.tags.showMsgMenu = false
      // 清理消息背景
      this.tags.openedMenuMsg.style.background = 'unset'
    },
    closeMergeMsg: function () {
      this.$emit('cleanMerge', null)
    },
    /**
     * 打开好友/群组信息页面
     */
    openChatInfoPan: function () {
      this.tags.openChatInfo = !this.tags.openChatInfo
      // 加载一些需要显示的消息，有部分判断是用来防止反复加载已存在内容的
      if (this.tags.openChatInfo) {
        // 加载基础信息
        if (this.chat.type === 'group' && this.chat.info.group.gc !== this.chat.id) {
          const url = `https://qinfo.clt.qq.com/cgi-bin/qun_info/get_group_info_all?gc=${this.chat.id}&bkn=${Vue.loginInfo.oicq.bkn}`
          Vue.sendWs(Vue.createAPI(
            'http_proxy',
            {'url': url},
            'getMoreGroupInfo'
          ))
        } else if (this.chat.type === 'user' && this.chat.info.user.uin !== this.chat.id) {
          const url = 'https://find.qq.com/proxy/domain/cgi.find.qq.com/qqfind/find_v11?backver=2'
          const info = `bnum=15&pagesize=15&id=0&sid=0&page=0&pageindex=0&ext=&guagua=1&gnum=12&guaguan=2&type=2&ver=4903&longitude=116.405285&latitude=39.904989&lbs_addr_country=%E4%B8%AD%E5%9B%BD&lbs_addr_province=%E5%8C%97%E4%BA%AC&lbs_addr_city=%E5%8C%97%E4%BA%AC%E5%B8%82&keyword=${this.chat.id}&nf=0&of=0&ldw=${Vue.loginInfo.oicq.bkn}`
          Vue.sendWs(Vue.createAPI(
            'http_proxy',
            { 'url': url, 'method': 'post', 'data': info },
            'getMoreUserInfo'
          ))
        }
        // 加载群成员列表
        if (this.chat.type === 'group' &&
        (Object.keys(this.chat.info.group_members).length === 0 || this.chat.info.group_members.length <= 0 || this.chat.info.group_members[0].group_id !== this.chat.id)) {
          Vue.sendWs(Vue.createAPI(
            'get_group_member_list',
            {'group_id': this.chat.id},
            'getGroupMemberList'
          ))
        }
        // 加载群文件列表
        if (this.chat.type === 'group' && Object.keys(this.chat.info.group_files).length === 0) {
          const url = `https://pan.qun.qq.com/cgi-bin/group_file/get_file_list?gc=${this.chat.id}&bkn=${Vue.loginInfo.oicq.bkn}&start_index=0&cnt=30&filter_code=0&folder_id=%2F&show_onlinedoc_folder=0`
          Vue.sendWs(Vue.createAPI(
            'http_proxy',
            { 'url': url },
            'getGroupFiles'
          ))
        }
      }
    },
    /**
     * 加载更多文件
     */
    fileLoad: function (event) {
      const sender = event.srcElement
      if (sender.scrollTop + sender.clientHeight >= sender.scrollHeight && this.chat.info.group_files.next_index !== 0 &&
        this.chat.info.group_files.next_index !== this.chat.info.group_files.total_cnt) {
        const url = `https://pan.qun.qq.com/cgi-bin/group_file/get_file_list?gc=${this.chat.id}&bkn=${Vue.loginInfo.oicq.bkn}&start_index=${this.chat.info.group_files.next_index}&cnt=30&filter_code=0&folder_id=%2F&show_onlinedoc_folder=0`
        Vue.sendWs(Vue.createAPI(
          'http_proxy',
          { 'url': url },
          'getMoreGroupFiles'
        ))
      }
    },
    /**
     * 下载文件（获取文件下载地址并下载）
     */
    getFile: function (item) {
      const url = `https://pan.qun.qq.com/cgi-bin/group_share_get_downurl?uin=${Vue.loginInfo.account.uin}&groupid=${this.chat.id}&pa=%2F${item.bus_id}${item.id}&r=${getRandom(true, false, false, 16)}&charset=utf-8&g_tk=${Vue.loginInfo.oicq.bkn}`
      Vue.sendWs(Vue.createAPI(
        'http_proxy',
        { 'url': url },
        'downloadGroupFile_' + item.id
      ))
    },
    /**
     * 发送消息
     */
    sendMsg: function () {
      let json = null
      let msg = this.msg
      // TODO 暂时不处理图片，等待 tim 修改后端
      // 构建图片 CQ 码
      // if (Vue.cacheImg !== undefined && Vue.cacheImg.length > 0) {
      //   for (let i = 0; i < Vue.cacheImg.length; i++) {
      //     // 构建图片 CQ 码
      //     msg = '[CQ:image,file=base64://' + Vue.cacheImg[i].substring(Vue.cacheImg[i].indexOf('base64') + 7) + ']' + msg
      //   }
      // }
      if (msg !== '') {
        // 去除回车发送导致的结尾换行
        if (msg.slice(-1) === '\n') {
          msg = msg.substring(0, msg.length - 1)
        }
        switch (this.chat.type) {
          case 'group': json = Vue.createAPI('sendGroupMsg', {'group_id': this.chat.id, 'message': msg}, 'sendMsgBack'); break
          case 'user': json = Vue.createAPI('sendPrivateMsg', {'user_id': this.chat.id, 'message': msg}, 'sendMsgBack'); break
        }
        if (json != null) {
          Vue.sendWs(json)
          // PS: 渲染本条消息的功能由消息本请求的返回系统处理
        }
      }
      // 发送后事务
      this.msg = ''
      this.scrollBottom()
    }
  },
  watch: {
    list: function () {
      // =================== 刷新统计数据 ===================

      // 判断新消息数量
      if (this.tags.showBottomButton && !this.tags.nowGetHistroy && this.listSize > 0) {
        this.NewMsgNum += this.list.length - this.listSize
      }
      // 超过 100 条消息时 shift 出一条
      if (this.list.length > 100 && !this.tags.nowGetHistroy) {
        this.list.shift()
      }
      // 刷新列表长度记录
      this.listSize = this.list.length

      // =================== 渲染监听操作 ===================

      // 渲染前的数据
      const pan = document.getElementById('msgPan')
      const height = pan.scrollHeight
      const top = pan.scrollTop
      // 渲染后操作
      this.$nextTick(() => {
        // 加载历史记录锁定滚动条位置
        if (this.tags.nowGetHistroy) {
          const newPan = document.getElementById('msgPan')
          this.scrollTo(newPan.scrollHeight - height, false)
          this.tags.nowGetHistroy = false
        } else {
          // 解除锁定加载
          this.tags.nowGetHistroy = false
        }
        // 新消息自动下滚
        const newPan = document.getElementById('msgPan')
        if (top === height - newPan.clientHeight) {
          // 刚刚页面在最底部
          this.scrollBottom(true)
        }
        // 刷新图片列表
        let getImgList = []
        this.list.forEach((item) => {
          item.message.forEach((msg) => {
            if (msg.type === 'image' && !msg.asface) {
              const index = (parseMsgId(item.message_id)).seqid
              const info = [index, item.message_id, msg.url]
              getImgList.push(info)
            }
          })
        })
        this.imgView.srcList = getImgList
      })
    },
    chat: function () {
      // 重置部分状态数据
      this.tags = this.$options.data().tags
      this.msgMenus = this.$options.data().msgMenus
    }
  }
}
</script>
