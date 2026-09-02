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
    <div id="chat-pan"
        v-move="chatMoveOptions"
        :class="'chat-pan' +
            (uiStore.openSideBar ? ' open' : '') +
            (['linux', 'win32'].includes(backend.platform ?? '') ? ' withBar' : '')"
        :style="{
            'background-image': toBackgroundImageStyle(!settingsStore.sysConfig.chat_more_blur ? settingsStore.sysConfig.chat_background : ''),
            'background-position': settingsStore.sysConfig.chat_background_align ?? 'center',
            'background-size': settingsStore.sysConfig.chat_background_fit ?? 'cover'
        }"
        @v-move-right.prevent="exitWin()">
        <slot name="chat-extra" />
        <!-- 聊天基本信息 -->
        <div class="info">
            <font-awesome-icon class="back" :icon="['fas', 'angle-left']" @click="exitWin" />
            <img :src="chat.show.avatar">
            <div class="info">
                <p>
                    {{ chat.show.name }}
                    <template
                        v-if="chat.show.type == 'group'">
                        ({{
                            chat.info.group_members.length
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
        <div :class=" 'loading' + (uiStore.nowGetHistory && uiStore.canLoadHistory ? ' show' : '')">
            <font-awesome-icon :icon="['fas', 'spinner']" />
            <span>{{ $t('加载中') }}</span>
        </div>
        <!-- 消息显示区 -->
        <div id="msgPan" ref="msgPan" class="chat"
            style="scroll-behavior: smooth"
            @scroll="chatScroll($event, details[3].open)">
            <template v-if="!details[3].open">
                <div v-if="!uiStore.canLoadHistory" class="note note-nomsg">
                    <hr>
                    <a>{{ $t('没有更多消息了') }}</a>
                </div>
                <div v-if="uiStore.loadHistoryFail" class="note note-nomsg">
                    <hr>
                    <a>{{ $t('获取历史记录失败') }}</a>
                </div>
                <!-- 时间戳，在下滑加载的时候会显示，方便在大段的相连消息上让用户知道消息时间 -->
                <NoticeBody v-if="uiStore.nowGetHistory && list.length > 0"
                    :data="{ sub_type: 'time', time: list[0].time }" />
                <TransitionGroup :name="settingsStore.sysConfig.opt_fast_animation ? '' : 'msglist'" tag="div">
                    <template v-for="(msgIndex, index) in list">
                        <!-- 时间戳 -->
                        <NoticeBody
                            v-if="isShowTime(list[Number(index) - 1] ? list[Number(index) - 1].time : undefined, msgIndex.time)"
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
                            :image-list-header="chatImg"
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
            </template>
            <template v-else>
                <!-- 搜索消息结果显示 -->
                <TransitionGroup
                    :name="settingsStore.sysConfig.opt_fast_animation ? '' : 'msglist'"
                    tag="div">
                    <template v-for="(msgIndex, index) in tags.search.list">
                        <!-- 时间戳 -->
                        <NoticeBody
                            v-if="isShowTime(list[Number(index) - 1] ? list[Number(index) - 1].time : undefined, msgIndex.time)"
                            :key="'notice-time-' + index"
                            :data="{ sub_type: 'time', time: msgIndex.time }" />
                        <!-- 消息体 -->
                        <MsgBody v-if=" (msgIndex.post_type === 'message' ||
                                     msgIndex.post_type === 'message_sent') &&
                                     msgIndex.message.length > 0"
                            :key="msgIndex.fake_message_id ?? msgIndex.message_id"
                            :selected="multipleSelectList.includes(msgIndex.message_id) || tags.menuDisplay.menuSelectedMsgId == msgIndex.message_id"
                            :data="msgIndex"
                            @scroll-to-msg="scrollToMsg"
                            @show-menu="showMsgMeun"
                            @image-loaded="imgLoadedScroll"
                            @left-move="replyMsg" />
                    </template>
                </TransitionGroup>
            </template>
            <span ref="chatPadding" class="chat-padding">&nbsp;</span>
        </div>
        <!-- 滚动到底部悬浮标志 -->
        <div class="new-msg"
            :style="{ 'opacity': tags.showBottomButton ? 1 : 0 }"
            @click="scrollBottom(true)">
            <div class="ss-card">
                <font-awesome-icon :icon="['fas', 'comment']" />
                <span v-if="NewMsgNum > 0">{{ NewMsgNum }}</span>
            </div>
        </div>
        <!-- 底部区域 -->
        <div id="send-more" ref="sendMore" class="more">
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
                        <div v-show="details[2].open && chat.info.jin_info.list.length > 0"
                            class="ss-card jin-pan">
                            <div>
                                <font-awesome-icon :icon="['fas', 'message']" />
                                <span>{{ $t('精华消息') }}</span>
                                <font-awesome-icon :icon="['fas', 'xmark']" @click="details[2].open = !details[2].open" />
                            </div>
                            <div
                                class="jin-pan-body"
                                @scroll="jinScroll">
                                <div v-for="(item, index) in chat.info.jin_info.list"
                                    :key="'jin-' + index">
                                    <div>
                                        <img :src="`https://q1.qlogo.cn/g?b=qq&s=0&nk=${item.sender_uin}`">
                                        <div>
                                            <a>{{ item.sender_nick }}</a>
                                            <span>{{ item.sender_time ? Intl.DateTimeFormat(
                                                      trueLang,
                                                      {
                                                          hour: 'numeric',
                                                          minute: 'numeric',
                                                      },
                                                  ).format(new Date(item.sender_time * 1000))
                                                      : '' }}
                                                {{ $t('发送') }}</span>
                                        </div>
                                        <span>{{
                                            $t('{time}，由 {name} 设置', {
                                                time: item.sender_time ? Intl.DateTimeFormat(
                                                    trueLang,
                                                    {
                                                        hour: 'numeric',
                                                        minute: 'numeric',
                                                    },
                                                ).format(new Date(item.sender_time * 1000)) : '',
                                                name: item.add_digest_nick,
                                            })
                                        }}</span>
                                    </div>
                                    <div class="context">
                                        <template
                                            v-for="(context, indexc) in item.msg_content"
                                            :key="'jinc-' + index + '-' + indexc">
                                            <span v-if="context.type === 'text'">
                                                {{ context.data.text }}
                                            </span>
                                            <EmojiFace v-if="context.type === 'face'"
                                                :emoji="Emoji.get(Number(context.data.id))" />
                                            <img v-if="context.type === 'image'"
                                                :src="context.data.url"
                                                @click="viewerEssImg(context.data.url)">
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
                        <font-awesome-icon :icon="['fas', 'share-from-square']" @click="showForWard('individual-messages')" />
                        <span>{{ $t('逐条转发') }}</span>
                    </div>
                    <div>
                        <font-awesome-icon :icon="['fas', 'share']" @click="showForWard('merged-messages')" />
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
                        <font-awesome-icon :icon="['fas', 'xmark']" @click="recallMsgs" />
                        <span>{{ $t('撤回') }}</span>
                    </div>
                    <div>
                        <span @click="multipleSelectList = []">{{ multipleSelectList.length }}</span>
                        <span>{{ $t('取消') }}</span>
                    </div>
                </div>
                <!-- 图片指示器 -->
                <Transition name="img-pan">
                    <div v-show="imgCache.size > 0"
                        :class="{
                            'img-pan': true,
                            'ss-card': true,
                        }"
                        @wheel="($event.currentTarget as HTMLElement).scrollLeft += $event.deltaY">
                        <div class="imgs">
                            <div v-for="[key, value] in imgCache"
                                :key="'imgCache-' + key">
                                <div class="img-btns">
                                    <div @click="editImg(key)">
                                        <font-awesome-icon :icon="['fas', 'pencil']" />
                                    </div>
                                    <hr>
                                    <div @click="deleteImg(key)">
                                        <font-awesome-icon style="color: var(--color-red)" :icon="['fas', 'xmark']" />
                                    </div>
                                </div>
                                <div class="img">
                                    <img :src="value" :alt="`[SQ:${key}]`">
                                </div>
                                <span>#{{ key }}</span>
                            </div>
                        </div>
                    </div>
                </Transition>
                <!-- 搜索指示器 -->
                <div :class="details[3].open ? 'search-tag show' : 'search-tag'">
                    <font-awesome-icon :icon="['fas', 'search']" />
                    <span>{{ settingsStore.sysConfig.enable_local_history ? $t('搜索已保存的消息') : $t('搜索已加载的消息') }}</span>
                    <div @click="closeSearch">
                        <font-awesome-icon :icon="['fas', 'xmark']" />
                    </div>
                </div>
                <!-- 回复指示器 -->
                <div :class="tags.isReply ? 'replay-tag show' : 'replay-tag'">
                    <font-awesome-icon :icon="['fas', 'reply']" />
                    <span>{{
                        selectedMsg === null ?
                            '' : selectedMsg.sender.nickname + ': ' + getMsgRawTxt(selectedMsg)
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
                    <div v-for="(item, index) in atFindList != null ? atFindList : []"
                        :key="'atFind-' + item.user_id"
                        :class="{ selected: index === atSelectedIndex }"
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
                        <label for="choice-pic" class="sr-only">{{ $t('选择图片') }}</label>
                    </div>
                    <div
                        :title="$t('文件')"
                        @click="runSelectFile">
                        <font-awesome-icon :icon="['fas', 'folder']" />
                        <input id="choice-file" type="file"
                            style="display: none" @change="selectFile">
                        <label for="choice-file" class="sr-only">{{ $t('选择文件') }}</label>
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
                    @click="moreFunClick(settingsStore.sysConfig.quick_send)">
                    <font-awesome-icon v-if="tags.showMoreDetail || details.find(item => item.open)" :icon="['fas', 'minus']" />
                    <font-awesome-icon v-else-if="settingsStore.sysConfig.quick_send == 'default'" :icon="['fas', 'plus']" />
                    <font-awesome-icon v-else-if="settingsStore.sysConfig.quick_send == 'img'" :icon="['fas', 'image']" />
                    <font-awesome-icon v-else-if="settingsStore.sysConfig.quick_send == 'file'" :icon="['fas', 'folder']" />
                    <font-awesome-icon v-else-if="settingsStore.sysConfig.quick_send == 'face'" :icon="['fas', 'face-laugh']" />
                </div>
                <div>
                    <form @submit="mainSubmit">
                        <template v-if="!Option.get('use_breakline')">
                            <label for="main-input" class="sr-only">{{ $t('消息输入框') }}</label>
                            <input
                                id="main-input"
                                ref="mainInput"
                                v-model="msg"
                                type="text"
                                autocomplete="off"
                                :disabled="uiStore.openSideBar || chat.info.me_info.shut_up_timestamp > 0"
                                :placeholder="
                                    chat.info.me_info.shut_up_timestamp > 0
                                        ? $t('已被禁言至：{time}', {
                                            time: Intl.DateTimeFormat(
                                                trueLang, getTimeConfig(
                                                    new Date(chat.info.me_info.shut_up_timestamp * 1000),
                                                ),
                                            ).format(new Date(chat.info.me_info.shut_up_timestamp * 1000)),
                                        }) : ''"
                                @paste="addImg"
                                @keydown="mainAtKey"
                                @keyup="mainKeyUp"
                                @click="selectSQIn"
                                @input="handleInput">
                        </template>
                        <template v-else>
                            <label for="main-input-ex" class="sr-only">{{ $t('消息输入框') }}</label>
                            <textarea id="main-input-ex"
                                ref="mainInput"
                                v-model="msg"
                                type="text"
                                :disabled="uiStore.openSideBar"
                                @paste="addImg"
                                @keydown="mainKey"
                                @keyup="mainKeyUp"
                                @click="selectSQIn"
                                @input="handleInput"
                                @compositionstart="handleCompositionStart"
                                @compositionend="handleCompositionEnd" />
                        </template>
                    </form>
                    <slot name="main-input-button" />
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
        <!-- 消息右击菜单 -->
        <Teleport to="body">
            <div :class="'msg-menu' + (['linux', 'win32'].includes(backend.platform ?? '') ? ' withBar' : '')">
                <div v-show="tags.showMsgMenu" class="msg-menu-bg" @click="closeMsgMenu" />
                <div id="msgMenu" :class="tags.showMsgMenu ?
                    'ss-card msg-menu-body show' : 'ss-card msg-menu-body'">
                    <div v-if="chatStore.chatInfo.show.type == 'group'"
                        v-show="tags.menuDisplay.showRespond"
                        :class="'ss-card respond' + (tags.menuDisplay.respond ? ' open' : '')">
                        <template v-for="(num, index) in Emoji.responseId" :key="'respond-' + num">
                            <EmojiFace :emoji="Emoji.get(num)!"
                                @click="sendRespond(num)" />
                            <font-awesome-icon v-if="index == 4" :icon="['fas', 'angle-up']"
                                @click="tags.menuDisplay.respond = true" />
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
                    <div v-show="tags.menuDisplay.copyImg" @click="copyImg">
                        <div><font-awesome-icon :icon="['fas', 'object-ungroup']" /></div>
                        <a>{{ $t('复制图片') }}</a>
                    </div>
                    <div v-show="tags.menuDisplay.downloadImg != false" @click="downloadImg">
                        <div><font-awesome-icon :icon="['fas', 'floppy-disk']" /></div>
                        <a>{{ $t('下载图片') }}</a>
                    </div>
                    <div v-show="tags.menuDisplay.revoke" @click="revokeMsg">
                        <div><font-awesome-icon :icon="['fas', 'xmark']" /></div>
                        <a>{{ $t('撤回') }}</a>
                    </div>
                    <div v-show="tags.menuDisplay.reedit" @click="reeditMsg">
                        <div><font-awesome-icon :icon="['fas', 'pencil']" /></div>
                        <a>{{ $t('重新编辑') }}</a>
                    </div>
                    <div v-show="tags.menuDisplay.at"
                        @click="selectedMsg ? addSpecialMsg({ msgObj: { type: 'at', qq: Number(selectedMsg.sender.user_id) }, addText: true, }): '';
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
                    <div v-show="isDev" @click="consoleLogMsg">
                        <div><font-awesome-icon :icon="['fas', 'screwdriver-wrench']" /></div>
                        <a>{{ $t('调试信息') }}</a>
                    </div>
                </div>
            </div>
        </Teleport>
        <!-- 群 / 好友信息弹窗 -->
        <Transition name="chat-info-float" :duration="{ enter: 300, leave: 200 }">
            <Info ref="infoRef" :chat="chat" :tags="tags"
                @close="openChatInfoPan" />
        </Transition>
        <!-- 转发面板 -->
        <Transition>
            <div v-if="tags.showForwardPan" class="forward-pan">
                <div class="ss-card card">
                    <header>
                        <span>{{ $t('转发消息') }}</span>
                        <font-awesome-icon :icon="['fas', 'xmark']" @click="cancelForward" />
                    </header>
                    <label for="chat-forward-search" class="sr-only">{{ $t('搜索转发对象') }}</label>
                    <input id="chat-forward-search" :placeholder="$t('搜索 ……')" @input="searchForward">
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
            'backdrop-filter': `blur(${!settingsStore.sysConfig.chat_more_blur ? settingsStore.sysConfig .chat_background_blur : 0}px)`
        }" />
    </div>
</template>

<script setup lang="ts">
import app from '@renderer/main'
import { i18n } from '@renderer/main'
import SendUtil from '@renderer/function/sender'
import Option, { get } from '@renderer/function/option'
import Info from '@renderer/pages/Info.vue'
import MsgBody from '@renderer/components/MsgBody.vue'
import NoticeBody from '@renderer/components/NoticeBody.vue'
import FacePan from '@renderer/components/FacePan.vue'
import MergePan from '@renderer/components/MergePan.vue'
import imageCompression from 'browser-image-compression'

import {
    ref,
    watch,
    onMounted,
    onBeforeUnmount,
    markRaw,
    nextTick,
    reactive,
    inject,
    toRaw,
    useTemplateRef,
} from 'vue'
import { v4 as uuid } from 'uuid'
import {
	scrollToMsg,
    downloadFile,
    loadHistory as loadHistoryFirst,
    shouldAutoFocus,
	vMenu,
	vMove,
	VMoveOptions,
} from '@renderer/function/utils/appUtil'
import {
    copyToClipboard,
    getTimeConfig,
    getTrueLang,
    getViewTime,
} from '@renderer/function/utils/systemUtil'
import {
    getMsgRawTxt,
    sendMsgRaw,
    getShowName,
    isShowTime,
    isDeleteMsg,
    getImageUrlData,
    getDifferencesWithRanges
} from '@renderer/function/utils/msgUtil'
import { Logger, LogType, PopInfo, PopType } from '@renderer/function/base'
import { Connector } from '@renderer/function/connect'
import {
    BaseChatInfoElem,
    MsgItemElem,
    SQCodeElem,
    GroupMemberInfoElem,
    UserFriendElem,
    UserGroupElem,
    MenuEventData,
} from '@renderer/function/elements/information'
import { backend } from '@renderer/runtime/backend'
import { toBackgroundImageStyle } from '@renderer/function/utils/backgroundUtil'
import { dbGetBefore, dbGetBeforeByTime, dbSearchMessages } from '@renderer/function/utils/localHistoryUtil'
import Emoji from '@renderer/function/model/emoji'
import EmojiFace from '@renderer/components/EmojiFace.vue'
import { Img } from '@renderer/function/model/img'
import { useSessionHistoryStore } from '@renderer/state/sessionHistory'
import { useConnectionStore } from '@renderer/state/connection'
import { useUIStore } from '@renderer/state/ui'
import { useSettingsStore } from '@renderer/state/settings'
import { useAuthStore } from '@renderer/state/auth'
import { useChatStore } from '@renderer/state/chat'
import { useContactStore } from '@renderer/state/contact'
import {
    addUploadTask,
    beginUploadFinalization,
    completeUploadTask,
    failUploadTask,
} from '@renderer/components/FileManager.vue'
import {
    arrayBufferToBase64,
    getOneBotResponseError,
    uploadFileStream,
} from '@renderer/function/utils/fileTransferUtil'

defineOptions({ name: 'ViewChat' })

const $t = i18n.global.t
const { viewer: viewerRef } = inject<{ viewer: any }>('viewer', { viewer: null })

const { chat, list } = defineProps<{
    chat: any
    list: any[]
    imgView?: any
}>()

const connectionStore = useConnectionStore()
const uiStore = useUIStore()
const settingsStore = useSettingsStore()
const authStore = useAuthStore()
const chatStore = useChatStore()
const contactStore = useContactStore()
const mergePan = useTemplateRef<InstanceType<typeof MergePan>>('mergePan')
const msgPan = useTemplateRef<HTMLDivElement>('msgPan')
const chatPadding = useTemplateRef<HTMLSpanElement>('chatPadding')
const sendMore = useTemplateRef<HTMLDivElement>('sendMore')
const mainInput = useTemplateRef<HTMLInputElement | HTMLTextAreaElement>('mainInput')

type ForwardAction = 'single-message' | 'individual-messages' | 'merged-messages'

const multipleSelectList = ref<string[]>([])
const selectedForwardAction = ref<ForwardAction>('single-message')
const tags = ref({
    sendTag: 'REFUSE' as 'READY' | 'PASS' | 'REFUSE',
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
        copyImg: false,
        downloadImg: false as string | false,
        revoke: false,
        reedit: false,
        at: true,
        poke: false,
        remove: false,
        respond: false,
        showRespond: true,
        config: false,
    },
    search: {
        userId: -1,
        list: reactive(list),
    },
    msgTouch: {
        x: -1,
        y: -1,
        msgOnTouchDown: false,
        onMove: 'no',
    },
    checkNewLineFlag: false,
})
const details = ref([
    { open: false },
    { open: false },
    { open: false },
    { open: false },
])
const msgMenus = ref<any[]>([])
const NewMsgNum = ref(0)
const msg = ref('')
const oldMsg = ref('')
const imgCache = ref(new Map<number, string>())
const sendCache = ref<MsgItemElem[]>([])
const selectedMsg = ref<{ [key: string]: any } | null>(null)
const selectCache = ref('')
const atFindList = ref<GroupMemberInfoElem[] | null>(null)
const atSelectedIndex = ref(0)
const atScrollTimer = ref<NodeJS.Timeout | null>(null)
const atScrollInterval = ref<NodeJS.Timeout | null>(null)
const searchDebounceTimer = ref<NodeJS.Timeout | null>(null)
const searchRequestId = ref(0)
const forwardList = ref(contactStore.userList)
const chatImg = ref<any>(undefined)
const trueLang = getTrueLang()
const isDev = import.meta.env.DEV

//#region == 窗口移动相关 ==================================================
const chatMoveOptions: VMoveOptions<HTMLDivElement> = {
    beforeHook: (_) => {
        const target = getTargetWin()
        if (!target) return
        target.style.transition = 'all 0s'
        const pan = document.getElementById('chat-pan')
        if (!pan) return
        const chatEl = pan.getElementsByClassName('chat')[0] as HTMLDivElement
        if(chatEl)
            chatEl.style.overflowY = 'hidden'
    },
    moveHook: (_, move: number) => {
        const target = getTargetWin()
        if (!target) return
        target.style.transform = 'translateX(' + move + 'px)'
    },
    endHook: (_) => {
        const pan = document.getElementById('chat-pan')
        const chatEl = pan?.getElementsByClassName('chat')[0] as HTMLDivElement
        if(chatEl) {
            chatEl.style.overflowY = 'scroll'
        }
        const target = getTargetWin()
        if (!target) return
        target.style.transition = 'transform 0.3s'
        target.style.transform = ''
    },
    rightLimit: {
        value: 100,
        type: '%',
    },
    speedCondition: {
        minMove: {
            value: 0.5 * uiStore.inch,
            type: 'px',
        },
        minSpeed: 5 * uiStore.inch,
    },
    moveCondition: {
        minMove: {
            value: 33,
            type: '%',
        }
    },
}
//#endregion

function resetState() {
    tags.value = {
        sendTag: 'REFUSE',
        showBottomButton: true,
        showMoreDetail: false,
        showMsgMenu: false,
        showForwardPan: false,
        openChatInfo: false,
        isReply: false,
        isJinLoading: false,
        onAtFind: false,
        menuDisplay: {
            menuSelectedMsgId: null,
            jumpToMsg: false,
            add: true,
            relpy: true,
            forward: true,
            select: true,
            copy: true,
            copySelect: false,
            copyImg: false,
            downloadImg: false,
            revoke: false,
            reedit: false,
            at: true,
            poke: false,
            remove: false,
            respond: false,
            showRespond: true,
            config: false,
        },
        search: {
            userId: -1,
            list: reactive(list),
        },
        msgTouch: {
            x: -1,
            y: -1,
            msgOnTouchDown: false,
            onMove: 'no',
        },
        checkNewLineFlag: false,
    }
    msgMenus.value = []
}

watch(() => chat, () => {
    resetState()
    sendCache.value = []
    imgCache.value.clear()
    multipleSelectList.value = []
    initMenuDisplay()
    nextTick(() => {
        scheduleResizeMainInput()
    })
    const history = useSessionHistoryStore()
    const sessionId = chat.show.id
    const session = [...contactStore.userList].find(i => (i.user_id ?? i.group_id) === sessionId)
    if (session) history.add(session)
})

watch(() => msg.value, (_newMsg, oldMsgVal) => {
    oldMsg.value = oldMsgVal
    scheduleResizeMainInput()
})

onMounted(() => {
    const history = useSessionHistoryStore()
    const sessionId = chat.show.id
    const session = [...contactStore.userList].find(i => (i.user_id ?? i.group_id) === sessionId)
    if (session) history.add(session)

    updateList(list.length, 0)
    watch(() => list.map((item) => item.message_id + '_' + item.fake_msg),
        (newIds, oldIds = []) => {
            updateList(newIds.length, oldIds.length)
        },
    )
    watch(() => chat.info.jin_info.list.length, () => {
            tags.value.isJinLoading = false
        },
    )
    if(backend.type == 'capacitor' && backend.platform === 'android') {
        backend.addListener('App', 'backButton', () => {
            exitWin()
        })
    }
    watch(() => connectionStore.backTimes, () => {
        exitWin()
    })
    nextTick(() => {
        setupChatPaddingObserver()
        scheduleResizeMainInput()
    })
})

onBeforeUnmount(() => {
    if (resizeMainInputFrame !== null) {
        cancelAnimationFrame(resizeMainInputFrame)
        resizeMainInputFrame = null
    }
    if (chatPaddingFrame !== null) {
        cancelAnimationFrame(chatPaddingFrame)
        chatPaddingFrame = null
    }
    if (sendMoreResizeObserver !== null) {
        sendMoreResizeObserver.disconnect()
        sendMoreResizeObserver = null
    }
})

let resizeMainInputFrame: number | null = null
let chatPaddingFrame: number | null = null
let sendMoreResizeObserver: ResizeObserver | null = null
let chatPaddingAfterUpdate: Array<() => void> = []
// scrollHeight includes a small browser-dependent inner gap for this textarea style.
// Keep the existing compact visual height, but make the adjustment explicit.
const TEXTAREA_SCROLL_HEIGHT_COMPACT_OFFSET = 4

function scheduleResizeMainInput(target?: HTMLTextAreaElement | HTMLInputElement | null, keepBottom = false) {
    // The template switches between input and textarea, so measure only after Vue
    // has applied the branch and coalesce rapid input changes into one frame.
    nextTick(() => {
        if (resizeMainInputFrame !== null) {
            cancelAnimationFrame(resizeMainInputFrame)
        }
        resizeMainInputFrame = requestAnimationFrame(() => {
            resizeMainInputFrame = null
            resizeMainInput(target ?? mainInput.value)
            scheduleChatPaddingUpdate(keepBottom ? () => scrollBottom() : undefined)
        })
    })
}

function updateChatPadding() {
    const morePan = sendMore.value
    const padding = chatPadding.value
    const chatPan = msgPan.value
    if (!morePan || !padding || !chatPan) return

    const contentBlocks = Array.from(morePan.children)
        .flatMap(child => Array.from(child.children))
        .filter((child): child is HTMLElement =>
            child instanceof HTMLElement && child.offsetHeight > 0,
        )
    const contentTop = contentBlocks.length > 0? contentBlocks.reduce(
            (top, child) => Math.min(top, child.getBoundingClientRect().top),
            Number.POSITIVE_INFINITY,
        ): morePan.getBoundingClientRect().top
    const chatBottom = chatPan.getBoundingClientRect().bottom
    padding.style.height = Math.max(0, chatBottom - contentTop) + 'px'
}

function scheduleChatPaddingUpdate(afterUpdate?: () => void) {
    if (afterUpdate) {
        chatPaddingAfterUpdate.push(afterUpdate)
    }
    if (chatPaddingFrame !== null) {
        return
    }
    chatPaddingFrame = requestAnimationFrame(() => {
        chatPaddingFrame = null
        updateChatPadding()
        const callbacks = chatPaddingAfterUpdate
        chatPaddingAfterUpdate = []
        callbacks.forEach(callback => callback())
    })
}

function setupChatPaddingObserver() {
    if (sendMoreResizeObserver !== null) return
    const morePan = sendMore.value
    if (!morePan || typeof ResizeObserver === 'undefined') {
        scheduleChatPaddingUpdate()
        return
    }
    sendMoreResizeObserver = new ResizeObserver(() => {
        scheduleChatPaddingUpdate()
    })
    sendMoreResizeObserver.observe(morePan)
    scheduleChatPaddingUpdate()
}

function resizeMainInput(target?: HTMLTextAreaElement | HTMLInputElement | null) {
    const input = target ?? mainInput.value
    if (!input) return
    if (!Option.get('use_breakline')) {
        input.style.height = ''
        return
    }
    if (!(input instanceof HTMLTextAreaElement)) {
        input.style.height = ''
        return
    }
    const computed = getComputedStyle(input)
    const lineHeight = Number.parseFloat(computed.lineHeight)
    const fontSize = Number.parseFloat(computed.fontSize)
    const baseLineHeight = Number.isFinite(lineHeight) ? lineHeight : fontSize
    const paddingTop = Number.parseFloat(computed.paddingTop) || 0
    const paddingBottom = Number.parseFloat(computed.paddingBottom) || 0
    const borderTop = Number.parseFloat(computed.borderTopWidth) || 0
    const borderBottom = Number.parseFloat(computed.borderBottomWidth) || 0
    let minHeight = (Number.isFinite(baseLineHeight) ? baseLineHeight : 0) + paddingTop + paddingBottom + borderTop + borderBottom
    if (minHeight <= 0) {
        const fallback = input.offsetHeight || Number.parseFloat(computed.height) || fontSize
        if (fallback && Number.isFinite(fallback)) {
            minHeight = fallback
        }
    }
    if (!input.dataset.baseHeight) {
        input.dataset.baseHeight = String(minHeight)
    }

    const oldTransition = input.style.transition
    input.style.transition = 'none'
    const oldOverflow = input.style.overflow

    const baseHeight = Number.parseFloat(input.dataset.baseHeight) || minHeight
    // Fast-path: if content is empty, reset directly to baseHeight without measuring
    if (input.value === '') {
        input.style.height = baseHeight + 'px'
    } else {
        // Set overflow:hidden so scrollHeight correctly reflects content height
        input.style.overflow = 'hidden'
        input.style.height = '0px'
        const targetHeight = Math.max(input.scrollHeight - TEXTAREA_SCROLL_HEIGHT_COMPACT_OFFSET, baseHeight)
        input.style.height = targetHeight + 'px'
        input.style.overflow = oldOverflow
    }

    input.getBoundingClientRect()
    input.style.transition = oldTransition
}
function jumpSearchMsg() {
    closeSearch()
    setTimeout(() => {
        if (!selectedMsg.value) return
        scrollToMsg('chat-' + selectedMsg.value?.message_id, true)
        closeMsgMenu()
    }, 100)
}

function chatScroll(event: Event, pass: boolean) {
    if(pass) return

    const body = event.target as HTMLDivElement
    if (body.scrollTop === 0 && list.length > 0) {
        loadMoreHistory()
    }
    if ((body.scrollTop + body.clientHeight + 10) >= body.scrollHeight) {
        NewMsgNum.value = 0
        tags.value.showBottomButton = false
    }
    if (
        body.scrollTop <
            body.scrollHeight - body.clientHeight * 2 &&
        tags.value.showBottomButton !== true
    ) {
        tags.value.showBottomButton = true
    }
}

async function loadMoreHistory() {
    if (
        !uiStore.nowGetHistory &&
        uiStore.canLoadHistory !== false
    ) {
        const firstMsgId = list[0].message_id
        const firstMsgTime = Number(list[0]?.time)
        const useMixedHistory =
            settingsStore.sysConfig.enable_local_history &&
            settingsStore.sysConfig.mixed_load_messages !== false
        uiStore.nowGetHistory = true
        if (useMixedHistory && Number.isFinite(firstMsgTime)) {
            uiStore.historyBeforeTime = firstMsgTime
        } else {
            uiStore.historyBeforeTime = undefined
        }
        uiStore.loadHistoryFail = false

        if (useMixedHistory) {
            let localMsgs = [] as any[]
            if (Number.isFinite(firstMsgTime)) {
                localMsgs = await dbGetBeforeByTime(
                    authStore.loginInfo.uin,
                    chatStore.chatInfo.show.id,
                    firstMsgTime,
                    20,
                )
            } else {
                localMsgs = await dbGetBefore(
                    authStore.loginInfo.uin,
                    chatStore.chatInfo.show.id,
                    firstMsgId,
                    20,
                )
            }
            if (localMsgs.length > 0) {
                const existingIds = new Set(chatStore.messageList.map((m) => String(m.message_id ?? '')))
                const addList = localMsgs.filter((m) => {
                    const msgId = String(m?.message_id ?? '')
                    return msgId.length === 0 || !existingIds.has(msgId)
                })
                if (addList.length > 0) {
                    chatStore.messageList.splice(0, 0, ...addList)
                }
                const boundary = list[addList.length] ?? list[addList.length - 1]
                const seqGapAnchors = detectSeqGaps([...addList, boundary])
                if (seqGapAnchors.length > 0) {
                    fillSeqGaps(seqGapAnchors)
                }
            }
        }

        const fullPage =
            authStore.jsonMap.message_list?.pagerType == 'full'
        const type = chatStore.chatInfo.show.type
        const id = chatStore.chatInfo.show.id
        let name
        if (authStore.jsonMap.message_list && type != 'group') {
            name = authStore.jsonMap.message_list.private_name
        } else {
            name = authStore.jsonMap.message_list.name
        }
        Connector.send(
            name ?? 'get_chat_history',
            {
                group_id: type == 'group' ? id : undefined,
                user_id: type != 'group' ? id : undefined,
                message_id: firstMsgId,
                count: fullPage? chatStore.messageList.length + 20: 20,
            },
            'getChatHistory',
        )
    }
}

function detectSeqGaps(msgs: any[]): string[] {
    const gaps: string[] = []
    for (let i = 0; i < msgs.length - 1; i++) {
        const seqA: number | null = msgs[i].message_seq ?? msgs[i].seq ?? null
        const seqB: number | null = msgs[i + 1].message_seq ?? msgs[i + 1].seq ?? null
        if (seqA == null || seqB == null) return []
        if (seqB - seqA > 1) {
            gaps.push(msgs[i + 1].message_id)
        }
    }
    return gaps
}

function fillSeqGaps(anchorMsgIds: string[]) {
    const type = chatStore.chatInfo.show.type
    const id = chatStore.chatInfo.show.id
    let name: string
    if (authStore.jsonMap.message_list && type != 'group') {
        name = authStore.jsonMap.message_list.private_name
    } else {
        name = authStore.jsonMap.message_list?.name
    }
    for (const anchorMsgId of anchorMsgIds) {
        Connector.send(
            name ?? 'get_chat_history',
            {
                group_id: type == 'group' ? id : undefined,
                user_id: type != 'group' ? id : undefined,
                message_id: anchorMsgId,
                count: 20,
            },
            'getChatHistoryGapFill_' + anchorMsgId,
        )
    }
}

function scrollTo(where: number | undefined, showAnimation = true) {
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
}

function scrollBottom(showAnimation = false) {
    const pan = document.getElementById('msgPan')
    if (pan !== null) {
        scrollTo(pan.scrollHeight, showAnimation)
    }
}

function scrollToMsgLocal(message_id: string) {
    if (!scrollToMsg(message_id, true)) {
        new PopInfo().add(PopType.INFO, $t('无法定位上下文'))
    }
}

function imgLoadedScroll(height: number) {
    const pan = document.getElementById('msgPan')
    if(pan) {
        if(list.length <= 20 && !tags.value.showBottomButton) {
            scrollBottom()
        } else {
            scrollTo(pan.scrollTop + height, false)
        }
    }
}

function mainKey(event: KeyboardEvent) {
    if (mainAtKey(event)) return

    if(tags.value.onAtFind) return
    if (event.key !== 'Enter') return
    let canSend = false
    switch (settingsStore.sysConfig.send_key) {
        case 'none':
            if (event.shiftKey) break
            if (event.ctrlKey) break
            if (event.altKey) break
            if (event.metaKey) break
            canSend = true
            break
        case 'shift':
            if (!event.shiftKey) break
            canSend = true
            break
        case 'ctrl':
            if (!event.ctrlKey) break
            canSend = true
            break
        case 'alt':
            if (!event.altKey) break
            canSend = true
            break
        case 'meta':
            if (!event.metaKey) break
            canSend = true
            break
    }

    if(canSend && tags.value.sendTag != 'PASS') {
        tags.value.sendTag = 'READY'
    }

    if (tags.value.sendTag == 'READY' && msg.value !== '') {
        event.preventDefault()
        sendMsg()
    } else {
        if(event.key === 'Enter' &&
            (event.ctrlKey || event.metaKey || event.altKey)) {
            msg.value += '\n'
        }
    }

    tags.value.sendTag = 'REFUSE'
}

function mainAtKey(event: KeyboardEvent) {
    if (!tags.value.onAtFind) return false

    if (event.keyCode === 38 || event.keyCode === 40) {
        event.preventDefault()
        const direction = event.keyCode === 38 ? -1 : 1
        moveAtSelection(direction)
        if (atScrollTimer.value !== null) return true
        atScrollTimer.value = setTimeout(() => {
            atScrollInterval.value = setInterval(() => {
                moveAtSelection(direction)
            }, 50)
        }, 300)
        return true
    }

    if (event.keyCode === 13) {
        event.preventDefault()
        const selectedMember = atFindList.value?.[atSelectedIndex.value]
        if (selectedMember) {
            choiceAt(selectedMember.user_id)
        }
        return true
    }

    if (event.keyCode === 27) {
        event.preventDefault()
        tags.value.onAtFind = false
        atFindList.value = null
        atSelectedIndex.value = 0
        return true
    }

    return false
}

function handleCompositionStart() {
    tags.value.sendTag = 'REFUSE'
}

function handleCompositionEnd() {
    tags.value.sendTag = 'PASS'
    setTimeout(() => { tags.value.sendTag = 'REFUSE' }, 50)
}

function mainKeyUp(event: KeyboardEvent) {
    const logger = new Logger()

    if (event.keyCode === 27) {
        return
    }

    if (event.keyCode === 38 || event.keyCode === 40) {
        if (atScrollTimer.value !== null) {
            clearTimeout(atScrollTimer.value)
            atScrollTimer.value = null
        }
        if (atScrollInterval.value !== null) {
            clearInterval(atScrollInterval.value)
            atScrollInterval.value = null
        }
    }

    if (tags.value.checkNewLineFlag){
        tags.value.checkNewLineFlag = false
        if (msg.value == '\n'){
            msg.value = ''
            scheduleResizeMainInput()
        }
    }

    if (tags.value.onAtFind && atFindList.value && atFindList.value.length > 0) {
        if (event.keyCode === 38 || event.keyCode === 40 || event.keyCode === 13 || event.keyCode === 27) {
            return
        }
    }

    if (event.keyCode != 13) {
        const lastInput = msg.value.substring(msg.value.length - 1)
        if (
            !tags.value.onAtFind &&
            lastInput == '@' &&
            chatStore.chatInfo.info.group_members.length > 0 &&
            chatStore.chatInfo.show.type == 'group'
        ) {
            logger.add(LogType.UI, '开始匹配群成员列表 ……')
            tags.value.onAtFind = true
            atSelectedIndex.value = 0
        }
        if (tags.value.onAtFind) {
            if (msg.value.lastIndexOf('@') < 0) {
                logger.add(LogType.UI, '匹配群成员列表被打断 ……')
                tags.value.onAtFind = false
                atFindList.value = null
                atSelectedIndex.value = 0
            } else {
                const atInfo = msg.value
                    .substring(msg.value.lastIndexOf('@') + 1)
                    .toLowerCase()
                atFindList.value = chatStore.chatInfo.info.group_members
                        .filter((item) => { return (
                                (item.card != '' && item.card != null && item.card.toLowerCase().indexOf(atInfo) >=0) ||
                                item.nickname.toLowerCase().indexOf(atInfo) >= 0 ||
                                atInfo ==item.user_id.toString()
                            )
                        },
                    )
                if (atFindList.value.length == 0) {
                    atFindList.value = chatStore.chatInfo.info.group_members
                }
                atSelectedIndex.value = 0
            }
        }
    }
}

function mainSubmit(event: Event) {
    event.preventDefault()
    if (msg.value != '') {
        sendMsg()
    }
}

function choiceAt(id: number | undefined) {
    if (id != undefined) {
        msg.value = msg.value.substring(0, msg.value.lastIndexOf('@'))
        addSpecialMsg({
            msgObj: { type: 'at', qq: Number(id) },
            addText: true,
        })
    }
    toMainInput()
    tags.value.onAtFind = false
    atFindList.value = null
    atSelectedIndex.value = 0
}

function scrollAtListToSelected() {
    nextTick(() => {
        const container = document.querySelector('.at-tag.show')
        const selectedItem = document.querySelector('.at-tag.show > div.selected')
        if (container && selectedItem) {
            const containerRect = container.getBoundingClientRect()
            const itemRect = selectedItem.getBoundingClientRect()
            if (itemRect.top < containerRect.top) {
                selectedItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
            } else if (itemRect.bottom > containerRect.bottom) {
                selectedItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
            }
        }
    })
}

function moveAtSelection(direction: number) {
    if (!atFindList.value || atFindList.value.length === 0) return
    if (direction === -1) {
        atSelectedIndex.value = atSelectedIndex.value > 0? atSelectedIndex.value - 1: atFindList.value.length - 1
    } else {
        atSelectedIndex.value = atSelectedIndex.value < atFindList.value.length - 1? atSelectedIndex.value + 1: 0
    }
    scrollAtListToSelected()
}

function selectSQIn() {
    const input = (document.getElementById( 'main-input') as HTMLTextAreaElement | HTMLInputElement | null) ??
        (document.getElementById( 'main-input-ex') as HTMLTextAreaElement | HTMLInputElement | null)
    if (
        input !== null &&
        input.selectionStart === input.selectionEnd
    ) {
        let cursurPosition = -1
        if (typeof input.selectionStart === 'number') {
            cursurPosition = input.selectionStart
        }
        const getSQCode = SendUtil.getSQList(msg.value)
        if (getSQCode != null) {
            getSQCode.forEach((item) => {
                const start = msg.value.indexOf(item)
                const end = start + item.length
                if (
                    start !== -1 &&
                    cursurPosition > start &&
                    cursurPosition < end
                ) {
                    nextTick(() => {
                        input.selectionStart = start
                        input.selectionEnd = end
                    })
                }
            })
        }
    }
}

function showMsgMeun(event: MenuEventData, data: any) {
    selectedMsg.value = data
    tags.value.menuDisplay.menuSelectedMsgId = data.message_id

    if (Option.get('log_level') === 'debug') {
        new Logger().debug('右击消息：' + data)
    }
    if (multipleSelectList.value.length > 0) {
        return
    }

    const menu = document.getElementById('msgMenu')
    const select = event.target as HTMLElement
    let selectUserType = 'member'
    if (
        chatStore.chatInfo.show.type == 'group' &&
        chatStore.chatInfo.info.group_members
    ) {
        chatStore.chatInfo.info.group_members.forEach(
            (item: any) => {
                if (item.user_id == data.sender.user_id) {
                    selectUserType = item.role
                }
            },
        )
    }

    if (menu !== null && data !== null) {
        if (get('close_respond') == true) {
            tags.value.menuDisplay.showRespond = false
        }
        if (
            select.nodeName == 'IMG' &&
            (select as HTMLImageElement).name == 'avatar'
        ) {
            Object.keys(tags.value.menuDisplay).forEach(
                (name: string) => {
                    (tags.value.menuDisplay as any)[name] = false
                },
            )
            tags.value.menuDisplay.showRespond = false
            tags.value.menuDisplay.at = true
            tags.value.menuDisplay.poke = true
            tags.value.menuDisplay.remove = true
            if (
                chatStore.chatInfo.show.type != 'group' ||
                data.sender.user_id === authStore.loginInfo.uin ||
                chatStore.chatInfo.info.me_info.role === 'member' ||
                selectUserType == 'owner' ||
                (selectUserType == 'admin' && chatStore.chatInfo.info.me_info.role != 'owner')
            ) {
                tags.value.menuDisplay.remove = false
            }
            if (data.sender.user_id === authStore.loginInfo.uin) {
                tags.value.menuDisplay.at = false
            }
            if(chatStore.chatInfo.show.type == 'group' &&
            chatStore.chatInfo.info.me_info.role != 'member') {
                tags.value.menuDisplay.config = true
            }
        } else {
            if (
                data.sender.user_id === authStore.loginInfo.uin ||
                chatStore.chatInfo.info.me_info.role ===
                    'admin' ||
                chatStore.chatInfo.info.me_info.role === 'owner'
            ) {
                tags.value.menuDisplay.revoke = true
            }
            tags.value.menuDisplay.reedit = tags.value.menuDisplay.revoke && data.sender.user_id === authStore.loginInfo.uin
            if (data.revoke === true) {
                tags.value.menuDisplay.relpy = false
                tags.value.menuDisplay.forward = false
                tags.value.menuDisplay.revoke = false
                tags.value.menuDisplay.select = false
            }
            if (details.value[3].open) {
                Object.keys(tags.value.menuDisplay).forEach(
                    (name: string) => {
                        (tags.value.menuDisplay as any)[name] = false
                    },
                )
                tags.value.menuDisplay.jumpToMsg = true
            }
            const selection = document.getSelection()
            const textBody = selection?.anchorNode?.parentElement
            let textMsg = null as HTMLElement | null
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
                selectCache.value = selection.toString()
                if (selectCache.value.length > 0) {
                    tags.value.menuDisplay.copySelect = true
                }
            }
            const nList = ['xml', 'json']
            data.message.forEach((item: any) => {
                if (nList.indexOf(item.type as string) > 0) {
                    tags.value.menuDisplay.forward = false
                    tags.value.menuDisplay.add = false
                }
            })
            if (select.nodeName == 'IMG' && (select as HTMLImageElement).src.length > 0) {
                tags.value.menuDisplay.downloadImg = (
                    select as HTMLImageElement
                ).src
                if (backend.isDesktop())
                    tags.value.menuDisplay.copyImg = true
            }
        }
        const pointX = event.x
        const pointY = event.y
        menu.style.marginLeft = pointX + 'px'
        menu.style.marginTop = pointY + 'px'
        let menuWidth = menu.clientWidth
        if (tags.value.menuDisplay.showRespond) {
            const item = menu.children[0] as HTMLDivElement
            menuWidth = item.clientWidth
        }
        const maxWidth = window.innerWidth
        if (pointX + menuWidth > maxWidth + 27) {
            menu.style.marginLeft = maxWidth + 7 - menuWidth + 'px'
        }
        tags.value.showMsgMenu = true
        setTimeout(() => {
            const menuHeight = menu.clientHeight
            const bodyHeight = document.body.clientHeight
            if (pointY + menuHeight > bodyHeight - 20) {
                menu.classList.add('topOut')
                menu.style.marginTop =
                    bodyHeight - menuHeight - 10 + 'px'
            }
        }, 100)
    }
}

