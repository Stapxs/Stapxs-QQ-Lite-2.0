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
                    <div style="flex: 1;"></div>
                    <svg @click="cleanList" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M170.5 51.6L151.5 80h145l-19-28.4c-1.5-2.2-4-3.6-6.7-3.6H177.1c-2.7 0-5.2 1.3-6.7 3.6zm147-26.6L354.2 80H368h48 8c13.3 0 24 10.7 24 24s-10.7 24-24 24h-8V432c0 44.2-35.8 80-80 80H112c-44.2 0-80-35.8-80-80V128H24c-13.3 0-24-10.7-24-24S10.7 80 24 80h8H80 93.8l36.7-55.1C140.9 9.4 158.4 0 177.1 0h93.7c18.7 0 36.2 9.4 46.6 24.9zM80 128V432c0 17.7 14.3 32 32 32H336c17.7 0 32-14.3 32-32V128H80zm80 64V400c0 8.8-7.2 16-16 16s-16-7.2-16-16V192c0-8.8 7.2-16 16-16s16 7.2 16 16zm80 0V400c0 8.8-7.2 16-16 16s-16-7.2-16-16V192c0-8.8 7.2-16 16-16s16 7.2 16 16zm80 0V400c0 8.8-7.2 16-16 16s-16-7.2-16-16V192c0-8.8 7.2-16 16-16s16 7.2 16 16z"/></svg>
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
            <BcMenu :data="listMenu" @close="listMenuClose" name="messages-menu">
                <ul>
                    <li icon="fa-solid fa-thumbtack" id="top">{{ $t('list_menu_top') }}</li>
                    <li icon="fa-solid fa-grip-lines" id="canceltop">{{ $t('list_menu_canceltop') }}</li>
                    <li icon="fa-solid fa-trash-can" id="remove">{{ $t('list_menu_remove') }}</li>
                    <li icon="fa-solid fa-check-to-slot" id="readed">{{ $t('list_menu_readed') }}</li>
                </ul>
            </BcMenu>
            <div id="message-list-body" :class="(runtimeData.tags.openSideBar ? 'open' : '')" style="overflow: scroll;">
                <!-- 系统信息 -->
                <FriendBody key="inMessage--10000"
                    v-if="runtimeData.systemNoticesList && Object.keys(runtimeData.systemNoticesList).length > 0"
                    :select="chat.show.id === -10000"
                    :data="{ user_id: -10000, always_top: true, nickname: $t('list_system_notice'), remark: $t('list_system_notice') }"
                    @click="systemNoticeClick"></FriendBody>
                <!-- 其他消息 -->
                <FriendBody v-for="item in runtimeData.onMsgList"
                    :key="'inMessage-' + item.user_id ? item.user_id : item.group_id"
                    :select="chat.show.id === item.user_id || (chat.show.id === item.group_id && chat.group_name != '')"
                    :menu="menu.select && menu.select == item"
                    :data="item"
                    @click="userClick(item)"
                    @contextmenu.prevent="listMenuShow($event, item)">
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
import BcMenu from 'vue3-bcui/packages/bc-menu'
import Menu from 'vue3-bcui/packages/bc-menu/index'
import Option from '@/function/option'

import { defineComponent } from 'vue'
import { runtimeData, notificationList } from '@/function/msg'
import { UserFriendElem, UserGroupElem } from '@/function/elements/information'
import { getRaw as getOpt, run as runOpt } from '@/function/option'
import { loadHistoryMessage } from '@/function/util'
import { PopInfo, PopType } from '@/function/base'
import { MenuStatue } from 'vue3-bcui/packages/dist/types'
import { library } from '@fortawesome/fontawesome-svg-core'

import { faThumbTack, faTrashCan, faCheckToSlot, faGripLines } from '@fortawesome/free-solid-svg-icons'

