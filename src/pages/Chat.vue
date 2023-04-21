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
    <div
        :style="`background-image: url(${runtimeData.sysConfig.chat_background})`"
        :class="'chat-pan' + (runtimeData.tags.openSideBar ? ' open': '') + (runtimeData.sysConfig.opt_no_window ? ' withBar': '')"
        id="chat-pan">        
        <!-- 聊天基本信息 -->
        <div class="info">
            <img :src="chat.show.avatar">
            <div>
                <p>{{ chat.show.name }}</p>
                <span v-if="chat.show.temp">
                    {{ $t('chat_temp_from', { group: chat.show.temp }) }}
                </span>
                <span v-else>
                    {{ list[list.length - 1] ? $t('chat_last_msg', {
                            time: Intl.DateTimeFormat(trueLang,
                                { hour: "numeric", minute: "numeric", second: "numeric" }).format(new Date(list[list.length - 1].time *
                                    1000))
                        }) : $t('chat_no_msg')
                    }}
                </span>
            </div>
            <div></div>
            <div>
                <svg @click="openChatInfoPan" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 512">
                    <path
                        d="M64 360c30.9 0 56 25.1 56 56s-25.1 56-56 56s-56-25.1-56-56s25.1-56 56-56zm0-160c30.9 0 56 25.1 56 56s-25.1 56-56 56s-56-25.1-56-56s25.1-56 56-56zM120 96c0 30.9-25.1 56-56 56S8 126.9 8 96S33.1 40 64 40s56 25.1 56 56z" />
                </svg>
            </div>
        </div>
        <!-- 加载中指示器 -->
        <div :class="'loading' + (tags.nowGetHistroy && runtimeData.tags.canLoadHistory ? ' show': '')">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M304 48c0-26.5-21.5-48-48-48s-48 21.5-48 48s21.5 48 48 48s48-21.5 48-48zm0 416c0-26.5-21.5-48-48-48s-48 21.5-48 48s21.5 48 48 48s48-21.5 48-48zM48 304c26.5 0 48-21.5 48-48s-21.5-48-48-48s-48 21.5-48 48s21.5 48 48 48zm464-48c0-26.5-21.5-48-48-48s-48 21.5-48 48s21.5 48 48 48s48-21.5 48-48zM142.9 437c18.7-18.7 18.7-49.1 0-67.9s-49.1-18.7-67.9 0s-18.7 49.1 0 67.9s49.1 18.7 67.9 0zm0-294.2c18.7-18.7 18.7-49.1 0-67.9S93.7 56.2 75 75s-18.7 49.1 0 67.9s49.1 18.7 67.9 0zM369.1 437c18.7 18.7 49.1 18.7 67.9 0s18.7-49.1 0-67.9s-49.1-18.7-67.9 0s-18.7 49.1 0 67.9z"/></svg>
            <span>加载中</span>
        </div>
        <!-- 消息显示区 -->
        <div class="chat" @scroll="chatScroll" id="msgPan" style="scroll-behavior: smooth;">
            <div class="note note-nomsg" v-if="!runtimeData.tags.canLoadHistory">
                <hr>
                <a>{{ $t('chat_no_more_msg') }}</a>
            </div>
            <!-- 时间戳，在下滑加载的时候会显示，方便在大段的相连消息上让用户知道消息时间 -->
            <NoticeBody v-if="tags.nowGetHistroy" :data="{sub_type: 'time', time: list[0].time}"></NoticeBody>
            <TransitionGroup name="msglist" tag="div">
                <template v-for="(msg, index) in list">
                    <!-- 时间戳 -->
                    <NoticeBody v-if="isShowTime((list[index - 1] ? list[index - 1].time : undefined), msg.time)" :key="'notice-time-' + index" :data="{sub_type: 'time', time: msg.time}"></NoticeBody>
                    <!-- 消息体 -->
                    <MsgBody
                        v-if="msg.post_type === 'message'"
                        :key="msg.message_id"
                        :data="msg"
                        @scrollToMsg="scrollToMsg"
                        @contextmenu.prevent="showMsgMeun($event, msg)"
                        @scrollButtom="imgLoadedScroll"
                        @touchstart="msgStartMove($event, msg)"
                        @touchmove="msgOnMove"
                        @touchend="msgMoveEnd($event, msg)">
                    </MsgBody>
                    <!-- 其他通知消息 -->
                    <NoticeBody v-if="msg.post_type === 'notice'" :key="'notice-' + index" :data="msg"></NoticeBody>
                </template> 
            </TransitionGroup>
        </div>
        <!-- 滚动到底部悬浮标志 -->
        <div class="new-msg" v-show="tags.showBottomButton" @click="scrollBottom(true)">
            <div class="ss-card">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                    <path
                        d="M256 32C114.6 32 .0272 125.1 .0272 240c0 49.63 21.35 94.98 56.97 130.7c-12.5 50.37-54.27 95.27-54.77 95.77c-2.25 2.25-2.875 5.734-1.5 8.734C1.979 478.2 4.75 480 8 480c66.25 0 115.1-31.76 140.6-51.39C181.2 440.9 217.6 448 256 448c141.4 0 255.1-93.13 255.1-208S397.4 32 256 32z" />
                </svg>
                <span v-if="NewMsgNum > 0">{{ NewMsgNum }}</span>
            </div>
        </div>
        <!-- 底部区域 -->
        <div class="more" id="send-more">
            <!-- 功能附加 -->
            <div>
                <div>
                    <!-- 表情面板 -->
                    <Transition name="pan">
                        <FacePan v-show="details[1].open" @addSpecialMsg="addSpecialMsg"></FacePan>
                    </Transition>
                    <!-- 精华消息 -->
                    <Transition name="pan">
                        <div v-show="details[2].open && runtimeData.chatInfo.info.jin_info && runtimeData.chatInfo.info.jin_info.data.msg_list" class="ss-card jin-pan">
                            <div>
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" style="margin-top: 5px;"><path d="M511.1 63.1v287.1c0 35.25-28.75 63.1-64 63.1h-144l-124.9 93.68c-7.875 5.75-19.12 .0497-19.12-9.7v-83.98h-96c-35.25 0-64-28.75-64-63.1V63.1c0-35.25 28.75-63.1 64-63.1h384C483.2 0 511.1 28.75 511.1 63.1z"></path></svg>
                                <span>{{ $t('chat_fun_menu_jin') }}</span>
                                <svg @click="details[2].open = !details[2].open" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512"><path d="M310.6 361.4c12.5 12.5 12.5 32.75 0 45.25C304.4 412.9 296.2 416 288 416s-16.38-3.125-22.62-9.375L160 301.3L54.63 406.6C48.38 412.9 40.19 416 32 416S15.63 412.9 9.375 406.6c-12.5-12.5-12.5-32.75 0-45.25l105.4-105.4L9.375 150.6c-12.5-12.5-12.5-32.75 0-45.25s32.75-12.5 45.25 0L160 210.8l105.4-105.4c12.5-12.5 32.75-12.5 45.25 0s12.5 32.75 0 45.25l-105.4 105.4L310.6 361.4z"></path></svg>
                            </div>
                            <div class="jin-pan-body" @scroll="jinScroll">
                                <div v-for="(item, index) in runtimeData.chatInfo.info.jin_info ? 
                                        runtimeData.chatInfo.info.jin_info.data.msg_list : []"
                                    :key="'jin-' + index">
                                    <div>
                                        <img :src="`https://q1.qlogo.cn/g?b=qq&s=0&nk=${item.sender_uin}`">
                                        <div>
                                            <a>{{ item.sender_nick }}</a>
                                            <span>{{ Intl.DateTimeFormat(trueLang,
                                                { hour: "numeric", minute: "numeric" })
                                                .format(new Date(item.sender_time * 1000)) }} {{ $t('chat_send') }}</span>
                                        </div>
                                    </div>
                                    <div class="context">
                                        <template v-for="(context, indexc) in item.msg_content"
                                            :key="'jinc-' + index + '-' + indexc">
                                            <span v-if="context.msg_type === 1">{{ context.text }}</span>
                                            <img v-if="context.msg_type === 2" class="face" :src="require('./../assets/img/qq-face/' + context.face_index + '.gif')">
                                            <img v-if="context.msg_type === 3" :src="context.image_url">
                                        </template>
                                    </div>
                                    <span>{{ $t('chat_fun_menu_jin_sender',
                                     { time: Intl.DateTimeFormat(trueLang,
                                                { hour: "numeric", minute: "numeric" })
                                                .format(new Date(item.add_digest_time * 1000)),name: item.add_digest_nick }) }}</span>
                                </div>
                                <div class="jin-pan-load" v-show="tags.isJinLoading">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M120 256c0 30.9-25.1 56-56 56s-56-25.1-56-56s25.1-56 56-56s56 25.1 56 56zm160 0c0 30.9-25.1 56-56 56s-56-25.1-56-56s25.1-56 56-56s56 25.1 56 56zm104 56c-30.9 0-56-25.1-56-56s25.1-56 56-56s56 25.1 56 56s-25.1 56-56 56z"></path></svg>
                                </div>
                            </div>
                        </div>
                    </Transition>
                </div>
                <!-- 回复指示器 -->
                <div :class="tags.isReply ? 'replay-tag show' : 'replay-tag'">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                        <path
                            d="M8.31 189.9l176-151.1c15.41-13.3 39.69-2.509 39.69 18.16v80.05C384.6 137.9 512 170.1 512 322.3c0 61.44-39.59 122.3-83.34 154.1c-13.66 9.938-33.09-2.531-28.06-18.62c45.34-145-21.5-183.5-176.6-185.8v87.92c0 20.7-24.31 31.45-39.69 18.16l-176-151.1C-2.753 216.6-2.784 199.4 8.31 189.9z">
                        </path>
                    </svg>
                    <span>{{ selectedMsg === null ? '' : (selectedMsg.sender.nickname + ': ' + selectedMsg.raw_message)
                    }}</span>
                    <div @click="cancelReply"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512">
                            <path
                                d="M310.6 361.4c12.5 12.5 12.5 32.75 0 45.25C304.4 412.9 296.2 416 288 416s-16.38-3.125-22.62-9.375L160 301.3L54.63 406.6C48.38 412.9 40.19 416 32 416S15.63 412.9 9.375 406.6c-12.5-12.5-12.5-32.75 0-45.25l105.4-105.4L9.375 150.6c-12.5-12.5-12.5-32.75 0-45.25s32.75-12.5 45.25 0L160 210.8l105.4-105.4c12.5-12.5 32.75-12.5 45.25 0s12.5 32.75 0 45.25l-105.4 105.4L310.6 361.4z">
                            </path>
                        </svg></div>
                </div>
                <!-- At 指示器 -->
                <div :class="atFindList != null ? 'at-tag show' : 'at-tag'" contenteditable="true" @blur="choiceAt(undefined)">
                    <div v-for="item in (atFindList != null ? atFindList : [])"
                        :key="'atFind-' + item.user_id"
                        @click="choiceAt(item.user_id)">
                        <img :src="'https://q1.qlogo.cn/g?b=qq&s=0&nk=' + item.user_id">
                        <span>{{ item.card != '' ? item.card : item.nickname }}</span>
                        <a>{{ item.user_id }}</a>
                    </div>
                    <div v-if="atFindList?.length == 0" class="emp">
                        <span>{{ $t('chat_fun_at_find_emp') }}</span>
                    </div>
                </div>
                <!-- 更多功能 -->
                <div :class="tags.showMoreDetail ? 'more-detail show' : 'more-detail'">
                    <div :title="$t('chat_fun_menu_pic')" @click="runSelectImg">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M0 96C0 60.7 28.7 32 64 32H448c35.3 0 64 28.7 64 64V416c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64V96zM323.8 202.5c-4.5-6.6-11.9-10.5-19.8-10.5s-15.4 3.9-19.8 10.5l-87 127.6L170.7 297c-4.6-5.7-11.5-9-18.7-9s-14.2 3.3-18.7 9l-64 80c-5.8 7.2-6.9 17.1-2.9 25.4s12.4 13.6 21.6 13.6h96 32H424c8.9 0 17.1-4.9 21.2-12.8s3.6-17.4-1.4-24.7l-120-176zM112 192c26.5 0 48-21.5 48-48s-21.5-48-48-48s-48 21.5-48 48s21.5 48 48 48z"/></svg>
                        <input id="choice-pic" type="file" style="display: none;" @change="selectImg">
                    </div>
                    <div :title="$t('chat_fun_menu_file')" @click="runSelectFile">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M64 480H448c35.3 0 64-28.7 64-64V160c0-35.3-28.7-64-64-64H288c-10.1 0-19.6-4.7-25.6-12.8L243.2 57.6C231.1 41.5 212.1 32 192 32H64C28.7 32 0 60.7 0 96V416c0 35.3 28.7 64 64 64z"/></svg>
                        <input id="choice-file" type="file" style="display: none;" @change="selectFile">
                    </div>
                    <div :title="$t('chat_fun_menu_face')"
                        @click="details[1].open = !details[1].open, tags.showMoreDetail = false">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                            <path
                                d="M0 256C0 114.6 114.6 0 256 0C397.4 0 512 114.6 512 256C512 397.4 397.4 512 256 512C114.6 512 0 397.4 0 256zM256 432C332.1 432 396.2 382 415.2 314.1C419.1 300.4 407.8 288 393.6 288H118.4C104.2 288 92.92 300.4 96.76 314.1C115.8 382 179.9 432 256 432V432zM176.4 160C158.7 160 144.4 174.3 144.4 192C144.4 209.7 158.7 224 176.4 224C194 224 208.4 209.7 208.4 192C208.4 174.3 194 160 176.4 160zM336.4 224C354 224 368.4 209.7 368.4 192C368.4 174.3 354 160 336.4 160C318.7 160 304.4 174.3 304.4 192C304.4 209.7 318.7 224 336.4 224z" />
                        </svg>
                    </div>
                    <div :title="$t('chat_fun_menu_jin')" v-if="chat.show.type === 'group'" @click="showJin">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path d="M316.9 18C311.6 7 300.4 0 288.1 0s-23.4 7-28.8 18L195 150.3 51.4 171.5c-12 1.8-22 10.2-25.7 21.7s-.7 24.2 7.9 32.7L137.8 329 113.2 474.7c-2 12 3 24.2 12.9 31.3s23 8 33.8 2.3l128.3-68.5 128.3 68.5c10.8 5.7 23.9 4.9 33.8-2.3s14.9-19.3 12.9-31.3L438.5 329 542.7 225.9c8.6-8.5 11.7-21.2 7.9-32.7s-13.7-19.9-25.7-21.7L381.2 150.3 316.9 18z"/></svg>
                    </div>
                </div>
            </div>
            <!-- 消息发送框 -->
            <div>
                <div @click="moreFunClick">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
                        <path
                            d="M432 256c0 17.69-14.33 32.01-32 32.01H256v144c0 17.69-14.33 31.99-32 31.99s-32-14.3-32-31.99v-144H48c-17.67 0-32-14.32-32-32.01s14.33-31.99 32-31.99H192v-144c0-17.69 14.33-32.01 32-32.01s32 14.32 32 32.01v144h144C417.7 224 432 238.3 432 256z" />
                    </svg>
                </div>
                <div>
                    <form @submit.prevent="mainSubmit">
                        <input
                            v-if="!Option.get('use_breakline')"
                            id="main-input"
                            type="text"
                            v-model="msg"
                            autocomplete="off"
                            :disabled="runtimeData.tags.openSideBar"
                            @paste="addImg"
                            @keyup="mainKeyUp"
                            @click="selectSQIn()">
                        <textarea
                            v-else
                            id="main-input"
                            type="text"
                            v-model="msg"
                            :disabled="runtimeData.tags.openSideBar"
                            @paste="addImg"
                            @keydown="mainKey"
                            @keyup="mainKeyUp"
                            @click="selectSQIn()">
                        </textarea>
                    </form>
                    <div @click="sendMsg">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 512">
                            <path
                                d="M64 448c-8.188 0-16.38-3.125-22.62-9.375c-12.5-12.5-12.5-32.75 0-45.25L178.8 256L41.38 118.6c-12.5-12.5-12.5-32.75 0-45.25s32.75-12.5 45.25 0l160 160c12.5 12.5 12.5 32.75 0 45.25l-160 160C80.38 444.9 72.19 448 64 448z" />
                        </svg>
                    </div>
                </div>
            </div>
            <div></div>
        </div>
        <!-- 合并转发消息预览器 -->
        <div :class="mergeList.length > 0 ? 'merge-pan show' : 'merge-pan'">
            <div @click="closeMergeMsg"></div>
            <div class="ss-card">
                <div>
                    <svg style="margin-top: 5px;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                        <path
                            d="M511.1 63.1v287.1c0 35.25-28.75 63.1-64 63.1h-144l-124.9 93.68c-7.875 5.75-19.12 .0497-19.12-9.7v-83.98h-96c-35.25 0-64-28.75-64-63.1V63.1c0-35.25 28.75-63.1 64-63.1h384C483.2 0 511.1 28.75 511.1 63.1z" />
                    </svg>
                    <span>{{ $t('chat_merge_msg') }}</span>
                    <svg @click="closeMergeMsg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512">
                        <path
                            d="M310.6 361.4c12.5 12.5 12.5 32.75 0 45.25C304.4 412.9 296.2 416 288 416s-16.38-3.125-22.62-9.375L160 301.3L54.63 406.6C48.38 412.9 40.19 416 32 416S15.63 412.9 9.375 406.6c-12.5-12.5-12.5-32.75 0-45.25l105.4-105.4L9.375 150.6c-12.5-12.5-12.5-32.75 0-45.25s32.75-12.5 45.25 0L160 210.8l105.4-105.4c12.5-12.5 32.75-12.5 45.25 0s12.5 32.75 0 45.25l-105.4 105.4L310.6 361.4z" />
                    </svg>
                </div>
                <div>
                    <template v-for="(msg, index) in mergeList"
                        :key="'merge-' + index">
                        <NoticeBody
                            v-if="isShowTime((mergeList[index - 1] ? mergeList[index - 1].time : undefined), msg.time, index == 0)"
                            :key="'notice-time-' + index"
                            :data="{sub_type: 'time', time: msg.time}">
                        </NoticeBody>
                        <!-- 合并转发消息忽略是不是自己的判定 -->
                        <MsgBody :data="msg" :type="'merge'"></MsgBody>
                    </template>
                </div>
            </div>
        </div>
        <!-- At 信息悬浮窗 -->
        <div class="mumber-info">
            <div v-if="Object.keys(mumberInfo).length > 0 && mumberInfo.error === undefined" class="ss-card"
                :style="getPopPost()">
                <img :src="'https://q1.qlogo.cn/g?b=qq&s=0&nk=' + mumberInfo.user_id">
                <div>
                    <span name="id">{{ mumberInfo.user_id }}</span>
                    <div>
                        <a>{{ mumberInfo.card == '' ? mumberInfo.nickname : mumberInfo.card }}</a>
                        <div>
                            <span v-if="mumberInfo.role !== 'member'">
                                {{ $t('chat_member_type_' + mumberInfo.role) }}
                            </span>
                            <span>Lv {{ mumberInfo.level }}</span>
                        </div>
                    </div>
                    <span> {{ $t('chat_join_time', {
                            time: Intl.DateTimeFormat(trueLang,
                                { year: 'numeric', month: "short", day: "numeric" }).format(new Date(mumberInfo.join_time * 1000))
                        })
                    }}
                    </span>
                </div>
            </div>
        </div>
        <!-- 消息右击菜单 -->
        <div :class="'msg-menu' + (runtimeData.sysConfig.opt_no_window ? ' withBar': '')">
            <div v-show="tags.showMsgMenu" class="msg-menu-bg" @click="closeMsgMenu"></div>
            <div :class="tags.showMsgMenu ? 'ss-card msg-menu-body show' : 'ss-card msg-menu-body'" id="msgMenu">
                <div @click="replyMsg(true)" v-show="tags.menuDisplay.relpy">
                    <div><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M511.1 63.1v287.1c0 35.25-28.75 63.1-64 63.1h-144l-124.9 93.68c-7.875 5.75-19.12 .0497-19.12-9.7v-83.98h-96c-35.25 0-64-28.75-64-63.1V63.1c0-35.25 28.75-63.1 64-63.1h384C483.2 0 511.1 28.75 511.1 63.1z"/></svg></div>
                    <a>{{ $t('chat_msg_menu_reply') }}</a>
                </div>
                <div @click="tags.showForwardPan = true" v-show="tags.menuDisplay.forward">
                   <div><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M503.7 226.2l-176 151.1c-15.38 13.3-39.69 2.545-39.69-18.16V272.1C132.9 274.3 66.06 312.8 111.4 457.8c5.031 16.09-14.41 28.56-28.06 18.62C39.59 444.6 0 383.8 0 322.3c0-152.2 127.4-184.4 288-186.3V56.02c0-20.67 24.28-31.46 39.69-18.16l176 151.1C514.8 199.4 514.8 216.6 503.7 226.2z"/></svg></div>
                   <a>{{ $t('chat_msg_menu_forward') }}</a>
                </div>
                <!-- <div v-show="tags.menuDisplay.select">
           <div><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512"><path d="M23.19 32C28.86 32 34.34 34.08 38.59 37.86L312.6 281.4C317.3 285.6 320 291.6 320 297.9C320 310.1 310.1 320 297.9 320H179.8L236.6 433.7C244.5 449.5 238.1 468.7 222.3 476.6C206.5 484.5 187.3 478.1 179.4 462.3L121.2 346L38.58 440.5C34.4 445.3 28.36 448 22.01 448C9.855 448 0 438.1 0 425.1V55.18C0 42.38 10.38 32 23.18 32H23.19z"/></svg></div>
           <a>{{ $t('chat_msg_menu_multiple_choice') }}</a>
        </div> -->
                <div @click="copyMsg" v-show="tags.menuDisplay.copy">
                    <div><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><path d="M336 64h-53.88C268.9 26.8 233.7 0 192 0S115.1 26.8 101.9 64H48C21.5 64 0 85.48 0 112v352C0 490.5 21.5 512 48 512h288c26.5 0 48-21.48 48-48v-352C384 85.48 362.5 64 336 64zM192 64c17.67 0 32 14.33 32 32c0 17.67-14.33 32-32 32S160 113.7 160 96C160 78.33 174.3 64 192 64zM272 224h-160C103.2 224 96 216.8 96 208C96 199.2 103.2 192 112 192h160C280.8 192 288 199.2 288 208S280.8 224 272 224z"/></svg></div>
                    <a>{{ $t('chat_msg_menu_copy') }}</a>
                </div>
                <div @click="copySelectMsg" v-show="tags.menuDisplay.copySelect">
                    <div><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512"><path d="M392.8 1.2c-17-4.9-34.7 5-39.6 22l-128 448c-4.9 17 5 34.7 22 39.6s34.7-5 39.6-22l128-448c4.9-17-5-34.7-22-39.6zm80.6 120.1c-12.5 12.5-12.5 32.8 0 45.3L562.7 256l-89.4 89.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0l112-112c12.5-12.5 12.5-32.8 0-45.3l-112-112c-12.5-12.5-32.8-12.5-45.3 0zm-306.7 0c-12.5-12.5-32.8-12.5-45.3 0l-112 112c-12.5 12.5-12.5 32.8 0 45.3l112 112c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L77.3 256l89.4-89.4c12.5-12.5 12.5-32.8 0-45.3z"/></svg></div>
                    <a>{{ $t('chat_msg_menu_copy_selected') }}</a>
                </div>
                <div @click="revokeMsg" v-show="tags.menuDisplay.revoke">
                    <div><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512"><path d="M310.6 361.4c12.5 12.5 12.5 32.75 0 45.25C304.4 412.9 296.2 416 288 416s-16.38-3.125-22.62-9.375L160 301.3L54.63 406.6C48.38 412.9 40.19 416 32 416S15.63 412.9 9.375 406.6c-12.5-12.5-12.5-32.75 0-45.25l105.4-105.4L9.375 150.6c-12.5-12.5-12.5-32.75 0-45.25s32.75-12.5 45.25 0L160 210.8l105.4-105.4c12.5-12.5 32.75-12.5 45.25 0s12.5 32.75 0 45.25l-105.4 105.4L310.6 361.4z"/></svg></div>
                    <a>{{ $t('chat_msg_menu_withdraw') }}</a>
                </div>
                <div @click="(selectedMsg ? addSpecialMsg({ msgObj: { type: 'at', qq: selectedMsg.sender.user_id }, addText: true }) : '');toMainInput();closeMsgMenu();" v-show="tags.menuDisplay.at">
                    <div><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M256 64C150 64 64 150 64 256s86 192 192 192c17.7 0 32 14.3 32 32s-14.3 32-32 32C114.6 512 0 397.4 0 256S114.6 0 256 0S512 114.6 512 256v32c0 53-43 96-96 96c-29.3 0-55.6-13.2-73.2-33.9C320 371.1 289.5 384 256 384c-70.7 0-128-57.3-128-128s57.3-128 128-128c27.9 0 53.7 8.9 74.7 24.1c5.7-5 13.1-8.1 21.3-8.1c17.7 0 32 14.3 32 32v80 32c0 17.7 14.3 32 32 32s32-14.3 32-32V256c0-106-86-192-192-192zm64 192c0-35.3-28.7-64-64-64s-64 28.7-64 64s28.7 64 64 64s64-28.7 64-64z"/></svg></div>
                    <a>{{ $t('chat_msg_menu_at') }}</a>
                </div>
                <div @click="removeUser" v-show="tags.menuDisplay.remove">
                    <div><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512"><path d="M38.8 5.1C28.4-3.1 13.3-1.2 5.1 9.2S-1.2 34.7 9.2 42.9l592 464c10.4 8.2 25.5 6.3 33.7-4.1s6.3-25.5-4.1-33.7L353.3 251.6C407.9 237 448 187.2 448 128C448 57.3 390.7 0 320 0C250.2 0 193.5 55.8 192 125.2L38.8 5.1zM264.3 304.3C170.5 309.4 96 387.2 96 482.3c0 16.4 13.3 29.7 29.7 29.7H514.3c3.9 0 7.6-.7 11-2.1l-261-205.6z"/></svg></div>
                    <a>{{ $t('chat_msg_menu_remove') }}</a>
                </div>
            </div>
        </div>
        <!-- 群 / 好友信息弹窗 -->
        <Transition>
            <Info :chat="chat" :tags="tags" @close="openChatInfoPan" @loadFile="fileLoad"></Info>
        </Transition>
        <!-- 图片发送器 -->
        <Transition>
            <div class="img-sender" v-show="imgCache.length > 0">
                <div class="card ss-card">
                    <div class="hander">
                        <span>{{ $t('chat_send_pic_title') }}</span>
                        <button @click="sendMsg" class="ss-button">{{ $t('chat_send') }}</button>
                    </div>
                    <div class="imgs">
                        <div v-for="(img64, index) in imgCache" :key="'sendImg-' + index">
                            <div @click="deleteImg(index)">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512">
                                    <path
                                        d="M310.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L160 210.7 54.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L114.7 256 9.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L160 301.3 265.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L205.3 256 310.6 150.6z" />
                                </svg>
                            </div>
                            <img :src="img64">
                        </div>
                    </div>
                    <div class="sender">
                        <svg @click="runSelectImg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" data-v-658eb408=""><path d="M0 96C0 60.7 28.7 32 64 32H448c35.3 0 64 28.7 64 64V416c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64V96zM323.8 202.5c-4.5-6.6-11.9-10.5-19.8-10.5s-15.4 3.9-19.8 10.5l-87 127.6L170.7 297c-4.6-5.7-11.5-9-18.7-9s-14.2 3.3-18.7 9l-64 80c-5.8 7.2-6.9 17.1-2.9 25.4s12.4 13.6 21.6 13.6h96 32H424c8.9 0 17.1-4.9 21.2-12.8s3.6-17.4-1.4-24.7l-120-176zM112 192c26.5 0 48-21.5 48-48s-21.5-48-48-48s-48 21.5-48 48s21.5 48 48 48z" data-v-658eb408=""></path></svg>
                        <input type="text" @paste="addImg" :disabled="runtimeData.tags.openSideBar" @click="toMainInput" v-model="msg">
                    </div>
                </div>
                <div class="bg" @click="imgCache = []"></div>
            </div>
        </Transition>
        <!-- 转发面板 -->
        <Transition>
            <div class="forward-pan" v-if="tags.showForwardPan">
                <div class="ss-card card">
                    <header>
                        <span>{{ $t('chat_msg_forward_pan') }}</span>
                        <svg @click="cancelForward" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" data-v-658eb408=""><path d="M310.6 361.4c12.5 12.5 12.5 32.75 0 45.25C304.4 412.9 296.2 416 288 416s-16.38-3.125-22.62-9.375L160 301.3L54.63 406.6C48.38 412.9 40.19 416 32 416S15.63 412.9 9.375 406.6c-12.5-12.5-12.5-32.75 0-45.25l105.4-105.4L9.375 150.6c-12.5-12.5-12.5-32.75 0-45.25s32.75-12.5 45.25 0L160 210.8l105.4-105.4c12.5-12.5 32.75-12.5 45.25 0s12.5 32.75 0 45.25l-105.4 105.4L310.6 361.4z" data-v-658eb408=""></path></svg>
                    </header>
                    <input @input="searchForward" :placeholder="$t('base_search')">
                    <div>
                        <div @click="forwardMsg(data)" v-for="data in forwardList" :key="'forwardList-' + data.user_id ? data.user_id : data.group_id">
                            <img loading="lazy" :title="data.group_name ? data.group_name :
                                data.remark === data.nickname ? data.nickname : data.remark + '（' + data.nickname + '）'" :src="data.user_id ?
                                'https://q1.qlogo.cn/g?b=qq&s=0&nk=' + data.user_id :
                                'https://p.qlogo.cn/gh/' + data.group_id + '/' + data.group_id + '/0'">
                            <div>
                                <p>{{ data.group_name ? data.group_name :
                                        data.remark === data.nickname ? data.nickname : data.remark + '（' + data.nickname + '）'
                                }}</p>
                                <span>{{ data.group_id ? $t('chat_type_group')  : $t('chat_type_user')}}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="bg" @click="cancelForward"></div>
            </div>
        </Transition>
        <div class="bg" :style="`backdrop-filter: blur(${runtimeData.sysConfig.chat_background_blur}px);`"></div>
    </div>
