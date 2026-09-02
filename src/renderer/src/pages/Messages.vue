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
        <div class="friend-list-container">
            <div id="message-list"
                :class="'friend-list' +
                    (uiStore.openSideBar ? ' open' : '') +
                    (showGroupAssist ? ' show' : '')">
                <div>
                    <div class="base only">
                        <span>{{ $t('消息') }}</span>
                        <div style="flex: 1" />
                        <font-awesome-icon
                            :icon="['fas', 'clock-rotate-left']"
                            @click="openHistory" />
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
                    :class="uiStore.openSideBar ? ' open' : ''"
                    style="overflow-x: hidden">
                    <!-- 系统信息 -->
                    <FriendBody v-if="!showGroupAssist &&
                                    contactStore.systemNoticesList &&
                                    Object.keys(contactStore.systemNoticesList).length > 0"
                        key="inMessage--10000"
                        :select="chat.show.id === -10000"
                        :menu="menu.select && menu.select.user_id === -10000"
                        :data="{
                            user_id: -10000,
                            always_top: true,
                            nickname: $t('系统通知'),
                            remark: $t('系统通知'),
                            raw_msg: contactStore.systemNoticesList[0].comment
                        }"
                        @click="systemNoticeClick"
                        @contextmenu.prevent="systemNoticeMenuShow($event)"
                        @touchstart="systemNoticeMenuStart($event)"
                        @touchmove="showMenuMove"
                        @touchend="showMenuEnd" />
                    <!--- 群组消息 -->
                    <FriendBody
                        v-if="contactStore.groupAssistList && contactStore.groupAssistList.length > 0"
                        key="inMessage--10001"
                        :select="chat.show.id === -10001"
                        :data="{
                            user_id: -10001,
                            always_top: true,
                            nickname: $t('群收纳盒'),
                            remark: $t('群收纳盒'),
                            time: contactStore.groupAssistList[0].time,
                            raw_msg: contactStore.groupAssistList[0].group_name + ': ' +
                                (contactStore.groupAssistList[0].raw_msg_base ?? '')
                        }"
                        @click="showGroupAssistCheck" />
                    <!-- 其他消息 -->
                    <FriendBody
                        v-for="item in contactStore.onMsgList"
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
                    (uiStore.openSideBar ? ' open' : '') +
                    (showGroupAssist ? ' show' : '')">
                <div>
                    <div class="base only">
                        <span style="cursor: pointer;"
                            @click="showGroupAssist = !showGroupAssist">
                            <font-awesome-icon style="margin-right: 5px;" :icon="['fas', 'angle-left']" />
                            {{ $t('群收纳盒') }}
                        </span>
                        <a v-if="contactStore.newMsgCount > 0">{{ contactStore.newMsgCount }}</a>
                    </div>
                    <div class="small">
                        <span style="cursor: pointer;">
                            {{ $t('群收纳盒') }}
                            <a v-if="contactStore.newMsgCount > 0">{{ contactStore.newMsgCount }}</a>
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
                    :class="uiStore.openSideBar ? ' open' : ''"
                    style="overflow-x: hidden">
                    <!-- 其他消息 -->
                    <FriendBody
                        v-for="item in contactStore.groupAssistList"
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
                <li id="clear_system_notice" icon="fa-solid fa-broom">
                    {{ $t('清空通知') }}
                </li>
            </ul>
        </BcMenu>
        <div :class="'friend-list-space' + (uiStore.openSideBar ? ' open' : '')">
            <div v-if="!loginInfo.status || chatStore.chatInfo.show.id == 0" class="ss-card">
                <font-awesome-icon :icon="['fas', 'inbox']" />
                <span>{{ $t('选择联系人开始聊天') }}</span>
            </div>
            <div v-else-if="chatStore.messageList.length > 0" class="ss-card cd">
                <font-awesome-icon :icon="['fas', 'angles-right']" />
                <span>(っ≧ω≦)っ</span>
                <span>{{ $t('别划了别划了被看见了啦') }}</span>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { ref, onMounted, markRaw } from 'vue'
    import { i18n } from '@renderer/main'
    import FriendBody from '@renderer/components/FriendBody.vue'
    import BcMenu from 'vue3-bcui/packages/bc-menu'
    import Menu from 'vue3-bcui/packages/bc-menu/index'
    import Option from '@renderer/function/option'

    import { useSettingsStore } from '@renderer/state/settings'
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
        faBroom,
    } from '@fortawesome/free-solid-svg-icons'
    import { Notify } from '@renderer/function/notify'
    import { refreshFavicon } from '@renderer/function/favicon'
    import { backend } from '@renderer/runtime/backend'
    import History from '@renderer/components/History.vue'
    import { useUIStore } from '@renderer/state/ui'
    import { useAuthStore } from '@renderer/state/auth'
    import { useContactStore } from '@renderer/state/contact'
    import { useChatStore } from '@renderer/state/chat'

    const $t = i18n.global.t

    defineOptions({ name: 'VueMessages' })

    const uiStore = useUIStore()
    const authStore = useAuthStore()
    const contactStore = useContactStore()
    const chatStore = useChatStore()
    const settingsStore = useSettingsStore()
    const props = defineProps<{ chat: any }>()
    const emit = defineEmits<{
        userClick: [data: any]
        loadHistory: [data: any]
    }>()

    const trRead = ref(false)
    const listMenu = ref<MenuStatue>({
        show: false,
        point: { x: 0, y: 0 },
    })
    const menu = Menu.append
    const showMenu = ref(false)
    const showGroupAssist = ref(false)

    onMounted(() => {
        library.add(faCheckToSlot, faThumbTack, faTrashCan, faGripLines, faBroom)
    })

    /**
     * 联系人点击事件
     * @param data 联系人对象
     */
    function userClick(data: UserFriendElem & UserGroupElem) {
        const id = data.user_id ? data.user_id : data.group_id
        if (!trRead.value && id != props.chat.show.id) {
            if (uiStore.openSideBar) {
                openLeftBar()
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
            if (props.chat.id != back.id) {
                // 更新聊天框
                emit('userClick', back)
                // 获取历史消息
                emit('loadHistory', back)
                // 重置消息面板
                // PS：这儿的作用是在运行时如果切换到了特殊面板，在点击联系人的时候可以切回来
                getOpt('chatview_name').then((chatViewName) => {
                    const getChatViewName = decodeURIComponent(chatViewName ?? '').
                        replaceAll('\\"', '')
                    if (settingsStore.sysConfig.chatview_name != '' &&
                            settingsStore.sysConfig.chatview_name != getChatViewName) {
                        settingsStore.sysConfig.chatview_name = getChatViewName
                        runOpt('chatview_name', getChatViewName)
                    }
                })
            }
            // 清除新消息标记
            const item = contactStore.baseOnMsgList.get(id)
            if(item) {
                if(item.new_msg) {
                    item.new_msg = false
                    contactStore.newMsgCount--
                }
                item.highlight = undefined
                contactStore.baseOnMsgList.set(id, item)
                // 关闭所有通知
                new Notify().closeAll((item.group_id ?? item.user_id).toString())
            }
        }
    }

    /**
     * 显示系统通知菜单
     * @param event 鼠标事件
     */
    function systemNoticeMenuShow(event: Event) {
        const info = menu.set('messages-menu', event as MouseEvent)
        showMenu.value = false
        info.list = ['clear_system_notice']
        listMenu.value = info
        menu.select = { user_id: -10000 }
    }

    /**
     * 系统通知菜单长按开始
     */
    function systemNoticeMenuStart(event: TouchEvent) {
        showMenuStart(event, { user_id: -10000 } as any)
    }

    /**
     * 清空系统通知
     */
    function clearSystemNotices() {
        contactStore.systemNoticesList = []
        new PopInfo().add(
            PopType.INFO,
            $t('已清空系统通知'),
        )
    }

    /**
     * 系统通知点击事件
     */
    function systemNoticeClick() {
        if (uiStore.openSideBar) {
            openLeftBar()
        }
        const back = {
            type: 'user',
            id: -10000,
            name: '系统消息',
        }
        emit('userClick', back)
        settingsStore.sysConfig.chatview_name = 'SystemNotice'
        runOpt('chatview_name', 'SystemNotice')
    }

    /**
     * 侧边栏操作
     */
    function openLeftBar() {
        uiStore.openSideBar = !uiStore.openSideBar
    }

    /**
     *  标记群组消息为已读
     */
    function readMsg(data: UserFriendElem & UserGroupElem) {
        const id = data.group_id ? data.group_id : data.user_id
        const item = contactStore.baseOnMsgList.get(id)
        if(item) {
            if(item.new_msg) {
                item.new_msg = false
                contactStore.newMsgCount--
            }
            item.highlight = undefined
            contactStore.baseOnMsgList.set(id, item)
        }
        // 标记消息已读
        const type = data.group_id ? 'group' : 'user'
        loadHistoryMessage(id, type, 1, 'readMemberMessage')
        // pop
        new PopInfo().add(
            PopType.INFO,
            $t('已标记为已读'),
        )
    }

    /**
     * 清空消息列表
     */
    function cleanList() {
        // 刷新置顶列表
        const info = settingsStore.sysConfig.top_info as {
            [key: string]: number[]
        } | null
        contactStore.baseOnMsgList = new Map()
        if (info != null) {
            const topList = info[authStore.loginInfo.uin]
            if (topList !== undefined) {
                contactStore.userList.forEach((item) => {
                    const id = Number(
                        item.user_id ? item.user_id : item.group_id,
                    )
                    if (topList.indexOf(id) >= 0) {
                        item.always_top = true
                        contactStore.baseOnMsgList.set(id, item)
                    }
                })
            }
        }
        // 刷新 favicon
        refreshFavicon()
    }

    /**
     * 列表菜单关闭事件
     * @param id 选择的菜单 ID
     */
    function listMenuClose(id: string) {
        const menuEl = document.getElementById(
            'msg-menu-view-messages-menu',
        )?.children[1] as HTMLDivElement
        if (menuEl) {
            setTimeout(() => {
                menuEl.style.transition = 'transform .1s'
            }, 200)
        }
        listMenu.value.show = false
        const item = menu.select
        if (id) {
            switch (id) {
                case 'read': {
                    if(!item.new_msg) {
                        item.new_msg = true
                        contactStore.newMsgCount++
                    }
                    break
                }
                case 'readed':
                    readMsg(item)
                    // 刷新 favicon
                    refreshFavicon()
                    break
                case 'remove': {
                    const id = item.user_id ? item.user_id : item.group_id
                    contactStore.baseOnMsgList.delete(id)
                    refreshFavicon()
                    break
                }
                case 'top':
                    saveTop(item, true)
                    break
                case 'canceltop':
                    saveTop(item, false)
                    break
                case 'notice_open': {
                    changeGroupNotice(item.group_id, true)
                    break
                }
                case 'notice_close': {
                    changeGroupNotice(item.group_id, false)
                    break
                }
                case 'clear_system_notice': {
                    clearSystemNotices()
                    break
                }
            }
        }
        menu.select = undefined
    }

    /**
     * 保存置顶信息
     * @param item 菜单选中项
     * @param value 是否置顶
     */
    function saveTop(item: any, value: boolean) {
        const id = authStore.loginInfo.uin
        const upId = item.user_id ? item.user_id : item.group_id
        // 完整的设置 JSON
        let topInfo = settingsStore.sysConfig.top_info as {
            [key: string]: number[]
        }
        if (topInfo == null || typeof topInfo !== 'object') {
            topInfo = {}
        }
        // 本人的置顶信息
        let topList = topInfo[id]
        // 操作
        if (value) {
            if (topList) {
                if (topList.indexOf(props.chat.show.id) < 0) {
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
        if(item.group_id && settingsStore.sysConfig.bubble_sort_user) {
            if(value) {
                showGroupAssist.value = false
            } else {
                showGroupAssist.value = true
            }
        }
    }

    /**
     * 显示列表菜单
     * @param item 菜单内容
     */
    function listMenuShow(event: Event, item: UserFriendElem & UserGroupElem) {
        const info = menu.set('messages-menu', event as MouseEvent)
        listMenuShowRun(info, item)
    }

    function listMenuShowRun(info: any, item: UserFriendElem & UserGroupElem) {
        // PS：这是触屏触发的标志，如果优先触发了 contextmenu 就不用触发触屏了
        showMenu.value = false
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
        listMenu.value = info
        menu.select = item
        // 出界处理
        setTimeout(() => {
            const menuEl = document.getElementById(
                'msg-menu-view-messages-menu',
            )?.children[1] as HTMLDivElement
            if (menuEl) {
                menuEl.style.transition = 'margin .2s, transform .1s'
                const hight = menuEl.clientHeight
                const top = menuEl.getBoundingClientRect().top
                const docHight = document.documentElement.clientHeight
                // 出界高度
                const dtHight = hight + top - docHight + 20
                if (dtHight > 0) {
                    menuEl.style.marginTop = docHight - hight - 30 + 'px'
                }
            }
        }, 100)
    }

    /**
     * 显示群收纳盒
     */
    function showGroupAssistCheck() {
        if(!showGroupAssist.value && chatStore.chatInfo.show.id == 0 && backend.type != 'capacitor' ) {
            // 如果没有打开聊天框，打开收纳盒中的第一个群；这么做主要是为了防止动画穿帮
            const assistGroup = document.getElementById('group-assist-message-list-body')
            if(assistGroup && assistGroup.children.length > 0) {
                (assistGroup.children[0] as HTMLDivElement).click()
                setTimeout(() => {
                    showGroupAssist.value = !showGroupAssist.value
                }, 500)
            } else {
                showGroupAssist.value = !showGroupAssist.value
            }
        } else {
            showGroupAssist.value = !showGroupAssist.value
        }
    }

    function showMenuStart(
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
        showMenu.value = true
        setTimeout(() => {
            if (showMenu.value) {
                listMenuShowRun(info, item)
                showMenu.value = false
            }
        }, 500)
    }

    function showMenuMove() {
        showMenu.value = false
    }

    function showMenuEnd() {
        showMenu.value = false
    }

    function openHistory() {
        const popInfo = {
            template: markRaw(History),
            svg: 'clock-rotate-left',
            title: $t('历史记录')
        }
        uiStore.popBoxList.push(popInfo)
    }
</script>

<style>
    .friend-list-container {
        overflow: hidden;
        display: flex;
    }

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
        .friend-list-container {
            overflow: unset;
        }
        .menu {
            width: 140px !important;
        }
    }

    @media (max-width: 500px) {
        .friend-list-container {
            overflow: hidden;
        }
    }
</style>