function initMenuDisplay() {
    tags.value.menuDisplay = {
        menuSelectedMsgId : null,
        jumpToMsg: false,
        add: true,
        relpy: true,
        forward: true,
        select: true,
        copy: true,
        copySelect: false,
        downloadImg: false,
        copyImg: false,
        revoke: false,
        reedit: false,
        at: false,
        poke: false,
        remove: false,
        respond: false,
        showRespond: true,
        config: false,
    }
}

function menuReplyMsg(closeMenu = true) {
    const msgData = selectedMsg.value
    if (!msgData) return
    replyMsg(msgData)
    if (closeMenu) {
        closeMsgMenu()
    }
}

function replyMsg(msgData: any) {
    const msgId = msgData.message_id
    selectedMsg.value = msgData
    addSpecialMsg({
        msgObj: { type: 'reply', id: String(msgId) },
        addText: false,
        addTop: true,
    })
    tags.value.isReply = true
    toMainInput()
}

function cancelReply() {
    sendCache.value = sendCache.value.filter((item) => {
        return item.type !== 'reply'
    })
    tags.value.isReply = false
}

function consoleLogMsg() {
    if (!selectedMsg.value) return
    // eslint-disable-next-line no-console
    console.log(selectedMsg.value)
    closeMsgMenu()
}

