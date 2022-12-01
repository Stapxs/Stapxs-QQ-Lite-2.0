<template>
  <div class="base" @click="showAll = !showAll">
    <header>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><!--! Font Awesome Pro 6.2.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2022 Fonticons, Inc. --><path d="M336 0h-288C21.49 0 0 21.49 0 48v431.9c0 24.7 26.79 40.08 48.12 27.64L192 423.6l143.9 83.93C357.2 519.1 384 504.6 384 479.9V48C384 21.49 362.5 0 336 0zM336 452L192 368l-144 84V54C48 50.63 50.63 48 53.1 48h276C333.4 48 336 50.63 336 54V452z"/></svg>
      <span>{{ data.msg.title }}</span>
    </header>
    <div :class="'body' + (!showAll ? '' : ' all')">
      <span v-html="Xss(data.msg.text_face).replaceAll('\r', '\n').replaceAll('\n\n', '\n')"></span>
    </div>
    <div class="info">
      <img :src="'https://q1.qlogo.cn/g?b=qq&s=0&nk=' + data.u">
      <a>{{ (runtimeData.onChat.info.group_members.filter((item) => { return Number(item.user_id) === Number(data.u) }))[0].nickname }}</a>
      <div></div>
      <span>{{ $t('chat_chat_info_bulletin_read', {
          isRead: data.is_read ? $t('chat_chat_info_bulletin_readed') : $t('chat_chat_info_bulletin_noread'),
          readNum: data.read_num
        })
      }}</span>
    </div>
  </div>
</template>

<script>
import Xss from 'xss'
import { runtimeData } from '../../assets/js/msg'

export default {
  name: 'BulletinBody',
  props: ['data'],
  data () {
    return {
      Xss: Xss,
      runtimeData: runtimeData,
      showAll: false
    }
  }
}
</script>
