<!--
 * @FileDescription: 聊天面板页面
 * @Author: Stapxs
 * @Date:
 *      2022/08/14
 *      2022/12/12
 * @Version:
 *      1.0 - 初始版本
 *      1.5 - 重构为 ts 版本，代码格式优化
-->

<template>
    <div ref="chat-pan"
        :class="{
            'chat-pan': true,
            'open': runtimeData.tags.openSideBar,
        }"
        :style="`background-image: url(${runtimeData.sysConfig.chat_background});`"
        @touchstart="chatMoveStartEvent"
        @touchmove="chatMoveEvent"
        @touchend="chatMoveEndEvent"
        @wheel="chatWheelEvent">
        <!-- 聊天基本信息 -->
        <div class="info">
            <font-awesome-icon :icon="['fas', 'bars-staggered']" @click="openLeftBar" />
            <img :src="chat.show.avatar">
            <div class="info">
                <p>
                    {{ chat.show.name }}
                    <template
                        v-if="runtimeData.chatInfo.show.type == 'group'">
                        ({{
                            runtimeData.chatInfo.info.group_members.length
                        }})
                    </template>
                </p>
                <span v-if="chat.show.temp">
                    {{ $t('来自群聊：{group}', { group: chat.show.temp }) }}
                </span>
                <span v-else>
                    <template v-if="chat.show.appendInfo">
                        {{ chat.show.appendInfo }}
                    </template>
                    <template v-else>
                        {{
                            list[list.length - 1] ? $t('上次消息 - {time}', {
                                time: Intl.DateTimeFormat(trueLang, {
                                    hour: 'numeric',
                                    minute: 'numeric',
                                    second: 'numeric',
                                }).format(new Date(list[list.length - 1].time * 1000)),
                            }) : $t('暂无消息')
                        }}
                    </template>
                </span>
            </div>
            <div class="space" />
            <div class="more">
                <font-awesome-icon :icon="['fas', 'ellipsis-vertical']" @click="openChatInfoPan" />
            </div>
        </div>
        <!-- 加载中指示器 -->
        <div :class=" 'loading' + (tags.nowGetHistroy && runtimeData.tags.canLoadHistory ? ' show' : '')">
            <font-awesome-icon :icon="['fas', 'spinner']" />
            <span>{{ $t('加载中') }}</span>
        </div>
        <!-- 消息显示区 -->
        <div v-if="!details[3].open"
            id="msgPan" class="chat"
            style="scroll-behavior: smooth"
            @scroll="chatScroll">
            <div v-if="!runtimeData.tags.canLoadHistory" class="note note-nomsg">
                <hr>
                <a>{{ $t('没有更多消息了') }}</a>
            </div>
            <div v-if="runtimeData.tags.loadHistoryFail" class="note note-nomsg">
                <hr>
                <a>{{ $t('获取历史记录失败') }}</a>
            </div>
            <!-- 时间戳，在下滑加载的时候会显示，方便在大段的相连消息上让用户知道消息时间 -->
            <NoticeBody v-if="tags.nowGetHistroy && list.length > 0"
                :data="{ sub_type: 'time', time: list[0].time }" />
            <TransitionGroup :name="runtimeData.sysConfig.opt_fast_animation ? '' : 'msglist'" tag="div">
                <template v-for="(msgIndex, index) in list">
                    <!-- 时间戳 -->
                    <NoticeBody
                        v-if="isShowTime(list[index - 1] ? list[index - 1].time : undefined, msgIndex.time)"
                        :key="'notice-time-' + (msgIndex.time / ( 4 * 60 )).toFixed(0)"
                        :data="{ sub_type: 'time', time: msgIndex.time }" />
                    <!-- [已删除]消息 -->
                    <NoticeBody
                        v-if="isDeleteMsg(msgIndex)"
                        :key="'delete-' + msgIndex.message_id"
                        :data="{ sub_type: 'delete' }" />
                    <!-- 消息体 -->
                    <MsgBody v-else-if="(msgIndex.post_type === 'message' ||
                                 msgIndex.post_type === 'message_sent') &&
                                 msgIndex.message.length > 0"
                        :key="msgIndex.fake_message_id ?? msgIndex.message_id"
                        :selected="multipleSelectList.includes(msgIndex.message_id) || tags.menuDisplay.menuSelectedMsgId == msgIndex.message_id"
                        :data="msgIndex"
                        :user-info-pan="userInfoPanFunc"
                        @click="msgClick($event, msgIndex)"
                        @show-menu="showMsgMeun"
                        @scroll-to-msg="scrollToMsg"
                        @image-loaded="imgLoadedScroll"
                        @left-move="replyMsg"
                        @send-poke="sendPoke" />
                    <!-- 其他通知消息 -->
                    <NoticeBody v-else-if="msgIndex.post_type === 'notice'"
                        :id="uuid()"
                        :key="'notice-' + index"
                        :data="msgIndex" />
                </template>
            </TransitionGroup>
        </div>
        <div v-else id="msgPan"
            class="chat" style="scroll-behavior: smooth">
            <!-- 搜索消息结果显示 -->
            <TransitionGroup
                :name="runtimeData.sysConfig.opt_fast_animation ? '' : 'msglist'"
                tag="div">
                <template v-for="(msgIndex, index) in tags.search.list">
                    <!-- 时间戳 -->
                    <NoticeBody
                        v-if="isShowTime(list[index - 1] ? list[index - 1].time : undefined, msgIndex.time)"
                        :key="'notice-time-' + index"
                        :data="{ sub_type: 'time', time: msgIndex.time }" />
                    <!-- 消息体 -->
                    <MsgBody v-if=" (msgIndex.post_type === 'message' ||
                                 msgIndex.post_type === 'message_sent') &&
                                 msgIndex.message.length > 0"
                        :key="msgIndex.fake_message_id ?? msgIndex.message_id"
                        :selected="multipleSelectList.includes(msgIndex.message_id) || tags.menuDisplay.menuSelectedMsgId == msgIndex.message_id"
                        :data="msgIndex"
                        :user-info-pan="userInfoPanFunc"
                        @scroll-to-msg="scrollToMsg"
                        @show-menu="showMsgMeun"
                        @image-loaded="imgLoadedScroll"
                        @left-move="replyMsg" />
                </template>
            </TransitionGroup>
        </div>
        <!-- 滚动到底部悬浮标志 -->
        <div v-show="tags.showBottomButton"
            class="new-msg"
            @click="scrollBottom(true)">
            <div class="ss-card">
                <font-awesome-icon :icon="['fas', 'comment']" />
                <span v-if="NewMsgNum > 0">{{ NewMsgNum }}</span>
            </div>
        </div>
        <!-- 底部区域 -->
        <div id="send-more" class="more">
            <!-- 功能附加 -->
            <div>
                <div>
                    <!-- 表情面板 -->
                    <Transition name="pan">
                        <FacePan v-show="details[1].open"
                            @add-special-msg="addSpecialMsg" @send-msg="sendMsg" />
                    </Transition>
                    <!-- 精华消息 -->
                    <Transition name="pan">
                        <div v-show="details[2].open && runtimeData.chatInfo.info.jin_info.list.length > 0"
                            class="ss-card jin-pan">
                            <div>
                                <font-awesome-icon :icon="['fas', 'message']" />
                                <span>{{ $t('精华消息') }}</span>
                                <font-awesome-icon :icon="['fas', 'xmark']" @click="details[2].open = !details[2].open" />
                            </div>
                            <div
                                class="jin-pan-body"
                                @scroll="jinScroll">
                                <div v-for="(item, index) in runtimeData.chatInfo.info.jin_info.list"
                                    :key="'jin-' + index">
                                    <div>
                                        <img :src="`https://q1.qlogo.cn/g?b=qq&s=0&nk=${item.sender_uin}`">
                                        <div>
                                            <a>{{ item.sender_nick }}</a>
                                            <span>{{ Intl.DateTimeFormat(
                                                      trueLang,
                                                      {
                                                          hour: 'numeric',
                                                          minute: 'numeric',
                                                      },
                                                  ).format(new Date(item.sender_time * 1000))
                                                  }}
                                                {{ $t('发送') }}</span>
                                        </div>
                                        <span>{{
                                            $t('{time}，由 {name} 设置', {
                                                time: Intl.DateTimeFormat(
                                                    trueLang,
                                                    {
                                                        hour: 'numeric',
                                                        minute: 'numeric',
                                                    },
                                                ).format(new Date(item.sender_time * 1000)),
                                                name: item.add_digest_nick,
                                            })
                                        }}</span>
                                    </div>
                                    <div class="context">
                                        <template
                                            v-for="(context, indexc) in item.msg_content"
                                            :key="'jinc-' + index + '-' + indexc">
                                            <span v-if="context.msg_type === 1">{{ context.text }}</span>
                                            <img v-if="context.msg_type === 2"
                                                class="face" :src="getFace(context.face_index)">
                                            <img v-if="context.msg_type === 3" :src="context.image_url">
                                        </template>
                                    </div>
                                </div>
                                <div v-show="tags.isJinLoading" class="jin-pan-load">
                                    <font-awesome-icon :icon="['fas', 'spinner']" />
                                </div>
                            </div>
                        </div>
                    </Transition>
                </div>
                <!-- 多选指示器 -->
                <div :class=" multipleSelectList.length > 0 ? 'select-tag show' : 'select-tag'">
                    <div>
                        <font-awesome-icon :icon="['fas', 'share']" @click="showForWard" />
                        <span>{{ $t('合并转发') }}</span>
                    </div>
                    <div>
                        <font-awesome-icon :icon="['fas', 'scissors']" />
                        <span>{{ $t('截图') }}</span>
                    </div>
                    <div>
                        <font-awesome-icon :icon="['fas', 'trash-can']" @click="delMsgs" />
                        <span>{{ $t('删除') }}</span>
                    </div>
                    <div>
                        <font-awesome-icon :icon="['fas', 'copy']" @click="copyMsgs" />
                        <span>{{ $t('复制') }}</span>
                    </div>
                    <div>
                        <span @click="multipleSelectList = []">{{ multipleSelectList.length }}</span>
                        <span>{{ $t('取消') }}</span>
                    </div>
                </div>
                <!-- 搜索指示器 -->
                <div :class="details[3].open ? 'search-tag show' : 'search-tag'">
                    <font-awesome-icon :icon="['fas', 'search']" />
                    <span>{{ $t('搜索已加载的消息') }}</span>
                    <div @click="closeSearch">
                        <font-awesome-icon :icon="['fas', 'xmark']" />
                    </div>
                </div>
                <!-- 回复指示器 -->
                <div :class="tags.isReply ? 'replay-tag show' : 'replay-tag'">
                    <font-awesome-icon :icon="['fas', 'reply']" />
                    <span>{{
                        selectedMsg === null ?
                            '' : selectedMsg.sender.nickname + ': ' + fun.getMsgRawTxt(selectedMsg)
                    }}</span>
                    <div @click="cancelReply">
                        <font-awesome-icon :icon="['fas', 'xmark']" />
                    </div>
                </div>
                <!-- At 指示器 -->
                <div
                    :class="atFindList != null ? 'at-tag show' : 'at-tag'"
                    contenteditable="true"
                    @blur="choiceAt(undefined)">
                    <div v-for="item in atFindList != null ? atFindList : []"
                        :key="'atFind-' + item.user_id"
                        @click="choiceAt(item.user_id)">
                        <img :src="'https://q1.qlogo.cn/g?b=qq&s=0&nk=' + item.user_id">
                        <span>{{
                            item.card != '' && item.card != null ? item.card : item.nickname
                        }}</span>
                        <a>{{ item.user_id }}</a>
                    </div>
                    <div v-if="atFindList?.length == 0" class="emp">
                        <span>{{ $t('没有找到匹配的群成员') }}</span>
                    </div>
                </div>
                <!-- 更多功能 -->
                <div :class="tags.showMoreDetail ? 'more-detail show' : 'more-detail'">
                    <div
                        :title="$t('图片')"
                        @click="runSelectImg">
                        <font-awesome-icon :icon="['fas', 'image']" />
                        <input id="choice-pic" type="file" style="display: none"
                            @change="selectImg">
                    </div>
                    <div
                        :title="$t('文件')"
                        @click="runSelectFile">
                        <font-awesome-icon :icon="['fas', 'folder']" />
                        <input id="choice-file" type="file"
                            style="display: none" @change="selectFile">
                    </div>
                    <div
                        :title="$t('表情')"
                        @click="(details[1].open = !details[1].open),
                                (tags.showMoreDetail = false)">
                        <font-awesome-icon :icon="['fas', 'face-laugh']" />
                    </div>
                    <div v-if="chat.show.type === 'user'"
                        :title="$t('戳一戳')"
                        @click="sendPoke(chat.show.id)">
                        <font-awesome-icon :icon="['fas', 'fa-hand-point-up']" />
                    </div>
                    <div v-if="chat.show.type === 'group'"
                        :title="$t('精华消息')" @click="showJin">
                        <font-awesome-icon :icon="['fas', 'star']" />
                    </div>
                    <div class="space" />
                    <div :title="$t('搜索消息')" @click="openSearch">
                        <font-awesome-icon :icon="['fas', 'search']" />
                    </div>
                </div>
            </div>
            <!-- 消息发送框 -->
            <div>
                <div v-menu.prevent="_=>moreFunClick()"
                    @click="moreFunClick(runtimeData.sysConfig.quick_send)">
                    <font-awesome-icon v-if="tags.showMoreDetail || details.find(item => item.open)" :icon="['fas', 'minus']" />
                    <font-awesome-icon v-else-if="runtimeData.sysConfig.quick_send == 'default'" :icon="['fas', 'plus']" />
                    <font-awesome-icon v-else-if="runtimeData.sysConfig.quick_send == 'img'" :icon="['fas', 'image']" />
                    <font-awesome-icon v-else-if="runtimeData.sysConfig.quick_send == 'file'" :icon="['fas', 'folder']" />
                    <font-awesome-icon v-else-if="runtimeData.sysConfig.quick_send == 'face'" :icon="['fas', 'face-laugh']" />
                </div>
                <div>
                    <form @submit="mainSubmit">
                        <input v-if="!Option.get('use_breakline')"
                            id="main-input"
                            v-model="msg"
                            type="text"
                            autocomplete="off"
                            :disabled="runtimeData.tags.openSideBar || chat.info.me_info.shut_up_timestamp > 0"
                            :placeholder="
                                chat.info.me_info.shut_up_timestamp > 0
                                    ? $t('已被禁言至：{time}', {
                                        time: Intl.DateTimeFormat(
                                            trueLang, getTimeConfig(
                                                new Date(chat.info.me_info.shut_up_timestamp * 1000),
                                            ),
                                        ).format(new Date(chat.info.me_infotimestamp * 1000)),
                                    }) : ''"
                            @paste="addImg"
                            @keyup="mainKeyUp"
                            @click="selectSQIn()"
                            @input="searchMessage">
                        <textarea v-else id="main-input"
                            v-model="msg"
                            type="text"
                            :disabled="runtimeData.tags.openSideBar"
                            @paste="addImg"
                            @keydown="mainKey"
                            @keyup="mainKeyUp"
                            @click="selectSQIn()"
                            @input="searchMessage" />
                    </form>
                    <div @click="sendMsg('sendMsgBack')">
                        <font-awesome-icon v-if="details[3].open" :icon="['fas', 'search']" />
                        <font-awesome-icon v-else :icon="['fas', 'angle-right']" />
                    </div>
                </div>
            </div>
            <div />
        </div>
        <!-- 合并转发消息预览器 -->
        <MergePan ref="mergePan" />
        <!-- At 信息悬浮窗 -->
        <UserInfoPanComponent :data="userInfoPanData" />
        <!-- 消息右击菜单 -->
        <Teleport to="body">
            <div :class="'msg-menu' + (['linux', 'win32'].includes(backend.platform ?? '') ? ' withBar' : '')">
                <div v-show="tags.showMsgMenu" class="msg-menu-bg" @click="closeMsgMenu" />
                <div id="msgMenu" :class="tags.showMsgMenu ?
                    'ss-card msg-menu-body show' : 'ss-card msg-menu-body'">
                    <div v-if="runtimeData.chatInfo.show.type == 'group'"
                        v-show="tags.menuDisplay.showRespond"
                        :class="'ss-card respond' + (tags.menuDisplay.respond ? ' open' : '')">
                        <template v-for="(num, index) in respondIds" :key="'respond-' + num">
                            <img v-if="getFace(num) != ''" loading="lazy"
                                :src="getFace(num) as any" @click="sendRespond(num)">
                            <font-awesome-icon v-if="index == 4" :icon="['fas', 'angle-up']" @click="tags.menuDisplay.respond = true" />
                        </template>
                    </div>
                    <div v-show="tags.menuDisplay.add" @click="forwardSelf()">
                        <div><font-awesome-icon :icon="['fas', 'plus']" /></div>
                        <a>{{ $t('+ 1') }}</a>
                    </div>
                    <div v-show="tags.menuDisplay.relpy" @click="menuReplyMsg(true)">
                        <div><font-awesome-icon :icon="['fas', 'message']" /></div>
                        <a>{{ $t('回复') }}</a>
                    </div>
                    <div v-show="tags.menuDisplay.forward" @click="showForWard()">
                        <div><font-awesome-icon :icon="['fas', 'share']" /></div>
                        <a>{{ $t('转发') }}</a>
                    </div>
                    <div v-show="tags.menuDisplay.select" @click="intoMultipleSelect()">
                        <div><font-awesome-icon :icon="['fas', 'circle-check']" /></div>
                        <a>{{ $t('多选') }}</a>
                    </div>
                    <div v-show="tags.menuDisplay.copy" @click="copyMsg">
                        <div><font-awesome-icon :icon="['fas', 'clipboard']" /></div>
                        <a>{{ $t('复制') }}</a>
                    </div>
                    <div v-show="tags.menuDisplay.copySelect" @click="copySelectMsg">
                        <div><font-awesome-icon :icon="['fas', 'code']" /></div>
                        <a>{{ $t('复制选中文本') }}</a>
                    </div>
                    <div v-show="tags.menuDisplay.downloadImg != false" @click="downloadImg">
                        <div><font-awesome-icon :icon="['fas', 'floppy-disk']" /></div>
                        <a>{{ $t('下载图片') }}</a>
                    </div>
                    <div v-show="tags.menuDisplay.revoke" @click="revokeMsg">
                        <div><font-awesome-icon :icon="['fas', 'xmark']" /></div>
                        <a>{{ $t('撤回') }}</a>
                    </div>
                    <div v-show="tags.menuDisplay.at"
                        @click="selectedMsg ? addSpecialMsg({ msgObj: { type: 'at', qq: selectedMsg.sender.user_id }, addText: true, }): '';
                                toMainInput();
                                closeMsgMenu()">
                        <div><font-awesome-icon :icon="['fas', 'at']" /></div>
                        <a>{{ $t('提及') }}</a>
                    </div>
                    <div v-show="tags.menuDisplay.poke" @click="sendPoke(selectedMsg ? selectedMsg.sender.user_id : undefined)">
                        <div><font-awesome-icon :icon="['fas', 'fa-hand-point-up']" /></div>
                        <a>{{ $t('戳一戳') }}</a>
                    </div>
                    <div v-show="tags.menuDisplay.remove" @click="removeUser">
                        <div><font-awesome-icon :icon="['fas', 'trash-can']" /></div>
                        <a>{{ $t('移出群聊') }}</a>
                    </div>
                    <div v-show="tags.menuDisplay.config"
                        @click="openChatInfoPan();
                                ($refs.infoRef as any).openMoreConfig(selectedMsg?.sender.user_id);
                                closeMsgMenu();">
                        <div><font-awesome-icon :icon="['fas', 'cog']" /></div>
                        <a>{{ $t('成员设置') }}</a>
                    </div>
                    <div v-show="tags.menuDisplay.jumpToMsg" @click="jumpSearchMsg">
                        <div><font-awesome-icon :icon="['fas', 'arrow-up-right-from-square']" /></div>
                        <a>{{ $t('跳转到消息') }}</a>
                    </div>
                </div>
            </div>
        </Teleport>
        <!-- 群 / 好友信息弹窗 -->
        <Transition>
            <Info ref="infoRef" :chat="chat" :tags="tags"
                @close="openChatInfoPan" />
        </Transition>
        <!-- 图片发送器 -->
        <Transition>
            <div v-show="imgCache.length > 0" class="img-sender">
                <div class="card ss-card">
                    <div class="hander">
                        <span>{{ $t('发送图片') }}</span>
                        <button class="ss-button" @click="sendMsg('sendMsgBack')">
                            {{ $t('发送') }}
                        </button>
                    </div>
                    <div class="imgs">
                        <div v-for="(img64, index) in imgCache" :key="'sendImg-' + index">
                            <div @click="deleteImg(index)">
                                <font-awesome-icon :icon="['fas', 'xmark']" />
                            </div>
                            <img :src="img64">
                        </div>
                    </div>
                    <div class="sender">
                        <font-awesome-icon :icon="['fas', 'image']" @click="runSelectImg" />
                        <input v-model="msg"
                            type="text"
                            :disabled="runtimeData.tags.openSideBar"
                            @paste="addImg"
                            @click="toMainInput">
                    </div>
                </div>
                <div class="bg" @click="imgCache = []" />
            </div>
        </Transition>
        <!-- 转发面板 -->
        <Transition>
            <div v-if="tags.showForwardPan" class="forward-pan">
                <div class="ss-card card">
                    <header>
                        <span>{{ $t('转发消息') }}</span>
                        <font-awesome-icon :icon="['fas', 'xmark']" @click="cancelForward" />
                    </header>
                    <input :placeholder="$t('搜索 ……')" @input="searchForward">
                    <div>
                        <div v-for="data in forwardList"
                            :key=" 'forwardList-' + data.user_id ? data.user_id : data.group_id"
                            @click="forwardMsg(data)">
                            <img loading="lazy"
                                :title="getShowName(data.group_name || data.nickname, data.remark)"
                                :src="data.user_id ?
                                    'https://q1.qlogo.cn/g?b=qq&s=0&nk=' + data.user_id :
                                    'https://p.qlogo.cn/gh/' + data.group_id + '/' + data.group_id + '/0'">
                            <div>
                                <p>
                                    {{ data.group_name ?
                                        data.group_name : data.remark === data.nickname ?
                                            data.nickname : data.remark + '（' + data.nickname + '）'
                                    }}
                                </p>
                                <span>{{ data.group_id ? $t('群组') : $t('好友') }}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="bg" @click="cancelForward" />
            </div>
        </Transition>
        <div class="bg" :style="{
            'backdrop-filter': `blur(${runtimeData.sysConfig .chat_background_blur}px)`
        }" />
    </div>