function cancelForward() {
    forwardList.value = contactStore.userList
    tags.value.showForwardPan = false
    selectedForwardAction.value = 'single-message'
    closeMsgMenu()
}

function searchForward(event: Event) {
    const value = (event.target as HTMLInputElement).value
    forwardList.value = contactStore.userList.filter(
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
}

function showForWard(action: ForwardAction = 'single-message') {
    selectedForwardAction.value = action
    tags.value.showForwardPan = true
    const showList = [...contactStore.onMsgList].reverse()
    showList.forEach((item: any) => {
        const index = forwardList.value.indexOf(item)
        if (index > -1) {
            forwardList.value.splice(index, 1)
            forwardList.value.unshift(item)
        }
    })
    closeMsgMenu()
}

function forwardSelf() {
    if (selectedMsg.value) {
        const msgData = JSON.parse(JSON.stringify(selectedMsg.value))
        sendMsgRaw(
            chat.show.id,
            chat.show.type,
            msgData.message,
            true,
        )
    }
    closeMsgMenu()
}

function intoMultipleSelect() {
    if (selectedMsg.value) {
        multipleSelectList.value.push(selectedMsg.value.message_id)
    }
    closeMsgMenu()
}

function cloneMessagePayload<T>(payload: T): T {
    const rawPayload = toRaw(payload)
    if (typeof structuredClone === 'function') {
        try {
            return structuredClone(rawPayload)
        } catch {
            return JSON.parse(JSON.stringify(rawPayload))
        }
    }
    return JSON.parse(JSON.stringify(rawPayload))
}

function forwardMsg(data: UserFriendElem & UserGroupElem) {
    const forwardAction = selectedForwardAction.value
    const msgData = selectedMsg.value ? cloneMessagePayload(selectedMsg.value) : null
    const id = data.group_id ? data.group_id : data.user_id
    const targetId = String(id)
    const targetType = data.group_id ? 'group' : 'user'
    const msgList = chatStore.messageList.filter((item) => {
        return multipleSelectList.value.includes(item.message_id)
    })
    const shouldPreShow = () =>
        String(chat.show.id) === targetId && chat.show.type === targetType

    if (forwardAction !== 'single-message' && msgList.length === 0) {
        cancelForward()
        return
    }

    if (forwardAction === 'individual-messages') {
        const popInfo = {
            title: $t('逐条转发'),
            html: $t('将按顺序逐条转发 {count} 条消息，是否继续？', {
                count: msgList.length,
            }),
            button: [
                {
                    text: $t('取消'),
                    fun: () => {
                        uiStore.popBoxList.shift()
                    },
                },
                {
                    text: $t('确定'),
                    master: true,
                    fun: () => {
                        msgList.forEach((item) => {
                            sendMsgRaw(
                                targetId,
                                targetType,
                                cloneMessagePayload(item.message),
                                shouldPreShow(),
                            )
                        })
                        multipleSelectList.value = []
                        uiStore.popBoxList.shift()
                    },
                },
            ],
        }
        uiStore.popBoxList.push(popInfo)
    } else if (forwardAction === 'merged-messages') {
        const jsonMsg = {
            app: 'com.tencent.multimsg',
            meta: {
                detail: {
                    source: $t('合并转发消息'),
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
                    summary: $t('查看 {count} 条转发消息', { count: msgList.length }),
                    resid: '',
                },
            },
        }
        const previewMsg = {
            message: [
                { type: 'json', data: JSON.stringify(jsonMsg), id: '' },
            ],
            sender: {
                user_id: authStore.loginInfo.uin,
                nickname: authStore.loginInfo.nickname,
            }
        }
        const popInfo = {
            title: $t('合并转发消息'),
            template: markRaw(MsgBody),
            templateValue: markRaw({ data: previewMsg, type: 'forward' }),
            button: [
                {
                    text: $t('取消'),
                    fun: () => {
                        uiStore.popBoxList.shift()
                    },
                },
                {
                    text: $t('确定'),
                    master: true,
                    fun: () => {
                        const msgBody = msgList.map((item) => {
                            return {
                                type: 'node',
                                id: item.message_id,
                                user_id: item.sender.user_id,
                                nickname: item.sender.nickname,
                                content: cloneMessagePayload(item.message),
                            }
                        })
                        sendMsgRaw(
                            targetId,
                            targetType,
                            msgBody,
                            shouldPreShow(),
                        )
                        multipleSelectList.value = []
                        uiStore.popBoxList.shift()
                    },
                },
            ],
        }
        uiStore.popBoxList.push(popInfo)
    } else if (selectedMsg.value && msgData) {
        const popInfo = {
            title: $t('转发消息'),
            template: markRaw(MsgBody),
            templateValue: markRaw({ data: msgData, type: 'forward' }),
            button: [
                {
                    text: $t('取消'),
                    fun: () => {
                        uiStore.popBoxList.shift()
                    },
                },
                {
                    text: $t('确定'),
                    master: true,
                    fun: () => {
                        sendMsgRaw(
                            targetId,
                            targetType,
                            cloneMessagePayload(msgData.message),
                            shouldPreShow(),
                        )
                        uiStore.popBoxList.shift()
                    },
                },
            ],
        }
        uiStore.popBoxList.push(popInfo)
    }
    cancelForward()
    if(contactStore.baseOnMsgList.get(id) == undefined) {
        contactStore.baseOnMsgList.set(id, data)
    }
    nextTick(() => {
        const user = document.getElementById('user-' + id)
        if (user) {
            user.click()
        }
    })
}

function sendRespond(num: number) {
    const msgData = selectedMsg.value
    if (msgData !== null) {
        const msgId = msgData.message_id
        Connector.send(
            authStore.jsonMap.send_respond.name,
            {
                group_id: chat.show.id,
                message_id: msgId,
                emoji_id: String(num),
                code: String(num),
            },
            'SendRespondBack_' + msgId + '_' + num,
        )
    }
    closeMsgMenu()
}

function copyMsg() {
    const msgData = selectedMsg.value
    if (msgData !== null) {
        if (!msgData.raw_message) {
            msgData.raw_message = getMsgRawTxt(msgData)
        }
        const popInfo = new PopInfo()
        app.config.globalProperties.$copyText(msgData.raw_message).then(
            () => {
                popInfo.add(PopType.INFO, $t('复制成功'), true)
            },
            () => {
                popInfo.add(PopType.ERR, $t('复制失败'), true)
            },
        )
    }
    closeMsgMenu()
}

function copySelectMsg() {
    if (selectCache.value != '') {
        const popInfo = new PopInfo()
        app.config.globalProperties
            .$copyText(selectCache.value)
            .then(
                () => {
                    popInfo.add(PopType.INFO, $t('复制成功'), true)
                },
                () => {
                    popInfo.add(PopType.ERR, $t('复制失败'), true)
                },
            )
    }
    closeMsgMenu()
}

async function copyImg() {
    const url = tags.value.menuDisplay.downloadImg
    if (!url) return
    closeMsgMenu()
    const { blob, buffer } = await getImageUrlData(url)
    const popInfo = new PopInfo()
    if(backend.type === 'tauri') {
        try {
            const Clipboard = await import('@tauri-apps/plugin-clipboard-manager')
            await Clipboard.writeImage(buffer)
            popInfo.add(PopType.INFO, $t('复制成功'))
        } catch(e) {
            popInfo.add(PopType.ERR, $t('复制失败'))
            new Logger().error(e as unknown as Error, '复制图片失败')
        }
    } else {
        const item = new ClipboardItem({ [blob.type]: blob })
        try {
            await copyToClipboard([item])
            popInfo.add(PopType.INFO, $t('复制成功'))
        } catch (e) {
            popInfo.add(PopType.ERR, $t('复制失败'))
            new Logger().error(e as unknown as Error, '复制图片失败')
        }
    }
}

function downloadImg() {
    const url = tags.value.menuDisplay.downloadImg
    if (url != false) {
        downloadFile(url as string, `img_${new Date().getTime()}.png`, () => undefined, () => undefined)
    }
    closeMsgMenu()
}

async function revokeMsg() {
    const msgData = selectedMsg.value
    closeMsgMenu()
    if (!msgData) {
        new PopInfo().add(PopType.ERR, $t('获取选中消息失败'))
        return
    }
    const msgId = msgData.message_id
    await Connector.callApi('delete_msg', { message_id: msgId })
}

async function reeditMsg() {
    const msgData = selectedMsg.value
    closeMsgMenu()
    if (!msgData) {
        new PopInfo().add(PopType.ERR, $t('获取选中消息失败'))
        return
    }
    const msgId = msgData.message_id
    await Connector.callApi('delete_msg', { message_id: msgId })
    reedit(msgData)
}

function removeUser() {
    const msgData = selectedMsg.value
    if (msgData !== null) {
        const popInfo = {
            title: $t('提醒'),
            html: `<span>${$t('真的要将 {user} 移出群聊吗', { user: msgData.sender.nickname })}</span>`,
            button: [
                {
                    text: $t('确定'),
                    fun: () => {
                        if (msgData) {
                            Connector.send(
                                'set_group_kick',
                                {
                                    group_id:
                                                    chatStore.chatInfo.show
                                                        .id,
                                    user_id: msgData.sender.user_id,
                                },
                                'setGroupKick',
                            )
                            closeMsgMenu()
                            uiStore.popBoxList.shift()
                        }
                    },
                },
                {
                    text: $t('取消'),
                    master: true,
                    fun: () => {
                        uiStore.popBoxList.shift()
                    },
                },
            ],
        }
        uiStore.popBoxList.push(popInfo)
    }
}

function closeMsgMenu() {
    tags.value.showMsgMenu = false
    tags.value.menuDisplay.menuSelectedMsgId = null
    setTimeout(() => {
        initMenuDisplay()
    }, 300)
}

function openChatInfoPan() {
    tags.value.openChatInfo = !tags.value.openChatInfo
    if (tags.value.openChatInfo) {
        if (
            chat.show.type === 'group' &&
            chat.info.group_info.gc !== chat.show.id
        ) {
            const url = `https://qinfo.clt.qq.com/cgi-bin/qun_info/get_group_info_all?gc=${chat.show.id}&bkn=${authStore.loginInfo.bkn}`
            Connector.send(
                'http_proxy',
                { url: url },
                'getMoreGroupInfo',
            )
        } else if (
            chat.show.type === 'user' &&
            chat.info.user_info.uin !== chat.show.id
        ) {
            const userInfo = authStore.jsonMap.friend_info.name
            if(userInfo != undefined) {
                Connector.send(
                    userInfo,
                    { user_id: chat.show.id },
                    'getMoreUserInfo',
                )
            }
        }
        const noticeName = authStore.jsonMap.group_notices.name
        if (
            chat.show.type === 'group' &&
            (chat.info.group_notices === undefined ||
                Object.keys(chat.info.group_notices).length ===
                    0)
        ) {
            if (noticeName) {
                Connector.send(
                    noticeName,
                    { group_id: chat.show.id },
                    'getGroupNotices',
                )
            }
        }
        if (chat.show.type === 'group' && Object.keys(chat.info.group_files).length === 0) {
            const name = authStore.jsonMap.group_files?.name
            if(name) {
                Connector.send(name, {
                    group_id: chat.show.id
                }, 'getGroupFiles')
            }
        }
    }
}

function deleteImg(index: number) {
    imgCache.value.delete(index)
    msg.value = msg.value.replace(
        '[SQ:' + index + ']',
        '',
    )
    msg.value = msg.value.replace(
        '[SQ:' + index,
        '',
    )
}

async function editImg(key: number) {
    const img = imgCache.value.get(key)
    if (!img) return
    if (!viewerRef?.value) return
    const dataurl = await viewerRef.value.edit(img)
    imgCache.value.set(key, dataurl)
}

function addSpecialMsg(data: SQCodeElem) {
    const input = (document.getElementById( 'main-input') as HTMLTextAreaElement | HTMLInputElement) ??
        (document.getElementById( 'main-input-ex') as HTMLTextAreaElement | HTMLInputElement)
    if (data !== undefined) {
        const index = sendCache.value.length
        sendCache.value.push(data.msgObj)
        if (!data.addText) return index

        const sqCode = `[SQ:${index}]`

        if (data.addTop === true) {
            msg.value = sqCode + msg.value
        } else {
            const selectionStart = input?.selectionStart
            const selectionEnd = input?.selectionEnd ?? selectionStart
            if(selectionStart != null) {
                const first = msg.value.substring(0, selectionStart)
                const last = msg.value.substring(selectionEnd!, msg.value.length)
                msg.value = first + sqCode + last
                nextTick(()=>{
                    input.selectionStart = selectionStart + sqCode.length
                    input.selectionEnd = selectionStart + sqCode.length
                })
            } else {
                msg.value += sqCode
            }
        }
        return index
    }
    return -1
}

function addImg(event: ClipboardEvent) {
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
            setImg(item.getAsFile())
            event.preventDefault()
        }
    }
}

