<!--
 - @FileDescription: 设置页面（账号子页面）
 - @Author: Stapxs
 - @Date: 2022/9/29
          2022/12/9
 - @Version: 1.0 - 初始版本
             1.5 - 重构为 ts 版本，代码格式优化
-->

<template>
    <div class="opt-page">
        <div v-if="Object.keys(runtimeData.loginInfo).length > 0" class="ss-card account-info">
            <img :src="'https://q1.qlogo.cn/g?b=qq&s=0&nk=' + runtimeData.loginInfo.uin">
            <div>
                <div>
                    <span>{{ runtimeData.loginInfo.nickname }}</span>
                    <span>{{ runtimeData.loginInfo.uin }}</span>
                </div>
                <span>{{ runtimeData.loginInfo.info && Object.keys(runtimeData.loginInfo.info).length > 0 ?
                        runtimeData.loginInfo.info.lnick : ''
                }}</span>
            </div>
            <svg @click="exitConnect" :title="$t('base_exit')" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                <path
                    d="M160 96c17.7 0 32-14.3 32-32s-14.3-32-32-32H96C43 32 0 75 0 128V384c0 53 43 96 96 96h64c17.7 0 32-14.3 32-32s-14.3-32-32-32H96c-17.7 0-32-14.3-32-32l0-256c0-17.7 14.3-32 32-32h64zM504.5 273.4c4.8-4.5 7.5-10.8 7.5-17.4s-2.7-12.9-7.5-17.4l-144-136c-7-6.6-17.2-8.4-26-4.6s-14.5 12.5-14.5 22v72H192c-17.7 0-32 14.3-32 32l0 64c0 17.7 14.3 32 32 32H320v72c0 9.6 5.7 18.2 14.5 22s19 2 26-4.6l144-136z" />
            </svg>
        </div>
        <div v-if="Object.keys(runtimeData.loginInfo).length > 0" class="ss-card">
            <header>{{ $t('option_account_config') }}</header>
            <div class="opt-item">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path d="M64 32C28.7 32 0 60.7 0 96V416c0 35.3 28.7 64 64 64H512c35.3 0 64-28.7 64-64V96c0-35.3-28.7-64-64-64H64zm80 256h64c44.2 0 80 35.8 80 80c0 8.8-7.2 16-16 16H80c-8.8 0-16-7.2-16-16c0-44.2 35.8-80 80-80zm96-96c0 35.3-28.7 64-64 64s-64-28.7-64-64s28.7-64 64-64s64 28.7 64 64zm128-32H496c8.8 0 16 7.2 16 16s-7.2 16-16 16H368c-8.8 0-16-7.2-16-16s7.2-16 16-16zm0 64H496c8.8 0 16 7.2 16 16s-7.2 16-16 16H368c-8.8 0-16-7.2-16-16s7.2-16 16-16zm0 64H496c8.8 0 16 7.2 16 16s-7.2 16-16 16H368c-8.8 0-16-7.2-16-16s7.2-16 16-16z"/></svg>
                <div>
                    <span>{{ $t('option_account_nick') }}</span>
                    <span>{{ $t('option_account_nick_tip') }}</span>
                </div>
                <input class="ss-input" style="width:150px" type="text" @keyup="setNick" v-model="runtimeData.loginInfo.nickname">
            </div>
            <div v-if="runtimeData.loginInfo.info && Object.keys(runtimeData.loginInfo.info).length > 0" class="opt-item">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M368.4 18.3L312.7 74.1 437.9 199.3l55.7-55.7c21.9-21.9 21.9-57.3 0-79.2L447.6 18.3c-21.9-21.9-57.3-21.9-79.2 0zM288 94.6l-9.2 2.8L134.7 140.6c-19.9 6-35.7 21.2-42.3 41L3.8 445.8c-3.8 11.3-1 23.9 7.3 32.4L164.7 324.7c-3-6.3-4.7-13.3-4.7-20.7c0-26.5 21.5-48 48-48s48 21.5 48 48s-21.5 48-48 48c-7.4 0-14.4-1.7-20.7-4.7L33.7 500.9c8.6 8.3 21.1 11.2 32.4 7.3l264.3-88.6c19.7-6.6 35-22.4 41-42.3l43.2-144.1 2.8-9.2L288 94.6z"/></svg>
                <div>
                    <span>{{ $t('option_account_lnick') }}</span>
                    <span>{{ $t('option_account_lnick_tip') }}</span>
                </div>
                <input class="ss-input" style="width:150px" type="text" @keyup="setLNick" v-model="runtimeData.loginInfo.info.lnick">
            </div>
        </div>
        <div class="ss-card" v-if="Object.keys(runtimeData.botInfo).length > 0">
            <header>{{ $t('option_account_bot') }}</header>
            <div class="l10n-info">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512">
                    <path
                        d="M320 0c17.7 0 32 14.3 32 32V96H480c35.3 0 64 28.7 64 64V448c0 35.3-28.7 64-64 64H160c-35.3 0-64-28.7-64-64V160c0-35.3 28.7-64 64-64H288V32c0-17.7 14.3-32 32-32zM208 384c-8.8 0-16 7.2-16 16s7.2 16 16 16h32c8.8 0 16-7.2 16-16s-7.2-16-16-16H208zm96 0c-8.8 0-16 7.2-16 16s7.2 16 16 16h32c8.8 0 16-7.2 16-16s-7.2-16-16-16H304zm96 0c-8.8 0-16 7.2-16 16s7.2 16 16 16h32c8.8 0 16-7.2 16-16s-7.2-16-16-16H400zM264 256c0-22.1-17.9-40-40-40s-40 17.9-40 40s17.9 40 40 40s40-17.9 40-40zm152 40c22.1 0 40-17.9 40-40s-17.9-40-40-40s-40 17.9-40 40s17.9 40 40 40zM48 224H64V416H48c-26.5 0-48-21.5-48-48V272c0-26.5 21.5-48 48-48zm544 0c26.5 0 48 21.5 48 48v96c0 26.5-21.5 48-48 48H576V224h16z" />
                </svg>
                <div>
                    <span>{{ runtimeData.botInfo.app_name }}<a>{{ runtimeData.botInfo.app_version !== undefined ?
                            runtimeData.botInfo.app_version : runtimeData.botInfo.version
                    }}</a></span>
                    <span>{{ $t('option_account_bot_tip') }}</span>
                </div>
            </div>
            <div class="bot-info">
                <div v-for="key in Object.keys(runtimeData.botInfo)" :key="'botinfo-' + key">
                    <span v-if="key !== 'app_name' && key !== 'app_version' && key !== 'version'">
                        <span>{{ $t('botinfo_' + key) + ': ' }}</span>
                        <span v-if="(typeof runtimeData.botInfo[key]) !== 'object'">
                            {{ paseBotInfo(key, runtimeData.botInfo[key]) }}
                        </span>
                        <span v-else v-for="item in Object.keys(runtimeData.botInfo[key])"
                            v-show="(typeof runtimeData.botInfo[key][item]) !== 'object'"
                            :key="'botinfo-' + key + item">
                            {{ (typeof runtimeData.botInfo[key][item] == 'number' ? 
                            $t('botinfo_' + item, runtimeData.botInfo[key][item]) : $t('botinfo_' + item))
                             + ': ' + paseBotInfo(item, runtimeData.botInfo[key][item]) }}
                        </span>
                    </span>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import Util from '@/function/util'

