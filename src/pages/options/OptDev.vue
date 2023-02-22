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
                <select @change="save" name="log_level" v-model="runtimeData.sysConfig.log_level">
                    <option value="err">{{ $t('option_dev_log_level_err') }}</option>
                    <option value="debug">{{ $t('option_dev_log_level_debug') }}</option>
                    <option value="info">{{ $t('option_dev_log_level_info') }}</option>
                    <option value="all">{{ $t('option_dev_log_level_all') }}</option>
                </select>
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
            <div class="opt-item">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512">
                    <path
                        d="M192 0c-41.8 0-77.4 26.7-90.5 64H64C28.7 64 0 92.7 0 128V448c0 35.3 28.7 64 64 64H320c35.3 0 64-28.7 64-64V128c0-35.3-28.7-64-64-64H282.5C269.4 26.7 233.8 0 192 0zm0 64a32 32 0 1 1 0 64 32 32 0 1 1 0-64zM72 272a24 24 0 1 1 48 0 24 24 0 1 1 -48 0zm104-16H304c8.8 0 16 7.2 16 16s-7.2 16-16 16H176c-8.8 0-16-7.2-16-16s7.2-16 16-16zM72 368a24 24 0 1 1 48 0 24 24 0 1 1 -48 0zm88 0c0-8.8 7.2-16 16-16H304c8.8 0 16 7.2 16 16s-7.2 16-16 16H176c-8.8 0-16-7.2-16-16z" />
                </svg>
                <div>
                    <span>{{ $t('option_dev_msg_type') }}</span>
                    <span>{{ $t('option_dev_msg_type_tip') }}</span>
                </div>
                <select @change="save" name="msg_type" v-model="runtimeData.tags.msgType">
                    <option value="">{{ $t('option_dev_msg_type_auto') }}</option>
                    <option v-for="item in BotMsgType" v-show="(typeof item == 'number')" :value="item" :key="item">{{
                        BotMsgType[item] }}</option>
                </select>
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
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M352 320c88.4 0 160-71.6 160-160c0-15.3-2.2-30.1-6.2-44.2c-3.1-10.8-16.4-13.2-24.3-5.3l-76.8 76.8c-3 3-7.1 4.7-11.3 4.7H336c-8.8 0-16-7.2-16-16V118.6c0-4.2 1.7-8.3 4.7-11.3l76.8-76.8c7.9-7.9 5.4-21.2-5.3-24.3C382.1 2.2 367.3 0 352 0C263.6 0 192 71.6 192 160c0 19.1 3.4 37.5 9.5 54.5L19.9 396.1C7.2 408.8 0 426.1 0 444.1C0 481.6 30.4 512 67.9 512c18 0 35.3-7.2 48-19.9L297.5 310.5c17 6.2 35.4 9.5 54.5 9.5zM80 456c-13.3 0-24-10.7-24-24s10.7-24 24-24s24 10.7 24 24s-10.7 24-24 24z"/></svg>
                <div>
                    <span>{{ $t('option_dev_debug') }}</span>
                    <span>{{ $t('option_dev_debug_tip') }}</span>
                </div>
                <button style="width:100px;font-size:0.8rem;" class="ss-button" @click="printVersionInfo">{{
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
            <header>{{ $t('option_dev_backup') }}</header>
            <div class="opt-item">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512"><path d="M32 64C32 28.7 60.7 0 96 0H256V128c0 17.7 14.3 32 32 32H416V288H248c-13.3 0-24 10.7-24 24s10.7 24 24 24H416V448c0 35.3-28.7 64-64 64H96c-35.3 0-64-28.7-64-64V64zM416 336V288H526.1l-39-39c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0l80 80c9.4 9.4 9.4 24.6 0 33.9l-80 80c-9.4 9.4-24.6 9.4-33.9 0s-9.4-24.6 0-33.9l39-39H416zm0-208H288V0L416 128z"/></svg>
                <div>
                    <span>{{ $t('option_dev_get_backup') }}</span>
                    <span>{{ $t('option_dev_get_backup_tip') }}</span>
                </div>
                <button @click="printSetUpInfo" style="width:100px;font-size:0.8rem;" class="ss-button">{{
                        $t('option_dev_runtime_run')
                }}</button>
            </div>
            <div class="opt-item">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M128 64c0-35.3 28.7-64 64-64H352V128c0 17.7 14.3 32 32 32H512V448c0 35.3-28.7 64-64 64H192c-35.3 0-64-28.7-64-64V336H302.1l-39 39c-9.4 9.4-9.4 24.6 0 33.9s24.6 9.4 33.9 0l80-80c9.4-9.4 9.4-24.6 0-33.9l-80-80c-9.4-9.4-24.6-9.4-33.9 0s-9.4 24.6 0 33.9l39 39H128V64zm0 224v48H24c-13.3 0-24-10.7-24-24s10.7-24 24-24H128zM512 128H384V0L512 128z"/></svg>
                <div>
                    <span>{{ $t('option_dev_set_backup') }}</span>
                    <span>{{ $t('option_dev_set_backup_tip') }}</span>
                </div>
                <button @click="importSetUpInfo" style="width:100px;font-size:0.8rem;" class="ss-button">{{
                        $t('option_dev_runtime_run')
                }}</button>
            </div>
            <div class="opt-item">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M135.2 17.7C140.6 6.8 151.7 0 163.8 0H284.2c12.1 0 23.2 6.8 28.6 17.7L320 32h96c17.7 0 32 14.3 32 32s-14.3 32-32 32H32C14.3 96 0 81.7 0 64S14.3 32 32 32h96l7.2-14.3zM32 128H416V448c0 35.3-28.7 64-64 64H96c-35.3 0-64-28.7-64-64V128zm96 64c-8.8 0-16 7.2-16 16V432c0 8.8 7.2 16 16 16s16-7.2 16-16V208c0-8.8-7.2-16-16-16zm96 0c-8.8 0-16 7.2-16 16V432c0 8.8 7.2 16 16 16s16-7.2 16-16V208c0-8.8-7.2-16-16-16zm96 0c-8.8 0-16 7.2-16 16V432c0 8.8 7.2 16 16 16s16-7.2 16-16V208c0-8.8-7.2-16-16-16z"/></svg>
                <div>
                    <span>{{ $t('option_dev_reset') }}</span>
                    <span>{{ $t('option_dev_reset_tip') }}</span>
                </div>
                <button @click="resetApp" style="width:100px;font-size:0.8rem;" class="ss-button">{{
                        $t('option_dev_runtime_run')
                }}</button>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { runASWEvent as save, runAS as saveBase, saveAll } from '@/function/option'
import { websocket as ws } from '@/function/connect'
import { PopInfo, PopType } from '@/function/base'
import { runtimeData } from '@/function/msg'
import app from '@/main'
import { BrowserInfo, detect } from 'detect-browser'
import packageInfo from '../../../package.json'
import { BotMsgType } from '@/function/elements/information'

export default defineComponent({
    name: 'ViewOptDev',
    data () {
        return {
            BotMsgType: BotMsgType,
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
                new PopInfo().add(PopType.INFO, this.appmsg_text)
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
            const electron = (process.env.IS_ELECTRON as any) === true ? window.require('electron') : null
            const reader = electron ? electron.ipcRenderer : null
            if (reader) {
                reader.send('win:openDevTools')
            }
        },
        async printVersionInfo() {

            // electron：索要 electron 信息
            let addInfo = undefined
            const electron = (process.env.IS_ELECTRON as any) === true ? window.require('electron') : null
            const reader = electron ? electron.ipcRenderer : null
            if(reader) {
                addInfo = await reader.invoke('opt:getSystemInfo')
            }

            const browser = detect() as BrowserInfo

            let html = '<div class="debug-info">'
            html += `<span>1 - ${packageInfo.version}</span>`
            html += `<span>2 - ${process.env.NODE_ENV}</span>`
            html += `<span style="width: 100%">3 - ${window.location.host}</span>`
            html += `<span>4 - ${browser.name}</span>`
            html += `<span>5 - ${browser.version}</span>`
            html += `<span>6 - ${browser.os}</span>`
            html += `<span>7 - ${runtimeData.botInfo.app_name}</span>`
            html += `<span>8 - ${runtimeData.botInfo.app_version !== undefined ? runtimeData.botInfo.app_version : runtimeData.botInfo.version}</span>`
            html += `<span>9 - ${document.getElementById('app')?.offsetWidth} px</span>`
            const lastIndex = 9
            if(addInfo) {
                const info = addInfo as {[key: string]: any}
                Object.keys(info).forEach((name: string, index) => {
                    html += `<span>${lastIndex + index + 1} - ${info[name]}</span>`
                })
            }
            html += '</div>'
            // 构建 popBox 内容
            const popInfo = {
                html: html,
                title: this.$t('option_dev_test_info'),
                button: [
                    {
                        text: app.config.globalProperties.$t('btn_yes'),
                        master: true,
                        fun: () => { runtimeData.popBoxList.shift() }
                    }
                ]
            }
            runtimeData.popBoxList.push(popInfo)
        },
        printSetUpInfo () {
            const json = JSON.stringify(runtimeData.sysConfig)
            const popInfo = {
                svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512"><path d="M32 64C32 28.7 60.7 0 96 0H256V128c0 17.7 14.3 32 32 32H416V288H248c-13.3 0-24 10.7-24 24s10.7 24 24 24H416V448c0 35.3-28.7 64-64 64H96c-35.3 0-64-28.7-64-64V64zM416 336V288H526.1l-39-39c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0l80 80c9.4 9.4 9.4 24.6 0 33.9l-80 80c-9.4 9.4-24.6 9.4-33.9 0s-9.4-24.6 0-33.9l39-39H416zm0-208H288V0L416 128z"/></svg>',
                html: '<textarea style="width: calc(100% - 40px);min-height: 90px;background: var(--color-card-1);color: var(--color-font);border: 0;padding: 20px;border-radius: 7px;margin-top: -10px;">' + json + '</textarea>',
                title: this.$t('option_dev_get_backup'),
                button: [
                    {
                        text: app.config.globalProperties.$t('chat_msg_menu_copy'),
                        fun: () => { 
                            app.config.globalProperties.$copyText(json)
                         }
                    },
                    {
                        text: app.config.globalProperties.$t('btn_yes'),
                        master: true,
                        fun: () => { runtimeData.popBoxList.shift() }
                    }
                ]
            }
            runtimeData.popBoxList.push(popInfo)
        },
        importSetUpInfo () {
            const popInfo = {
                svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M128 64c0-35.3 28.7-64 64-64H352V128c0 17.7 14.3 32 32 32H512V448c0 35.3-28.7 64-64 64H192c-35.3 0-64-28.7-64-64V336H302.1l-39 39c-9.4 9.4-9.4 24.6 0 33.9s24.6 9.4 33.9 0l80-80c9.4-9.4 9.4-24.6 0-33.9l-80-80c-9.4-9.4-24.6-9.4-33.9 0s-9.4 24.6 0 33.9l39 39H128V64zm0 224v48H24c-13.3 0-24-10.7-24-24s10.7-24 24-24H128zM512 128H384V0L512 128z"/></svg>',
                html: '<textarea id="importSetUpInfoTextArea" style="width: calc(100% - 40px);min-height: 90px;background: var(--color-card-1);color: var(--color-font);border: 0;padding: 20px;border-radius: 7px;margin-top: -10px;"></textarea>',
                title: this.$t('option_dev_set_backup'),
                button: [
                    {
                        text: app.config.globalProperties.$t('btn_no'),
                        fun: () => { runtimeData.popBoxList.shift() }
                    },
                    {
                        text: app.config.globalProperties.$t('btn_yes'),
                        master: true,
                        fun: () => { 
                            const input = document.getElementById('importSetUpInfoTextArea') as HTMLTextAreaElement
                            if(input) {
                                try {
                                    const json = JSON.parse(input.value)
                                    runtimeData.sysConfig = json
                                    console.log(json)
                                    saveAll(json)
                                    app.config.globalProperties.$cookies.set('top', JSON.stringify(json.top_info), '1m')
                                    location.reload()
                                } catch (e) {
                                    new PopInfo().add(PopType.ERR, app.config.globalProperties.$t('import_config_fail'))
                                }
                            }
                         }
                    }
                ]
            }
            runtimeData.popBoxList.push(popInfo)
        },
        resetApp () {
            const popInfo = {
                svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M135.2 17.7C140.6 6.8 151.7 0 163.8 0H284.2c12.1 0 23.2 6.8 28.6 17.7L320 32h96c17.7 0 32 14.3 32 32s-14.3 32-32 32H32C14.3 96 0 81.7 0 64S14.3 32 32 32h96l7.2-14.3zM32 128H416V448c0 35.3-28.7 64-64 64H96c-35.3 0-64-28.7-64-64V128zm96 64c-8.8 0-16 7.2-16 16V432c0 8.8 7.2 16 16 16s16-7.2 16-16V208c0-8.8-7.2-16-16-16zm96 0c-8.8 0-16 7.2-16 16V432c0 8.8 7.2 16 16 16s16-7.2 16-16V208c0-8.8-7.2-16-16-16zm96 0c-8.8 0-16 7.2-16 16V432c0 8.8 7.2 16 16 16s16-7.2 16-16V208c0-8.8-7.2-16-16-16z"/></svg>',
                html: '<span>' + this.$t('option_dev_reset_tip1') + '</span>',
                title: this.$t('option_dev_reset'),
                button: [
                    {
                        text: app.config.globalProperties.$t('btn_yes'),
                        fun: () => {
                            localStorage.clear()
                            document.cookie.split(';').forEach(function (c) {
                                document.cookie = c
                                    .replace(/^ +/, '')
                                    .replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/');
                            })
                            location.reload()
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
    mounted() {
        this.$watch(() => runtimeData.sysConfig.chatview_name, () => {
            this.chatview_name = runtimeData.sysConfig.chatview_name
        })
    }
})
</script>