function runSelectImg() {
    const input = document.getElementById('choice-pic')
    if (input) {
        input.click()
    }
}

function selectImg(event: Event) {
    tags.value.showMoreDetail = false
    const sender = event.target as HTMLInputElement
    if (sender && sender.files) {
        setImg(sender.files[0])
    }
}

function runSelectFile() {
    const input = document.getElementById('choice-file')
    if (input) {
        input.click()
    }
}

function selectFile(event: Event) {
    tags.value.showMoreDetail = false
    const sender = event.target as HTMLInputElement
    if (sender.files != null) {
        const file = sender.files[0]
        const fileName = file.name
        const size = file.size
        if (size > 1073741824) {
            const popInfo = {
                title: $t('提醒'),
                html: `<span>${$t('文件大于 1GB。发送速度可能会非常缓慢；确认要发送吗？')}</span>`,
                button: [
                    {
                        text: $t('发送'),
                        fun: () => {
                            uiStore.popBoxList.shift()
                            sendFile(file, fileName)
                        },
                    },
                    {
                        text: $t('取消'),
                        master: true,
                        fun: () => {
                            uiStore.popBoxList.shift()
                        },
                    },
                ],
            }
            uiStore.popBoxList.push(popInfo)
        } else {
            sendFile(file, fileName)
        }
        sender.value = ''
    }
}

