<!--
 * @FileDescription: 设置页面（开发者子页面）
 * @Author: Stapxs
 * @Date: 2022/09/28
 * @Version: 1.0
-->

<template>
    <div class="opt-page">
        <div class="ss-card">
            <header>{{ $t('option_dev_dev') }}</header>
            <div class="opt-item">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
                    <path
                        d="M96 0C43 0 0 43 0 96V416c0 53 43 96 96 96H384h32c17.7 0 32-14.3 32-32s-14.3-32-32-32V384c17.7 0 32-14.3 32-32V32c0-17.7-14.3-32-32-32H384 96zm0 384H352v64H96c-17.7 0-32-14.3-32-32s14.3-32 32-32zm32-240c0-8.8 7.2-16 16-16H336c8.8 0 16 7.2 16 16s-7.2 16-16 16H144c-8.8 0-16-7.2-16-16zm16 48H336c8.8 0 16 7.2 16 16s-7.2 16-16 16H144c-8.8 0-16-7.2-16-16s7.2-16 16-16z" />
                </svg>
                <div>
                    <span>{{ $t('option_dev_log_level') }}</span>
                    <span>{{ $t('option_dev_log_level_tip') }}</span>
                </div>
                <label>
                    <select @change="save" name="log_level" v-model="runtimeData.sysConfig.log_level">
                        <option value="err">{{ $t('option_dev_log_level_err') }}</option>
                        <option value="debug">{{ $t('option_dev_log_level_debug') }}</option>
                        <option value="info">{{ $t('option_dev_log_level_info') }}</option>
                        <option value="all">{{ $t('option_dev_log_level_all') }}</option>
                    </select>
                </label>
            </div>
            <div class="opt-item">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
                    <path
                        d="M384 480c35.3 0 64-28.7 64-64l0-320c0-35.3-28.7-64-64-64L64 32C28.7 32 0 60.7 0 96L0 416c0 35.3 28.7 64 64 64l320 0zM224 352c-6.7 0-13-2.8-17.6-7.7l-104-112c-6.5-7-8.2-17.2-4.4-25.9s12.5-14.4 22-14.4l208 0c9.5 0 18.2 5.7 22 14.4s2.1 18.9-4.4 25.9l-104 112c-4.5 4.9-10.9 7.7-17.6 7.7z" />
                </svg>
                <div>
                    <span>{{ $t('option_dev_msg_menu') }}</span>
                    <span>{{ $t('option_dev_msg_menu_tip') }}</span>
                </div>
                <label class="ss-switch">
                    <input type="checkbox" @change="save" name="msg_menu" v-model="runtimeData.sysConfig.msg_menu">
                    <div>
                        <div></div>
                    </div>
                </label>
            </div>
            <div class="opt-item">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512">
                    <path
                        d="M320 0c17.7 0 32 14.3 32 32V96H480c35.3 0 64 28.7 64 64V448c0 35.3-28.7 64-64 64H160c-35.3 0-64-28.7-64-64V160c0-35.3 28.7-64 64-64H288V32c0-17.7 14.3-32 32-32zM208 384c-8.8 0-16 7.2-16 16s7.2 16 16 16h32c8.8 0 16-7.2 16-16s-7.2-16-16-16H208zm96 0c-8.8 0-16 7.2-16 16s7.2 16 16 16h32c8.8 0 16-7.2 16-16s-7.2-16-16-16H304zm96 0c-8.8 0-16 7.2-16 16s7.2 16 16 16h32c8.8 0 16-7.2 16-16s-7.2-16-16-16H400zM264 256c0-22.1-17.9-40-40-40s-40 17.9-40 40s17.9 40 40 40s40-17.9 40-40zm152 40c22.1 0 40-17.9 40-40s-17.9-40-40-40s-40 17.9-40 40s17.9 40 40 40zM48 224H64V416H48c-26.5 0-48-21.5-48-48V272c0-26.5 21.5-48 48-48zm544 0c26.5 0 48 21.5 48 48v96c0 26.5-21.5 48-48 48H576V224h16z" />
                </svg>
                <div>
                    <span>{{ $t('option_dev_debug_msg') }}</span>
                    <span><a style="cursor:pointer;" @click="sendAbab">{{ $t('option_dev_debug_msg_tip') }}</a></span>
                </div>
                <label class="ss-switch">
                    <input type="checkbox" @change="save" name="debug_msg" v-model="runtimeData.sysConfig.debug_msg">
                    <div>
                        <div></div>
                    </div>
                </label>
            </div>
        </div>
        <div class="ss-card">
            <header>{{ $t('option_dev_test') }}</header>
            <div class="opt-item">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                    <path
                        d="M32 32H480c17.7 0 32 14.3 32 32V96c0 17.7-14.3 32-32 32H32C14.3 128 0 113.7 0 96V64C0 46.3 14.3 32 32 32zm0 128H480V416c0 35.3-28.7 64-64 64H96c-35.3 0-64-28.7-64-64V160zm128 80c0 8.8 7.2 16 16 16H336c8.8 0 16-7.2 16-16s-7.2-16-16-16H176c-8.8 0-16 7.2-16 16z" />
                </svg>
                <div>
                    <span>{{ $t('option_dev_ws_send') }}</span>
                    <span>{{ $t('option_dev_ws_send_tip') }}</span>
                </div>
                <input class="ss-input" style="width:150px" type="text" @keyup="sendTestWs" v-model="ws_text">
            </div>
            <div class="opt-item">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                    <path
                        d="M64 0C28.7 0 0 28.7 0 64V352c0 35.3 28.7 64 64 64h96v80c0 6.1 3.4 11.6 8.8 14.3s11.9 2.1 16.8-1.5L309.3 416H448c35.3 0 64-28.7 64-64V64c0-35.3-28.7-64-64-64H64z" />
                </svg>
                <div>
                    <span>{{ $t('option_dev_appmsg') }}</span>
                    <span>{{ $t('option_dev_appmsg_tip') }}</span>
                </div>
                <input class="ss-input" style="width:150px" type="text" @keyup="sendTestAppmsg" v-model="appmsg_text">
            </div>
            <div class="opt-item">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
                    <path
                        d="M448 80v48c0 44.2-100.3 80-224 80S0 172.2 0 128V80C0 35.8 100.3 0 224 0S448 35.8 448 80zM393.2 214.7c20.8-7.4 39.9-16.9 54.8-28.6V288c0 44.2-100.3 80-224 80S0 332.2 0 288V186.1c14.9 11.8 34 21.2 54.8 28.6C99.7 230.7 159.5 240 224 240s124.3-9.3 169.2-25.3zM0 346.1c14.9 11.8 34 21.2 54.8 28.6C99.7 390.7 159.5 400 224 400s124.3-9.3 169.2-25.3c20.8-7.4 39.9-16.9 54.8-28.6V432c0 44.2-100.3 80-224 80S0 476.2 0 432V346.1z" />
                </svg>
                <div>
                    <span>{{ $t('option_dev_runtime') }}</span>
                    <span>{{ $t('option_dev_runtime_tip') }}</span>
                </div>
                <button style="width:100px;font-size:0.8rem;" class="ss-button" @click="printRuntime">{{
                        $t('option_dev_runtime_run')
                }}</button>
            </div>
            <div class="opt-item">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
                    <path
                        d="M64 32C28.7 32 0 60.7 0 96V416c0 35.3 28.7 64 64 64H384c35.3 0 64-28.7 64-64V96c0-35.3-28.7-64-64-64H64zM200 344V280H136c-13.3 0-24-10.7-24-24s10.7-24 24-24h64V168c0-13.3 10.7-24 24-24s24 10.7 24 24v64h64c13.3 0 24 10.7 24 24s-10.7 24-24 24H248v64c0 13.3-10.7 24-24 24s-24-10.7-24-24z" />
                </svg>
                <div>
                    <span>{{ $t('option_dev_ui_test') }}</span>
                    <span>{{ $t('option_dev_ui_test_tip') }}</span>
                </div>
                <label class="ss-switch">
                    <input type="checkbox" @change="save" name="ui_test" v-model="runtimeData.sysConfig.ui_test">
                    <div>
                        <div></div>
                    </div>
                </label>
            </div>
        </div>
        <div class="ss-card">
            <header>{{ $t('option_dev_connect') }}</header>
            <div class="tip">
                {{ $t('option_dev_connect_tip') }}
            </div>
            <div class="opt-item">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
                    <path
                        d="M64 32C28.7 32 0 60.7 0 96V416c0 35.3 28.7 64 64 64H384c35.3 0 64-28.7 64-64V96c0-35.3-28.7-64-64-64H64zM200 344V280H136c-13.3 0-24-10.7-24-24s10.7-24 24-24h64V168c0-13.3 10.7-24 24-24s24 10.7 24 24v64h64c13.3 0 24 10.7 24 24s-10.7 24-24 24H248v64c0 13.3-10.7 24-24 24s-24-10.7-24-24z" />
                </svg>
                <div>
                    <span>{{ $t('option_dev_connect_beat') }}</span>
                    <span>{{ $t('option_dev_connect_beat_tip') }}</span>
                </div>
                <label class="ss-switch">
                    <input type="checkbox" @change="save" name="connect_beat" v-model="runtimeData.sysConfig.connect_beat">
                    <div>
                        <div></div>
                    </div>
                </label>
            </div>
            <div class="opt-item">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512">
                    <path
                        d="M96 0C78.3 0 64 14.3 64 32v96h64V32c0-17.7-14.3-32-32-32zM288 0c-17.7 0-32 14.3-32 32v96h64V32c0-17.7-14.3-32-32-32zM32 160c-17.7 0-32 14.3-32 32s14.3 32 32 32v32c0 77.4 55 142 128 156.8V480c0 17.7 14.3 32 32 32s32-14.3 32-32V412.8C297 398 352 333.4 352 256V224c17.7 0 32-14.3 32-32s-14.3-32-32-32H32z" />
                </svg>
                <div>
                    <span>{{ $t('option_dev_connect_type') }}</span>
                    <span>{{ $t('option_dev_connect_type_tip') }}</span>
                </div>
                <input class="ss-input" style="width:150px" type="text">
            </div>
        </div>
        <div class="ss-card">
            <header>{{ $t('option_dev_chatview') }}</header>
            <div class="tip">
                {{ $t('option_dev_chatview_tip') }}
            </div>
            <div class="opt-item">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                    <path
                        d="M0 128C0 92.7 28.7 64 64 64H448c35.3 0 64 28.7 64 64V384c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64V128zm64 32v64c0 17.7 14.3 32 32 32H416c17.7 0 32-14.3 32-32V160c0-17.7-14.3-32-32-32H96c-17.7 0-32 14.3-32 32zM80 320c-13.3 0-24 10.7-24 24s10.7 24 24 24h56c13.3 0 24-10.7 24-24s-10.7-24-24-24H80zm136 0c-13.3 0-24 10.7-24 24s10.7 24 24 24h48c13.3 0 24-10.7 24-24s-10.7-24-24-24H216z" />
                </svg>
                <div>
                    <span>{{ $t('option_dev_chatview_name') }}</span>
                    <span>{{ $t('option_dev_chatview_name_tip') }}</span>
                </div>
                <input class="ss-input" style="width:150px" type="text" v-model="chatview_name"
                    @keyup="saveWName($event, 'chatview_name')">
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { runASWEvent as save, runAS as saveBase } from '@/function/option'
import { websocket as ws } from '@/function/connect'
import { PopInfo, PopType } from '@/function/base'
import { runtimeData } from '@/function/msg'
import app from '@/main'

