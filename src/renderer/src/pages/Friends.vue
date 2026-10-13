<!--
 * @FileDescription: 联系人列表页面
 * @Author: Stapxs
 * @Date:
 *      2022/08/14
 *      2022/12/12
 * @Version:
 *      1.0 - 初始版本
 *      1.5 - 重构为 ts 版本，代码格式优化
-->

<template>
    <div class="friend-view">
        <div id="friend-list" :class="'friend-list' + (uiStore.openSideBar ? ' open' : '')">
            <div>
                <div class="base">
                    <span>{{ $t('联系人') }}</span>
                    <div style="flex: 1" />
                    <font-awesome-icon :icon="['fas', 'rotate-right']" @click="reloadUser" />
                </div>
                <div
                    id="friend-small-search"
                    class="small">
                    <label>
                        <input
                            id="friend-search-small"
                            v-model="searchInfo"
                            v-auto-focus type="text"
                            :placeholder="$t('搜索 ……')" @input="search">
                        <font-awesome-icon :icon="['fas', 'magnifying-glass']" />
                    </label>
                    <div class="reload" @click="reloadUser">
                        <font-awesome-icon :icon="['fas', 'rotate-right']" />
                    </div>
                    <div @click="openLeftBar">
                        <font-awesome-icon :icon="['fas', 'bars-staggered']" />
                    </div>
                </div>
                <label>
                    <input
                        id="friend-search"
                        v-model="searchInfo"
                        v-auto-focus
                        type="text"
                        :placeholder="$t('搜索 ……')" @input="search">
                    <font-awesome-icon :icon="['fas', 'magnifying-glass']" />
                </label>
            </div>
            <div :class="uiStore.openSideBar ? 'open' : ''">
                <template v-if="contactStore.showList.length <= 0">
                    <template v-if="settingsStore.classes.length > 0">
                        <template v-for="info in settingsStore.classes"
                            :key="'class-' + info.class_id">
                            <div :class=" 'list exp-body' +
                                (classStatus[info.class_id] == true ? ' open' : '')">
                                <header :title="info.class_name"
                                    :class="'exp-header' +
                                        (uiStore.openSideBar ? ' open' : '')"
                                    @click="classClick(info.class_id)">
                                    <div />
                                    <span>{{ info.class_name }}</span>
                                    <a>{{
                                        info.user_count ??
                                            contactStore.userList.filter((get) => {
                                                return get.class_id == info.class_id
                                            }).length
                                    }}</a>
                                </header>
                                <div :id="'class-' + info.class_id">
                                    <FriendBody v-for="item in contactStore.userList.filter(
                                                    (get) => {
                                                        return ( get.class_id == info.class_id )
                                                    },
                                                )"
                                        :key=" 'fb-' + (item.user_id ? item.user_id : item.group_id) "
                                        :data="item" from="friend"
                                        @click="userClick(item, $event)" />
                                </div>
                            </div>
                        </template>
                        <div :class="'list exp-body' + (classStatus['-1'] == true ? ' open' : '')">
                            <header :title="$t('群组')"
                                :class="'exp-header' +
                                    (uiStore.openSideBar ? ' open' : '') "
                                @click="classClick('-1')">
                                <div />
                                <span>{{ $t('群组') }}</span>
                                <a>{{
                                    contactStore.userList.filter((get) => {
                                        return get.class_id == undefined
                                    }).length
                                }}</a>
                            </header>
                            <div>
                                <FriendBody v-for="item in contactStore.userList.filter(
                                                (get) => {
                                                    return get.class_id == undefined
                                                },
                                            )"
                                    :key="'fb-' + (item.user_id ? item.user_id : item.group_id)"
                                    :data="item"
                                    from="friend"
                                    @click="userClick(item, $event)" />
                            </div>
                        </div>
                    </template>
                    <template v-else>
                        <FriendBody v-for="item in contactStore.userList"
                            :key="'fb-' + (item.user_id ? item.user_id : item.group_id)"
                            :data="item"
                            from="friend"
                            @click="userClick(item, $event)" />
                    </template>
                </template>
                <!-- 搜索用的 -->
                <div v-else class="list">
                    <div>
                        <FriendBody v-for="item in contactStore.showList"
                            :key="'fb-' + (item.user_id ? item.user_id : item.group_id)"
                            :data="item" from="friend"
                            @click="userClick(item, $event)" />
                    </div>
                </div>
            </div>
        </div>
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
    import { ref, onMounted } from 'vue'
    import { vAutoFocus } from '@renderer/function/utils/appUtil'

    import FriendBody from '@renderer/components/FriendBody.vue'

    import {
        BaseChatInfoElem,
        UserFriendElem,
        UserGroupElem,
    } from '@renderer/function/elements/information'

    import { reloadUsers } from '@renderer/function/utils/appUtil'
    import { login as loginInfo } from '@renderer/function/connect'
    import { backend } from '@renderer/runtime/backend'
    import { matchPinyin } from '@renderer/function/utils/pinyin'
    import { useUIStore } from '@renderer/state/ui'
    import { useSettingsStore } from '@renderer/state/settings'
    import { useContactStore } from '@renderer/state/contact'
    import { useChatStore } from '@renderer/state/chat'

    defineOptions({ name: 'ViewFriends' })

    const uiStore = useUIStore()
    const settingsStore = useSettingsStore()
    const contactStore = useContactStore()
    const chatStore = useChatStore()
    const { list } = defineProps<{ list: (UserFriendElem & UserGroupElem)[] }>()
    const emit = defineEmits<{
        userClick: [data: BaseChatInfoElem]
        loadHistory: [data: BaseChatInfoElem]
    }>()

    const isSearch = ref(false)
    const searchInfo = ref('')
    const classStatus = ref<{ [key: string]: boolean }>({})

    onMounted(() => {
        // 判断 friend-small-search 是否 display none
        const smallSearch = document.getElementById('friend-small-search')
        if(smallSearch) {
            const style = window.getComputedStyle(smallSearch)
            let name = 'friend-search'
            if(style.display != 'none') {
                name = 'friend-search-small'
            }
            // 将焦点移动到搜索框
            if(backend.isDesktop()) {
                const search = document.getElementById(name)
                if(search) {
                    search.focus()
                }
            }
        }
    })

    function getShowName(data: UserFriendElem & UserGroupElem) {
        const group = data.group_name
        const remark = data.remark
        const nickname = data.nickname
        if (group) return group
        else {
            if (!remark || remark == nickname) {
                return nickname
            } else {
                return remark + '（' + nickname + '）'
            }
        }
    }

    function openLeftBar() {
        uiStore.openSideBar = !uiStore.openSideBar
    }

    function classClick(id: string) {
        if (classStatus.value[id]) {
            classStatus.value[id] = !classStatus.value[id]
        } else {
            classStatus.value[id] = true
        }
    }

    function userClick(data: UserFriendElem & UserGroupElem, event: Event) {
        const sender = event.currentTarget as HTMLDivElement
        if (uiStore.openSideBar) {
            openLeftBar()
        }
        isSearch.value = false
        searchInfo.value = ''
        contactStore.showList = [] as any[]

        const back = {
            type: data.user_id ? 'user' : 'group',
            id: data.user_id ? data.user_id : data.group_id,
            name: getShowName(data),
            avatar: data.user_id? 'https://q1.qlogo.cn/g?b=qq&s=0&nk=' + data.user_id: 'https://p.qlogo.cn/gh/' +
                  data.group_id + '/' + data.group_id + '/0',
            jump: sender.dataset.jump,
        } as BaseChatInfoElem
        // 更新聊天框
        emit('userClick', back)
        contactStore.baseOnMsgList.set(back.id, data)
        // 获取历史消息
        emit('loadHistory', back)
        // 切换标签卡
        const barMsg = document.getElementById('bar-msg')
        if (barMsg !== null) {
            barMsg.click()
        }
    }

    function search(event: Event) {
        const value = (event.target as HTMLInputElement).value.toLocaleLowerCase()
        if (value !== '') {
            isSearch.value = true
            contactStore.showList = list.filter(
                (item: UserFriendElem & UserGroupElem) => {
                    const name = (
                        item.user_id? item.nickname + item.remark: item.group_name
                    ).toLowerCase()
                    if (name.includes(value)) return true
                    const id = item.user_id? item.user_id: item.group_id
                    if (id.toString() === value) return true
                    if (item.py_name && matchPinyin(item.py_name, value)) return true
                    return false
                },
            )
        } else {
            isSearch.value = false
            contactStore.showList = [] as any[]
        }
        // macOS: 刷新 TouchBar
        if(backend.isDesktop()) {
            // list 只需要 id 和 name
            backend.call(undefined, 'sys:flushFriendSearch', false,
                contactStore.showList.map((item) => {
                    return {
                        id: item.user_id ? item.user_id : item.group_id,
                        name: getShowName(item)
                    }
                }))
        }
    }

    function reloadUser() {
        reloadUsers()
    }
