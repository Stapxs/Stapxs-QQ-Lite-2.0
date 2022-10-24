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
        <!-- 更多共附加区 -->
        <div>
          <!-- 表情面板 -->
          <FacePan v-show="details[1].open" @addSpecialMsg="addSpecialMsg"></FacePan>
        </div>
        <!-- 更多功能 -->
        <div :class="tags.showMoreDetail ? 'more-detail show' : 'more-detail'">
          <div :title="this.$t('chat.fun_menu.face')" @click="details[1].open = !details[1].open,tags.showMoreDetail = false">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M0 256C0 114.6 114.6 0 256 0C397.4 0 512 114.6 512 256C512 397.4 397.4 512 256 512C114.6 512 0 397.4 0 256zM256 432C332.1 432 396.2 382 415.2 314.1C419.1 300.4 407.8 288 393.6 288H118.4C104.2 288 92.92 300.4 96.76 314.1C115.8 382 179.9 432 256 432V432zM176.4 160C158.7 160 144.4 174.3 144.4 192C144.4 209.7 158.7 224 176.4 224C194 224 208.4 209.7 208.4 192C208.4 174.3 194 160 176.4 160zM336.4 224C354 224 368.4 209.7 368.4 192C368.4 174.3 354 160 336.4 160C318.7 160 304.4 174.3 304.4 192C304.4 209.7 318.7 224 336.4 224z"/></svg>
          </div>
        </div>
      </div>
      <div>
        <div @click="tags.showMoreDetail = !tags.showMoreDetail">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M432 256c0 17.69-14.33 32.01-32 32.01H256v144c0 17.69-14.33 31.99-32 31.99s-32-14.3-32-31.99v-144H48c-17.67 0-32-14.32-32-32.01s14.33-31.99 32-31.99H192v-144c0-17.69 14.33-32.01 32-32.01s32 14.32 32 32.01v144h144C417.7 224 432 238.3 432 256z"/></svg>
        </div>
        <div>
          <textarea
            id="main-input"
            type="text"
            v-model="msg"
            @paste="addImg"
            @keyup="mainKeyUp"
            @click="selectSQ(),selectSQIn()"></textarea>
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
              <span v-if="mumberInfo.role !== 'member'">
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
    <InfoBody :chat="chat" :tags="tags" @close="openChatInfoPan" @loadFile="fileLoad"></InfoBody>
    <!-- 图片发送器 -->
    <div class="img-sender" v-if="Vue.cacheImg != undefined && Vue.cacheImg.length > 0">
      <div class="card ss-card">
        <div class="hander">
          <span>{{ $t('chat.send_pic.title') }}</span>
          <button @click="sendMsg();Vue.cacheImg = undefined" class="ss-button">{{ $t('chat.send_pic.send') }}</button>
        </div>
        <div class="imgs">
          <div v-for="(img64, index) in Vue.cacheImg"
            :key="'sendImg-' + img64.substring(img64.length - 5, img64.length)">
            <div @click="deleteImg(index)">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512"><path d="M310.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L160 210.7 54.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L114.7 256 9.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L160 301.3 265.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L205.3 256 310.6 150.6z"/></svg>
            </div>
            <img :src="img64">
          </div>
        </div>
        <div class="sender">
          <input type="text" @paste="addImg" v-model="msg">
        </div>
      </div>
      <div class="bg" @click="Vue.cacheImg = undefined"></div>
    </div>
  </div>
</template>

<script>
import MsgBody from '../components/MsgBody.vue'
import Vue from 'vue'

import { parseMsgId, getTrueLang } from '../assets/js/util.js'
import SendUtil from '../assets/js/sender.js'
import InfoBody from '../components/chat/InfoPan.vue'
import FacePan from '../components/chat/FacePan.vue'

