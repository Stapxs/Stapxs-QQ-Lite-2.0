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
        <div id="message-list"
            :class="'friend-list' +
                (runtimeData.tags.openSideBar ? ' open' : '') +
                (showGroupAssist ? ' show' : '')">
            <div>
                <div class="base only">
                    <span>{{ $t('消息') }}</span>
                    <div style="flex: 1" />
                    <font-awesome-icon :icon="['fas', 'trash-can']" @click="cleanList" />
                </div>
                <div class="small">
                    <span>{{ $t('消息') }}</span>
                    <div v-if="showGroupAssist"
                        style="margin-right: -5px;margin-left: 5px;"
                        @click="showGroupAssist = !showGroupAssist">
                        <font-awesome-icon :icon="['fas', 'angle-left']" />
                    </div>
                    <div @click="openLeftBar">
                        <font-awesome-icon :icon="['fas', 'bars-staggered']" />
                    </div>
                </div>
            </div>
            <TransitionGroup
                id="message-list-body"
                name="onmsg"
                tag="div"
                :class="runtimeData.tags.openSideBar ? ' open' : ''"
                style="overflow-x: hidden">
                <!-- 系统信息 -->
                <FriendBody v-if="!showGroupAssist &&
                                runtimeData.systemNoticesList &&
                                Object.keys(runtimeData.systemNoticesList).length > 0"
                    key="inMessage--10000"
                    :select="chat.show.id === -10000"
                    :data="{
                        user_id: -10000,
                        always_top: true,
                        nickname: $t('系统通知'),
                        remark: $t('系统通知'),
                    }"
                    @click="systemNoticeClick" />
                <!--- 群组消息 -->
                <FriendBody
                    v-if="runtimeData.groupAssistList && runtimeData.groupAssistList.length > 0"
                    key="inMessage--10001"
                    :select="chat.show.id === -10001"
                    :data="{
                        user_id: -10001,
                        always_top: true,
                        nickname: $t('群收纳盒'),
                        remark: $t('群收纳盒'),
                        time: runtimeData.groupAssistList[0].time,
                        raw_msg: runtimeData.groupAssistList[0].group_name + ': ' +
                            (runtimeData.groupAssistList[0].raw_msg_base ?? '')
                    }"
                    @click="showGroupAssistCheck" />
                <!-- 其他消息 -->
                <FriendBody
                    v-for="item in runtimeData.onMsgList"
                    :key="'inMessage-' + (item.user_id ? item.user_id : item.group_id)"
                    :select="chat.show.id === item.user_id || (chat.show.id === item.group_id && chat.group_name != '')"
                    :menu="menu.select && menu.select == item"
                    :data="item"
                    from="message"
                    @contextmenu.prevent="listMenuShow($event, item)"
                    @click="userClick(item)"
                    @touchstart="showMenuStart($event, item)"
                    @touchmove="showMenuMove"
                    @touchend="showMenuEnd" />
            </TransitionGroup>
        </div>
        <div id="group-assist-message-list"
            :class="'friend-list group-assist-message-list' +
                (runtimeData.tags.openSideBar ? ' open' : '') +
                (showGroupAssist ? ' show' : '')">
            <div>
                <div class="base only">
                    <span style="cursor: pointer;"
                        @click="showGroupAssist = !showGroupAssist">
                        <font-awesome-icon style="margin-right: 5px;" :icon="['fas', 'angle-left']" />
                        {{ $t('群收纳盒') }}
                    </span>
                </div>
                <div class="small">
                    <span style="cursor: pointer;">
                        {{ $t('群收纳盒') }}
                    </span>
                    <div v-if="showGroupAssist"
                        style="margin-right: -5px;margin-left: 5px;"
                        @click="showGroupAssist = !showGroupAssist">
                        <font-awesome-icon :icon="['fas', 'angle-left']" />
                    </div>
                    <div @click="openLeftBar">
                        <font-awesome-icon :icon="['fas', 'bars-staggered']" />
                    </div>
                </div>
            </div>
            <TransitionGroup
                id="group-assist-message-list-body"
                name="onmsg"
                tag="div"
                :class="runtimeData.tags.openSideBar ? ' open' : ''"
                style="overflow-x: hidden">
                <!-- 其他消息 -->
                <FriendBody
                    v-for="item in runtimeData.groupAssistList"
                    :key="'inMessage-' + (item.user_id ? item.user_id : item.group_id)"
                    :select="chat.show.id === item.user_id || (chat.show.id === item.group_id && chat.group_name != '')"
                    :menu="menu.select && menu.select == item"
                    :data="item"
                    from="message"
                    @contextmenu.prevent="listMenuShow($event, item)"
                    @click="userClick(item)"
                    @touchstart="showMenuStart($event, item)"
                    @touchmove="showMenuMove"
                    @touchend="showMenuEnd" />
            </TransitionGroup>
        </div>
        <BcMenu :data="listMenu" name="messages-menu"
            @close="listMenuClose">
            <ul>
                <li id="top" icon="fa-solid fa-thumbtack">
                    {{ $t('置顶') }}
                </li>
                <li id="canceltop" icon="fa-solid fa-grip-lines">
                    {{ $t('取消置顶') }}
                </li>
                <li id="remove" icon="fa-solid fa-trash-can">
                    {{ $t('删除') }}
                </li>
                <li id="readed" icon="fa-solid fa-check-to-slot">
                    {{ $t('标记已读') }}
                </li>
                <li id="read" icon="fa-solid fa-flag">
                    {{ $t('标记未读') }}
                </li>
                <li id="notice_open" icon="fa-solid fa-volume-high">
                    {{ $t('开启通知') }}
                </li>
                <li id="notice_close" icon="fa-solid fa-volume-xmark">
                    {{ $t('关闭通知') }}
                </li>
            </ul>
        </BcMenu>
        <div :class="'friend-list-space' + (runtimeData.tags.openSideBar ? ' open' : '')">
            <div v-if="!loginInfo.status || runtimeData.chatInfo.show.id == 0" class="ss-card">
                <font-awesome-icon :icon="['fas', 'inbox']" />
                <span>{{ $t('选择联系人开始聊天') }}</span>
            </div>
            <div v-else class="ss-card">
                <font-awesome-icon :icon="['fas', 'angles-right']" />
                <span>(っ≧ω≦)っ</span>
                <span>{{ $t('别划了别划了被看见了啦') }}</span>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
    import app from '@renderer/main'
    import FriendBody from '@renderer/components/FriendBody.vue'
    import BcMenu from 'vue3-bcui/packages/bc-menu'
    import Menu from 'vue3-bcui/packages/bc-menu/index'
    import Option from '@renderer/function/option'

    import { defineComponent } from 'vue'
    import { runtimeData } from '@renderer/function/msg'
    import {
        UserFriendElem,
        UserGroupElem,
    } from '@renderer/function/elements/information'
    import { getRaw as getOpt, run as runOpt } from '@renderer/function/option'
    import { changeGroupNotice, loadHistoryMessage } from '@renderer/function/utils/appUtil'
    import { PopInfo, PopType } from '@renderer/function/base'
    import { MenuStatue } from 'vue3-bcui/packages/dist/types'
    import { library } from '@fortawesome/fontawesome-svg-core'
    import { login as loginInfo } from '@renderer/function/connect'
    import { canGroupNotice, getShowName } from '@renderer/function/utils/msgUtil'

    import {
        faThumbTack,
        faTrashCan,
        faCheckToSlot,
        faGripLines,
    } from '@fortawesome/free-solid-svg-icons'
    import { Notify } from '@renderer/function/notify'
    import { refreshFavicon } from '@renderer/function/favicon'
    import { backend } from '@renderer/runtime/backend'

    export default defineComponent({
        name: 'VueMessages',
        components: { FriendBody, BcMenu },
        props: ['chat'],
        emits: ['userClick', 'loadHistory'],
        data() {
            return {
                runtimeData: runtimeData,
                trRead: false,
                listMenu: {
                    show: false,
                    point: { x: 0, y: 0 },
                } as MenuStatue,
                menu: Menu.append,
                showMenu: false,
                loginInfo: loginInfo,
                showGroupAssist: false,
            }
        },
        mounted() {
            library.add(faCheckToSlot, faThumbTack, faTrashCan, faGripLines)
        },
        methods: {
            /**
             * 联系人点击事件
             * @param data 联系人对象
             */
            userClick(data: UserFriendElem & UserGroupElem) {
                const id = data.user_id ? data.user_id : data.group_id
                if (!this.trRead && id != this.chat.show.id) {
                    if (this.runtimeData.tags.openSideBar) {
                        this.openLeftBar()
                    }
                    const back = {
                        // 临时会话标志
                        temp: data.group_name == '' ? data.group_id : undefined,
                        type: data.user_id ? 'user' : 'group',
                        id: id,
                        name: getShowName(data.group_name || data.nickname, data.remark),
                        avatar: data.user_id? 'https://q1.qlogo.cn/g?b=qq&s=0&nk=' +
                              data.user_id: 'https://p.qlogo.cn/gh/' +
                              data.group_id + '/' + data.group_id + '/0',
                    }
                    if (this.chat.id != back.id) {
                        // 更新聊天框
                        this.$emit('userClick', back)
                        // 获取历史消息
                        this.$emit('loadHistory', back)
                        // 重置消息面板
                        // PS：这儿的作用是在运行时如果切换到了特殊面板，在点击联系人的时候可以切回来
                        if (
                            runtimeData.sysConfig.chatview_name != '' &&
                            runtimeData.sysConfig.chatview_name !=
                                decodeURIComponent(getOpt('chatview_name') ?? '')
                        ) {
                            runtimeData.sysConfig.chatview_name =
                                decodeURIComponent(getOpt('chatview_name') ?? '')
                            runOpt('chatview_name', decodeURIComponent(getOpt('chatview_name') ?? ''))
                        }
                    }
                    // 清除新消息标记
                    const item = runtimeData.baseOnMsgList.get(id)
                    if(item) {
                        item.new_msg = false
                        item.highlight = undefined
                        runtimeData.baseOnMsgList.set(id, item)
                        // 关闭所有通知
                        new Notify().closeAll((item.group_id ?? item.user_id).toString())
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
                    name: '系统消息',
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
            readMsg(data: UserFriendElem & UserGroupElem) {
                const id = data.group_id ? data.group_id : data.user_id
                const item = runtimeData.baseOnMsgList.get(id)
                if(item) {
                    item.new_msg = false
                    item.highlight = undefined
                    runtimeData.baseOnMsgList.set(id, item)
                }
                // 标记消息已读
                const type = data.group_id ? 'group' : 'user'
                loadHistoryMessage(id, type, 1, 'readMemberMessage')
                // pop
                new PopInfo().add(
                    PopType.INFO,
                    app.config.globalProperties.$t('已标记为已读'),
                )
            },

            /**
             * 清空消息列表
             */
            cleanList() {
                // 刷新置顶列表
                const info = runtimeData.sysConfig.top_info as {
                    [key: string]: number[]
                } | null
                runtimeData.baseOnMsgList = new Map()
                if (info != null) {
                    const topList = info[runtimeData.loginInfo.uin]
                    if (topList !== undefined) {
                        runtimeData.userList.forEach((item) => {
                            const id = Number(
                                item.user_id ? item.user_id : item.group_id,
                            )
                            if (topList.indexOf(id) >= 0) {
                                item.always_top = true
                                runtimeData.baseOnMsgList.set(id, item)
                            }
                        })
                    }
                }
                // 刷新 favicon
                refreshFavicon()
            },

            /**
             * 列表菜单关闭事件
             * @param id 选择的菜单 ID
             */
            listMenuClose(id: string) {
                const menu = document.getElementById(
                    'msg-menu-view-messages-menu',
                )?.children[1] as HTMLDivElement
                if (menu) {
                    setTimeout(() => {
                        menu.style.transition = 'transform .1s'
                    }, 200)
                }
                this.listMenu.show = false
                const item = this.menu.select
                if (id) {
                    switch (id) {
                        case 'read': {
                            item.new_msg = true
                            break
                        }
                        case 'readed':
                            this.readMsg(item)
                            // 刷新 favicon
                            refreshFavicon()
                            break
                        case 'remove': {
                            const id = item.user_id ? item.user_id : item.group_id
                            runtimeData.baseOnMsgList.delete(id)
                            refreshFavicon()
                            break
                        }
                        case 'top':
                            this.saveTop(item, true)
                            break
                        case 'canceltop':
                            this.saveTop(item, false)
                            break
                        case 'notice_open': {
                            changeGroupNotice(item.group_id, true)
                            break
                        }
                        case 'notice_close': {
                            changeGroupNotice(item.group_id, false)
                            break
                        }
                    }
                }
                this.menu.select = undefined
            },

            /**
             * 保存置顶信息
             * @param event 点击事件
             */
            saveTop(item: any, value: boolean) {
                const id = runtimeData.loginInfo.uin
                const upId = item.user_id ? item.user_id : item.group_id
                // 完整的设置 JSON
                let topInfo = runtimeData.sysConfig.top_info as {
                    [key: string]: number[]
                }
                if (topInfo == null) {
                    topInfo = {}
                }
                // 本人的置顶信息
                let topList = topInfo[id]
                // 操作
                if (value) {
                    if (topList) {
                        if (topList.indexOf(this.chat.show.id) < 0) {
                            topList.push(upId)
                        }
                    } else {
                        topList = [upId]
                    }
                } else {
                    if (topList) {
                        topList.splice(topList.indexOf(upId), 1)
                    }
                }
                // 刷新设置
                if (topList) {
                    topInfo[id] = topList
                    Option.save('top_info', topInfo)
                }
                // 为消息列表内的对象刷新置顶标志
                item.always_top = value
                // 刷新群收纳盒
                if(item.group_id && runtimeData.sysConfig.bubble_sort_user) {
                    if(value) {
                        this.showGroupAssist = false
                    } else {
                        this.showGroupAssist = true
                    }
                }
            },

            /**
             * 显示列表菜单
             * @param item 菜单内容
             */
            listMenuShow(event: Event, item: UserFriendElem & UserGroupElem) {
                const info = this.menu.set('messages-menu', event as MouseEvent)
                this.listMenuShowRun(info, item)
            },
            listMenuShowRun(info: any, item: UserFriendElem & UserGroupElem) {
                // PS：这是触屏触发的标志，如果优先触发了 contextmenu 就不用触发触屏了
                this.showMenu = false
                info.list = ['top', 'remove']
                // 置顶的不显示移除
                if (item.always_top) {
                    info.list = ['canceltop']
                }
                if (item.new_msg) {
                    info.list.push('readed')
                } else {
                    info.list.push('read')
                }
                // 是群的话显示通知设置
                if (item.group_id) {
                    if (canGroupNotice(item.group_id)) {
                        info.list.push('notice_close')
                    } else {
                        info.list.push('notice_open')
                    }
                }
                this.listMenu = info
                this.menu.select = item
                // 出界处理
                setTimeout(() => {
                    const menu = document.getElementById(
                        'msg-menu-view-messages-menu',
                    )?.children[1] as HTMLDivElement
                    if (menu) {
                        menu.style.transition = 'margin .2s, transform .1s'
                        const hight = menu.clientHeight
                        const top = menu.getBoundingClientRect().top
                        const docHight = document.documentElement.clientHeight
                        // 出界高度
                        const dtHight = hight + top - docHight + 20
                        if (dtHight > 0) {
                            menu.style.marginTop = docHight - hight - 30 + 'px'
                        }
                    }
                }, 100)
            },

            /**
             * 显示群收纳盒
             */
            showGroupAssistCheck() {
                if(!this.showGroupAssist && runtimeData.chatInfo.show.id == 0 && backend.type != 'capacitor' ) {
                    // 如果没有打开聊天框，打开收纳盒中的第一个群；这么做主要是为了防止动画穿帮 😭
                    const assistGroup = document.getElementById('group-assist-message-list-body')
                    if(assistGroup && assistGroup.children.length > 0) {
                        (assistGroup.children[0] as HTMLDivElement).click()
                        setTimeout(() => {
                            this.showGroupAssist = !this.showGroupAssist
                        }, 500)
                    } else {
                        this.showGroupAssist = !this.showGroupAssist
                    }
                } else {
                    this.showGroupAssist = !this.showGroupAssist
                }
            },

            showMenuStart(
                event: TouchEvent,
                item: UserFriendElem & UserGroupElem,
            ) {
                const info = {
                    show: true,
                    point: {
                        x: event.targetTouches[0].pageX,
                        y: event.targetTouches[0].pageY,
                    },
                }
                this.showMenu = true
                setTimeout(() => {
                    if (this.showMenu) {
                        this.listMenuShowRun(info, item)
                        this.showMenu = false
                    }
                }, 500)
            },
            showMenuMove() {
                this.showMenu = false
            },
            showMenuEnd() {
                this.showMenu = false
            },
        },
    })
</script>

<style>
    .onmsg-enter-active,
    .onmsg-leave-active,
    .onmsg-move {
        transition: transform 0.4s;
    }

    .menu div.item > a {
        font-size: 0.9rem !important;
    }
    .menu div.item > svg {
        margin: 3px 10px 3px 0 !important;
        font-size: 1rem !important;
    }

    .msg-menu-bg {
        background: transparent !important;
    }

    @media (max-width: 700px) {
        .menu {
            width: 140px !important;
        }
    }
</style>
