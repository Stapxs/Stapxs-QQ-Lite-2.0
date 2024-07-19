<!--
 * @FileDescription: 设置页面（界面子页面）
 * @Author: Stapxs
 * @Date: 2022/09/26
 * @Version: 1.0
-->

<template>
    <div class="opt-page">
        <div class="ss-card">
            <header>{{ $t('option_view_l10n') }}</header>
            <div class="l10n-info">
                <font-awesome-icon :icon="['fas', 'language']" />
                <div>
                    <span>{{ $t('l10n_name') }}</span>
                    <span class="author">{{ $t('l10n_author_title') }}{{ $t('l10n_author') }}</span>
                    <span>{{ $t('l10n_description') }}</span>
                </div>
            </div>
            <div class="opt-item">
                <font-awesome-icon :icon="['fas', 'earth-asia']" />
                <div>
                    <span>{{ $t('option_view_language') }}</span>
                    <span>{{ $t('option_view_language_tip') }}</span>
                </div>
                <select @change="save($event); gaLanguage($event)" name="language" title="language"
                    v-model="runtimeData.sysConfig.language">
                    <option v-for="item in languages" :value="item.value" :key="item.value">{{ item.name }}</option>
                </select>
            </div>
        </div>
        <div class="ss-card">
            <header>{{ $t('option_view_theme') }}</header>
            <template v-if="runtimeData.sysConfig.opt_auto_gtk != true">
                <div class="opt-item" id="opt_view_dark">
                    <font-awesome-icon :icon="['fas', 'moon']" />
                    <div>
                        <span>{{ $t('option_view_dark_mode') }}</span>
                        <span>{{ $t('option_view_dark_mode_tip') }}</span>
                    </div>
                    <label class="ss-switch">
                        <input type="checkbox" @change="save" name="opt_dark" v-model="runtimeData.sysConfig.opt_dark">
                        <div>
                            <div></div>
                        </div>
                    </label>
                </div>
                <div class="opt-item">
                    <font-awesome-icon :icon="['fas', 'toggle-on']" />
                    <div>
                        <span>{{ $t('option_view_auto_dark') }}</span>
                        <span>{{ $t('option_view_auto_dark_tip') }}</span>
                    </div>
                    <label class="ss-switch">
                        <input type="checkbox" @change="save" name="opt_auto_dark"
                            v-model="runtimeData.sysConfig.opt_auto_dark">
                        <div>
                            <div></div>
                        </div>
                    </label>
                </div>
                <template v-if="runtimeData.sysConfig.opt_auto_win_color != true">
                    <div class="opt-item">
                        <font-awesome-icon :icon="['fas', 'palette']" />
                        <div>
                            <span>{{ $t('option_view_theme_color') }}</span>
                            <span>{{ $t('option_view_theme_color_tip') }}</span>
                        </div>
                        <div class="theme-color-col">
                            <label v-for="(name, index) in colors" :title="name" :key="'color_id_' + index" class="ss-radio">
                                <input type="radio" name="theme_color" @change="save($event); gaColor($event)" :data-id="index"
                                    :checked="runtimeData.sysConfig.theme_color === undefined ? index === 0 : Number(runtimeData.sysConfig.theme_color) === index">
                                <div :style="'background: var(--color-main-' + index + ');'">
                                    <div></div>
                                </div>
                            </label>
                        </div>
                    </div>
                </template>
            </template>
            <template v-if="runtimeData.tags.isElectron && browser.os == 'Linux'">
                <div class="opt-item">
                    <font-awesome-icon :icon="['fas', 'window-restore']" />
                    <div>
                        <span>{{ $t('option_view_auto_gtk') }}</span>
                        <span>{{ $t('option_view_auto_gtk_tip') }}</span>
                    </div>
                    <label class="ss-switch">
                        <input type="checkbox" @change="save" name="opt_auto_gtk"
                            v-model="runtimeData.sysConfig.opt_auto_gtk">
                        <div>
                            <div></div>
                        </div>
                    </label>
                </div>
            </template>
            <template v-if="runtimeData.tags.isElectron && browser.os != 'Linux'">
                <div class="opt-item">
                    <font-awesome-icon :icon="['fas', 'wand-magic-sparkles']" />
                    <div>
                        <span>{{ $t('option_view_auto_win_color') }}</span>
                        <span>{{ $t('option_view_auto_win_color_tip') }}</span>
                    </div>
                    <label class="ss-switch">
                        <input type="checkbox" @change="save" name="opt_auto_win_color"
                            v-model="runtimeData.sysConfig.opt_auto_win_color">
                        <div>
                            <div></div>
                        </div>
                    </label>
                </div>
            </template>
            <div class="opt-item">
                <font-awesome-icon :icon="['fas', 'table-columns']" />
                <div>
                    <span>{{ $t('option_dev_chatview_name') }}</span>
                    <span>{{ $t('option_dev_chatview_name_tip') }}</span>
                </div>
                <select @change="save($event); gaChatView($event)" name="chatview_name" title="chatview_name" v-model="chatview_name">
                    <option value="">{{ $t('option_dev_chatview_name_none') }}</option>
                    <option v-for="item in getAppendChatView()" :value="item" :key="item">{{ item.replace('Chat', '') }}</option>
                </select>
            </div>
            <div class="opt-item">
                <font-awesome-icon :icon="['fas', 'image']" />
                <div>
                    <span>{{ $t('option_view_background') }}</span>
                    <span>{{ $t('option_view_background_tip') }}</span>
                </div>
                <input class="ss-input" style="width:150px" type="text" name="chat_background" @keyup="save"
                    v-model="runtimeData.sysConfig.chat_background">
            </div>
            <div class="opt-item">
                <font-awesome-icon :icon="['fas', 'o']" />
                <div>
                    <span>{{ $t('option_view_background_blur') }}</span>
                    <span>{{ $t('option_view_background_blur_tip') }}</span>
                </div>
                <div class="ss-range">
                    <input :style="`background-size: ${runtimeData.sysConfig.chat_background_blur}% 100%;`" type="range" v-model="runtimeData.sysConfig.chat_background_blur" name="chat_background_blur" @input="save">
                    <span :style="`color: var(--color-font${runtimeData.sysConfig.chat_background_blur > 50 ? '-r' : ''})`">{{ runtimeData.sysConfig.chat_background_blur }} px</span>
                </div>
            </div>
        </div>
        <div class="ss-card">
            <header>{{ $t('option_view_view') }}</header>
            <div class="opt-item" v-if="isMobile()">
                <font-awesome-icon :icon="['fas', 'up-down-left-right']" />
                <div>
                    <span>{{ $t('option_view_initial_scale') }}</span>
                    <span>{{ $t('option_view_initial_scale_tip') }}</span>
                </div>
                <div class="ss-range">
                    <input :style="`background-size: ${initialScaleShow / 0.05}% 100%;`" type="range" min="0.1" max="5" step="0.05" v-model="runtimeData.sysConfig.initial_scale" name="initial_scale" @change="save" @input="setInitialScaleShow">
                    <span :style="`color: var(--color-font${initialScaleShow / 0.05 > 50 ? '-r' : ''})`">{{ initialScaleShow }}</span>
                </div>
            </div>
            <div class="opt-item" v-if="isMobile()">
                <font-awesome-icon :icon="['fas', 'border-top-left']" />
                <div>
                    <span>{{ $t('option_view_fs_adaptation') }}</span>
                    <span>{{ $t('option_view_fs_adaptation_tip') }}</span>
                </div>
                <div class="ss-range">
                    <input :style="`background-size: ${fsAdaptationShow / 50 * 100}% 100%;`" type="range" min="0" max="50" step="10" v-model="runtimeData.sysConfig.fs_adaptation" name="fs_adaptation" @change="save" @input="setFsAdaptationShow">
                    <span :style="`color: var(--color-font${fsAdaptationShow / 50 > 0.5 ? '-r' : ''})`">{{ fsAdaptationShow }} px</span>
                </div>
            </div>
            <div class="opt-item">
                <font-awesome-icon :icon="['fas', 'arrows-rotate']" />
                <div>
                    <span>{{ $t('option_view_dont_touch') }}</span>
                    <span>{{ $t('option_view_dont_touch_tip') }}</span>
                </div>
                <label class="ss-switch">
                    <input type="checkbox" @change="modifyTouch">
                    <div>
                        <div></div>
                    </div>
                </label>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import Umami from '@stapxs/umami-logger-typescript'