function sendFile(file: File, fileName: string | null) {
    const displayName = fileName ?? file.name ?? $t('未知文件')
    const target = {
        id: chatStore.chatInfo.show.id,
        type: chatStore.chatInfo.show.type,
    }
    const controller = new AbortController()
    const streamMap = authStore.jsonMap.file_upload_stream
    const inlineFileLimit = 8 * 1024 * 1024
    let taskId = ''

    const upload = async (onProgress: (loaded: number, total: number) => void) => {
        let filePath: string | undefined
        if (streamMap?.name && file.size > 0) {
            try {
                const mappedChunkSize = Number(streamMap.chunk_size)
                filePath = await uploadFileStream(file, {
                    action: streamMap.name,
                    streamId: uuid(),
                    fileName: displayName,
                    chunkSize: Number.isFinite(mappedChunkSize) && mappedChunkSize > 0? Math.min(mappedChunkSize, 8 * 1024 * 1024): 4 * 1024 * 1024,
                    fileRetentionMs: 30 * 60 * 1000,
                    chunkTimeoutMs: 60 * 1000,
                    completeTimeoutMs: 10 * 60 * 1000,
                }, (action, params, timeout) => {
                    return Connector.callRawApi(action, params, timeout)
                }, onProgress, controller.signal)
            } catch (error) {
                if (controller.signal.aborted) throw error
                if (file.size > inlineFileLimit) throw error
                onProgress(0, file.size)
                new Logger().error(
                    error as Error,
                    '分块上传不可用，回退到兼容模式',
                )
            }
        }

        if (filePath) {
            if (controller.signal.aborted) {
                throw new DOMException('Upload cancelled', 'AbortError')
            }
            const action = target.type === 'group'? streamMap.group_name: streamMap.private_name
            if (!action) throw new Error('当前 OneBot 映射缺少文件上传接口')
            if (!beginUploadFinalization(taskId)) {
                throw new DOMException('Upload cancelled', 'AbortError')
            }
            const response = await Connector.callRawApi(action, {
                group_id: target.type === 'group' ? target.id : undefined,
                user_id: target.type !== 'group' ? target.id : undefined,
                file: filePath,
                name: displayName,
                upload_file: true,
            }, 10 * 60 * 1000)
            const responseError = getOneBotResponseError(response)
            if (responseError) throw new Error(responseError)
            completeUploadTask(taskId)
            return
        }

        if (file.size > inlineFileLimit) {
            throw new Error($t('当前 OneBot 实现不支持分块上传此文件'))
        }

        const base64data = arrayBufferToBase64(await file.arrayBuffer())
        if (controller.signal.aborted) {
            throw new DOMException('Upload cancelled', 'AbortError')
        }
        if (
            String(chatStore.chatInfo.show.id) !== String(target.id) ||
            chatStore.chatInfo.show.type !== target.type
        ) {
            throw new Error($t('会话已切换，请重新发送文件'))
        }
        if (!beginUploadFinalization(taskId)) {
            throw new DOMException('Upload cancelled', 'AbortError')
        }
        onProgress(file.size, file.size)
        sendCache.value = []
        imgCache.value.clear()
        msg.value = ''
        addSpecialMsg({
            addText: true,
            msgObj: {
                type: 'file',
                file: 'base64://' + base64data,
                name: displayName,
            },
        })
        sendMsg('sendFileBack_' + taskId)
    }

    taskId = addUploadTask({
        fileName: displayName,
        fileSize: file.size,
        execute: (onProgress) => {
            void upload(onProgress).catch((error) => {
                if (controller.signal.aborted) return
                const message = error instanceof Error? error.message: String(error)
                failUploadTask(taskId, message)
                new PopInfo().add(PopType.ERR, $t('文件上传失败') + '：' + message)
            })
            return () => controller.abort()
        },
    })
}

