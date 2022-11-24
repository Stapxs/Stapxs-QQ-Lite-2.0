<template>
  <div class="note">
    <div class="note-recall note-base" v-if="data.sub_type === 'recall'">
      <a>{{ this.data.name }}</a>
      <span>{{ $t('chat_notice_recall') }}</span>
      <div>

      </div>
    </div>
  </div>
</template>

<script>
import Vue from 'vue'
import { runtimeData } from '../../assets/js/msg'

export default {
  name: 'NoticeBody',
  props: ['data'],
  data () {
    return {
    }
  },
  methods: {
  },
  mounted () {
    if (this.data.sub_type === 'recall') {
      // 补全撤回者信息
      if (runtimeData.onChat.type === 'group') {
        const id = this.data.operator_id
        // 寻找群成员信息
        if (runtimeData.onChat.info.group_members !== undefined) {
          const back = runtimeData.onChat.info.group_members.filter((item) => {
            return Number(item.user_id) === Number(id)
          })
          if (back.length === 1) {
            Vue.set(this.data, 'name', back[0].card === '' ? back[0].nickname : back[0].card)
          } else {
            Vue.set(this.data, 'name', id)
          }
        } else {
          Vue.set(this.data, 'name', id)
        }
      } else {
        Vue.set(this.data, 'name', runtimeData.onChat.name)
      }
    }
  }
}
</script>
