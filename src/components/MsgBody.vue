<!--
 * @FileDescription: 消息组件
 * @Author: Stapxs
 * @Date: 2022/08/03
 * @Version: 1.0
 * @Note: 此组件也负责子组件的渲染
 -->

 <template>
  <div
      class="message"
      :data-raw="getMsgRawTxt(data.message)"
      :id="data.message_id"
      :data-sender="data.sender.user_id"
      :data-time="data.time">
    <img :src="'https://q1.qlogo.cn/g?b=qq&s=0&nk=' + data.sender.user_id" v-if="!isMe">
    <div class="message-space" v-if="data.sender.user_id.toString() === loginId.toString()"></div>
    <div :class="isMe ? 'message-body me' : 'message-body'">
      <a  v-if="!isMe">{{ data.sender.card ? data.sender.card : data.sender.nickname }}</a>
      <div>
        <!-- 回复指示框 -->
        <div
            v-if="data.source"
            class="msg-replay"
            :id="'get_rep_msg_' + data.message_id">
          <svg style="height: 1rem;display: inline-block;margin-right: 5px;fill: var(--color-font-2);" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M8.31 189.9l176-151.1c15.41-13.3 39.69-2.509 39.69 18.16v80.05C384.6 137.9 512 170.1 512 322.3c0 61.44-39.59 122.3-83.34 154.1c-13.66 9.938-33.09-2.531-28.06-18.62c45.34-145-21.5-183.5-176.6-185.8v87.92c0 20.7-24.31 31.45-39.69 18.16l-176-151.1C-2.753 216.6-2.784 199.4 8.31 189.9z"></path></svg>
          {{ data.source ? data.source.message : '' }}
        </div>
        <!-- 消息体 -->
        <div v-for="(item, index) in data.message" :key="data.message_id + '-m-' + index">
          <span v-if="item.type === 'text'">{{ item.text }}</span>
          <img v-if="item.type === 'image'" title="查看图片" alt="群图片" :class="imgStyle(data.message.length, index)" :src="item.url">
          <img v-if="item.type === 'face'" :alt="item.text" class="msg-face" :src="require('./../assets/src/qq-face/' + item.id + '.gif')" title="惊恐">
          <span v-if="item.type === 'bface'" style="font-style: italic;opacity: 0.7;">[ 表情：{{ item.text }} ]</span>
          <a v-if="item.type === 'at' && isAtShow(data.source, item.qq)" :id="item.qq" :class="isMe ? 'msg-at me' : 'msg-at'">{{ item.text }}</a>
        </div>
        <!-- 链接预览指示框 -->
      </div>
    </div>
    <code style="display: none;">{{ data.raw_message }}</code>
  </div>
</template>

<script>
import Vue from 'vue'

export default {
  name: 'MsgBody',
  props: ['data'],
  components: { },
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
    }
  },
  mounted: function () {
    this.isMe = this.loginId.toString() === this.data.sender.user_id.toString()
  }
}
</script>
