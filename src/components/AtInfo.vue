<template>
  <div class="mumber-info">
    <div v-if="mumberInfo !== null" class="ss-card">
      <img :src="'https://q1.qlogo.cn/g?b=qq&s=0&nk=' + mumberInfo.user_id">
      <div>
        <div>
          <a>{{  mumberInfo.card == '' ? mumberInfo.nickname : mumberInfo.card  }}</a>
          <span v-if="getRoleTitle(mumberInfo.role) !== ''">{{  getRoleTitle(mumberInfo.role)  }}</span>
          <span>Lv {{  mumberInfo.level  }}</span>
          <span> {{  mumberInfo.sex == 'male' ? '♂️' : '♀️'  }} </span>
        </div>
        <span> {{  this.formatTime(new Date(mumberInfo.join_time * 1000), 'yyyy 年 MM 月dd 日')  }} 加入群聊 </span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AtInfo',
  props: ['mumberInfo'],
  data() {
    return {}
  },
  methods: {
    getRoleTitle: function (role) {
      switch (role) {
        case 'admin': return '管理员'; break
        default: return ''
      }
    },
    /**
     * 格式化时间
     * @param { Date } time 时间
     */
     formatTime: function (time, like) {
      var format = require('date-format')
      return format.asString(like, time)
    }
  }
}
</script>
    