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
            <svg :title="$t('base_exit')" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                <path
                    d="M160 96c17.7 0 32-14.3 32-32s-14.3-32-32-32H96C43 32 0 75 0 128V384c0 53 43 96 96 96h64c17.7 0 32-14.3 32-32s-14.3-32-32-32H96c-17.7 0-32-14.3-32-32l0-256c0-17.7 14.3-32 32-32h64zM504.5 273.4c4.8-4.5 7.5-10.8 7.5-17.4s-2.7-12.9-7.5-17.4l-144-136c-7-6.6-17.2-8.4-26-4.6s-14.5 12.5-14.5 22v72H192c-17.7 0-32 14.3-32 32l0 64c0 17.7 14.3 32 32 32H320v72c0 9.6 5.7 18.2 14.5 22s19 2 26-4.6l144-136z" />
            </svg>
        </div>
        <div class="ss-card">
            <header>{{ $t('option_account_config') }}</header>
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

import { runASWEvent as save } from '@/function/option'
import { runtimeData } from '@/function/msg'

export default {
    name: 'ViewOptAccount',
    props: [],
    data() {
        return {
            runtimeData: runtimeData,
            save: save
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
        }
    }
}
</script>