export default defineComponent({
    name: 'ViewOptDev',
    data () {
        return {
            runtimeData: runtimeData,
            save: save,
            ws_text: '',
            appmsg_text: '',
            chatview_name: ''
        }
    },
    methods: {
        saveWName (event: KeyboardEvent, name: string) {
            if (event.keyCode === 13) {
                saveBase(name, this.chatview_name)
            }
        },
        sendTestWs (event: KeyboardEvent) {
            // 发送测试 WS 消息
            if (event.keyCode === 13 && this.ws_text !== '') {
                const info = JSON.parse(this.ws_text)
                this.ws_text = ''
                // 修改 echo 防止被消息处理机处理
                info.echo = 'websocketTest'
                ws.send(JSON.stringify(info))
            }
        },
        sendTestAppmsg (event: KeyboardEvent) {
            if (event.keyCode === 13 && this.appmsg_text !== '') {
                new PopInfo().add(PopType.INFO, this.appmsg_text, false)
                this.appmsg_text = ''
            }
        },
        sendAbab () {
            new PopInfo().add(PopType.INFO, app.config.globalProperties.$t('pop_option_dev_debug_msg_tip_1'))
        },
        printRuntime () {
            console.log('=========================')
            console.log(runtimeData)
            console.log('=========================')
        }
    },
    mounted() {
        this.$watch(() => runtimeData.sysConfig.chatview_name, () => {
            this.chatview_name = runtimeData.sysConfig.chatview_name
        })
    }
})
</script>