import { defineComponent, toRaw } from 'vue'
import { runtimeData } from '../../function/msg'
import { runASWEvent as save, get } from '../../function/option'
import { BrowserInfo, detect } from 'detect-browser'
import { getDeviceType } from '@/function/utils/systemUtil'

import languages from '../../assets/l10n/_l10nconfig.json'

export default defineComponent({
    name: 'ViewOptTheme',
    data() {
        return {
            get: get,
            runtimeData: runtimeData,
            save: save,
            languages: languages,
            // 别问我为什么微软是紫色的
            colors: ['林槐蓝', '墨竹青', '少女粉', '微软紫', '坏猫黄', '玄素黑'],
            browser: detect() as BrowserInfo,
            initialScaleShow: 0.1,
            fsAdaptationShow: 0,
            chatview_name: ''
        }
    },
    methods: {
        gaLanguage(event: Event) {
            const sender = event.target as HTMLInputElement
            // UM：上传语言选择
            Umami.trackEvent('use_language', { name: sender.value })
        },

        gaChatView(event: Event) {
            const sender = event.target as HTMLInputElement
            // UM：上传Chat View 选择
            Umami.trackEvent('use_chatview', { name: sender.value })
        },

        gaColor(event: Event) {
            const sender = event.target as HTMLInputElement
            // UM：上传主题颜色选择
            Umami.trackEvent('use_theme_color', { name: this.colors[Number(sender.dataset.id)] })
        },

        setInitialScaleShow(event: Event) {
            const sender = event.target as HTMLInputElement
            this.initialScaleShow = Number(sender.value)
        },
        setFsAdaptationShow(event: Event) {
            const sender = event.target as HTMLInputElement
            this.fsAdaptationShow = Number(sender.value)
        },

        restartapp() {
            if (runtimeData.reader) {
                runtimeData.reader.send('win:relaunch')
            }
        },
        
        isMobile() {
            return getDeviceType() === 'Android' || getDeviceType() === 'iOS'
        },

        modifyTouch(event: Event) {
            const sender = event.target as HTMLInputElement
            const baseApp = document.getElementById('base-app')
            if(baseApp && sender.checked == true) {
                if(baseApp.classList.contains('no-touch')) {
                    baseApp.classList.remove('no-touch')
                    sender.checked = false
                } else {
                    baseApp.classList.add('no-touch')
                    // UM：上传禁用触摸(彩蛋)的选择
                    Umami.trackEvent('click_statistics', { name: 'touch_randomly' })
                }
            }
        },

        getAppendChatView() {
            // 获取附加的聊天视图，它放置在项目 src/pages/chat-view 下
            const chatView = require.context('@/pages/chat-view', true, /\.vue$/)
            const chatViewList: string[] = []
            chatView.keys().forEach((key: string) => {
                const name = key.split('/').pop()?.split('.')[0]
                if (name && name.startsWith('Chat')) {
                    chatViewList.push(name)
                }
            })
            return chatViewList
        }
    },
    mounted() {
        // 一次性初始化一次缩放级别
        const watch = this.$watch(
            () => runtimeData.sysConfig,
            () => {
                this.initialScaleShow = toRaw(runtimeData.sysConfig.initial_scale)
                this.fsAdaptationShow = toRaw(runtimeData.sysConfig.fs_adaptation)
                watch()
            }
        )
        this.$watch(() => runtimeData.sysConfig.chatview_name, () => {
            this.chatview_name = runtimeData.sysConfig.chatview_name
        })
    }
})
</script>