</template>

<script setup lang="ts">
import app from '@renderer/main'
import SendUtil from '@renderer/function/sender'
import Option, { get } from '@renderer/function/option'
import Info from '@renderer/pages/Info.vue'
import MsgBody from '@renderer/components/MsgBody.vue'
import NoticeBody from '@renderer/components/NoticeBody.vue'
import FacePan from '@renderer/components/FacePan.vue'
import MergePan from '@renderer/components/MergePan.vue'
import imageCompression from 'browser-image-compression'

import {
    defineComponent,
    markRaw,
    reactive,
    shallowReactive
} from 'vue'
import { v4 as uuid } from 'uuid'
import {
    downloadFile,
    loadHistory as loadHistoryFirst,
    shouldAutoFocus,
} from '@renderer/function/utils/appUtil'
import {
    getTimeConfig,
    getTrueLang,
    getViewTime,
} from '@renderer/function/utils/systemUtil'
import {
    getMsgRawTxt,
    sendMsgRaw,
    getFace,
    getShowName,
    isShowTime,
    isDeleteMsg,
} from '@renderer/function/utils/msgUtil'
import { scrollToMsg } from '@renderer/function/utils/appUtil'
import { Logger, LogType, PopInfo, PopType } from '@renderer/function/base'
import { Connector } from '@renderer/function/connect'
import { runtimeData } from '@renderer/function/msg'
import {
    BaseChatInfoElem,
    MsgItemElem,
    SQCodeElem,
    GroupMemberInfoElem,
    UserFriendElem,
    UserGroupElem,
    MenuEventData,
} from '@renderer/function/elements/information'
import { wheelMask } from '@renderer/function/input'
import UserInfoPanComponent, { UserInfoPan } from '@renderer/components/UserInfoPan.vue'
import { backend } from '@renderer/runtime/backend'
import { vMenu } from '@renderer/function/utils/appUtil'

