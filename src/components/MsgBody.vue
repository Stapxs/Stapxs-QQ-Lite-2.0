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
      :data-time="data.time">
    <img :src="'https://q1.qlogo.cn/g?b=qq&s=0&nk=' + data.sender.user_id" v-if="!isMe || isMerge">
    <div class="message-space" v-if="isMe && !isMerge"></div>
    <div :class="isMe ? (isMerge ? 'message-body' : 'message-body me') : 'message-body'">
      <a v-if="!isMe || isMerge">{{ data.sender.card ? data.sender.card : data.sender.nickname }}</a>
      <div>
        <!-- 回复指示框 -->
        <div
            v-if="data.source"
            class="msg-replay"
            @click="scrollToMsg(data.source.seq)">
          <svg style="height: 1rem;display: inline-block;margin-right: 5px;fill: var(--color-font-2);" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M8.31 189.9l176-151.1c15.41-13.3 39.69-2.509 39.69 18.16v80.05C384.6 137.9 512 170.1 512 322.3c0 61.44-39.59 122.3-83.34 154.1c-13.66 9.938-33.09-2.531-28.06-18.62c45.34-145-21.5-183.5-176.6-185.8v87.92c0 20.7-24.31 31.45-39.69 18.16l-176-151.1C-2.753 216.6-2.784 199.4 8.31 189.9z"></path></svg>
          {{ data.source ? data.source.message : '' }}
        </div>
        <!-- 消息体 -->
        <div v-for="(item, index) in data.message" :class="isMsgInline(item.type) ? 'msg-inline' : ''" :key="data.message_id + '-m-' + index">
          <span v-if="item.type === 'text' && item.text !== ''" class="msg-text" >{{ item.text }}</span>
          <img v-if="item.type === 'image'" title="查看图片" alt="群图片" :class="imgStyle(data.message.length, index)" :src="item.url">
          <img v-if="item.type === 'face'" :alt="item.text" class="msg-face" :src="require('./../assets/src/qq-face/' + item.id + '.gif')" title="惊恐">
          <span v-if="item.type === 'bface'" style="font-style: italic;opacity: 0.7;">[ 表情：{{ item.text }} ]</span>
          <div v-if="item.type === 'at' && isAtShow(data.source, item.qq)" :class="isMe ? (isMerge ? 'msg-at' : 'msg-at me') : 'msg-at'">
            <a @mouseover="showUserInfo" @mouseleave="hiddenUserInfo" :data-id="item.qq" :data-group="data.group_id">{{ item.text }}</a>
          </div>
          <div
            v-if="item.type === 'xml'"
            v-html="buildXML(item.data, item.id, data.message_id)"
            @click="xmlClick('xml-' + data.message_id)"></div>
        </div>
        <!-- 链接预览框 -->
      </div>
    </div>
    <code style="display: none;">{{ data.raw_message }}</code>
  </div>
</template>

<script>
import Vue from 'vue'
import Util from '../assets/js/util.js'

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
     * 处理图片显示需要的样式
     * @param { int } length 消息段数
     * @param { int } at 图片在消息中的位置
     */
    imgStyle: function (length, at) {
      if (length === 1) { return 'msg-img alone' }
      if (at === 0) { return 'msg-img top' }
      if (at === length - 1) { return 'msg-img button' }
      return 'msg-img'
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
    scrollToMsg: function (id) {
      this.$emit('scrollToMsg', 'chat-' + id)
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
      item = item.replaceAll('<picture', '<img alt="XML 图片" class="msg-xml-img"') // picture
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
    /**
     * xml 消息的点击事件
     */
    xmlClick: function (id) {
      const sender = document.getElementById(id)
      const type = sender.dataset.type
      console.log(type)
      // 如果存在 url 项，优先打开 url
      if (sender.dataset.url !== undefined && sender.dataset.url !== 'undefined' && sender.dataset.url !== '') {
        window.open(sender.dataset.url, '_blank')
        return
      }
      // 接下来按类型处理
      if (type === 'forward') {
        // 解析合并转发消息
        Vue.sendWs(Vue.createAPI('getForwardMsg', { 'resid': sender.dataset.id }))
      }
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
      Vue.sendWs(Vue.createAPI('getGroupMemberInfo', {group_id: group, user_id: id},
        'getGroupMemberInfo_' + pointX + '_' + pointY))
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
