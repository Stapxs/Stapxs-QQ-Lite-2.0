<!--
 * @FileDescription: 设置页面（功能子页面）
 * @Author: Stapxs
 * @Date: 2022/11/07
 * @Version: 1.0
-->

<template>
    <div class="opt-page">
        <div class="ss-card">
            <header>{{ $t('option_fun_notice') }}</header>
            <div class="opt-item">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512">
                    <path
                        d="M301.1 34.8C312.6 40 320 51.4 320 64V448c0 12.6-7.4 24-18.9 29.2s-25 3.1-34.4-5.3L131.8 352H64c-35.3 0-64-28.7-64-64V224c0-35.3 28.7-64 64-64h67.8L266.7 40.1c9.4-8.4 22.9-10.4 34.4-5.3zM425 167l55 55 55-55c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9l-55 55 55 55c9.4 9.4 9.4 24.6 0 33.9s-24.6 9.4-33.9 0l-55-55-55 55c-9.4 9.4-24.6 9.4-33.9 0s-9.4-24.6 0-33.9l55-55-55-55c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0z" />
                </svg>
                <div>
                    <span>{{ $t('option_dev_notice_close') }}</span>
                    <span>{{ $t('option_dev_notice_close_tip') }}</span>
                </div>
                <label class="ss-switch">
                    <input type="checkbox" @change="save" name="close_notice"
                        v-model="runtimeData.sysConfig.close_notice">
                    <div>
                        <div></div>
                    </div>
                </label>
            </div>
            <div class="opt-item" v-if="!runtimeData.sysConfig.close_notice">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
                    <path
                        d="M349.4 44.6c5.9-13.7 1.5-29.7-10.6-38.5s-28.6-8-39.9 1.8l-256 224c-10 8.8-13.6 22.9-8.9 35.3S50.7 288 64 288H175.5L98.6 467.4c-5.9 13.7-1.5 29.7 10.6 38.5s28.6 8 39.9-1.8l256-224c10-8.8 13.6-22.9 8.9-35.3s-16.6-20.7-30-20.7H272.5L349.4 44.6z" />
                </svg>
                <div>
                    <span>{{ $t('option_dev_notice_all') }}</span>
                    <span>{{ $t('option_dev_notice_all_tip') }}</span>
                </div>
                <label class="ss-switch">
                    <input type="checkbox" @change="save" name="notice_all" v-model="runtimeData.sysConfig.notice_all">
                    <div>
                        <div></div>
                    </div>
                </label>
            </div>
        </div>
        <div class="ss-card">
            <header>{{ $t('option_fun_chat') }}</header>
            <div class="opt-item">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                    <path
                        d="M459.5 440.6c9.5 7.9 22.8 9.7 34.1 4.4s18.4-16.6 18.4-29V96c0-12.4-7.2-23.7-18.4-29s-24.5-3.6-34.1 4.4L288 214.3V256v41.7L459.5 440.6zM256 352V256 128 96c0-12.4-7.2-23.7-18.4-29s-24.5-3.6-34.1 4.4l-192 160C4.2 237.5 0 246.5 0 256s4.2 18.5 11.5 24.6l192 160c9.5 7.9 22.8 9.7 34.1 4.4s18.4-16.6 18.4-29V352z" />
                </svg>
                <div>
                    <span>{{ $t('option_dev_send_reget') }}</span>
                    <span>{{ $t('option_dev_send_reget_tip') }}</span>
                </div>
                <label class="ss-switch">
                    <input type="checkbox" @change="save" name="send_reget" v-model="runtimeData.sysConfig.send_reget">
                    <div>
                        <div></div>
                    </div>
                </label>
            </div>
            <div class="opt-item">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
                    <path
                        d="M163.8 0H284.2c12.1 0 23.2 6.8 28.6 17.7L320 32h96c17.7 0 32 14.3 32 32s-14.3 32-32 32H32C14.3 96 0 81.7 0 64S14.3 32 32 32h96l7.2-14.3C140.6 6.8 151.7 0 163.8 0zM32 128H416L394.8 467c-1.6 25.3-22.6 45-47.9 45H101.1c-25.3 0-46.3-19.7-47.9-45L32 128zm192 64c-6.4 0-12.5 2.5-17 7l-80 80c-9.4 9.4-9.4 24.6 0 33.9s24.6 9.4 33.9 0l39-39V408c0 13.3 10.7 24 24 24s24-10.7 24-24V273.9l39 39c9.4 9.4 24.6 9.4 33.9 0s9.4-24.6 0-33.9l-80-80c-4.5-4.5-10.6-7-17-7z" />
                </svg>
                <div>
                    <span>{{ $t('option_dev_chat_nd') }}</span>
                    <span>{{ ndt === 0 ? $t('option_dev_chat_nd_tip') : $t('option_dev_chat_nd_tip_1') }}</span>
                </div>
                <label class="ss-switch" v-if="ndt < 3">
                    <input type="checkbox" @change="msgND" v-model="ndv">
                    <div>
                        <div></div>
                    </div>
                </label>
            </div>
            <div class="opt-item">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                    <path
                        d="M64 32C28.7 32 0 60.7 0 96V416c0 35.3 28.7 64 64 64H448c35.3 0 64-28.7 64-64V96c0-35.3-28.7-64-64-64H64zM175 175c9.4-9.4 24.6-9.4 33.9 0l47 47 47-47c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9l-47 47 47 47c9.4 9.4 9.4 24.6 0 33.9s-24.6 9.4-33.9 0l-47-47-47 47c-9.4 9.4-24.6 9.4-33.9 0s-9.4-24.6 0-33.9l47-47-47-47c-9.4-9.4-9.4-24.6 0-33.9z" />
                </svg>
                <div>
                    <span>{{ $t('option_dev_chat_pic_pan') }}</span>
                    <span>{{ $t('option_dev_chat_pic_pan_tip') }}</span>
                </div>
                <label class="ss-switch">
                    <input type="checkbox" @change="save" name="close_chat_pic_pan"
                        v-model="runtimeData.sysConfig.close_chat_pic_pan">
                    <div>
                        <div></div>
                    </div>
                </label>
            </div>
            <div class="opt-item">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512">
                    <path
                        d="M275.2 38.4c-10.6-8-25-8.5-36.3-1.5S222 57.3 224.6 70.3l9.7 48.6c-19.4 9-36.9 19.9-52.4 31.5c-15.3 11.5-29 23.9-40.7 36.3L48.1 132.4c-12.5-7.3-28.4-5.3-38.7 4.9S-3 163.3 4.2 175.9L50 256 4.2 336.1c-7.2 12.6-5 28.4 5.3 38.6s26.1 12.2 38.7 4.9l93.1-54.3c11.8 12.3 25.4 24.8 40.7 36.3c15.5 11.6 33 22.5 52.4 31.5l-9.7 48.6c-2.6 13 3.1 26.3 14.3 33.3s25.6 6.5 36.3-1.5l77.6-58.2c54.9-4 101.5-27 137.2-53.8c39.2-29.4 67.2-64.7 81.6-89.5c5.8-9.9 5.8-22.2 0-32.1c-14.4-24.8-42.5-60.1-81.6-89.5c-35.8-26.8-82.3-49.8-137.2-53.8L275.2 38.4zM448 256c0 17.7-14.3 32-32 32s-32-14.3-32-32s14.3-32 32-32s32 14.3 32 32z" />
                </svg>
                <div>
                    <span>{{ $t('option_fun_taill') }}</span>
                    <span>{{ $t('option_fun_taill_tip') }}</span>
                </div>
                <input class="ss-input" style="width:150px" type="text" name="msg_taill" @keyup="save"
                    v-model="runtimeData.sysConfig.msg_taill">
            </div>
            <div class="opt-item">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512">
                    <path
                        d="M64 64C28.7 64 0 92.7 0 128V384c0 35.3 28.7 64 64 64H512c35.3 0 64-28.7 64-64V128c0-35.3-28.7-64-64-64H64zm16 64h32c8.8 0 16 7.2 16 16v32c0 8.8-7.2 16-16 16H80c-8.8 0-16-7.2-16-16V144c0-8.8 7.2-16 16-16zM64 240c0-8.8 7.2-16 16-16h32c8.8 0 16 7.2 16 16v32c0 8.8-7.2 16-16 16H80c-8.8 0-16-7.2-16-16V240zm16 80h32c8.8 0 16 7.2 16 16v32c0 8.8-7.2 16-16 16H80c-8.8 0-16-7.2-16-16V336c0-8.8 7.2-16 16-16zm80-176c0-8.8 7.2-16 16-16h32c8.8 0 16 7.2 16 16v32c0 8.8-7.2 16-16 16H176c-8.8 0-16-7.2-16-16V144zm16 80h32c8.8 0 16 7.2 16 16v32c0 8.8-7.2 16-16 16H176c-8.8 0-16-7.2-16-16V240c0-8.8 7.2-16 16-16zM160 336c0-8.8 7.2-16 16-16H400c8.8 0 16 7.2 16 16v32c0 8.8-7.2 16-16 16H176c-8.8 0-16-7.2-16-16V336zM272 128h32c8.8 0 16 7.2 16 16v32c0 8.8-7.2 16-16 16H272c-8.8 0-16-7.2-16-16V144c0-8.8 7.2-16 16-16zM256 240c0-8.8 7.2-16 16-16h32c8.8 0 16 7.2 16 16v32c0 8.8-7.2 16-16 16H272c-8.8 0-16-7.2-16-16V240zM368 128h32c8.8 0 16 7.2 16 16v32c0 8.8-7.2 16-16 16H368c-8.8 0-16-7.2-16-16V144c0-8.8 7.2-16 16-16zM352 240c0-8.8 7.2-16 16-16h32c8.8 0 16 7.2 16 16v32c0 8.8-7.2 16-16 16H368c-8.8 0-16-7.2-16-16V240zM464 128h32c8.8 0 16 7.2 16 16v32c0 8.8-7.2 16-16 16H464c-8.8 0-16-7.2-16-16V144c0-8.8 7.2-16 16-16zM448 240c0-8.8 7.2-16 16-16h32c8.8 0 16 7.2 16 16v32c0 8.8-7.2 16-16 16H464c-8.8 0-16-7.2-16-16V240zm16 80h32c8.8 0 16 7.2 16 16v32c0 8.8-7.2 16-16 16H464c-8.8 0-16-7.2-16-16V336c0-8.8 7.2-16 16-16z" />
                </svg>
                <div>
                    <span>{{ $t('option_dev_chat_use_breakline') }}</span>
                    <span>{{ $t('option_dev_chat_use_breakline_tip') }}</span>
                </div>
                <label class="ss-switch">
                    <input type="checkbox" @change="breakLineTip($event);save($event)" name="use_breakline" v-model="runtimeData.sysConfig.use_breakline">
                    <div>
                        <div></div>
                    </div>
                </label>
            </div>
        </div>
        <div class="ss-card">
            <header>{{ $t('option_fun_ga') }}</header>
            <div class="opt-item"
                :style="runtimeData.sysConfig.close_ga !== true ? 'background: var(--color-card-1);' : ''">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512">
                    <path
                        d="M0 336c0 79.5 64.5 144 144 144H512c70.7 0 128-57.3 128-128c0-61.9-44-113.6-102.4-125.4c4.1-10.7 6.4-22.4 6.4-34.6c0-53-43-96-96-96c-19.7 0-38.1 6-53.3 16.2C367 64.2 315.3 32 256 32C167.6 32 96 103.6 96 192c0 2.7 .1 5.4 .2 8.1C40.2 219.8 0 273.2 0 336z" />
                </svg>
                <div>
                    <span>{{ $t('option_fun_ga_turn') }}</span>
                    <span>{{ $t('option_fun_ga_turn_tip') }}</span>
                </div>
                <label class="ss-switch">
                    <input type="checkbox" @change="save" name="close_ga" v-model="runtimeData.sysConfig.close_ga">
                    <div>
                        <div></div>
                    </div>
                </label>
            </div>
            <div class="tip" v-if="runtimeData.sysConfig.close_ga !== true">
                {{ $t('option_fun_ga_tip') }}
            </div>
            <div class="opt-item" v-if="runtimeData.sysConfig.close_ga !== true">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
                    <path
                        d="M429.6 92.1c4.9-11.9 2.1-25.6-7-34.7s-22.8-11.9-34.7-7l-352 144c-14.2 5.8-22.2 20.8-19.3 35.8s16.1 25.8 31.4 25.8H224V432c0 15.3 10.8 28.4 25.8 31.4s30-5.1 35.8-19.3l144-352z" />
                </svg>
                <div>
                    <span>{{ $t('option_fun_ga_user') }}</span>
                    <span>{{ $t('option_fun_ga_user_tip') }}</span>
                </div>
                <label class="ss-switch">
                    <input type="checkbox" @change="save" name="open_ga_user"
                        v-model="runtimeData.sysConfig.open_ga_user">
                    <div>
                        <div></div>
                    </div>
                </label>
            </div>
            <div class="opt-item" v-if="runtimeData.sysConfig.close_ga !== true">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512">
                    <path
                        d="M252.3 11.7c-15.6-15.6-40.9-15.6-56.6 0l-184 184c-15.6 15.6-15.6 40.9 0 56.6l184 184c15.6 15.6 40.9 15.6 56.6 0l184-184c15.6-15.6 15.6-40.9 0-56.6l-184-184zM248 224c0 13.3-10.7 24-24 24s-24-10.7-24-24s10.7-24 24-24s24 10.7 24 24zM96 248c-13.3 0-24-10.7-24-24s10.7-24 24-24s24 10.7 24 24s-10.7 24-24 24zm128 80c13.3 0 24 10.7 24 24s-10.7 24-24 24s-24-10.7-24-24s10.7-24 24-24zm128-80c-13.3 0-24-10.7-24-24s10.7-24 24-24s24 10.7 24 24s-10.7 24-24 24zM224 72c13.3 0 24 10.7 24 24s-10.7 24-24 24s-24-10.7-24-24s10.7-24 24-24zm96 392c0 26.5 21.5 48 48 48H592c26.5 0 48-21.5 48-48V240c0-26.5-21.5-48-48-48H472.5c13.4 26.9 8.8 60.5-13.6 82.9L320 413.8V464zm160-88c-13.3 0-24-10.7-24-24s10.7-24 24-24s24 10.7 24 24s-10.7 24-24 24z" />
                </svg>
                <div>
                    <span>{{ $t('option_fun_ga_bot') }}</span>
                    <span>{{ $t('option_fun_ga_bot_tip') }}</span>
                </div>
                <label class="ss-switch">
                    <input type="checkbox" @change="save" name="open_ga_bot"
                        v-model="runtimeData.sysConfig.open_ga_bot">
                    <div>
                        <div></div>
                    </div>
                </label>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { runASWEvent as save } from '@/function/option'
import { runtimeData } from '@/function/msg'

export default defineComponent({
    name: 'ViewOptFunction',
    data() {
        return {
            runtimeData: runtimeData,
            save: save,
            ndt: 0,
            ndv: false
        }
    },
    methods: {
        msgND: function () {
            this.ndt++
            setTimeout(() => {
                this.ndv = false
            }, 300)
        },
        breakLineTip (event: Event) {
            const sender = event.target as HTMLInputElement
            if(sender.checked) {
                const popInfo = {
                    title: this.$t('popbox_tip'),
                    html: `<span>${this.$t('option_dev_chat_use_breakline_tip_1')}</span>`,
                    button: [
                        {
                            text: this.$t('btn_know'),
                            master: true,
                            fun: () => { runtimeData.popBoxList.shift() }
                        }
                    ]
                }
                runtimeData.popBoxList.push(popInfo)
            }
        }
    }
})
</script>