</template>

<script lang="ts">
import app from '@/main'
import SendUtil from '@/function/sender'
import Option from '@/function/option'
import Util from '@/function/util'
import Info from '@/pages/Info.vue'
import MsgBody from '@/components/MsgBody.vue'
import NoticeBody from '@/components/NoticeBody.vue'
import FacePan from '@/components/FacePan.vue'
import imageCompression from 'browser-image-compression'

import { defineComponent, markRaw } from 'vue'
import { parseMsgId, getTrueLang, loadHistory as loadHistoryFirst } from '@/function/util'
import { Logger, LogType, PopInfo, PopType } from '@/function/base'
import { Connector, login as loginInfo } from '@/function/connect'
import { runtimeData } from '@/function/msg'
import { BaseChatInfoElem, MsgItemElem, SQCodeElem, GroupMemberInfoElem, UserFriendElem, UserGroupElem, BotMsgType } from '@/function/elements/information'

export default defineComponent({
    name: 'ViewChat',
    props: ['chat', 'list', 'mergeList', 'mumberInfo', 'imgView'],
    components: { Info, MsgBody, NoticeBody, FacePan },
    data () {
        return {
            Option: Option,
            Connector: Connector,
            runtimeData: runtimeData,
            forwardList: runtimeData.userList,
            trueLang: getTrueLang(),
            tags: {
                nowGetHistroy: false,
                showBottomButton: true,
                showMoreDetail: false,
                showMsgMenu: false,
                showForwardPan: false,
                openedMenuMsg: {} as HTMLDivElement,
                openChatInfo: false,
                isReply: false,
                isJinLoading: false,
                onAtFind: false,
                menuDisplay: {
                    relpy: true,
                    forward: true,
                    select: false,
                    copy: true,
                    copySelect: false,
                    revoke: false,
                    at: true,
                    remove: false
                },
                msgTouch: {
                    x: -1,
                    y: -1,
                    msgOnTouchDown: false,
                    onMove: 'no'
                }
            },
            details: [{ open: false }, { open: false }, {open: false}],
            msgMenus: [],
            NewMsgNum: 0,
            msg: '',
            imgCache: [] as string[],
            sendCache: [] as MsgItemElem[],
            selectedMsg: null as { [key: string]: any } | null,
            selectCache: '',
            replyMsgInfo: null,
            atFindList: null as GroupMemberInfoElem[] | null
        }
    },
    methods: {
        
        /**
         * 判断是否需要显示时间戳（上下超过五分钟的消息）
         * @param timePrv 上条消息的时间戳（10 位）
         * @param timeNow 当前消息的时间戳（10 位）
         */
        isShowTime (timePrv: number | undefined, timeNow: number, alwaysShow = false) {
            if(alwaysShow) return true
            if(timePrv == undefined) return false
            // 五分钟 10 位时间戳相差 300
            return timeNow - timePrv >= 300
        },

        /**
         * 消息区滚动
         * @param event 滚动事件
         */
        chatScroll (event: Event) {
            const body = event.target as HTMLDivElement
            const bar = document.getElementById('send-more')
            // 顶部
            if (body.scrollTop === 0 && this.list.length > 0) {
                this.loadMoreHistory()
            }
            // 底部
            if (body.scrollTop + body.clientHeight >= body.scrollHeight) {
                this.NewMsgNum = 0
                this.tags.showBottomButton = false
                // 去除阴影
                if(bar) {
                    bar.style.transition = 'background .3s'
                    bar.classList.add('btn')
                }
            }
            // 显示回到底部
            if (body.scrollTop < body.scrollHeight - body.clientHeight * 2 && this.tags.showBottomButton !== true) {
                this.tags.showBottomButton = true
            }
            // 添加阴影
            if (body.scrollTop < body.scrollHeight - body.clientHeight - 10) {
                if(bar) {
                    bar.style.transition = 'background 1s'
                    bar.classList.remove('btn')
                }
            }
        },

        /**
         * 加载更多历史消息
         */
        loadMoreHistory () {
            if (!this.tags.nowGetHistroy && runtimeData.tags.canLoadHistory !== false) {
                // 获取列表第一条消息 ID
                const firstMsgId = this.list[0].message_id
                // 锁定加载防止反复触发
                this.tags.nowGetHistroy = true
                // 发起获取历史消息请求
                let name = 'get_chat_history'
                if(runtimeData.botInfo['go-cqhttp'] === true)
                    name = 'get_msg_history'
                Connector.send(
                    name,
                    {
                        message_id: firstMsgId,
                        target_id: runtimeData.chatInfo.show.id,
                        group: runtimeData.chatInfo.show.type == 'group',
                        count: 20
                    },
                    'getChatHistory'
                )
            }
        },
        
        /**
         * 消息区滚动到指定位置
         * @param where 位置（px）
         * @param showAnimation 是否使用动画
         */
        scrollTo (where: number | undefined, showAnimation = true) {
            const pan = document.getElementById('msgPan')
            if(pan !== null && where) {
                if (showAnimation === false) {
                    pan.style.scrollBehavior = 'unset'
                } else {
                    pan.style.scrollBehavior = 'smooth'
                }
                pan.scrollTop = where
                pan.style.scrollBehavior = 'smooth'
            }
        },
        scrollBottom (showAnimation = false) {
            const pan = document.getElementById('msgPan')
            if(pan !== null) {
                this.scrollTo(pan.scrollHeight, showAnimation)
            }
        },
        scrollToMsg (seqName: string) {
            // oicq1：seq 字段名消息格式兼容
            const seq = this.list[0].seq ? this.list[0].seq : this.list[0].seqid
            if (!Util.scrollToMsg(seqName, true)) {
                const pass = Number(seq) - Number(seqName.split('-')[1])
                new PopInfo().add(PopType.INFO, this.$t('pop_chat_msg_not_load') + ' ( +' + pass + ' ) ')
            }
        },
        imgLoadedScroll () {
            const pan = document.getElementById('msgPan')
            if(pan && !this.tags.showBottomButton) {
                this.scrollBottom()
            }
        },

        /**
         * 发送框按键事件
         * @param event 事件
         */
        mainKey (event: KeyboardEvent) {
            if (!event.shiftKey && event.keyCode == 13) {
                // enter 发送消息
                if(this.msg != '') {
                    this.sendMsg()
                }
            }
        },
        mainKeyUp(event: KeyboardEvent) {
            const logger = new Logger()
            // 发送完成后输入框会遗留一个换行，把它删掉 ……
            if (!event.shiftKey && event.keyCode == 13 && this.msg == '\n') {
                this.msg = ''
            }
            if(event.keyCode != 13) {
                // 获取最后一个输入的符号用于判定 at
                const lastInput = this.msg.substring(this.msg.length - 1)
                if(!this.tags.onAtFind && lastInput == '@' && 
                        runtimeData.chatInfo.info.group_members.length > 0 &&
                        runtimeData.chatInfo.show.type == 'group') {
                    logger.add(LogType.UI, '开始匹配群成员列表 ……')
                    this.tags.onAtFind = true
                }
                if(this.tags.onAtFind) {
                    if(this.msg.lastIndexOf("@") < 0) {
                        logger.add(LogType.UI, '匹配群成员列表被打断 ……')
                        this.tags.onAtFind = false
                        this.atFindList = null
                    } else {
                        const atInfo = this.msg.substring(this.msg.lastIndexOf("@") + 1).toLowerCase()
                        console.log(atInfo)
                        if(atInfo != '') {
                            this.atFindList = runtimeData.chatInfo.info.group_members.filter((item) => {
                                return (item.card != '' && item.card.toLowerCase().indexOf(atInfo) >= 0) || 
                                        item.nickname.toLowerCase().indexOf(atInfo) >= 0 ||
                                        atInfo == item.user_id.toString()
                            })
                        }
                    }
                }
            }
        },

        /**
         * 通过表单提交方式发送消息
         * PS：主要用来解决一些奇奇怪怪的回车判定导致的问题
         */
        mainSubmit() {
            if (this.msg != '') {
                this.sendMsg()
            }
        },

        /**
         * 选择 At
         * @param id QQ 号
         */
        choiceAt(id: number | undefined) {
            if(id != undefined) {
                // 删除输入框内的 At 文本
                this.msg = this.msg.substring(0, this.msg.lastIndexOf('@'))
                // 添加 at 信息
                this.addSpecialMsg({ msgObj: { type: 'at', qq: id }, addText: true })
            }
            this.toMainInput()
            this.tags.onAtFind = false
            this.atFindList = null
        },

        /**
         * 选中光标在其内部的那个 SQLCode
         */
        selectSQIn () {
            var input = document.getElementById('main-input') as HTMLInputElement
            // 如果文本框里本来就选中着什么东西就不触发了
            if (input !== null && input.selectionStart === input.selectionEnd) {
                var cursurPosition = -1
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
                        if (start !== -1 && cursurPosition > start && cursurPosition < end) {
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
        showMsgMeun (event: Event, data: any) {
            this.selectedMsg = data
            if (Option.get('log_level') === 'debug') {
                console.log(data)
            }
            const menu = document.getElementById('msgMenu')
            const msg = event.currentTarget as HTMLDivElement
            const select = event.target as HTMLElement
            let selectUserType = 'member'
            if(runtimeData.chatInfo.show.type == 'group' && runtimeData.chatInfo.info.group_members) {
                runtimeData.chatInfo.info.group_members.forEach((item: any) => {
                    if(item.user_id == data.sender.user_id) {
                        selectUserType = item.role
                    }
                })
            }
            if(menu !== null && msg !== null) {
                if(select.nodeName == 'IMG' && (select as HTMLImageElement).name == 'avatar') {
                    // 右击头像需要显示的内容
                    Object.keys(this.tags.menuDisplay).forEach((name: string) => {
                        (this.tags.menuDisplay as any)[name] = false
                    })
                    this.tags.menuDisplay.at = true
                    this.tags.menuDisplay.remove = true
                    if(runtimeData.chatInfo.show.type != 'group' ||
                        data.sender.user_id === runtimeData.loginInfo.uin ||
                        runtimeData.chatInfo.info.me_info.role === 'member' ||
                        selectUserType == 'owner' || selectUserType == 'admin') {
                            // 自己、私聊或者没有权限的时候不显示移除
                            this.tags.menuDisplay.remove = false
                    }
                    if (data.sender.user_id === runtimeData.loginInfo.uin) {
                        // 自己不显示提及
                        this.tags.menuDisplay.at = false
                    }
                } else {
                    // 检查消息，确认菜单显示状态
                    if (data.sender.user_id === runtimeData.loginInfo.uin ||
                        runtimeData.chatInfo.info.me_info.role === 'admin' ||
                        runtimeData.chatInfo.info.me_info.role === 'owner') {
                        // 自己的消息、管理员和群主会显示撤回
                        this.tags.menuDisplay.revoke = true
                    }
                    if(data.revoke === true) {
                        // 已被撤回的自己的消息只显示复制
                        this.tags.menuDisplay.relpy = false
                        this.tags.menuDisplay.forward = false
                        this.tags.menuDisplay.revoke = false
                    }
                    const selection = document.getSelection()
                    const textBody = selection?.anchorNode?.parentElement
                    let textMsg = null as HTMLElement | null
                    // 向外寻找含有 message class 的父元素，直到遇到 chat class
                    let msgParent = textBody
                    if(msgParent) {
                        while(msgParent.className != 'chat') {
                            if(msgParent.className.startsWith('message') &&
                                msgParent.className.indexOf('-') < 0) {
                                textMsg = msgParent
                                break
                            }
                            msgParent = msgParent.parentElement as HTMLDivElement
                            if(!msgParent) {
                                break
                            }
                        }
                    }
                    if(textBody && textBody.className.indexOf('msg-text') > -1 &&
                        selection.focusNode == selection.anchorNode &&
                        textMsg && textMsg.id == msg.id) {
                        // 用于判定是否选中了 msg-text 且开始和结束是同一个 Node（防止跨消息复制）
                        this.selectCache = selection.toString()
                        if(this.selectCache.length > 0) {
                            this.tags.menuDisplay.copySelect = true
                        }
                    }
                    const nList = ['xml', 'json']
                    data.message.forEach((item: any) => {
                        if(nList.indexOf(item.type as string) > 0) {
                            // 如果包含以上消息类型，不能转发
                            this.tags.menuDisplay.forward = false
                        }
                    })
                }
                // 鼠标位置
                const pointEvent = event as PointerEvent || window.event as PointerEvent
                const pointX = pointEvent.clientX - msg.getBoundingClientRect().left + 20
                const pointY = pointEvent.clientY
                // 移动菜单位置
                menu.style.marginLeft = pointX + 'px'
                menu.style.marginTop = pointY + 'px'
                // 出界判定
                const menuWidth = menu.clientWidth
                const msgWidth = msg.offsetWidth
                if (pointX + menuWidth > msgWidth + 27) {
                    menu.style.marginLeft = (msgWidth + 27 - menuWidth) + 'px'
                }
                // 显示菜单
                this.tags.showMsgMenu = true
                // PS：在菜单完全显示出来之前获取不到正确的高度，所以延迟一下
                setTimeout(() => {
                    // 出界判定
                    const menuHeight = menu.clientHeight
                    const bodyHeight = document.body.clientHeight
                    if (pointY + menuHeight > bodyHeight + 10) {
                        menu.classList.add('topOut')
                        menu.style.marginTop = (bodyHeight - menuHeight - 10) + 'px'
                        // menu.classList.remove('topOut')
                    }
                }, 90)
                // 设置消息背景
                this.tags.openedMenuMsg = msg
                msg.style.background = '#00000008'
            }
        },

        /**
         * 初始化菜单状态
         */
        initMenuDisplay () {
            this.tags.menuDisplay = {
                relpy: true,
                forward: true,
                select: false,
                copy: true,
                copySelect: false,
                revoke: false,
                at: false,
                remove: false
            }
        },

        /**
         * 回复消息
         */
        replyMsg (closeMenu = true) {
            const msg = this.selectedMsg
            if (msg !== null) {
                const msgId = msg.message_id
                // 添加回复内容
                // PS：这儿还是用旧的方式 …… 因为新的调用不友好。回复消息不会被加入文本行，在消息发送器内有特殊判定。
                this.addSpecialMsg({ msgObj: { type: 'reply', id: msgId }, addText: false, addTop: true })
                // 显示回复指示器
                this.tags.isReply = true
                // 聚焦输入框
                this.toMainInput()
                // 关闭消息菜单
                if(closeMenu) {
                    this.closeMsgMenu()
                }
            }
        },

        /**
         * 取消回复消息
         */
        cancelReply () {
            // 去除回复消息缓存
            this.sendCache = this.sendCache.filter((item) => {
                return item.type !== 'reply'
            })
            this.tags.isReply = false
        },

        /**
         * 取消转发
         */
        cancelForward () {
            this.forwardList = runtimeData.userList
            this.tags.showForwardPan = false
            this.closeMsgMenu()
        },

        /**
         * 搜索转发列表
         * @param value 搜索内容
         */
        searchForward (event: Event) {
            const value = (event.target as HTMLInputElement).value
            this.forwardList = runtimeData.userList.filter((item: UserFriendElem & UserGroupElem) => {
                const name = (item.user_id ? (item.nickname + item.remark) : item.group_name).toLowerCase()
                const id = item.user_id ? item.user_id : item.group_id
                return name.indexOf(value.toLowerCase()) !== -1 || id.toString() === value
            })
        },

        /**
         * 转发消息
         */
        forwardMsg (data: UserFriendElem & UserGroupElem) {
            if (this.selectedMsg) {
                const msg = this.selectedMsg
                const type = data.group_id ? 'group' : 'user'
                const id = data.group_id ? data.group_id : data.user_id
                // 关闭转发窗口
                this.cancelForward()
                // 将接收目标加入消息列表并跳转过去
                if (runtimeData.onMsgList.indexOf(data) < 0) {
                    runtimeData.onMsgList.push(data)
                }
                this.$nextTick(() => {
                    const user = document.getElementById('user-' + id)
                    if(user) {
                        user.click()
                    }
                })
                // 二次确认转发
                const popInfo = {
                    title: this.$t('chat_msg_forward_pan'),
                    template: MsgBody,
                    templateValue: markRaw({data: msg, type: 'forward'}),
                    button: [
                        {
                            text: this.$t('btn_no'),
                            fun: () => { runtimeData.popBoxList.shift() }
                        },
                        {
                            text: this.$t('btn_yes'),
                            master: true,
                            fun: () => {
                                let msgSend = msg.message
                                if(runtimeData.tags.msgType == BotMsgType.CQCode) {
                                    msgSend = Util.parseJSONCQCode(msgSend)
                                }
                                switch (type) {
                                    case 'group': Connector.send('send_group_msg', { 'group_id': id, 'message': msgSend }, 'sendMsgBack_forward'); break
                                    case 'user': Connector.send('send_private_msg', { 'user_id': id, 'message': msgSend }, 'sendMsgBack_forward'); break
                                }
                                runtimeData.popBoxList.shift()
                            }
                        }
                    ]
                }
                runtimeData.popBoxList.push(popInfo)
            }
        },

        /**
         * 复制选中的消息
         */
        copyMsg () {
            const msg = this.selectedMsg
            if (msg !== null) {
                // 如果消息体没有简述消息的话 ……
                if(!msg.raw_message) {
                    msg.raw_message = Util.getMsgRawTxt(msg.message)
                }
                const popInfo = new PopInfo()
                app.config.globalProperties.$copyText(msg.raw_message).then(() => {
                    popInfo.add(PopType.INFO, this.$t('pop_chat_msg_menu_copy_success'), true)
                }, (e: any) => {
                    console.log(e)
                    popInfo.add(PopType.ERR, this.$t('pop_chat_msg_menu_copy_err'), true)
                })
            }
            this.closeMsgMenu()
        },

        /**
         * 复制缓存的选中的文本
         */
        copySelectMsg () {
            if (this.selectCache != '') {
                const popInfo = new PopInfo()
                app.config.globalProperties.$copyText(this.selectCache).then(() => {
                    popInfo.add(PopType.INFO, this.$t('pop_chat_msg_menu_copy_success'), true)
                }, (e: any) => {
                    console.log(e)
                    popInfo.add(PopType.ERR, this.$t('pop_chat_msg_menu_copy_err'), true)
                })
            }
            this.closeMsgMenu()
        },

        /**
         * 撤回消息
         */
        revokeMsg () {
            const msg = this.selectedMsg
            if (msg !== null) {
                const msgId = msg.message_id
                Connector.send('delete_msg', { 'message_id': msgId })
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
                    title: this.$t('popbox_tip'),
                    html: `<span>${this.$t('chat_msg_menu_remove_tip', { user: msg.sender.nickname })}</span>`,
                    button: [
                        {
                            text: app.config.globalProperties.$t('btn_yes'),
                            fun: () => {
                                if(msg) {
                                    Connector.send('set_group_kick', 
                                    {
                                        group_id: runtimeData.chatInfo.show.id,
                                        user_id: msg.sender.user_id
                                    }, 'setGroupKick')
                                    this.closeMsgMenu()
                                    runtimeData.popBoxList.shift()
                                }
                            }
                        },
                        {
                            text: app.config.globalProperties.$t('btn_no'),
                            master: true,
                            fun: () => { runtimeData.popBoxList.shift() }
                        }
                    ]
                }
                runtimeData.popBoxList.push(popInfo)
            }
        },

        /**
         * 获取悬浮窗显示位置
         */
        getPopPost () {
            const x = this.mumberInfo.x === undefined ? '0' : this.mumberInfo.x
            const y = this.mumberInfo.y === undefined ? '0' : this.mumberInfo.y
            return 'margin-left:' + x + 'px;margin-top:' + y + 'px;'
        },

        /**
         * 关闭右击菜单
         */
        closeMsgMenu () {
            // 关闭菜单
            this.tags.showMsgMenu = false
            // 清理消息背景
            this.tags.openedMenuMsg.style.background = 'unset'
            setTimeout(() => {
                // 重置菜单显示状态
                this.initMenuDisplay()
            }, 300)
        },

        /**
         * 关闭合并转发弹窗
         */
        closeMergeMsg () {
            this.runtimeData.mergeMessageList = undefined
        },

        /**
         * 打开好友/群组信息页面
         */
        openChatInfoPan () {
            this.tags.openChatInfo = !this.tags.openChatInfo
            // 加载一些需要显示的消息，有部分判断是用来防止反复加载已存在内容的
            if (this.tags.openChatInfo) {
                // 加载基础信息
                if (this.chat.show.type === 'group' && this.chat.info.group_info.gc !== this.chat.show.id) {
                    const url = `https://qinfo.clt.qq.com/cgi-bin/qun_info/get_group_info_all?gc=${this.chat.show.id}&bkn=${runtimeData.loginInfo.bkn}`
                    Connector.send(
                        'http_proxy',
                        { 'url': url },
                        'getMoreGroupInfo'
                    )
                } else if (this.chat.show.type === 'user' && this.chat.info.user_info.uin !== this.chat.show.id) {
                    const url = 'https://find.qq.com/proxy/domain/cgi.find.qq.com/qqfind/find_v11?backver=2'
                    const info = `bnum=15&pagesize=15&id=0&sid=0&page=0&pageindex=0&ext=&guagua=1&gnum=12&guaguan=2&type=2&ver=4903&longitude=116.405285&latitude=39.904989&lbs_addr_country=%E4%B8%AD%E5%9B%BD&lbs_addr_province=%E5%8C%97%E4%BA%AC&lbs_addr_city=%E5%8C%97%E4%BA%AC%E5%B8%82&keyword=${this.chat.show.id}&nf=0&of=0&ldw=${runtimeData.loginInfo.bkn}`
                    Connector.send(
                        'http_proxy',
                        { 'url': url, 'method': 'post', 'data': info },
                        'getMoreUserInfo'
                    )
                }
                // 加载群公告列表
                if (this.chat.show.type === 'group' && (this.chat.info.group_notices === undefined || Object.keys(this.chat.info.group_notices).length === 0)) {
                    const url = `https://web.qun.qq.com/cgi-bin/announce/get_t_list?bkn=${runtimeData.loginInfo.bkn}&qid=${this.chat.show.id}&ft=23&s=-1&n=20`
                    Connector.send(
                        'http_proxy',
                        { 'url': url },
                        'getGroupNotices'
                    )
                }
                // 加载群文件列表
                if (this.chat.show.type === 'group' && Object.keys(this.chat.info.group_files).length === 0) {
                    const url = `https://pan.qun.qq.com/cgi-bin/group_file/get_file_list?gc=${this.chat.show.id}&bkn=${runtimeData.loginInfo.bkn}&start_index=0&cnt=30&filter_code=0&folder_id=%2F&show_onlinedoc_folder=0`
                    Connector.send(
                        'http_proxy',
                        { 'url': url },
                        'getGroupFiles'
                    )
                }
            }
        },

        // /**
        //  * 加载更多文件
        //  */
        fileLoad (event: Event) {
            const sender = event.currentTarget as HTMLDivElement
            if (sender.scrollTop + sender.clientHeight >= sender.scrollHeight && this.chat.info.group_files.next_index !== 0 &&
                this.chat.info.group_files.next_index !== this.chat.info.group_files.total_cnt) {
                const url = `https://pan.qun.qq.com/cgi-bin/group_file/get_file_list?gc=${this.chat.show.id}&bkn=${runtimeData.loginInfo.bkn}&start_index=${this.chat.info.group_files.next_index}&cnt=30&filter_code=0&folder_id=%2F&show_onlinedoc_folder=0`
                Connector.send(
                    'http_proxy',
                    { 'url': url },
                    'getMoreGroupFiles'
                )
            }
        },

        /**
         * 根据 index 删除图片
         * @param { number } index 图片编号
         */
        deleteImg (index: number) {
            this.imgCache.splice(index, 1)
        },

        /**
         * 添加特殊消息结构
         * @param data obj
         */
        addSpecialMsg (data: SQCodeElem) {
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
        addImg (event: ClipboardEvent) {
            // 判断粘贴类型
            if (!(event.clipboardData && event.clipboardData.items)) {
                return
            }
            for (let i = 0, len = event.clipboardData.items.length; i < len; i++) {
                let item = event.clipboardData.items[i]
                if (item.kind === 'file') {
                    this.setImg(item.getAsFile())
                    // 阻止默认行为
                    event.preventDefault()
                }
            }
        },

        runSelectImg () {
            const input = document.getElementById('choice-pic')
            if(input) {
                input.click()
            }
        },
        /**
         * 手动选择图片
         */
        selectImg (event: Event) {
            this.tags.showMoreDetail = false
            const sender = event.target as HTMLInputElement
            if(sender && sender.files) {
                this.setImg(sender.files[0])
            }
        },

        runSelectFile () {
            const input = document.getElementById('choice-file')
            if(input) {
                input.click()
            }
        },
        /**
         * 选择文件
         */
        async selectFile (event: Event) {
            this.tags.showMoreDetail = false
            const sender = event.target as HTMLInputElement
            if(sender.files != null) {
                // 构建请求参数
                const formData = new FormData();
                formData.append('type', runtimeData.chatInfo.show.type)
                formData.append('id', String(runtimeData.chatInfo.show.id))
                formData.append('file', sender.files[0])
                // 请求
                try {
                    var onProgress = function (e: ProgressEvent) {
                       const percent = Math.round(e.loaded / e.total * 100)
                       if(percent % 10 === 0) {
                           new PopInfo().add(PopType.INFO, app.config.globalProperties.$t('pop_send_file', { percent: percent}))
                       }
                    }

                    const ssl = runtimeData.tags.connectSsl ? 'https://' : 'http://'

                    var url = ssl + loginInfo.address + '/upload_file'
                    var xhr = new XMLHttpRequest()
                    xhr.upload.onprogress = onProgress
                    xhr.open("POST", url, true)
                    xhr.setRequestHeader("authorization", loginInfo.token)
                    xhr.send(formData)
                    xhr.onreadystatechange = function () {
                        const data = JSON.parse(xhr.responseText)
                        if(Object.keys(data).length > 0) {
                            // 发送成功，直接刷新整个历史消息
                            loadHistoryFirst(runtimeData.chatInfo.show)
                        } else {
                            new PopInfo().add(PopType.ERR, app.config.globalProperties.$t('pop_send_file_fail'))
                        }
                    }
                } catch(e) {
                    console.log(e)
                    new PopInfo().add(PopType.ERR, app.config.globalProperties.$t('pop_send_file_err'))
                }
            }
        },

        /**
         * 将图片转换为 base64 并缓存
         * @param blob 文件对象
         */
        async setImg(blob: File | null) {
            const popInfo = new PopInfo()
            if (blob !== null && blob.type.indexOf('image/') >= 0 && blob.size !== 0) {
                if (blob.size < 3145728) {
                    // 转换为 Base64
                    var reader = new FileReader()
                    reader.readAsDataURL(blob)
                    reader.onloadend = () => {
                        var base64data = reader.result as string
                        if (base64data !== null) {
                            if (Option.get('close_chat_pic_pan') === true) {
                                // 在关闭图片插入面板的模式下将直接以 SQCode 插入输入框
                                const data = {
                                    addText: true,
                                    msgObj: {
                                        type: 'image',
                                        file: 'base64://' + base64data.substring(base64data.indexOf('base64,') + 7, base64data.length)
                                    }
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
                    const options = { maxSizeMB: 3,useWebWorker: true }
                    try {
                        popInfo.add(PopType.INFO, this.$t('pop_chat_image_compression'))
                        const compressedFile = await imageCompression(blob, options)
                        new Logger().add(LogType.INFO, '图片压缩成功，原大小：' + blob.size / 1024 / 1024 + ' MB，压缩后大小：' + compressedFile.size / 1024 / 1024 + ' MB')
                        this.setImg(compressedFile)
                    } catch (error) {
                        popInfo.add(PopType.INFO, this.$t('pop_chat_image_compression_fail'))
                    }
                }
            }
        },

        /**
         * 将焦点移回主发送框
         * PS：我实在懒得再做一次回车发送了。所以当点击图片发送框的输入框后，焦点会被移动到主输入框上以方便回车发送
         */
        toMainInput () {
            const mainInput = document.getElementById('main-input')
            if(mainInput !== null) {
                mainInput.focus()
            }
        },

        /**
         * 发送消息
         */
        sendMsg () {
            // 为了减少对于复杂图文排版页面显示上的工作量，对于非纯文本的消息依旧处理为纯文本，如：
            // "这是一段话 [SQ:0]，[SQ:1] 你要不要来试试 Stapxs QQ Lite？"
            // 其中 [SQ:n] 结构代表着这是特殊消息以及这个消息具体内容在消息缓存中的 index，像是这样：
            // const sendCache = [{type:"face",id:11},{type:"at",qq:1007028430}]
            //                     ^^^^^^^ 0 ^^^^^^^   ^^^^^^^^^^ 1 ^^^^^^^^^^
            // 在发送操作触发之后，将会解析此条字符串排列出最终需要发送的消息结构用于发送。
            let msg = SendUtil.parseMsg(this.msg, this.sendCache, this.imgCache)
            if (msg !== undefined && msg.length > 0) {
                switch (this.chat.show.type) {
                    case 'group': Connector.send('send_group_msg', { 'group_id': this.chat.show.id, 'message': msg }, 'sendMsgBack'); break
                    case 'user': 
                    {
                        if(this.chat.show.temp) {
                            Connector.send('send_temp_msg', { 'user_id': this.chat.show.id, 'group_id': this.chat.show.temp, 'message': msg }, 'sendMsgBack');
                        } else {
                            Connector.send('send_private_msg', { 'user_id': this.chat.show.id, 'message': msg }, 'sendMsgBack');
                        }
                        break
                    }
                }
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

            if(oldLength == 0 && newLength > 0) {
                // 设置最后一条消息以上都为已读
                Connector.send(
                    'set_message_read',
                    { message_id: this.list[this.list.length - 1].message_id },
                    'setMessageRead'
                )
                // go-cqhttp：他们名字不一样
                Connector.send(
                    'mark_msg_as_read',
                    { message_id: this.list[this.list.length - 1].message_id },
                    'setMessageRead'
                )
            }

            // =================== 刷新统计数据 ===================

            // 判断新消息数量（回到底部按钮显示、不在加载历史消息、不是首次加载消息）
            if (this.tags.showBottomButton && !this.tags.nowGetHistroy && oldLength > 0) {
                if(this.NewMsgNum !== 0) {
                    this.NewMsgNum = this.NewMsgNum + Math.abs(newLength - oldLength)
                } else {
                    this.NewMsgNum = Math.abs(newLength - oldLength)
                }
            }
            // 清屏重新加载消息列表（超过 n 条消息、回到底部按钮不显示）
            // PS：也就是说只在消息底部时才会触发，以防止你是在看历史消息攒满了刷掉
            if (this.list.length > 200 && !this.tags.nowGetHistroy && !this.tags.showBottomButton) {
                runtimeData.messageList = []
                const info = {
                    type: this.chat.show.type,
                    id: this.chat.show.id,
                    name: this.chat.show.name,
                    avatar: this.chat.show.avatar,
                    jump: this.chat.show.jump
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
                            this.scrollTo(newPan.scrollHeight - height, false)
                        }
                        // 新消息自动下滚（只要回到底部按钮没显示就算是在最底部、首次加载（不需要滚动动画））
                        if(!this.tags.nowGetHistroy) {
                            if (!this.tags.showBottomButton) {
                                this.scrollTo(newPan.scrollHeight)
                            }
                            if(oldLength <= 0) {
                                this.scrollTo(newPan.scrollHeight, false)
                            }
                        }
                        // 解除锁定加载
                        this.tags.nowGetHistroy = false
                    }
                    // 刷新图片列表
                    // TODO: 需要优化性能
                    let getImgList = [] as { index: number, message_id: string, img_url: string }[]
                    this.list.forEach((item: any) => {
                        if (item.message !== undefined) {
                            item.message.forEach((msg: MsgItemElem) => {
                                if (msg.type === 'image' && !msg.asface) {
                                    const index = (parseMsgId(item.message_id)).seqid
                                    if(index != undefined) {
                                        const info = {
                                            index: index,
                                            message_id: item.message_id,
                                            img_url: msg.url
                                        }
                                        getImgList.push(info)
                                    }
                                }
                            })
                        }
                    })
                    if(getImgList.length != (runtimeData.chatInfo.info.image_list ? runtimeData.chatInfo.info.image_list.length : 0)) {
                        const num = runtimeData.tags.viewer.index
                        runtimeData.chatInfo.info.image_list = getImgList
                        const viewer = app.config.globalProperties.$viewer
                        if(runtimeData.tags.viewer.show) {
                            // 重新显示新的图片位置
                            if(num >= 0 && viewer) {
                                const viewIndex = num + getImgList.length - (runtimeData.chatInfo.info.image_list ? runtimeData.chatInfo.info.image_list.length : 0)
                                viewer.view(viewIndex)
                                viewer.show()
                                runtimeData.tags.viewer.index = viewIndex
                                new Logger().add(LogType.UI, '重新显示图片位置：' + viewIndex)
                            }
                        }
                    }
                    // 处理跳入跳转预设
                    // 如果 jump 参数不是 undefined，则意味着这次加载历史记录的同时需要跳转到指定的消息
                    if (runtimeData.chatInfo.show && runtimeData.chatInfo.show.jump) {
                        new Logger().debug('进入跳转至消息：' + runtimeData.chatInfo.show.jump)
                        this.scrollToMsg('chat-' + parseMsgId(runtimeData.chatInfo.show.jump).seqid)
                        runtimeData.chatInfo.show.jump = undefined
                    }
                })
            }
        },

        /**
         * 消息触屏开始
         * @param event 触摸事件
         */
        msgStartMove (event: TouchEvent, msg: any) {
            const logger = new Logger()
            const sender = event.currentTarget as HTMLDivElement
            logger.add(LogType.UI, '消息触屏点击事件开始 ……')
            this.tags.msgTouch.msgOnTouchDown = true
            this.tags.msgTouch.x = event.targetTouches[0].pageX
            this.tags.msgTouch.y = event.targetTouches[0].pageY
            // 消息长按事件，计时判定长按
            setTimeout(() => {
                logger.add(LogType.UI, "消息触屏长按判定：" + this.tags.msgTouch.msgOnTouchDown)
                if (this.tags.msgTouch.msgOnTouchDown === true) {
                    sender.style.background = '#00000008'
                    this.showMsgMeun(event, msg)
                }
            }, 400)
        },
        
        /**
         * 消息触屏移动
         * @param event 触摸事件
         */
        msgOnMove (event: TouchEvent) {
            const logger = new Logger()
            const sender = event.currentTarget as HTMLDivElement
            const msgPan = document.getElementById('msgPan')
            // 开始点击的位置
            const startX = this.tags.msgTouch.x
            const startY = this.tags.msgTouch.y
            // TODO: 懒得写了，移动的允许范围，用来防止按住了挪出控件范围导致无法触发 end
            // const maxTop = sender.
            if(startX > -1 && startY > -1 && msgPan) {
                // 计算移动差值
                const dx = Math.abs(startX - event.targetTouches[0].pageX)
                const dy = Math.abs(startY - event.targetTouches[0].pageY)
                const x = startX - event.targetTouches[0].pageX
                // 如果 dy 大于 10px 则判定为用户在滚动页面，打断长按消息判定
                if (dy > 10 || dx > 5) {
                    if (this.tags.msgTouch.msgOnTouchDown) {
                        logger.add(LogType.UI, "用户正在滑动，打断长按判定。")
                        this.tags.msgTouch.msgOnTouchDown = false
                    }
                }
                if (dy < sender.offsetHeight / 3 && dy < 40) {
                    this.tags.msgTouch.onMove = 'on'
                    if (x < -10) {
                        // 左滑
                        if (dx >= sender.offsetWidth / 3) {
                            this.tags.msgTouch.onMove = 'right'
                            logger.add(LogType.UI, "触发右滑判定 ……（转发）")
                        } else {
                            sender.style.transform = "translate(" + (Math.sqrt(dx) + 5) + "px)"
                            sender.style.transition = "transform 0s"
                        }
                    } else if (x > 10) {
                        // 右滑
                        if (dx >= sender.offsetWidth / 3) {
                            this.tags.msgTouch.onMove = 'left'
                            logger.add(LogType.UI, "触发左滑判定 ……（回复）")
                        } else {
                            sender.style.transform = "translate(-" + (Math.sqrt(dx) + 5) + "px)"
                            sender.style.transition = "transform 0s"
                        }
                    }
                } else {
                    this.tags.msgTouch.onMove = 'no'
                    sender.style.transform = "translate(0px)"
                }
            }
        },

        /**
         * 消息触屏结束
         * @param event 触摸事件
         * @param msg 消息对象
         */
        msgMoveEnd (event: Event, msg: any) {
            const sender = event.currentTarget as HTMLDivElement
            sender.style.transform = 'translate(0px)'
            // 判断操作
            if (this.tags.msgTouch.onMove == 'left') {
                // 左滑回复
                this.selectedMsg = msg
                this.replyMsg(false)
            } else if (this.tags.msgTouch.onMove == 'right') {
                // 右滑转发
            }
            // 重置数据
            const data = (this as any).$options.data(this)
            this.tags.msgTouch = data.tags.msgTouch
        },
        
        /**
         * 获取显示群精华消息
         */
        showJin () {
            this.details[2].open = !this.details[2].open
            if (runtimeData.chatInfo.info.jin_info.data.msg_list.length == 0) {
                const url = `https://qun.qq.com/cgi-bin/group_digest/digest_list?bkn=${runtimeData.loginInfo.bkn}&group_code=${this.chat.show.id}&page_start=0&page_limit=40`
                Connector.send(
                    'http_proxy',
                    { 'url': url },
                    'getJin'
                )
            }
            this.tags.showMoreDetail = !this.tags.showMoreDetail
        },

        /**
         * 精华消息滚动事件
         */
        jinScroll (event: Event) {
            const body = event.target as HTMLDivElement
            // 滚动到底部，加载更多
            if (body.scrollTop + body.clientHeight === body.scrollHeight && !this.tags.isJinLoading) {
                if (this.chat.info.jin_info.retcode == 0 && this.chat.info.jin_info.data.is_end == false) {
                    this.tags.isJinLoading = true
                    const url = `https://qun.qq.com/cgi-bin/group_digest/digest_list?bkn=${runtimeData.loginInfo.bkn}&group_code=${this.chat.show.id}&page_start=${(this.chat.info.jin_info.data.msg_list.length) / 40 + 1}&page_limit=40`
                    Connector.send(
                        'http_proxy',
                        { 'url': url },
                        'getJin'
                    )
                }
            }
        },

        /**
         * 更多功能按钮被点击
         */
        moreFunClick () {
            let hasOpen = false
            // 关闭所有其他的已打开的更多功能弹窗
            this.details.forEach((item) => {
                if(item.open) hasOpen = true
                item.open = false
            })
            // 如果有关闭操作，就不打开更多功能菜单
            if(!hasOpen) {
                this.tags.showMoreDetail = !this.tags.showMoreDetail
            }
        }
    },
    watch: {
        chat () {
            // 重置部分状态数据
            const data = (this as any).$options.data(this)
            this.tags = data.tags
            this.msgMenus = data.msgMenus
            this.sendCache = []
            this.imgCache = [] as string[]
            this.initMenuDisplay()
        }
    },
    mounted() {
        // 消息列表刷新
        this.updateList(this.list.length, 0)
        // PS：由于监听 list 本身返回的新旧值是一样，于是监听 length（反正也只要知道长度）
        this.$watch(() => this.list.length, this.updateList)
        //精华消息列表刷新
        this.$watch(() => this.chat.info.jin_info.data.msg_list.length, () => {
            this.tags.isJinLoading = false
        })
    }
})
</script>

<style scoped>
/* 消息移除动画 */
.msglist-move {
    transition: all .5s;
}

.msglist-leave-active {
    display: none;
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