export default defineComponent({
    name: 'VueMessages',
    props: ['chat'],
    components: { FriendBody, BcMenu },
    data() {
        return {
            runtimeData: runtimeData,
            trRead: false,
            listMenu: {
                show: false,
                point: { x: 0, y: 0 }
            } as MenuStatue,
            menu: Menu.append
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
                    // 临时会话标志
                    temp: data.group_name == '' ? data.group_id : undefined,
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

        /**
         * 清空消息列表
         */
        cleanList() {
            // 刷新置顶列表
            const info = runtimeData.sysConfig.top_info as { [key: string]: number[] } | null
            runtimeData.onMsgList = []
            if (info != null) {
                const topList = info[runtimeData.loginInfo.uin]
                if (topList !== undefined) {
                    runtimeData.userList.forEach((item) => {
                        const id = Number(item.user_id ? item.user_id : item.group_id)
                        if (topList.indexOf(id) >= 0) {
                            item.always_top = true
                            runtimeData.onMsgList.push(item)
                        }
                    })
                }
            }
        },

        /**
         * 列表菜单关闭事件
         * @param id 选择的菜单 ID
         */
        listMenuClose(id: string) {
            this.listMenu.show = false
            const item = this.menu.select
            if(id) {
                switch(id) {
                    case 'readed': this.readMsg(item); break
                    case 'remove': {
                        const index = runtimeData.onMsgList.findIndex((get) => {
                            return item == get
                        })
                        runtimeData.onMsgList.splice(index, 1)
                        break
                    }
                    case 'top': this.saveTop(true); break
                    case 'canceltop': this.saveTop(false); break
                }
            }
            this.menu.select = undefined
        },

        /**
         * 保存置顶信息
         * @param event 点击事件
         */
         saveTop(value: boolean) {
            const id = runtimeData.loginInfo.uin
            // 完整的 cookie JSON
            let topInfo = runtimeData.sysConfig.top_info as { [key: string]: number[] }
            if (topInfo == null) {
                topInfo = {}
            }
            // 本人的置顶信息
            let topList = topInfo[id]
            // 操作
            if (value) {
                if (topList) {
                    if (topList.indexOf(this.chat.show.id) < 0) {
                        topList.push(this.chat.show.id)
                    }
                } else {
                    topList = [this.chat.show.id]
                }
            } else {
                if (topList) {
                    topList.splice(topList.indexOf(this.chat.show.id), 1)
                }
            }
            // 刷新 cookie
            if (topList) {
                topInfo[id] = topList
                Option.save('top_info', topInfo)
            }
            // 为消息列表内的对象刷新置顶标志
            for (let i = 0; i < runtimeData.onMsgList.length; i++) {
                const item = runtimeData.onMsgList[i]
                if (item.user_id == this.chat.show.id || item.group_id == this.chat.show.id) {
                    runtimeData.onMsgList[i].always_top = value
                    break
                }
            }
            // 重新排序列表
            const newList = [] as (UserFriendElem & UserGroupElem)[]
            let topNum = 1
            runtimeData.onMsgList.forEach((item) => {
                // 排序操作
                if (item.always_top === true) {
                    newList.unshift(item)
                    topNum++
                } else if (item.new_msg === true) {
                    newList.splice(topNum - 1, 0, item)
                } else {
                    newList.push(item)
                }
            })
            runtimeData.onMsgList = newList
        },

        /**
         * 显示列表菜单
         * @param item 菜单内容
         */
        listMenuShow(event: Event, item: (UserFriendElem & UserGroupElem)) {
            const info = this.menu.set('messages-menu', event as MouseEvent)
            info.list = ['top', 'remove', 'readed']
            // 置顶的不显示移除
            if(item.always_top) {
                info.list = ['canceltop', 'readed']
            }
            this.listMenu = info
            this.menu.select = item
        }
    },
    mounted() {
        library.add(faCheckToSlot, faThumbTack, faTrashCan, faGripLines)
    }
})
</script>

<style>
.menu div.item > a {
    font-size: 0.9rem !important;
}
.menu div.item > svg {
    margin: 3px 10px 3px 0 !important;
    font-size: 1rem !important;
}

@media (max-width: 700px) {
    .menu {
        width: 140px !important;
    }
}
</style>