async function setImg(file: File | null) {
    const popInfo = new PopInfo()
    if (!file) return
    if (!file.type.includes('image/')) return
    if (file.size === 0) return

    if (file.size > 3145728) {
        const options = { maxSizeMB: 3, useWebWorker: true }
        try {
            popInfo.add(PopType.INFO, $t('正在压缩图片 ……'))
            const compressedFile = await imageCompression(file, options)
            new Logger().add(
                LogType.INFO,
                '图片压缩成功，原大小：' +
                    file.size / 1024 / 1024 +
                    ' MB，压缩后大小：' +
                    compressedFile.size / 1024 / 1024 +
                    ' MB',
            )
            setImg(compressedFile)
        } catch (error) {
            new Logger().error(error as Error, '图片压缩失败')
            popInfo.add(PopType.INFO, $t('压缩图片失败'))
        }
        return
    }

    const id = sendCache.value.length
    const data = {
        type: 'text',
        text: `[${$t('图片')}]`,
    }
    addSpecialMsg({
        addText: true,
        msgObj: data,
    })
    imgCache.value.set(id, await fileToDataURL(file))
}

async function fileToDataURL(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = function(event) {
            if (!event.target) reject(new Error('读取文件失败'))
            else resolve(event.target.result as string)
        }
        reader.onerror = function(error) {
            reject(error)
        }
        reader.readAsDataURL(file)
    })
}

