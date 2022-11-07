<!--
 * @FileDescription: 消息组件
 * @Author: Stapxs
 * @Date: 2022/08/03
 * @Version: 1.0
 * @Note: 此组件也负责子组件的渲染
 -->

 <template>
  <div
      :class="isMerge ? 'message merge' : 'message'"
      :data-raw="getMsgRawTxt(data.message)"
      :id="'chat-' + getSeq(data.message_id)"
      :data-sender="data.sender.user_id"
      :data-time="data.time"
      @mouseleave="hiddenUserInfo">
    <img :src="'https://q1.qlogo.cn/g?b=qq&s=0&nk=' + data.sender.user_id" v-show="!isMe || isMerge">
    <div class="message-space" v-if="isMe && !isMerge"></div>
    <div :class="isMe ? (isMerge ? 'message-body' : 'message-body me') : 'message-body'">
      <a v-show="!isMe || isMerge">{{ data.sender.card ? data.sender.card : data.sender.nickname }}</a>
      <div>
        <!-- 回复指示框 -->
        <div
            v-if="data.source"
            :class="isMe ? (isMerge ? 'msg-replay' : 'msg-replay me') : 'msg-replay'"
            @click="scrollToMsg(data.source.seq)">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M8.31 189.9l176-151.1c15.41-13.3 39.69-2.509 39.69 18.16v80.05C384.6 137.9 512 170.1 512 322.3c0 61.44-39.59 122.3-83.34 154.1c-13.66 9.938-33.09-2.531-28.06-18.62c45.34-145-21.5-183.5-176.6-185.8v87.92c0 20.7-24.31 31.45-39.69 18.16l-176-151.1C-2.753 216.6-2.784 199.4 8.31 189.9z"></path></svg>
          <a> {{ data.source ? data.source.message : '' }} </a>
        </div>
        <!-- 消息体 -->
        <div v-for="(item, index) in data.message" :class="isMsgInline(item.type) ? 'msg-inline' : ''" :key="data.message_id + '-m-' + index">
          <span v-if="item.type === 'text'" v-show="item.text !== ''" class="msg-text" v-html="parseText(item.text)"></span>
          <img v-else-if="item.type === 'image'" :title="$t('chat.view_pic')" :alt="$t('chat.group_pic')" @click="imgClick(data.message_id)" :class="imgStyle(data.message.length, index)" :src="item.url">
          <img v-else-if="item.type === 'face'" :alt="item.text" class="msg-face" :src="require('./../assets/src/qq-face/' + item.id + '.gif')" :title="item.text">
          <span v-else-if="item.type === 'bface'" style="font-style: italic;opacity: 0.7;">[ {{ $t('chat.fun_menu.pic') }}：{{ item.text }} ]</span>
          <div v-else-if="item.type === 'at'" v-show="isAtShow(data.source, item.qq)" :class="getAtClass(item.qq)">
            <a @mouseenter="showUserInfo" :data-id="item.qq" :data-group="data.group_id">{{ item.text }}</a>
          </div>
          <div v-else-if="item.type === 'xml'"
            v-html="buildXML(item.data, item.id, data.message_id)"
            @click="xmlClick('xml-' + data.message_id)"></div>
            <div v-else-if="item.type === 'json'"
              v-html="buildJSON(item.data, data.message_id)"
              @click="xmlClick('json-' + data.message_id)">
            </div>
            <span v-else class="msg-unknown">{{ $t('chat.unsupported_msg') }}</span>
        </div>
        <!-- 链接预览框 -->
      </div>
    </div>
    <code style="display: none;">{{ data.raw_message }}</code>
  </div>
</template>

<script>
import Vue from 'vue'
import Xss from 'xss'
import Util from '../assets/js/util.js'

import { connect as connecter } from '../assets/js/connect'