</script>

<style scoped>
    .exp-body > div {
        /* transition: transform .3s;
    transform-origin: top; */
        transform: scaleY(0);
        height: 0;
    }
    .exp-body.open > div {
        transform: scaleY(1);
        height: unset;
    }
    .exp-body > header > div {
        transition:
            margin-right 0.3s,
            transform 0.3s;
        transform: scaleY(0);
        margin-right: 0;
        width: 0;
    }
    .exp-body.open > header > div {
        transform: scaleY(1);
        margin-right: 10px;
        width: 5px;
    }

    .exp-header {
        color: var(--color-font);
        align-items: center;
        border-radius: 7px;
        cursor: pointer;
        margin: 0 10px;
        padding: 10px;
        display: flex;
    }
    .exp-header:hover {
        background: var(--color-card-2);
    }
    .exp-header > div {
        background: var(--color-main);
        margin-right: 10px;
        border-radius: 7px;
        height: 1rem;
        width: 5px;
    }
    .exp-header > span {
        flex: 1;
    }
    .exp-header > a {
        color: var(--color-font-2);
        font-size: 0.9rem;
    }

    @media (max-width: 700px) {
        .exp-header:not(.open) {
            display: none;
        }
    }
    @media (max-width: 500px) {
        .exp-header > span {
            display: block !important;
        }
    }
</style>