function toMainInput() {
    const input = (document.getElementById( 'main-input') as HTMLTextAreaElement | HTMLInputElement) ??
        (document.getElementById( 'main-input-ex') as HTMLTextAreaElement | HTMLInputElement)
    if (input !== null) {
        input.focus()
    }
}

function sendMsg(echo = 'sendMsgBack') {
    if (details.value[3].open) {
        return
    }
    details.value.forEach((item) => {
        item.open = false
    })

    for (const [key, base64data] of imgCache.value) {
        sendCache.value[key] = {
            type: 'image',
            file: 'base64://' + base64data.substring(
                base64data.indexOf('base64,') + 7,
                base64data.length
            )
        }
    }
    const parsedMsg = SendUtil.parseMsg(
        msg.value,
        sendCache.value,
        [],
    )
    if (chat.show.temp) {
        sendMsgRaw(
            chat.show.id + '/' + chat.show.temp,
            chat.show.type,
            parsedMsg,
            true,
            echo,
        )
    } else {
        sendMsgRaw(
            chat.show.id,
            chat.show.type,
            parsedMsg,
            true,
            echo,
        )
    }
    tags.value.checkNewLineFlag = true
    msg.value = ''
    sendCache.value = []
    imgCache.value.clear()
    scrollBottom()
    cancelReply()
    scheduleResizeMainInput(undefined, true)
}