export default {
  name: 'MsgBody',
  props: ['data', 'isMerge'],
  data () {
    return {
      loginId: Vue.loginInfo.account.uin,
      isMe: false
    }
  },
  methods: {
    /**
     * 获取消息的纯文本信息
     * Note: 此方法可能会被遗弃（由于 oicq 会返回纯文本消息）
     * @param { object } message 消息对象
     */
    getMsgRawTxt: function (message) {
      let back = ''
      for (let i = 0; i < message.length; i++) {
        switch (message[i].type) {
          case 'at':
          case 'text': back += message[i].text.replaceAll('\n', ' ').replaceAll('\r', ' '); break
          case 'face':
          case 'bface': back += '[表情]'; break
          case 'image': back += '[图片]'; break
          case 'record': back += '[语音]'; break
          case 'video': back += '[视频]'; break
          case 'file': back += '[文件]'; break
          case 'json': back += JSON.parse(message[i].data).prompt; break
          case 'xml': {
            let name = message[i].data.substring(message[i].data.indexOf('<source name="') + 14)
            name = name.substring(0, name.indexOf('"'))
            back += '[' + name + ']'
            break
          }
        }
      }
      return back
    },
    /**
     * 判断消息块是否要行内显示
     * @param { String } type 消息类型
     */
    isMsgInline: function (type) {
      switch (type) {
        case 'at':
        case 'text':
        case 'face': return true
        case 'bface':
        case 'image':
        case 'record':
        case 'video':
        case 'file':
        case 'json':
        case 'xml': return false
      }
    },
    /**
     * 在有回复的情况下判断是否隐藏重复 at 消息
     * @param { object } message 消息体
     * @param { long } at at user_id
     */
    isAtShow: function (source, at) {
      if (source !== undefined) {
        return !(at === source.user_id)
      }
      return true
    },
    getAtClass: function (who) {
      let back = 'msg-at'
      if (this.isMe && !(this.isMerge)) {
        back += ' me'
      }
      if (Vue.loginInfo.account.uin === who) {
        back += ' atme'
      }
      return back
    },
    scrollToMsg: function (id) {
      this.$emit('scrollToMsg', 'chat-' + id)
    },
    /**
     * 处理图片显示需要的样式，顺便添加图片列表
     * @param { int } length 消息段数
     * @param { int } at 图片在消息中的位置
     */
    imgStyle: function (length, at) {
      // 处理样式
      if (length === 1) { return 'msg-img alone' }
      if (at === 0) { return 'msg-img top' }
      if (at === length - 1) { return 'msg-img button' }
      return 'msg-img'
    },
    imgClick: function (msgId) {
      this.$emit('viewImg', msgId)
    },
    getSeq: function (id) {
      return Util.parseMsgId(id).seqid
    },
    /**
     * 尝试渲染 xml 消息
     * @param { String } xml xml 消息内容
     * @param { String } id xml 消息 ID（不知道有啥用）
     */
    buildXML: function printXML (xml, id, msgid) {
      // <msg> 标签内的为本体
      let item = xml.substring(xml.indexOf('<item'), xml.indexOf('</msg>'))
      // 尝试转换标签为 html
      // item = item.replaceAll('/>', '>')
      item = item.replaceAll('item', 'div') // item
      item = item.replaceAll('<div', '<div class="msg-xml"')
      item = item.replaceAll('title', 'p') // title
      item = item.replaceAll('summary', 'a') // summary
      item = item.replaceAll('<a', '<a class="msg-xml-summary"')
      item = item.replaceAll('<picture', '<img class="msg-xml-img"') // picture
      // 将不正确的参数改为 dataset
      item = item.replaceAll('size=', 'data-size=')
      item = item.replaceAll('linespace=', 'data-linespace=')
      item = item.replaceAll('cover=', 'src=')
      // 处理出处标签
      item = item.replace('source name=', 'source data-name=')
      // 处理错误的 style 位置
      const div = document.createElement('div')
      div.id = 'xml-' + msgid
      div.dataset.id = id
      div.innerHTML = item
      for (let i = 0; i < div.children[0].children.length; i++) {
        switch (div.children[0].children[i].nodeName) {
          case 'P': {
            div.children[0].children[i].style.fontSize = Number(div.children[0].children[i].dataset.size) / 30 + 'rem'
            div.children[0].children[i].style.marginBottom = Number(div.children[0].children[i].dataset.size) / 5 + 'px'
            break
          }
        }
      }
      // 解析 msg 消息体
      let msgHeader = xml.substring(xml.indexOf('<msg'), xml.indexOf('<item')) + '</msg>'
      msgHeader = msgHeader.replace('msg', 'div')
      msgHeader = msgHeader.replace('m_resid=', 'data-resid=')
      msgHeader = msgHeader.replace('url=', 'data-url=')
      let header = document.createElement('div')
      header.innerHTML = msgHeader
      // 处理特殊的出处
      let sourceBody = ''
      for (let i = 0; i < div.children.length; i++) {
        if (div.children[i].nodeName === 'SOURCE') {
          sourceBody = div.children[i]
        }
      }
      const source = sourceBody.dataset.name
      switch (source) {
        case '聊天记录': {
          // 合并转发消息
          div.dataset.type = 'forward'
          div.dataset.id = header.children[0].dataset.resid
          div.style.cursor = 'pointer'
          break
        }
        case '群投票': {
          // 群投票
          return '<a class="msg-unknow">（不支持显示的 XML：' + source + '）</a>'
        }
      }
      // 附带链接的 xml 消息处理
      if (header.children[0].dataset.url !== undefined) {
        div.dataset.url = header.children[0].dataset.url
        div.style.cursor = 'pointer'
      }
      return div.outerHTML
    },
    xmlClick: function (id) {
      const sender = document.getElementById(id)
      const type = sender.dataset.type
      // 如果存在 url 项，优先打开 url
      if (sender.dataset.url !== undefined && sender.dataset.url !== 'undefined' && sender.dataset.url !== '') {
        window.open(sender.dataset.url, '_blank')
        return
      }
      // 接下来按类型处理
      if (type === 'forward') {
        // 解析合并转发消息
        connecter.send('getForwardMsg', { 'resid': sender.dataset.id })
      }
    },
    /**
     * 尝试渲染 JSON 消息
     * @param { object } data json 消息内容
     */
    buildJSON: function (data, msgId) {
      // 解析 JSON
      let json = JSON.parse(data)
      let body = json.meta[Object.keys(json.meta)[0]]
      // App 信息
      let name = body.tag === undefined ? body.title : body.tag
      let icon = body.icon === undefined ? body.source_icon : body.icon

      let title = body.title
      let desc = body.desc

      let preview = body.preview
      if (preview !== undefined && preview.indexOf('http') === -1) preview = '//' + preview

      let url = body.qqdocurl === undefined ? body.jumpUrl : body.qqdocurl
      // 构建 HTML
      let html = '<div class="msg-json" id="json-' + msgId + '" data-url="' + url + '">' +
                 '<p>' + title + '</p>' +
                 '<span>' + desc + '</span>' +
                 '<img src="' + preview + '">' +
                 '<div><img src="' + icon + '"><span>' + name + '</span></div>' +
                 '</div>'
      // 返回
      return html
    },
    /**
     * 处理纯文本消息（换行、链接等）
     * @param { string } text 纯文本消息
     */
    parseText: function (text) {
      // 把 r 转为 n
      text = text.replaceAll('\r\n', '\n').replaceAll('\r', '\n')
      // 防止意外渲染转义字符串
      text = text.replaceAll('&', '&amp;')
      // XSS 过滤
      text = Xss(text)
      // 链接判定
      const reg = /(http|ftp|https):\/\/[\w\-_]+(\.[\w\-_]+)+([\w\-\.,@?^=%&:/~\+#]*[\w\-\@?^=%&/~\+#])?/gi //eslint-disable-line
      text = text.replaceAll(reg, '<a href="$&" target="_blank">$&</a>')
      // 返回
      return text
    },
    showUserInfo: function (event) {
      const sender = event.currentTarget
      const id = sender.dataset.id
      const group = sender.dataset.group
      // 获取鼠标位置
      const pointEvent = event || window.event
      const pointX = pointEvent.layerX
      const pointY = pointEvent.clientY
      // 出界判定不做了怪麻烦的
      // 请求用户信息
      connecter.send('getGroupMemberInfo', {group_id: group, user_id: id},
        'getGroupMemberInfo_' + pointX + '_' + pointY)
    },
    hiddenUserInfo: function () {
      this.$parent.hiddenUserInfo()
    }
  },
  mounted: function () {
    this.isMe = this.loginId.toString() === this.data.sender.user_id.toString()
  }
}
</script>