type IUser = any

const userInfoPanData = shallowReactive<{
    user: undefined | IUser | number,
    x: number,
    y: number,
}>({
    user: undefined,
    x: 0,
    y: 0,
})
const userInfoPanFunc: UserInfoPan = {
    open: (user: IUser | number, x: number, y: number) => {
        if(user.level != undefined) {
            userInfoPanData.user = user
            userInfoPanData.x = x
            userInfoPanData.y = y
        }
    },
    close: () => {
        userInfoPanData.user = undefined
    },
}
</script>

<script lang="ts">
    export default defineComponent({
        name: 'ViewChat',
        props: ['chat', 'list', 'imgView'],
        data() {
            return {
                backend,
                uuid,
                getShowName,
                fun: {
                    getMsgRawTxt: getMsgRawTxt,
                },
                Option: Option,
                getFace: getFace,
                Connector: Connector,
                runtimeData: runtimeData,
                getTimeConfig: getTimeConfig,
                forwardList: runtimeData.userList,
                trueLang: getTrueLang(),
                multipleSelectList: [] as string[],
                tags: {
                    nowGetHistroy: false,
                    showBottomButton: true,
                    showMoreDetail: false,
                    showMsgMenu: false,
                    showForwardPan: false,
                    openChatInfo: false,
                    isReply: false,
                    isJinLoading: false,
                    onAtFind: false,
                    menuDisplay: {
                        menuSelectedMsgId: null as string | null,
                        jumpToMsg: false,
                        add: true,
                        relpy: true,
                        forward: true,
                        select: true,
                        copy: true,
                        copySelect: false,
                        downloadImg: false as string | false,
                        revoke: false,
                        at: true,
                        poke: false,
                        remove: false,
                        respond: false,
                        showRespond: true,
                        config: false,
                    },
                    search: {
                        userId: -1,
                        list: reactive(this.list),
                    },
                    msgTouch: {
                        x: -1,
                        y: -1,
                        msgOnTouchDown: false,
                        onMove: 'no',
                    },
                    chatMove: {
                        move: 0,
                        onScroll: 'none' as 'none' | 'touch' | 'wheel',
                        lastTime: null as null | number,
                        speedList: [] as number[],
                        touchLast: null as null | TouchEvent,
                    },
                },
                details: [
                    { open: false },
                    { open: false },
                    { open: false },
                    { open: false },
                ],
                msgMenus: [],
                NewMsgNum: 0,
                msg: '',
                imgCache: [] as string[],
                sendCache: [] as MsgItemElem[],
                selectedMsg: null as { [key: string]: any } | null,
                selectCache: '',
                replyMsgInfo: null,
                atFindList: null as GroupMemberInfoElem[] | null,
                getImgList: [] as {
                    index: number
                    message_id: string
                    img_url: string
                }[],
                respondIds: [
                    5, 314, 318, 319, 320, 324, 337, 338, 339, 341, 342, 343, 344,
                    345, 346, 181, 74, 75, 351, 349, 350, 395, 326, 53, 333, 424,
                    425, 427, 426, 14, 4, 8, 9, 10, 12, 16, 96, 21, 23, 24, 25, 26,
                    27, 28, 29, 30, 32, 33, 34, 38, 39, 97, 98, 99, 100, 101, 102,
                    103, 104, 106, 305, 109, 111, 182, 179, 173, 174, 212, 175, 176,
                    183, 262, 264, 265, 266, 267, 268, 269, 270, 271, 272, 277, 307,
                    306, 281, 282, 284, 285, 293, 287, 289, 294, 297, 298, 299, 332,
                    336, 353, 355, 356, 354, 352, 357, 428, 334, 347, 303, 302, 295,
                    49, 66, 63, 116, 60, 76, 124, 118, 78, 79, 120, 123, 201, 273,
                    171, 144, 147, 89, 41, 125, 42, 43, 129, 85
                ],
                isShowTime,
                isDeleteMsg,
            }
        },
        watch: {
            chat() {
                // 重置部分状态数据
                const data = (this as any).$options.data(this)
                this.tags = data.tags
                this.msgMenus = data.msgMenus
                this.sendCache = []
                this.imgCache = [] as string[]
                this.multipleSelectList = []
                this.initMenuDisplay()
            },
        },
        async mounted() {
            // 消息列表刷新
            this.updateList(this.list.length, 0)
            // PS：由于监听 list 本身返回的新旧值是一样，于是监听 length（反正也只要知道长度）
            this.$watch(() => this.list.length, this.updateList)
            //精华消息列表刷新
            this.$watch(
                () => this.chat.info.jin_info.list.length,
                () => {
                    this.tags.isJinLoading = false
                },
            )
            // 为 viewer 绑定关闭事件
            const viewer = app.config.globalProperties.$viewer
            this.$watch(
                () => viewer.hiding,
                (newVall) => {
                    if (newVall) {
                        runtimeData.chatInfo.info.image_list = this.getImgList
                    }
                },
            )
            // Capacitor：系统返回操作（Android）
            if(backend.type == 'capacitor' && backend.platform === 'android') {
                backend.addListener('App', 'backButton', () => {
                    this.exitWin()
                })
            }
            // Web：系统返回操作
            this.$watch(() => runtimeData.watch.backTimes, () => {
                this.exitWin()

            })
        },
        methods: {
            jumpSearchMsg() {
                this.closeSearch()
                setTimeout(() => {
                    if (!this.selectedMsg) return
                    this.scrollToMsg('chat-' + this.selectedMsg?.message_id)
                    this.closeMsgMenu()
                }, 100)
            },

            /**
             * 消息区滚动
             * @param event 滚动事件
             */
            chatScroll(event: Event) {
                const body = event.target as HTMLDivElement
                const bar = document.getElementById('send-more')
                // 顶部
                if (body.scrollTop === 0 && this.list.length > 0) {
                    this.loadMoreHistory()
                }
                // 底部
                if ((body.scrollTop + body.clientHeight + 10) >= body.scrollHeight) {
                    this.NewMsgNum = 0
                    this.tags.showBottomButton = false
                    // 去除阴影
                    if (bar) {
                        bar.style.transition = 'background .3s'
                        bar.classList.add('btn')
                    }
                }
                // 显示回到底部
                if (
                    body.scrollTop <
                        body.scrollHeight - body.clientHeight * 2 &&
                    this.tags.showBottomButton !== true
                ) {
                    this.tags.showBottomButton = true
                }
                // 添加阴影
                if (
                    body.scrollTop <
                    body.scrollHeight - body.clientHeight - 10
                ) {
                    if (bar) {
                        bar.style.transition = 'background 1s'
                        bar.classList.remove('btn')
                    }
                }
            },

            /**
             * 加载更多历史消息
             */
            loadMoreHistory() {
                if (
                    !this.tags.nowGetHistroy &&
                    runtimeData.tags.canLoadHistory !== false
                ) {
                    // 获取列表第一条消息 ID
                    const firstMsgId = this.list[0].message_id
                    // 锁定加载防止反复触发
                    this.tags.nowGetHistroy = true
					// 移除加载失败标志
					runtimeData.tags.loadHistoryFail = false
                    // 发起获取历史消息请求
                    const fullPage =
                        runtimeData.jsonMap.message_list?.pagerType == 'full'
                    const type = runtimeData.chatInfo.show.type
                    const id = runtimeData.chatInfo.show.id
                    let name
                    if (runtimeData.jsonMap.message_list && type != 'group') {
                        name = runtimeData.jsonMap.message_list.private_name
                    } else {
                        name = runtimeData.jsonMap.message_list.name
                    }
                    Connector.send(
                        name ?? 'get_chat_history',
                        {
                            group_id: type == 'group' ? id : undefined,
                            user_id: type != 'group' ? id : undefined,
                            message_id: firstMsgId,
                            count: fullPage? runtimeData.messageList.length + 20: 20,
                        },
                        'getChatHistory',
                    )
                }
            },

            /**
             * 消息区滚动到指定位置
             * @param where 位置（px）
             * @param showAnimation 是否使用动画
             */
            scrollTo(where: number | undefined, showAnimation = true) {
                const pan = document.getElementById('msgPan')
                if (pan !== null && where) {
                    if (showAnimation === false) {
                        pan.style.scrollBehavior = 'unset'
                    } else {
                        pan.style.scrollBehavior = 'smooth'
                    }
                    pan.scrollTop = where
                    pan.style.scrollBehavior = 'smooth'
                }
            },
            scrollBottom(showAnimation = false) {
                const pan = document.getElementById('msgPan')
                if (pan !== null) {
                    this.scrollTo(pan.scrollHeight, showAnimation)
                }
            },
            scrollToMsg(message_id: string) {
                if (!scrollToMsg(message_id, true)) {
                    new PopInfo().add(PopType.INFO, this.$t('无法定位上下文'))
                }
            },
            imgLoadedScroll(height: number) {
                const pan = document.getElementById('msgPan')
                if(pan) {
                    if(this.list.length <= 20 && !this.tags.showBottomButton) {
                        this.scrollBottom()
                    } else {
                        // 纠正滚动位置
                        this.scrollTo(pan.scrollTop + height, false)
                    }
                }
            },

            /**
             * 发送框按键事件
             * @param event 事件
             */
            mainKey(event: KeyboardEvent) {
                if (!event.shiftKey && event.keyCode == 13) {
                    // enter 发送消息
                    if (this.msg != '') {
                        this.sendMsg()
                    }
                }
            },
            mainKeyUp(event: KeyboardEvent) {
                const logger = new Logger()
                // 发送完成后输入框会遗留一个换行，把它删掉 ……
                if (
                    !event.shiftKey &&
                    event.keyCode == 13 &&
                    this.msg == '\n'
                ) {
                    this.msg = ''
                }
                if (event.keyCode != 13) {
                    // 获取最后一个输入的符号用于判定 at
                    const lastInput = this.msg.substring(this.msg.length - 1)
                    if (
                        !this.tags.onAtFind &&
                        lastInput == '@' &&
                        runtimeData.chatInfo.info.group_members.length > 0 &&
                        runtimeData.chatInfo.show.type == 'group'
                    ) {
                        logger.add(LogType.UI, '开始匹配群成员列表 ……')
                        this.tags.onAtFind = true
                    }
                    if (this.tags.onAtFind) {
                        if (this.msg.lastIndexOf('@') < 0) {
                            logger.add(LogType.UI, '匹配群成员列表被打断 ……')
                            this.tags.onAtFind = false
                            this.atFindList = null
                        } else {
                            const atInfo = this.msg
                                .substring(this.msg.lastIndexOf('@') + 1)
                                .toLowerCase()
                            if (atInfo != '') {
                                this.atFindList = runtimeData.chatInfo.info.group_members
                                        .filter((item) => { return (
                                                (item.card != '' && item.card != null && item.card.toLowerCase().indexOf(atInfo) >=0) ||
                                                item.nickname.toLowerCase().indexOf(atInfo) >= 0 ||
                                                atInfo ==item.user_id.toString()
                                            )
                                        },
                                    )
                            }
                        }
                    }
                }
            },

            /**
             * 通过表单提交方式发送消息
             * PS：主要用来解决一些奇奇怪怪的回车判定导致的问题
             */
            mainSubmit(event) {
                event.preventDefault()
                if (this.msg != '') {
                    this.sendMsg()
                }
            },

            /**
             * 选择 At
             * @param id QQ 号
             */
            choiceAt(id: number | undefined) {
                if (id != undefined) {
                    // 删除输入框内的 At 文本
                    this.msg = this.msg.substring(0, this.msg.lastIndexOf('@'))
                    // 添加 at 信息
                    this.addSpecialMsg({
                        msgObj: { type: 'at', qq: id },
                        addText: true,
                    })
                }
                this.toMainInput()
                this.tags.onAtFind = false
                this.atFindList = null
            },

            /**
             * 选中光标在其内部的那个 SQLCode
             */
            selectSQIn() {
                const input = document.getElementById(
                    'main-input',
                ) as HTMLInputElement
                // 如果文本框里本来就选中着什么东西就不触发了
                if (
                    input !== null &&
                    input.selectionStart === input.selectionEnd
                ) {
                    let cursurPosition = -1
                    if (typeof input.selectionStart === 'number') {
                        cursurPosition = input.selectionStart
                    }
                    // 获取所有的 SQCode
                    const getSQCode = SendUtil.getSQList(this.msg)
                    if (getSQCode != null) {
                        // 遍历寻找 SQCode 位置区间包括光标位置的 SQCode
                        getSQCode.forEach((item) => {
                            const start = this.msg.indexOf(item)
                            const end = start + item.length
                            if (
                                start !== -1 &&
                                cursurPosition > start &&
                                cursurPosition < end
                            ) {
                                this.$nextTick(() => {
                                    input.selectionStart = start
                                    input.selectionEnd = end
                                })
                            }
                        })
                    }
                }
            },

            /**
             * 显示右击菜单
             * @param event 右击事件
             * @param data 消息信息
             */
            showMsgMeun(event: MenuEventData, data: any) {
                this.selectedMsg = data
                this.tags.menuDisplay.menuSelectedMsgId = data.message_id

                if (Option.get('log_level') === 'debug') {
                    new Logger().debug('右击消息：' + data)
                }
                // 如果开着多选模式，不打开右击菜单
                if (this.multipleSelectList.length > 0) {
                    return
                }

                const menu = document.getElementById('msgMenu')
                const select = event.target as HTMLElement
                let selectUserType = 'member'
                if (
                    runtimeData.chatInfo.show.type == 'group' &&
                    runtimeData.chatInfo.info.group_members
                ) {
                    runtimeData.chatInfo.info.group_members.forEach(
                        (item: any) => {
                            if (item.user_id == data.sender.user_id) {
                                selectUserType = item.role
                            }
                        },
                    )
                }

                if (menu !== null && data !== null) {
                    // 关闭回应功能
                    if (get('close_respond') == true) {
                        this.tags.menuDisplay.showRespond = false
                    }
                    if (
                        select.nodeName == 'IMG' &&
                        (select as HTMLImageElement).name == 'avatar'
                    ) {
                        // 右击头像需要显示的内容
                        Object.keys(this.tags.menuDisplay).forEach(
                            (name: string) => {
                                (this.tags.menuDisplay as any)[name] = false
                            },
                        )
                        this.tags.menuDisplay.showRespond = false
                        this.tags.menuDisplay.at = true
                        this.tags.menuDisplay.poke = true
                        this.tags.menuDisplay.remove = true
                        if (
                            runtimeData.chatInfo.show.type != 'group' ||
                            data.sender.user_id === runtimeData.loginInfo.uin ||
                            runtimeData.chatInfo.info.me_info.role === 'member' ||
                            selectUserType == 'owner' ||
                            (selectUserType == 'admin' && runtimeData.chatInfo.info.me_info.role != 'owner')
                        ) {
                            // 自己、私聊或者没有权限的时候不显示移除
                            this.tags.menuDisplay.remove = false
                        }
                        if (data.sender.user_id === runtimeData.loginInfo.uin) {
                            // 自己不显示提及
                            this.tags.menuDisplay.at = false
                        }
                        // 群成员设置
                        if(runtimeData.chatInfo.show.type == 'group' &&
                        runtimeData.chatInfo.info.me_info.role != 'member') {
                            this.tags.menuDisplay.config = true
                        }
                    } else {
                        // 检查消息，确认菜单显示状态
                        if (
                            data.sender.user_id === runtimeData.loginInfo.uin ||
                            runtimeData.chatInfo.info.me_info.role ===
                                'admin' ||
                            runtimeData.chatInfo.info.me_info.role === 'owner'
                        ) {
                            // 自己的消息、管理员和群主会显示撤回
                            this.tags.menuDisplay.revoke = true
                        }
                        if (data.revoke === true) {
                            // 已被撤回的自己的消息只显示复制
                            this.tags.menuDisplay.relpy = false
                            this.tags.menuDisplay.forward = false
                            this.tags.menuDisplay.revoke = false
                            this.tags.menuDisplay.select = false
                        }
                        // 如果在搜索状态，只显示跳转到消息的菜单
                        if (this.details[3].open) {
                            Object.keys(this.tags.menuDisplay).forEach(
                                (name: string) => {
                                    (this.tags.menuDisplay as any)[name] = false
                                },
                            )
                            this.tags.menuDisplay.jumpToMsg = true
                        }
                        const selection = document.getSelection()
                        const textBody = selection?.anchorNode?.parentElement
                        let textMsg = null as HTMLElement | null
                        // 向外寻找含有 message class 的父元素，直到遇到 chat class
                        let msgParent = textBody
                        if (msgParent) {
                            while (msgParent.className != 'chat') {
                                if (
                                    msgParent.className.startsWith('message') &&
                                    msgParent.className.indexOf('-') < 0
                                ) {
                                    textMsg = msgParent
                                    break
                                }
                                msgParent =
                                    msgParent.parentElement as HTMLDivElement
                                if (!msgParent) {
                                    break
                                }
                            }
                        }
                        if (
                            textBody &&
                            textBody.className.indexOf('msg-text') > -1 &&
                            selection.focusNode == selection.anchorNode &&
                            textMsg &&
                            textMsg.id == data.message_id
                        ) {
                            // 用于判定是否选中了 msg-text 且开始和结束是同一个 Node（防止跨消息复制）
                            this.selectCache = selection.toString()
                            if (this.selectCache.length > 0) {
                                this.tags.menuDisplay.copySelect = true
                            }
                        }
                        const nList = ['xml', 'json']
                        data.message.forEach((item: any) => {
                            if (nList.indexOf(item.type as string) > 0) {
                                // 如果包含以上消息类型，不能转发
                                this.tags.menuDisplay.forward = false
                                this.tags.menuDisplay.add = false
                            }
                        })
                        if (select.nodeName == 'IMG') {
                            // 右击图片需要显示的内容，这边特例设置为链接
                            this.tags.menuDisplay.downloadImg = (
                                select as HTMLImageElement
                            ).src
                        }
                    }
                    // 鼠标位置
                    const pointX = event.x
                    const pointY = event.y
                    // 移动菜单位置
                    menu.style.marginLeft = pointX + 'px'
                    menu.style.marginTop = pointY + 'px'
                    // 出界判定
                    let menuWidth = menu.clientWidth
                    if (this.tags.menuDisplay.showRespond) {
                        // 如果有回应功能，获取回应功能的宽度；它比菜单长
                        const item = menu.children[0] as HTMLDivElement
                        menuWidth = item.clientWidth
                    }
                    const maxWidth = window.innerWidth
                    if (pointX + menuWidth > maxWidth + 27) {
                        menu.style.marginLeft = maxWidth + 7 - menuWidth + 'px'
                    }
                    // 显示菜单
                    this.tags.showMsgMenu = true
                    // PS：在菜单完全显示出来之前获取不到正确的高度，所以延迟一下
                    setTimeout(() => {
                        // 出界判定
                        const menuHeight = menu.clientHeight
                        const bodyHeight = document.body.clientHeight
                        if (pointY + menuHeight > bodyHeight - 20) {
                            menu.classList.add('topOut')
                            menu.style.marginTop =
                                bodyHeight - menuHeight - 10 + 'px'
                        }
                    }, 100)
                }
            },

            /**
             * 初始化菜单状态
             */
            initMenuDisplay() {
                this.tags.menuDisplay = {
                    menuSelectedMsgId : null,
                    jumpToMsg: false,
                    add: true,
                    relpy: true,
                    forward: true,
                    select: true,
                    copy: true,
                    copySelect: false,
                    downloadImg: false,
                    revoke: false,
                    at: false,
                    poke: false,
                    remove: false,
                    respond: false,
                    showRespond: true,
                    config: false,
                }
            },

            /**
             * 回复消息
             */
            menuReplyMsg(closeMenu = true) {
                const msg = this.selectedMsg
                if (!msg) return

                this.replyMsg(msg)
                // 关闭消息菜单
                if (closeMenu) {
                    this.closeMsgMenu()
                }
            },
            replyMsg(msg: any) {
                const msgId = msg.message_id
                this.selectedMsg = msg
                // 添加回复内容
                // PS：这儿还是用旧的方式 …… 因为新的调用不友好。回复消息不会被加入文本行，在消息发送器内有特殊判定。
                this.addSpecialMsg({
                    msgObj: { type: 'reply', id: String(msgId) },
                    addText: false,
                    addTop: true,
                })
                // 显示回复指示器
                this.tags.isReply = true
                // 聚焦输入框
                this.toMainInput()
            },

            /**
             * 取消回复消息
             */
            cancelReply() {
                // 去除回复消息缓存
                this.sendCache = this.sendCache.filter((item) => {
                    return item.type !== 'reply'
                })
                this.tags.isReply = false
            },

            /**
             * 取消转发
             */
            cancelForward() {
                this.forwardList = runtimeData.userList
                this.tags.showForwardPan = false
                this.closeMsgMenu()
            },

            /**
             * 搜索转发列表
             * @param value 搜索内容
             */
            searchForward(event: Event) {
                const value = (event.target as HTMLInputElement).value
                this.forwardList = runtimeData.userList.filter(
                    (item: UserFriendElem & UserGroupElem) => {
                        const name = (
                            item.user_id? item.nickname + item.remark: item.group_name
                        ).toLowerCase()
                        const id = item.user_id ? item.user_id : item.group_id
                        return (
                            name.indexOf(value.toLowerCase()) !== -1 ||
                            id.toString() === value
                        )
                    },
                )
            },

            showForWard() {
                this.tags.showForwardPan = true
                const showList = Object.assign(runtimeData.onMsgList).reverse()
                // 将 forWardList 中 showList 之中的条目挪到最前面
                showList.forEach((item) => {
                    const index = this.forwardList.indexOf(item)
                    if (index > -1) {
                        this.forwardList.splice(index, 1)
                        this.forwardList.unshift(item)
                    }
                })
            },

            forwardSelf() {
                if (this.selectedMsg) {
                    const msg = JSON.parse(JSON.stringify(this.selectedMsg))
                    sendMsgRaw(
                        this.chat.show.id,
                        this.chat.show.type,
                        msg.message,
                        true,
                    )
                }
                this.closeMsgMenu()
            },

            intoMultipleSelect() {
                if (this.selectedMsg) {
                    this.multipleSelectList.push(this.selectedMsg.message_id)
                }
                this.closeMsgMenu()
            },

            /**
             * 转发消息
             */
            forwardMsg(data: UserFriendElem & UserGroupElem) {
                const msg = this.selectedMsg
                const id = data.group_id ? data.group_id : data.user_id
                if (this.multipleSelectList.length > 0 && msg) {
                    // 构造一条假的 json 消息用来渲染
                    const msgList = runtimeData.messageList.filter((item) => {
                        return this.multipleSelectList.indexOf(item.message_id) >= 0
                    })
                    // 构造 titleList
                    const jsonMsg = {
                        app: 'com.tencent.multimsg',
                        meta: {
                            detail: {
                                source: this.$t('合并转发消息'),
                                news: [
                                    ...msgList.slice(0, 3).map((item) => {
                                        const name =
                                            item.sender.card &&
                                            item.sender.card != ''? item.sender.card: item.sender.nickname
                                        return {
                                            text:
                                                name +
                                                ': ' +
                                                getMsgRawTxt(item),
                                        }
                                    }),
                                ],
                                summary: this.$t('查看 {count} 条转发消息', { count: this.multipleSelectList.length }),
                                resid: '',
                            },
                        },
                    }
                    const previewMsg = {
                        message: [
                            { type: 'json', data: JSON.stringify(jsonMsg), id: '' },
                        ],
                        sender: {
                            user_id: runtimeData.loginInfo.uin,
                            nickname: runtimeData.loginInfo.nickname,
                        }
                    }
                    // 二次确认转发
                    const popInfo = {
                        title: this.$t('合并转发消息'),
                        template: markRaw(MsgBody),
                        templateValue: markRaw({ data: previewMsg, type: 'forward' }),
                        button: [
                            {
                                text: this.$t('取消'),
                                fun: () => {
                                    runtimeData.popBoxList.shift()
                                },
                            },
                            {
                                text: this.$t('确定'),
                                master: true,
                                fun: () => {
                                    // 构建消息体
                                    const msgBody = msgList.map((item) => {
                                        return {
                                            type: 'node',
                                            id: item.message_id,
                                            user_id: item.sender.user_id,
                                            nickname: item.sender.nickname,
                                            content: item.message,
                                        }
                                    })
                                    sendMsgRaw(
                                        this.chat.show.id,
                                        this.chat.show.type,
                                        msgBody,
                                        true,
                                    )
                                    runtimeData.popBoxList.shift()
                                },
                            },
                        ],
                    }
                    runtimeData.popBoxList.push(popInfo)
                } else if (this.selectedMsg && msg) {
                    // 二次确认转发
                    const popInfo = {
                        title: this.$t('转发消息'),
                        template: markRaw(MsgBody),
                        templateValue: markRaw({ data: msg, type: 'forward' }),
                        button: [
                            {
                                text: this.$t('取消'),
                                fun: () => {
                                    runtimeData.popBoxList.shift()
                                },
                            },
                            {
                                text: this.$t('确定'),
                                master: true,
                                fun: () => {
                                    sendMsgRaw(
                                        this.chat.show.id,
                                        this.chat.show.type,
                                        msg.message,
                                        true,
                                    )
                                    runtimeData.popBoxList.shift()
                                },
                            },
                        ],
                    }
                    runtimeData.popBoxList.push(popInfo)
                }
                // 关闭转发窗口
                this.cancelForward()
                // 将接收目标加入消息列表并跳转过去
                if(runtimeData.baseOnMsgList.get(id) == undefined) {
                    runtimeData.baseOnMsgList.set(id, data)
                }
                this.$nextTick(() => {
                    const user = document.getElementById('user-' + id)
                    if (user) {
                        user.click()
                    }
                })
            },

            /**
             * 发送消息回应
             * @param num
             */
            sendRespond(num: number) {
                const msg = this.selectedMsg
                if (msg !== null) {
                    const msgId = msg.message_id
                    Connector.send(
                        runtimeData.jsonMap.send_respond.name,
                        {
							group_id: this.chat.show.id,
                            message_id: msgId,
                            emoji_id: String(num),
							code: String(num),
                        },
                        'SendRespondBack_' + msgId + '_' + num,
                    )
                }
                this.closeMsgMenu()
            },

            /**
             * 复制选中的消息
             */
            copyMsg() {
                const msg = this.selectedMsg
                if (msg !== null) {
                    // 如果消息体没有简述消息的话 ……
                    if (!msg.raw_message) {
                        msg.raw_message = getMsgRawTxt(msg)
                    }
                    const popInfo = new PopInfo()
                    app.config.globalProperties.$copyText(msg.raw_message).then(
                        () => {
                            popInfo.add(PopType.INFO, this.$t('复制成功'), true)
                        },
                        () => {
                            popInfo.add(PopType.ERR, this.$t('复制失败'), true)
                        },
                    )
                }
                this.closeMsgMenu()
            },

            /**
             * 复制缓存的选中的文本
             */
            copySelectMsg() {
                if (this.selectCache != '') {
                    const popInfo = new PopInfo()
                    app.config.globalProperties
                        .$copyText(this.selectCache)
                        .then(
                            () => {
                                popInfo.add(
                                    PopType.INFO,
                                    this.$t('复制成功'),
                                    true,
                                )
                            },
                            () => {
                                popInfo.add(
                                    PopType.ERR,
                                    this.$t('复制失败'),
                                    true,
                                )
                            },
                        )
                }
                this.closeMsgMenu()
            },

            /**
             * 下载选中的图片
             */
            downloadImg() {
                const url = this.tags.menuDisplay.downloadImg
                if (url != false) {
                    downloadFile(url as string, 'img.png', () => undefined, () => undefined)
                }
                this.closeMsgMenu()
            },

            /**
             * 撤回消息
             */
            revokeMsg() {
                const msg = this.selectedMsg
                if (msg !== null) {
                    const msgId = msg.message_id
                    Connector.send('delete_msg', { message_id: msgId }, 'deleteMsg')
                    // 关闭消息菜单
                    this.closeMsgMenu()
                }
            },

            /**
             * 移出群聊
             */
            removeUser() {
                const msg = this.selectedMsg
                if (msg !== null) {
                    const popInfo = {
                        title: this.$t('提醒'),
                        html: `<span>${this.$t('真的要将 {user} 移出群聊吗', { user: msg.sender.nickname })}</span>`,
                        button: [
                            {
                                text: app.config.globalProperties.$t('确定'),
                                fun: () => {
                                    if (msg) {
                                        Connector.send(
                                            'set_group_kick',
                                            {
                                                group_id:
                                                    runtimeData.chatInfo.show
                                                        .id,
                                                user_id: msg.sender.user_id,
                                            },
                                            'setGroupKick',
                                        )
                                        this.closeMsgMenu()
                                        runtimeData.popBoxList.shift()
                                    }
                                },
                            },
                            {
                                text: app.config.globalProperties.$t('取消'),
                                master: true,
                                fun: () => {
                                    runtimeData.popBoxList.shift()
                                },
                            },
                        ],
                    }
                    runtimeData.popBoxList.push(popInfo)
                }
            },

            /**
             * 关闭右击菜单
             */
            closeMsgMenu() {
                // 关闭菜单
                this.tags.showMsgMenu = false
                this.tags.menuDisplay.menuSelectedMsgId = null
                setTimeout(() => {
                    // 重置菜单显示状态
                    this.initMenuDisplay()
                }, 300)
            },

            /**
             * 打开好友/群组信息页面
             */
            openChatInfoPan() {
                this.tags.openChatInfo = !this.tags.openChatInfo
                // 加载一些需要显示的消息，有部分判断是用来防止反复加载已存在内容的
                if (this.tags.openChatInfo) {
                    // 加载基础信息
                    if (
                        this.chat.show.type === 'group' &&
                        this.chat.info.group_info.gc !== this.chat.show.id
                    ) {
                        const url = `https://qinfo.clt.qq.com/cgi-bin/qun_info/get_group_info_all?gc=${this.chat.show.id}&bkn=${runtimeData.loginInfo.bkn}`
                        Connector.send(
                            'http_proxy',
                            { url: url },
                            'getMoreGroupInfo',
                        )
                    } else if (
                        this.chat.show.type === 'user' &&
                        this.chat.info.user_info.uin !== this.chat.show.id
                    ) {
                        const userInfo = runtimeData.jsonMap.friend_info.name
                        if(userInfo != undefined) {
                            Connector.send(
                                userInfo,
                                { user_id: this.chat.show.id },
                                'getMoreUserInfo',
                            )
                        }
                    }
                    // 加载群公告列表
                    const noticeName = runtimeData.jsonMap.group_notices.name
                    if (
                        this.chat.show.type === 'group' &&
                        (this.chat.info.group_notices === undefined ||
                            Object.keys(this.chat.info.group_notices).length ===
                                0)
                    ) {
                        if (noticeName && noticeName != 'http_proxy') {
                            Connector.send(
                                noticeName,
                                { group_id: this.chat.show.id },
                                'getGroupNotices',
                            )
                        } else {
                            const url = `https://web.qun.qq.com/cgi-bin/announce/get_t_list?bkn=${runtimeData.loginInfo.bkn}&qid=${this.chat.show.id}&ft=23&s=-1&n=20`
                            Connector.send(
                                'http_proxy',
                                { url: url },
                                'getGroupNotices',
                            )
                        }
                    }
                    // 加载群文件列表
                    if (this.chat.show.type === 'group' && Object.keys(this.chat.info.group_files).length === 0) {
                        const name = runtimeData.jsonMap.group_files?.name
                        if(name) {
                            Connector.send(name, {
                                group_id: this.chat.show.id
                            }, 'getGroupFiles')
                        }
                    }
                }
            },

            /**
             * 根据 index 删除图片
             * @param { number } index 图片编号
             */
            deleteImg(index: number) {
                this.imgCache.splice(index, 1)
            },

            /**
             * 添加特殊消息结构
             * @param data obj
             */
            addSpecialMsg(data: SQCodeElem) {
                if (data !== undefined) {
                    const index = this.sendCache.length
                    this.sendCache.push(data.msgObj)
                    if (data.addText === true) {
                        if (data.addTop === true) {
                            this.msg = '[SQ:' + index + ']' + this.msg
                        } else {
                            this.msg += '[SQ:' + index + ']'
                        }
                    }
                    return index
                }
                return -1
            },

            /**
             * 添加图片缓存
             * @param event 事件
             */
            addImg(event: ClipboardEvent) {
                // 判断粘贴类型
                if (!(event.clipboardData && event.clipboardData.items)) {
                    return
                }
                for (
                    let i = 0, len = event.clipboardData.items.length;
                    i < len;
                    i++
                ) {
                    const item = event.clipboardData.items[i]
                    if (item.kind === 'file') {
                        this.setImg(item.getAsFile())
                        // 阻止默认行为
                        event.preventDefault()
                    }
                }
            },

            runSelectImg() {
                const input = document.getElementById('choice-pic')
                if (input) {
                    input.click()
                }
            },
            /**
             * 手动选择图片
             */
            selectImg(event: Event) {
                this.tags.showMoreDetail = false
                const sender = event.target as HTMLInputElement
                if (sender && sender.files) {
                    this.setImg(sender.files[0])
                }
            },

            runSelectFile() {
                const input = document.getElementById('choice-file')
                if (input) {
                    input.click()
                }
            },
            /**
             * 选择文件
             */
            selectFile(event: Event) {
                this.tags.showMoreDetail = false
                const sender = event.target as HTMLInputElement
                if (sender.files != null) {
                    const file = sender.files[0]
                    const fileName = file.name
                    const size = file.size
                    // 如果文件大于 1G，提醒一下
                    if (size > 1073741824) {
                        const popInfo = {
                            title: this.$t('提醒'),
                            html: `<span>${this.$t('文件大于 1GB。发送速度可能会非常缓慢；确认要发送吗？')}</span>`,
                            button: [
                                {
                                    text: this.$t('发送'),
                                    fun: () => {
                                        runtimeData.popBoxList.shift()
                                    },
                                },
                                {
                                    text: this.$t('取消'),
                                    master: true,
                                    fun: () => {
                                        runtimeData.popBoxList.shift()
                                    },
                                },
                            ],
                        }
                        runtimeData.popBoxList.push(popInfo)
                    } else {
                        this.sendFile(file, fileName)
                    }

                    // 清空 input
                    sender.value = ''
                }
            },
            sendFile(file: File, fileName: string | null) {
                // 将 file 转换为 base64
                const reader = new FileReader()
                    reader.readAsDataURL(file)
                    reader.onloadend = () => {
                        let base64data = reader.result as string
                        // 找到第一个逗号，截取后面的内容
                        base64data = base64data.substring(
                            base64data.indexOf('base64,') + 7,
                            base64data.length,
                        )
                        // 发送文件不能包含任何其他内容
                        this.sendCache = []
                        this.imgCache = []
                        this.msg = ''
                        this.addSpecialMsg({
                            addText: true,
                            msgObj: {
                                type: 'file',
                                file: 'base64://' + base64data,
                                name: fileName ?? this.$t('未知文件'),
                            },
                        })
                        // 直接触发发送消息
                        this.sendMsg('sendFileBack')
                        // 提示
                        const popInfo = {
                            title: this.$t('提醒'),
                            html: `<span>${this.$t('正在发送文件中……')}</span>`,
                            allowClose: false
                        }
                        runtimeData.popBoxList.push(popInfo)
                    }
            },

            /**
             * 将图片转换为 base64 并缓存
             * @param blob 文件对象
             */
            async setImg(blob: File | null) {
                const popInfo = new PopInfo()
                if (
                    blob !== null &&
                    blob.type.indexOf('image/') >= 0 &&
                    blob.size !== 0
                ) {
                    if (blob.size < 3145728) {
                        // 转换为 Base64
                        const reader = new FileReader()
                        reader.readAsDataURL(blob)
                        reader.onloadend = () => {
                            const base64data = reader.result as string
                            if (base64data !== null) {
                                if (Option.get('close_chat_pic_pan') === true) {
                                    // 在关闭图片插入面板的模式下将直接以 SQCode 插入输入框
                                    const data = {
                                        addText: true,
                                        msgObj: {
                                            type: 'image',
                                            file:
                                                'base64://' +
                                                base64data.substring(
                                                    base64data.indexOf(
                                                        'base64,',
                                                    ) + 7,
                                                    base64data.length,
                                                ),
                                        },
                                    }
                                    this.addSpecialMsg(data)
                                } else {
                                    // 记录图片信息
                                    // 只要你内存够猛，随便 cache 图片，这边就不做限制了
                                    this.imgCache.push(base64data)
                                }
                            }
                        }
                    } else {
                        // 压缩图片
                        const options = { maxSizeMB: 3, useWebWorker: true }
                        try {
                            popInfo.add(
                                PopType.INFO,
                                this.$t('正在压缩图片 ……'),
                            )
                            const compressedFile = await imageCompression(
                                blob,
                                options,
                            )
                            new Logger().add(
                                LogType.INFO,
                                '图片压缩成功，原大小：' +
                                    blob.size / 1024 / 1024 +
                                    ' MB，压缩后大小：' +
                                    compressedFile.size / 1024 / 1024 +
                                    ' MB',
                            )
                            this.setImg(compressedFile)
                        } catch (error) {
                            popInfo.add(PopType.INFO, this.$t('压缩图片失败'))
                        }
                    }
                }
            },

            /**
             * 将焦点移回主发送框
             * PS：我实在懒得再做一次回车发送了。所以当点击图片发送框的输入框后，焦点会被移动到主输入框上以方便回车发送
             */
            toMainInput() {
                const mainInput = document.getElementById('main-input')
                if (mainInput !== null) {
                    mainInput.focus()
                }
            },

            /**
             * 发送消息
             */
            sendMsg(echo = 'sendMsgBack') {
                // 在搜索消息的时候不允许发送消息
                if (this.details[3].open) {
                    return
                }
                // 关闭所有其他的已打开的更多功能弹窗
                this.details.forEach((item) => {
                    item.open = false
                })
                // 为了减少对于复杂图文排版页面显示上的工作量，对于非纯文本的消息依旧处理为纯文本，如：
                // "这是一段话 [SQ:0]，[SQ:1] 你要不要来试试 Stapxs QQ Lite？"
                // 其中 [SQ:n] 结构代表着这是特殊消息以及这个消息具体内容在消息缓存中的 index，像是这样：
                // sendCache = [{type:"face",id:11},{type:"at",qq:1007028430}]
                //               ^^^^^^^ 0 ^^^^^^^   ^^^^^^^^^^ 1 ^^^^^^^^^^
                // 在发送操作触发之后，将会解析此条字符串排列出最终需要发送的消息结构用于发送。
                const msg = SendUtil.parseMsg(
                    this.msg,
                    this.sendCache,
                    this.imgCache,
                )
                if (this.chat.show.temp) {
                    sendMsgRaw(
                        this.chat.show.id + '/' + this.chat.show.temp,
                        this.chat.show.type,
                        msg,
                        true,
                        echo,
                    )
                } else {
                    sendMsgRaw(
                        this.chat.show.id,
                        this.chat.show.type,
                        msg,
                        true,
                        echo,
                    )
                }
                // 发送后事务
                this.msg = ''
                this.sendCache = []
                this.imgCache = []
                this.scrollBottom()
                this.cancelReply()
            },

            updateList(newLength: number, oldLength: number) {
                // =================== 首次加载消息 ===================

                if (oldLength == 0 && newLength > 0) {
                    const name =
                        runtimeData.jsonMap.set_message_read?.name ?? undefined
                    let private_name =
                        runtimeData.jsonMap.set_message_read?.private_name ??
                        name
                    if (!private_name) private_name = name
                    // 设置最后一条消息以上都为已读
                    if (runtimeData.chatInfo.show.type == 'group') {
                        Connector.send(
                            name,
                            {
                                group_id: this.chat.show.id,
                                message_id:
                                    this.list[this.list.length - 1].message_id,
                            },
                            'setMessageRead',
                        )
                    } else {
                        Connector.send(
                            private_name,
                            {
                                user_id: this.chat.show.id,
                                message_id:
                                    this.list[this.list.length - 1].message_id,
                            },
                            'setMessageRead',
                        )
                    }
                    if(shouldAutoFocus()) {
                        // 将焦点移动到发送框
                        this.toMainInput()
                    }
                }

                // =================== 刷新统计数据 ===================

                // 判断新消息数量（回到底部按钮显示、不在加载历史消息、不是首次加载消息）
                if (
                    this.tags.showBottomButton &&
                    !this.tags.nowGetHistroy &&
                    oldLength > 0
                ) {
                    if (this.NewMsgNum !== 0) {
                        this.NewMsgNum =
                            this.NewMsgNum + Math.abs(newLength - oldLength)
                    } else {
                        this.NewMsgNum = Math.abs(newLength - oldLength)
                    }
                }
                // 清屏重新加载消息列表（超过 n 条消息、回到底部按钮不显示）
                // PS：也就是说只在消息底部时才会触发，以防止你是在看历史消息攒满了刷掉
                if (
                    this.list.length > 200 &&
                    !this.tags.nowGetHistroy &&
                    !this.tags.showBottomButton
                ) {
                    runtimeData.messageList = []
                    const info = {
                        type: this.chat.show.type,
                        id: this.chat.show.id,
                        name: this.chat.show.name,
                        avatar: this.chat.show.avatar,
                        jump: this.chat.show.jump,
                    } as BaseChatInfoElem
                    loadHistoryFirst(info)
                    this.tags.nowGetHistroy = true
                }

                // =================== 渲染监听操作 ===================

                const pan = document.getElementById('msgPan')
                if (pan !== null) {
                    // 渲染前的数据
                    const height = pan.scrollHeight
                    // const top = pan.scrollTop
                    // 渲染后操作
                    this.$nextTick(() => {
                        const newPan = document.getElementById('msgPan')
                        if (newPan !== null) {
                            // 加载历史记录锁定滚动条位置
                            if (this.tags.nowGetHistroy) {
                                this.scrollTo(
                                    newPan.scrollHeight - height,
                                    false,
                                )
                            }
                            // 新消息自动下滚（只要回到底部按钮没显示就算是在最底部、首次加载（不需要滚动动画））
                            if (!this.tags.nowGetHistroy) {
                                if (!this.tags.showBottomButton) {
                                    this.scrollTo(newPan.scrollHeight)
                                }
                                if (oldLength <= 0) {
                                    this.scrollTo(newPan.scrollHeight, false)
                                }
                            }
                            // 解除锁定加载
                            this.tags.nowGetHistroy = false
                        }
                        // 刷新图片列表
                        // TODO: 需要优化性能
                        let initMainList = false
                        if (this.getImgList.length == 0) initMainList = true
                        this.getImgList = []
                        this.list.forEach((item: any) => {
                            if (item.message !== undefined) {
                                item.message.forEach((msg: MsgItemElem) => {
                                    if (
                                        msg.type === 'image' &&
                                        msg.file != 'marketface'
                                    ) {
                                        const info = {
                                            index: item.message_id,
                                            message_id: item.message_id,
                                            img_url: backend.proxyUrl(msg.url)
                                        }
                                        this.getImgList.push(info)
                                    }
                                })
                            }
                        })
                        const viewer = app.config.globalProperties.$viewer
                        if (!viewer.isShown || initMainList) {
                            runtimeData.chatInfo.info.image_list =
                                this.getImgList
                        }
                        // 处理跳入跳转预设
                        // 如果 jump 参数不是 undefined，则意味着这次加载历史记录的同时需要跳转到指定的消息
                        if (
                            runtimeData.chatInfo.show &&
                            runtimeData.chatInfo.show.jump
                        ) {
                            new Logger().debug(
                                '进入跳转至消息：' +
                                    runtimeData.chatInfo.show.jump,
                            )
                            this.scrollToMsg(
                                'chat-' + runtimeData.chatInfo.show.jump,
                            )
                            runtimeData.chatInfo.show.jump = undefined
                        }
                    })
                }
            },

            msgClick(_: Event, data: any) {
                const message_id = data.message_id
                if (this.multipleSelectList.length > 0) {
                    if (this.multipleSelectList.indexOf(message_id) > -1) {
                        this.multipleSelectList =
                            this.multipleSelectList.filter((item) => {
                                return item != message_id
                            })
                    } else {
                        this.multipleSelectList.push(message_id)
                    }
                }
            },

            delMsgs() {
                new PopInfo().add(
                    PopType.INFO,
                    this.$t('欸嘿，这个按钮只是用来占位置的'),
                )
            },

            copyMsgs() {
                const msgList = this.list.filter((item: any) => {
                    return this.multipleSelectList.indexOf(item.message_id) > -1
                })
                let msg = ''
                let lastDate = ''
                msgList.forEach((item: any) => {
                    // 去除 item.time 时间戳中的时间，只保留日期
                    const time = new Date(getViewTime(item.time))
                    const date =
                        time.getFullYear() +
                        '-' +
                        (time.getMonth() + 1) +
                        '-' +
                        time.getDate()
                    if (date != lastDate) {
                        msg += '\n—— ' + date + ' ——\n'
                        lastDate = date
                    }
                    msg +=
                        item.sender.nickname +
                        ' ' +
                        time.getHours() +
                        ':' +
                        time.getMinutes() +
                        ':' +
                        time.getSeconds() +
                        '\n' +
                        getMsgRawTxt(item) +
                        '\n\n'
                })
                const popInfo = new PopInfo()
                app.config.globalProperties.$copyText(msg).then(
                    () => {
                        popInfo.add(PopType.INFO, this.$t('复制成功'), true)
                        this.multipleSelectList = []
                    },
                    () => {
                        popInfo.add(PopType.ERR, this.$t('复制失败'), true)
                    },
                )
            },

            /**
             * 获取显示群精华消息
             */
            showJin() {
                this.details[2].open = !this.details[2].open
                if (runtimeData.chatInfo.info.jin_info.list.length == 0) {
                    // `https://qun.qq.com/cgi-bin/group_digest/digest_list?bkn=${runtimeData.loginInfo.bkn}&group_code=${this.chat.show.id}&page_start=0&page_limit=40`
                    const name =
                        runtimeData.jsonMap.group_essence.name ??
                        'get_essence_msg_list'
                    Connector.send(
                        name,
                        {
                            group_id: this.chat.show.id,
                            pages: 0,
                        },
                        'getJin',
                    )
                }
                this.tags.showMoreDetail = !this.tags.showMoreDetail
            },

            searchMessage(event: Event) {
                if (this.details[3].open) {
                    const value = (event.target as HTMLInputElement).value
                    if (value.length == 0) {
                        this.tags.search.list = reactive(this.list)
                    } else if (value.length > 0) {
                        this.tags.search.list = this.list.filter(
                            (item: any) => {
                                const rawMessage = getMsgRawTxt(item)
                                return rawMessage.indexOf(value) !== -1
                            },
                        )
                    }
                }
            },
            openSearch() {
                this.details[3].open = !this.details[3].open
                this.tags.showMoreDetail = !this.tags.showMoreDetail
            },
            closeSearch() {
                this.details[3].open = !this.details[3].open
                this.msg = ''
                this.tags.search.list = reactive(this.list)
            },

            /**
             * 发送戳一戳
             */
            sendPoke(user_id: number) {
                if (runtimeData.jsonMap.poke) {
                    let name = runtimeData.jsonMap.poke.name
                    if (
                        this.chat.show.type == 'user' &&
                        runtimeData.jsonMap.poke.private_name
                    ) {
                        name = runtimeData.jsonMap.poke.private_name
                    }
                    Connector.send(
                        name,
                        {
                            user_id: user_id,
                            group_id: this.chat.show.id,
                        },
                        'sendPoke',
                    )
                }
                this.tags.showMoreDetail = false
                this.tags.menuDisplay.poke = false
            },

            /**
             * 精华消息滚动事件
             */
            jinScroll(event: Event) {
                const body = event.target as HTMLDivElement
                // 滚动到底部，加载更多
                if (
                    body.scrollTop + body.clientHeight === body.scrollHeight &&
                    !this.tags.isJinLoading
                ) {
                    if (this.chat.info.jin_info.is_end == false) {
                        this.tags.isJinLoading = true
                        const name =
                            runtimeData.jsonMap.group_essence.name ??
                            'get_essence_msg_list'
                        Connector.send(
                            name,
                            {
                                group_id: this.chat.show.id,
                                pages: this.chat.info.jin_info.pages + 1,
                            },
                            'getJin',
                        )
                    }
                }
            },

            /**
             * 更多功能按钮被点击
             */
            moreFunClick(type = 'default') {
                let hasOpen = false
                // 关闭所有其他的已打开的更多功能弹窗
                this.details.forEach((item) => {
                    if (item.open) hasOpen = true
                    item.open = false
                })
                // 如果有关闭操作，就不打开更多功能菜单
                if (hasOpen) return

                // 如果更多功能菜单已经打开，则关闭
                if (this.tags.showMoreDetail) {
                    this.tags.showMoreDetail = false
                    return
                }

                // 打开指定的更多功能菜单
                switch(type) {
                    case 'default': this.tags.showMoreDetail = true; break
                    case 'img': this.runSelectImg(); break
                    case 'file': this.runSelectFile(); break
                    case 'face': this.details[1].open = !this.details[1].open; break
                }
            },

            openLeftBar() {
                runtimeData.tags.openSideBar = !runtimeData.tags.openSideBar
            },

            //#region == 窗口移动相关 ==================================================
            // 滚轮滑动
            chatWheelEvent(event: WheelEvent) {
                const process = (event: WheelEvent) => {
                    // 正在触屏,不处理
                    if (this.tags.chatMove.onScroll === 'touch') return false
                    const x = event.deltaX
                    const y = event.deltaY
                    const absX = Math.abs(x)
                    const absY = Math.abs(y)
                    // 斜度过大
                    if (absY !== 0 && absX / absY < 2) return false
                    this.dispenseMove('wheel', -x / 3)
                    return true
                }
                if (!process(event)) return
                event.preventDefault()
                // 创建遮罩
                // 由于在窗口移动中,窗口判定箱也在移动,当指针不再窗口外,事件就断了
                // 所以要创建一个不会动的全局遮罩来处理
                wheelMask(process,()=>{
                    this.dispenseMove('wheel', 0, true)
                })
            },

            // 触屏开始
            chatMoveStartEvent(event: TouchEvent) {
                if (this.tags.chatMove.onScroll === 'wheel') return
                // 触屏开始时，记录触摸点
                this.tags.chatMove.touchLast = event
            },

            // 触屏滑动
            chatMoveEvent(event: TouchEvent) {
                if (this.tags.chatMove.onScroll === 'wheel') return
                if (!this.tags.chatMove.touchLast) return
                const touch = event.changedTouches[0]
                const lastTouch = this.tags.chatMove.touchLast.changedTouches[0]
                const deltaX = touch.clientX - lastTouch.clientX
                const deltaY = touch.clientY - lastTouch.clientY
                const absX = Math.abs(deltaX)
                const absY = Math.abs(deltaY)
                // 斜度过大
                if (absY !== 0 && absX / absY < 2) return
                // 触屏移动
                this.tags.chatMove.touchLast = event
                this.dispenseMove('touch', deltaX)
            },

            // 触屏滑动结束
            chatMoveEndEvent(event: TouchEvent) {
                if (this.tags.chatMove.onScroll === 'wheel') return
                const touch = event.changedTouches[0]
                const lastTouch = this.tags.chatMove.touchLast?.changedTouches[0]
                if (lastTouch) {
                    const deltaX = touch.clientX - lastTouch.clientX
                    const deltaY = touch.clientY - lastTouch.clientY
                    const absX = Math.abs(deltaX)
                    const absY = Math.abs(deltaY)
                    // 斜度过大
                    if (absY === 0 || absX / absY > 2) {
                        this.dispenseMove('touch', deltaX)
                    }
                }
                this.dispenseMove('touch', 0, true)
                this.tags.chatMove.touchLast = null
            },
            /**
             * 分发触屏/滚轮情况
             */
            dispenseMove(type: 'touch' | 'wheel', value: number, end: boolean = false) {
                if (!end && this.tags.chatMove.onScroll === 'none') this.startMove(type, value)
                if (this.tags.chatMove.onScroll === 'none') return
                if (end) this.endMove()
                else this.keepMove(value)
            },
            /**
             * 开始窗口移动
             */
            startMove(type: 'touch' | 'wheel', value: number) {
                // 移除不需要的css
                const target = this.getTargetWin()
                if (!target) return
                target.style.transition = 'all 0s'
                // 禁用滚动
                const chatPan = document.getElementById('chat-pan')
                if (!chatPan) return
                const chat = chatPan.getElementsByClassName('chat')[0] as HTMLDivElement
                if(chat) {
                    chat.style.overflowY = 'hidden'
                }
                this.tags.chatMove.onScroll = type
                this.tags.chatMove.move = value
                this.tags.chatMove.lastTime = Date.now()
            },
            /**
             * 保持窗口移动
             */
            keepMove(value: number){
                this.tags.chatMove.move += value
                const nowDate = Date.now()
                if (!this.tags.chatMove.lastTime) return
                const deltaTime = nowDate - this.tags.chatMove.lastTime
                this.tags.chatMove.lastTime = nowDate
                this.tags.chatMove.speedList.push(
                    value / deltaTime
                )
                if (this.tags.chatMove.move < 0) this.tags.chatMove.move = 0
                const move = this.tags.chatMove.move
                const target = this.getTargetWin()
                if (!target) return
                target.style.transform = 'translateX(' + move + 'px)'
            },
            /**
             * 结束窗口移动
             */
            endMove() {
                // 保留自己要的数据
                const move = this.tags.chatMove.move
                const speedList = this.tags.chatMove.speedList
                // 重置数据
                this.tags.chatMove.onScroll = 'none'
                this.tags.chatMove.lastTime = 0
                this.tags.chatMove.speedList = []
                this.tags.chatMove.move = 0
                // 复原css
                const chatPan = document.getElementById('chat-pan')
                const chat = chatPan?.getElementsByClassName('chat')[0] as HTMLDivElement
                if(chat) {
                    chat.style.overflowY = 'scroll'
                }
                const target = this.getTargetWin()
                if (!target) return
                target.style.transition = 'transform 0.3s'
                target.style.transform = ''
                // 移动距离大小判定
                const width = target.offsetWidth
                // 如果移动距离大于屏幕宽度的三分之一，视为关闭
                if (move > width / 3) {
                    return this.exitWin()
                }
                // 末端速度法
                // 防止误触
                if (move < runtimeData.inch * 0.5) return
                const endSpeedList = speedList.reverse().slice(0, 10)
                let endSpeed = 0
                for (const speed of endSpeedList) {
                    endSpeed += speed
                }
                endSpeed /= endSpeedList.length
                endSpeed /= runtimeData.inch
                // 如果末端速度大于 5，则视为关闭
                if (endSpeed > 5) {
                    return this.exitWin()
                }
            },
            //#endregion
            /**
             * 得到焦点窗口
             */
            getTargetWin(): HTMLDivElement | undefined {
                const chatPan = document.getElementById('chat-pan')
                if (!chatPan) return
                const mergePan = this.$refs.mergePan as InstanceType<typeof MergePan>
                if(this.tags.openChatInfo) {
                    // 聊天信息面板返回
                    return chatPan.getElementsByClassName('chat-info-pan')[0] as HTMLDivElement
                } else if(mergePan?.isMergeOpen()) {
                    // 合并转发面板返回
                    return chatPan.getElementsByClassName('merge-pan')[0] as HTMLDivElement
                } else {
                    // 聊天面板底层返回
                    return chatPan as HTMLDivElement
                }
            },
            /**
             * 退出一层窗口
             */
            exitWin() {
                const mergePan = this.$refs.mergePan as InstanceType<typeof MergePan>
                if(this.tags.openChatInfo) {
                    // 会话信息栏
                    this.openChatInfoPan()
                } else if(mergePan?.isMergeOpen()) {
                    // 合并转发栏
                    mergePan?.closeMergeMsg()
                    setTimeout(() => {
                        const chatPan = document.getElementById('chat-pan')
                        const mergePan = chatPan!.getElementsByClassName('merge-pan')[0] as HTMLDivElement
                        if(mergePan) {
                            mergePan.style.transform = ''
                        }
                    }, 500)
                } else {
                    // 自身
                    runtimeData.chatInfo.show.id = 0
                    runtimeData.tags.openSideBar = true
                    new Logger().add(LogType.UI, '右滑打开侧边栏触发完成')
                }
            },
        },
    })
</script>

<style scoped>
    /* 消息动画 */
    .msglist-move {
        transition: all 0.3s;
    }

    .msglist-enter-active {
        transition: all 0.4s;
    }

    .msglist-leave-active {
        transition: all 0.2s;
    }

    .msglist-enter-from {
        transform: translateX(-20px);
        opacity: 0;
    }

    .msglist-leave-to {
        opacity: 0;
    }

    /* 更多功能面板动画 */
    .pan-enter-active,
    .pan-leave-active {
        transition: opacity 0.3s;
    }

    .pan-enter-from {
        transform: translateX(20px);
        opacity: 0;
    }

    .pan-leave-to {
        opacity: 0;
    }
</style>