import { runASWEvent as saveR, remove } from '@/function/option'
import { runtimeData } from '@/function/msg'
import { Connector, login } from '@/function/connect'

export default {
    name: 'ViewOptAccount',
    props: [],
    data() {
        return {
            runtimeData: runtimeData,
            save: saveR,
            login: login
        }
    },
    methods: {
        /**
         * 对 botInfo 字段部分需要处理的数据进行处理
         * @param name 键名
         * @param value 键值
         */
        paseBotInfo(name: string, value: number | string) {
            if (typeof value == 'number' && name.indexOf('time') > 0 && value > 1000000000) {
                // 尝试转换时间戳
                if (value / 10000000000 < 1) {
                    value = value * 1000
                }
                return Intl.DateTimeFormat(
                    Util.getTrueLang(),
                    { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' }).format(new Date(value))
            }
            return value
        },

        /**
         * 断开连接
         */
        exitConnect() {
            // TODO: 因为事实上目前没没有断开清理流程，所以目前是取消自动连接然后刷新页面
            remove('auto_connect')
            location.reload()
        },

        /**
         * 设置昵称
         * @param event 事件
         */
        setNick(event: KeyboardEvent) {
            // TODO: 这玩意的返回好像永远是错误的 …… 所以干脆不处理返回了
            if (event.key === 'Enter' && runtimeData.loginInfo.nickname !== '') {
                Connector.send('set_nickname', {nickname: runtimeData.loginInfo.nickname}, 'setNickname')
            }
        },
        
        /**
         * 设置签名
         * @param event 事件
         */
        setLNick(event: KeyboardEvent) {
            // TODO: 这玩意的返回好像永远是错误的 …… 所以干脆不处理返回了
            if (event.key === 'Enter' && runtimeData.loginInfo.info.lnick !== '') {
                Connector.send('set_signature', {signature: runtimeData.loginInfo.info.lnick}, 'setSignature')
            }
        }
    }
}
</script>