function updateList(newLength: number, oldLength: number) {
    if (oldLength == 0 && newLength > 0) {
        const name =
            authStore.jsonMap.set_message_read?.name ?? undefined
        let private_name =
            authStore.jsonMap.set_message_read?.private_name ??
            name
        if (!private_name) private_name = name
        if (chatStore.chatInfo.show.type == 'group') {
            Connector.send(
                name,
                {
                    group_id: chat.show.id,
                    message_id:
                        list[list.length - 1].message_id,
                },
                'setMessageRead',
            )
        } else {
            Connector.send(
                private_name,
                {
                    user_id: chat.show.id,
                    message_id:
                        list[list.length - 1].message_id,
                },
                'setMessageRead',
            )
        }
        if(shouldAutoFocus()) {
            toMainInput()
        }
    }

    if (
        tags.value.showBottomButton &&
        !uiStore.nowGetHistory &&
        oldLength > 0
    ) {
        if (NewMsgNum.value !== 0) {
            NewMsgNum.value =
                NewMsgNum.value + Math.abs(newLength - oldLength)
        } else {
            NewMsgNum.value = Math.abs(newLength - oldLength)
        }
    }
    if (
        list.length > 200 &&
        !uiStore.nowGetHistory &&
        !tags.value.showBottomButton
    ) {
        chatStore.messageList = []
        const info = {
            type: chat.show.type,
            id: chat.show.id,
            name: chat.show.name,
            avatar: chat.show.avatar,
            jump: chat.show.jump,
        } as BaseChatInfoElem
        loadHistoryFirst(info)
        uiStore.nowGetHistory = true
    }

    const pan = document.getElementById('msgPan')
    if (pan !== null) {
        const height = pan.scrollHeight
        nextTick(() => {
            const newPan = document.getElementById('msgPan')
            if (newPan !== null) {
                if (uiStore.nowGetHistory) {
                    scrollTo(
                        newPan.scrollHeight - height,
                        false,
                    )
                }
                if (!uiStore.nowGetHistory) {
                    if (!tags.value.showBottomButton) {
                        scrollTo(newPan.scrollHeight)
                    }
                    if (oldLength <= 0) {
                        scrollTo(newPan.scrollHeight, false)
                    }
                }
                uiStore.nowGetHistory = false
            }

            const getImgList = () => {
                const getImgList = [] as string[]
                for(const item of list) {
                    if (item.message !== undefined) {
                        for(const msgItem of item.message) {
                            if (
                                msgItem.type === 'image' &&
                                msgItem.file != 'marketface'
                            ) {
                                getImgList.push(msgItem.url)
                            }
                        }
                    }
                }
                return getImgList
            }
            chatImg.value = Img.fromList(getImgList())
            if (
                chatStore.chatInfo.show &&
                chatStore.chatInfo.show.jump
            ) {
                new Logger().debug(
                    '进入跳转至消息：' +
                        chatStore.chatInfo.show.jump,
                )
                scrollToMsgLocal(
                    'chat-' + chatStore.chatInfo.show.jump,
                )
                chatStore.chatInfo.show.jump = undefined
            }
        })
    }
}

function msgClick(_: Event, data: any) {
    const message_id = data.message_id
    if (multipleSelectList.value.length > 0) {
        if (multipleSelectList.value.indexOf(message_id) > -1) {
            multipleSelectList.value =
                multipleSelectList.value.filter((item) => {
                    return item != message_id
                })
        } else {
            multipleSelectList.value.push(message_id)
        }
    }
}

function delMsgs() {
    new PopInfo().add(
        PopType.INFO,
        $t('欸嘿，这个按钮只是用来占位置的'),
    )
}

function copyMsgs() {
    const msgList = list.filter((item: any) => {
        return multipleSelectList.value.indexOf(item.message_id) > -1
    })
    let msgText = ''
    let lastDate = ''
    msgList.forEach((item: any) => {
        const time = new Date(getViewTime(item.time))
        const date =
            time.getFullYear() +
            '-' +
            (time.getMonth() + 1) +
            '-' +
            time.getDate()
        if (date != lastDate) {
            msgText += '\n—— ' + date + ' ——\n'
            lastDate = date
        }
        msgText +=
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
    app.config.globalProperties.$copyText(msgText).then(
        () => {
            popInfo.add(PopType.INFO, $t('复制成功'), true)
            multipleSelectList.value = []
        },
        () => {
            popInfo.add(PopType.ERR, $t('复制失败'), true)
        },
    )
}

async function recallMsgs() {
    const msgList = list.filter((item: any) => multipleSelectList.value.includes(item.message_id))
    const tasks: Promise<true | undefined>[] = []
    for (const msgItem of msgList) {
        const msgId = msgItem.message_id
        tasks.push(Connector.callApi('delete_msg', { message_id: msgId }))
    }
    multipleSelectList.value = []
    await Promise.all(tasks)
}

function showJin() {
    details.value[2].open = !details.value[2].open
    if (chatStore.chatInfo.info.jin_info.list.length == 0) {
        const name =
            authStore.jsonMap.group_essence.name ??
            'get_essence_msg_list'
        Connector.send(
            name,
            {
                group_id: chat.show.id,
                pages: 0,
            },
            'getJin',
        )
    }
    tags.value.showMoreDetail = !tags.value.showMoreDetail
}

async function handleInput(event: Event) {
    const input = event.target as HTMLInputElement
    scheduleResizeMainInput(input)

    const diff = getDifferencesWithRanges(msg.value, oldMsg.value)
    let { end, str } = { end: 0, str: '' }
    if(diff.length > 0) {
        ({ end, str } = diff[0])
    }

    if(str.indexOf(']') >= 0) {
        const sqIndex = oldMsg.value.substring(0, end).lastIndexOf('[SQ:')
        if(sqIndex >= 0 && sqIndex < end) {
            const msgHas = oldMsg.value.substring(sqIndex)
            const sq = oldMsg.value.slice(sqIndex, msgHas.indexOf(']') + sqIndex + 1)
            const numStr = sq.replace('[SQ:', '').replace(']', '')
            const num = Number(numStr)
            if(!isNaN(num) && imgCache.value.has(num)) {
                deleteImg(num)
            }
        }
    }

    if (details.value[3].open) {
        if (searchDebounceTimer.value) {
            clearTimeout(searchDebounceTimer.value)
            searchDebounceTimer.value = null
        }
        const value = input.value
        if (value.length == 0) {
            searchRequestId.value++
            tags.value.search.list = reactive(list)
        } else if (settingsStore.sysConfig.enable_local_history) {
            const requestId = ++searchRequestId.value
            searchDebounceTimer.value = setTimeout(async () => {
                const results = await dbSearchMessages(
                    authStore.loginInfo.uin,
                    chatStore.chatInfo.show.id,
                    value,
                )
                if (requestId !== searchRequestId.value || !details.value[3].open) return
                tags.value.search.list = results
            }, 180)
        } else {
            searchRequestId.value++
            tags.value.search.list = list.filter(
                (item: any) => {
                    const rawMessage = getMsgRawTxt(item)
                    return rawMessage.indexOf(value) !== -1
                },
            )
        }
    }
}

function openSearch() {
    details.value[3].open = !details.value[3].open
    tags.value.showMoreDetail = !tags.value.showMoreDetail
}

function closeSearch() {
    if (searchDebounceTimer.value) {
        clearTimeout(searchDebounceTimer.value)
        searchDebounceTimer.value = null
    }
    searchRequestId.value++
    details.value[3].open = !details.value[3].open
    msg.value = ''
    tags.value.search.list = reactive(list)
    scheduleResizeMainInput()
}

function sendPoke(userId: number) {
    if (authStore.jsonMap.poke) {
        let name = authStore.jsonMap.poke.name
        if (
            chat.show.type == 'user' &&
            authStore.jsonMap.poke.private_name
        ) {
            name = authStore.jsonMap.poke.private_name
        }
        Connector.send(
            name,
            {
                user_id: userId,
                group_id: chat.show.id,
            },
            'sendPoke',
        )
    }
    tags.value.showMoreDetail = false
    tags.value.menuDisplay.poke = false
}

function reedit(msgData: any) {
    msg.value = ''
    sendCache.value = []
    imgCache.value.clear()
    cancelReply()
    for (const seg of msgData.message) {
        if (seg.type === 'text') {
            msg.value += seg.text
        } else if (seg.type === 'reply') {
            const foundMsg = list.find((item: any) => item.message_id == seg.id)
            if (!foundMsg) continue
            replyMsg(foundMsg)
        } else {
            addSpecialMsg({
                addText: false,
                msgObj: seg,
            })
            msg.value += '[SQ:' + (sendCache.value.length - 1) + ']'
        }
    }
    toMainInput()
}

function jinScroll(event: Event) {
    const body = event.target as HTMLDivElement
    if (
        body.scrollTop + body.clientHeight === body.scrollHeight &&
        !tags.value.isJinLoading
    ) {
        if (chat.info.jin_info.is_end == false) {
            tags.value.isJinLoading = true
            const name =
                authStore.jsonMap.group_essence.name ??
                'get_essence_msg_list'
            Connector.send(
                name,
                {
                    group_id: chat.show.id,
                    pages: chat.info.jin_info.pages + 1,
                },
                'getJin',
            )
        }
    }
}

function viewerEssImg(url: string) {
    if (!viewerRef?.value) return
    viewerRef.value.open(new Img(url))
}

function moreFunClick(type = 'default') {
    let hasOpen = false
    details.value.forEach((item) => {
        if (item.open) hasOpen = true
        item.open = false
    })
    if (hasOpen) return
    if (tags.value.showMoreDetail) {
        tags.value.showMoreDetail = false
        return
    }
    switch(type) {
        case 'default': tags.value.showMoreDetail = true; break
        case 'img': runSelectImg(); break
        case 'file': runSelectFile(); break
        case 'face': details.value[1].open = !details.value[1].open; break
    }
}

function getTargetWin(): HTMLDivElement | undefined {
    const chatPan = document.getElementById('chat-pan')
    if (!chatPan) return
    if(tags.value.openChatInfo) {
        return chatPan.getElementsByClassName('chat-info-pan')[0] as HTMLDivElement
    } else if(mergePan.value?.isMergeOpen()) {
        return chatPan.getElementsByClassName('merge-pan')[0] as HTMLDivElement
    } else {
        return chatPan as HTMLDivElement
    }
}

function exitWin() {
    if(tags.value.openChatInfo) {
        openChatInfoPan()
    } else if(mergePan.value?.isMergeOpen()) {
        mergePan.value?.closeMergeMsg()
        setTimeout(() => {
            const chatPan = document.getElementById('chat-pan')
            const mergePanEl = chatPan!.getElementsByClassName('merge-pan')[0] as HTMLDivElement
            if(mergePanEl) {
                mergePanEl.style.transform = ''
            }
        }, 500)
    } else {
        chatStore.chatInfo.show.id = 0
        uiStore.openSideBar = true
        new Logger().add(LogType.UI, '右滑打开侧边栏触发完成')
    }
}
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
