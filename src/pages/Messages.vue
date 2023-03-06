<!--
 * @FileDescription: 消息列表页面
 * @Author: Stapxs
 * @Date: 
 *      2022/08/14
 *      2022/12/14
 * @Version:
 *      1.0 - 初始版本
 *      1.5 - 重构为 ts 版本，代码格式优化
-->

<template>
    <div class="friend-view">
        <div :class="'friend-list' + (runtimeData.tags.openSideBar ? ' open' : '')" id="message-list">
            <div>
                <div class="base only">
                    <span>{{ $t('message_title') }}</span>
                </div>
                <div class="small">
                    <span v-show="runtimeData.tags.openSideBar">{{ $t('message_title') }}</span>
                    <div @click="openLeftBar">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                            <path
                                d="M0 96C0 78.3 14.3 64 32 64H416c17.7 0 32 14.3 32 32s-14.3 32-32 32H32C14.3 128 0 113.7 0 96zM64 256c0-17.7 14.3-32 32-32H480c17.7 0 32 14.3 32 32s-14.3 32-32 32H96c-17.7 0-32-14.3-32-32zM448 416c0 17.7-14.3 32-32 32H32c-17.7 0-32-14.3-32-32s14.3-32 32-32H416c17.7 0 32 14.3 32 32z" />
                        </svg>
                    </div>
                </div>
            </div>
            <div id="message-list-body" :class="(runtimeData.tags.openSideBar ? 'open' : '')">
                <!-- 系统信息 -->
                <FriendBody key="inMessage--10000"
                    v-if="runtimeData.systemNoticesList && Object.keys(runtimeData.systemNoticesList).length > 0"
                    :select="chat.show.id === -10000"
                    :data="{ user_id: -10000, always_top: true, nickname: $t('list_system_notice'), remark: $t('list_system_notice') }"
                    @click="systemNoticeClick"></FriendBody>
                <!-- 其他消息 -->
                <FriendBody v-for="item in runtimeData.onMsgList"
                    :key="'inMessage-' + item.user_id ? item.user_id : item.group_id"
                    :select="chat.show.id === item.user_id || chat.show.id === item.group_id" :data="item"
                    @click="userClick(item)" @contextmenu.prevent="readMsg(item)" @touchstart="readStart"
                    @touchend="readEnd(item)">
                </FriendBody>
            </div>
        </div>
        <div>
            <div class="ss-card">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                    <path
                        d="M447 56.25C443.5 42 430.7 31.1 416 31.1H96c-14.69 0-27.47 10-31.03 24.25L3.715 304.9C1.247 314.9 0 325.2 0 335.5v96.47c0 26.51 21.49 48 48 48h416c26.51 0 48-21.49 48-48v-96.47c0-10.32-1.247-20.6-3.715-30.61L447 56.25zM352 352H160L128 288H72.97L121 96h270l48.03 192H384L352 352z" />
                </svg>
                <span>{{ $t('chat_space') }}</span>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import app from '@/main'
import FriendBody from '@/components/FriendBody.vue'

import { defineComponent } from 'vue'
import { runtimeData, notificationList } from '@/function/msg'
import { UserFriendElem, UserGroupElem } from '@/function/elements/information'
import { getRaw as getOpt, run as runOpt } from '@/function/option'
import { loadHistoryMessage } from '@/function/util'
import { Logger, LogType, PopInfo, PopType } from '@/function/base'

export default defineComponent({
    name: 'VueMessages',
    props: ['chat'],
    components: { FriendBody },
    data() {
        return {
            runtimeData: runtimeData,
            trRead: false
        }
    },
    methods: {
        /**
         * 联系人点击事件
         * @param data 联系人对象
         */
        userClick(data: (UserFriendElem & UserGroupElem)) {
            if (!this.trRead) {
                if (this.runtimeData.tags.openSideBar) {
                    this.openLeftBar()
                }
                const index = runtimeData.onMsgList.indexOf(data)
                const back = {
                    type: data.user_id ? 'user' : 'group',
                    id: data.user_id ? data.user_id : data.group_id,
                    name: data.group_name ? data.group_name : data.remark === data.nickname ? data.nickname : data.remark + '（' + data.nickname + '）',
                    avatar: data.user_id ? 'https://q1.qlogo.cn/g?b=qq&s=0&nk=' + data.user_id : 'https://p.qlogo.cn/gh/' + data.group_id + '/' + data.group_id + '/0'
                }
                if (this.chat.id != back.id) {
                    // 更新聊天框
                    this.$emit('userClick', back)
                    // 获取历史消息
                    this.$emit('loadHistory', back)
                    // 重置消息面板
                    // PS：这儿的作用是在运行时如果切换到了特殊面板，在点击联系人的时候可以切回来
                    if (runtimeData.sysConfig.chatview_name != '' && runtimeData.sysConfig.chatview_name != getOpt('chatview_name')) {
                        runtimeData.sysConfig.chatview_name = getOpt('chatview_name')
                        runOpt('chatview_name', getOpt('chatview_name'))
                    }
                }
                // 清除新消息标记
                runtimeData.onMsgList[index].new_msg = false
                // 清除消息通知
                const notificationIndex = notificationList.findIndex((item) => {
                    const tag = item.tag
                    const userId = Number(tag.split('/')[0])
                    return userId == data.user_id || userId == data.group_id
                })
                if (notificationIndex != -1) {
                    const notification = notificationList[notificationIndex]
                    // PS：使用 close 方法关闭通知也会触发关闭事件，所以这儿需要先移除再关闭
                    // 防止一些判断用户主动关闭通知的逻辑出现问题
                    notificationList.splice(notificationIndex, 1)
                    notification.close()
                }
            }
        },

        /**
         * 系统通知点击事件
         */
        systemNoticeClick() {
            if (this.runtimeData.tags.openSideBar) {
                this.openLeftBar()
            }
            const back = {
                type: 'user',
                id: -10000,
                name: '系统消息'
            }
            this.$emit('userClick', back)
            runtimeData.sysConfig.chatview_name = 'SystemNotice'
            runOpt('chatview_name', 'SystemNotice')
        },

        /**
         * 侧边栏操作
         */
        openLeftBar() {
            runtimeData.tags.openSideBar = !runtimeData.tags.openSideBar
        },

        /**
         *  标记群组消息为已读
         */
        readMsg(data: (UserFriendElem & UserGroupElem)) {
            const index = runtimeData.onMsgList.indexOf(data)
            runtimeData.onMsgList[index].new_msg = false
            // 标记消息已读
            const id = data.group_id ? data.group_id : data.user_id
            const type = data.group_id ? 'group' : 'user'
            loadHistoryMessage(id, type, 1, 'readMemberMessage')
            // pop
            new PopInfo().add(
                PopType.INFO, app.config.globalProperties.$t('chat_readed'))
        },
        readStart() {
            const logger = new Logger()
            this.trRead = false
            setTimeout(() => {
                logger.add(LogType.UI, "列表触屏长按触发。")
                this.trRead = true
            }, 800)
        },
        readEnd(data: (UserFriendElem & UserGroupElem)) {
            if (this.trRead) {
                this.readMsg(data)
            }
        }
    }
})
</script>