export default {
  name: 'Chat',
  props: ['chat', 'list', 'mergeList', 'mumberInfo', 'imgView'],
  components: { MsgBody, InfoBody, FacePan },
  data () {
    return {
      Vue: Vue,
      trueLang: getTrueLang(),
      tags: {
        canLoadHistory: true,
        nowGetHistroy: false,
        showBottomButton: true,
        showMoreDetail: false,
        showMsgMenu: false,
        openedMenuMsg: null,
        openChatInfo: false
      },
      details: [{ open: false }, { open: false }],
      msgMenus: [],
      NewMsgNum: 0,
      listSize: 0,
      msg: '',
      msgCache: '',
      sendCache: []
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
     * 发送框按键事件
     * @param { object } event 事件
     */
    mainKeyUp: function (event) {
      // console.log(event.keyCode)
      if (!event.shiftKey && event.keyCode === 13) {
        // enter 发送消息
        this.msg = this.msgCache
        this.sendMsg()
      } else if (event.keyCode === 8) {
        // backspace 删除内容
        this.selectSQ()
      } else {
        // cache 非回车发送的输入消息已用于在回车发送时去除按下的回车（复盖为回车前的内容）
        this.msgCache = this.msg
      }
    },
    /**
     * 选中当前输入框光标位置前面的一个 SQCode
     */
    selectSQ: function () {
      var input = document.getElementById('main-input')
      // 如果文本框里本来就选中着什么东西就不触发了
      if (input.selectionStart === input.selectionEnd) {
        // PS：这儿用来对删除前方是否有 [SQ:n] 特殊结构进行判断以便自动选中
        var cursurPosition = -1
        if (typeof input.selectionStart === 'number') {
          cursurPosition = input.selectionStart
        }
        // PS：只取光标前面的部分消息
        const getSQCode = SendUtil.getSQList(this.msg.substring(0, cursurPosition))
        if (getSQCode !== null) {
          const selectionStart = (this.msg.substring(0, cursurPosition)).lastIndexOf(getSQCode[getSQCode.length - 1])
          if (selectionStart !== -1 &&
            selectionStart + getSQCode[getSQCode.length - 1].length === this.msg.substring(0, cursurPosition).length) {
            this.$nextTick(() => {
              input.selectionStart = selectionStart
              input.selectionEnd = this.msg.substring(0, cursurPosition).length
            })
          }
        }
      }
    },
    /**
     * 选中光标在其内部的那个 SQLCode
     */
    selectSQIn: function () {
      var input = document.getElementById('main-input')
      // 如果文本框里本来就选中着什么东西就不触发了
      if (input.selectionStart === input.selectionEnd) {
        var cursurPosition = -1
        if (typeof input.selectionStart === 'number') {
          cursurPosition = input.selectionStart
        }
        // 获取所有的 SQCode
        const getSQCode = SendUtil.getSQList(this.msg)
        console.log(getSQCode)
        if (getSQCode != null) {
          // 遍历寻找 SQCode 位置区间包括光标位置的 SQCode
          getSQCode.forEach((item) => {
            const start = this.msg.indexOf(item)
            const end = start + item.length
            if (start !== -1 && cursurPosition > start && cursurPosition < end) {
              this.$nextTick(() => {
                input.selectionStart = start
                input.selectionEnd = end
              })
            }
          })
        }
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
     * 根据 index 删除图片
     * @param { number } index 图片编号
     */
    deleteImg: function (index) {
      console.log(index)
      console.log(Vue.cacheImg)
      Vue.cacheImg.splice(index, 1)
      this.$forceUpdate()
      console.log(Vue.cacheImg)
    },
    /**
     * 添加特殊消息结构
     * @param { object } obj obj
     */
    addSpecialMsg: function (data) {
      // data 结构：
      // const data = {
      //   addText: false,    // 是否添加到输入框内
      //   msgObj: {}         // 消息结构
      // }
      console.log(data)
      if (data !== undefined) {
        const index = this.sendCache.length
        this.sendCache.push(data.msgObj)
        if (data.addText === true) {
          this.msg += '[SQ:' + index + ']'
        }
        return index
      }
      return -1
    },
    /**
     * 添加图片缓存
     * @param { object } e 事件
     */
    addImg: function (e) {
      // 判断粘贴类型
      if (!(e.clipboardData && e.clipboardData.items)) {
        return
      }
      for (let i = 0, len = e.clipboardData.items.length; i < len; i++) {
        let item = e.clipboardData.items[i]
        if (item.kind === 'file') {
          let blob = item.getAsFile()
          if (blob.type.indexOf('image/') >= 0 && blob.size !== 0) {
            this.$emit('message', {
              text: this.$t('chat.image_processing'),
              type: Vue.appMsgType.info,
              autoClose: true
            })
            if (blob.size < 3145728) {
              // 转换为 Base64
              var reader = new FileReader()
              reader.readAsDataURL(blob)
              reader.onloadend = function () {
                var base64data = reader.result
                // 记录图片信息
                if (Vue.cacheImg === undefined) {
                  Vue.cacheImg = []
                }
                // 只要你内存够猛，随便 cache 图片，这边就不做限制了
                Vue.cacheImg.push(base64data)
              }
            } else {
              this.$emit('message', {
                text: this.$t('chat.image_toooo_big'),
                type: Vue.appMsgType.info,
                autoClose: true
              })
            }
            // 阻止默认行为
            e.preventDefault()
          }
        }
      }
    },
    /**
     * 发送消息
     */
    sendMsg: function () {
      // 为了减少对于复杂图文排版页面显示上的工作量，对于非纯文本的消息依旧处理为纯文本，如：
      // "这是一段话[SQ:0]，[SQ:1] 你要不要来试试 Stapxs QQ Lite？"
      // 其中 [SQ:n] 结构代表着这是特殊消息以及这个消息具体内容在消息缓存中的 index，像是这样：
      // const sendCache = [{type:"face",id:1},{type:"at",qq:1007028430}]
      //                     ^^^^^^ 0 ^^^^^^    ^^^^^^^^^^ 1 ^^^^^^^^^^
      // 在发送操作触发之后，将会解析此条字符串排列出最终需要发送的消息结构用于发送。
      // // PS：你可以在前面添加反斜杠来忽略解析，就像是："[SQ:1] 你好，\[SQ:2]"
      let json = null
      let msg = SendUtil.parseMsg(this.msg, this.sendCache)
      if (msg !== null && msg.length > 0) {
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
      this.sendCache = []
    }
  }
}
</script>
