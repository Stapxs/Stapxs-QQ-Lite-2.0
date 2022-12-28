<!--
 * @FileDescription: 群文件列表项模板
 * @Author: Stapxs
 * @Date: missing
 * @Version: 1.0
-->

<template>
    <div :class="(item.type === 2 ? ' folder' : '') + ((item.sub_list && item.sub_list.length > 0) ? ' open' : '')"
        @click="loadFileDir(item.id, item.type)">
        <svg v-if="item.type === 2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
            <path
                d="M447.1 96h-172.1L226.7 50.75C214.7 38.74 198.5 32 181.5 32H63.1c-35.35 0-64 28.66-64 64v320c0 35.34 28.65 64 64 64h384c35.35 0 64-28.66 64-64V160C511.1 124.7 483.3 96 447.1 96zM463.1 416c0 8.824-7.178 16-16 16h-384c-8.822 0-16-7.176-16-16V96c0-8.824 7.178-16 16-16h117.5c4.273 0 8.293 1.664 11.31 4.688L255.1 144h192c8.822 0 16 7.176 16 16V416z" />
        </svg>
        <svg v-if="item.type === 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
            <path
                d="M384 32H64.01C28.66 32 .0085 60.65 .0065 96L0 415.1C-.002 451.3 28.65 480 64 480h232.1c25.46 0 49.88-10.12 67.89-28.12l55.88-55.89C437.9 377.1 448 353.6 448 328.1V96C448 60.8 419.2 32 384 32zM52.69 427.3C50.94 425.6 48 421.8 48 416l.0195-319.1C48.02 87.18 55.2 80 64.02 80H384c8.674 0 16 7.328 16 16v192h-88C281.1 288 256 313.1 256 344v88H64C58.23 432 54.44 429.1 52.69 427.3zM330.1 417.9C322.9 425.1 313.8 429.6 304 431.2V344c0-4.406 3.594-8 8-8h87.23c-1.617 9.812-6.115 18.88-13.29 26.05L330.1 417.9z" />
        </svg>
        <div class="main">
            <span>{{ toHtml(item.name) }}</span>
            <div>
                <span :data-id="item.owner_uin">{{ toHtml(item.owner_name) }}</span>
                <span>{{ item.create_time === 0 ? '-' : Intl.DateTimeFormat(trueLang,
                        { year: 'numeric', month: "short", day: "numeric" })
                        .format(new Date(item.create_time * 1000))
                }}</span>
                <span v-if="!item.dead_time && item.dead_time">{{ ((item.dead_time -
                        item.create_time / 86400) - 1) + $t('chat_chat_info_dead_day')
                }}</span>
                <span v-if="item.type === 2">{{ $t('chat_chat_info_file_num', item.size, { num: item.size }) }}</span>
                <span v-if="item.type === 1">{{ getSize(item.size) }}</span>
            </div>
        </div>
        <div v-if="item.type === 1 && item.downloadingPercentage === undefined" class="download" @click="getFile(item)">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                <!--! Font Awesome Pro 6.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2022 Fonticons, Inc. -->
                <path
                    d="M344 240h-56L287.1 152c0-13.25-10.75-24-24-24h-16C234.7 128 223.1 138.8 223.1 152L224 240h-56c-9.531 0-18.16 5.656-22 14.38C142.2 263.1 143.9 273.3 150.4 280.3l88.75 96C243.7 381.2 250.1 384 256.8 384c7.781-.3125 13.25-2.875 17.75-7.844l87.25-96c6.406-7.031 8.031-17.19 4.188-25.88S353.5 240 344 240zM256 0C114.6 0 0 114.6 0 256s114.6 256 256 256s256-114.6 256-256S397.4 0 256 0zM256 464c-114.7 0-208-93.31-208-208S141.3 48 256 48s208 93.31 208 208S370.7 464 256 464z" />
            </svg>
        </div>
        <svg v-if="item.downloadingPercentage !== undefined" class="download-bar" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50%" cy="50%" r="40%" stroke-width="15%" fill="none" stroke-linecap="round" />
            <circle cx="50%" cy="50%" r="40%" stroke-width="15%" fill="none" :stroke-dasharray="item.downloadingPercentage === undefined ?
            '0,10000' : `${Math.floor(2 * Math.PI * 25) * item.downloadingPercentage / 100},10000`" />
        </svg>
        <div :class="(item.sub_list !== undefined ? 'sub_file ' : '') + 'group-files'" v-show="item.sub_item_show !== false && item.sub_list !== undefined">
            <div v-for="sub_item in item.sub_list" :key="'sub_file-' + sub_item.id">
                <FileBody :chat="chat" :item="sub_item" :parent="item.id"></FileBody>
            </div>
        </div>
    </div>
</template>
  
<script lang="ts">
import { defineComponent } from 'vue'

import { getTrueLang, getSizeFromBytes, htmlDecodeByRegExp, getRandom } from '@/function/util'
import { Connector } from '@/function/connect'
import { runtimeData } from '@/function/msg'

export default defineComponent({
    name: 'FileBody',
    props: ['item', 'chat', 'parent'],
    data () {
        return {
            trueLang: getTrueLang(),
            getSize: getSizeFromBytes,
            toHtml: htmlDecodeByRegExp
        }
    },
    methods: {
        /**
         * 下载文件（获取文件下载地址并下载）
         */
        getFile (item: { [key: string]: any }) {
            const url = `https://pan.qun.qq.com/cgi-bin/group_share_get_downurl?uin=${runtimeData.loginInfo.uin}&groupid=${this.chat.show.id}&pa=/${item.bus_id}${item.id}&r=${getRandom(true, false, false, 16)}&charset=utf-8&g_tk=${runtimeData.loginInfo.bkn}`
            if (this.parent === undefined) {
                Connector.send('http_proxy', { 'url': url }, 'downloadGroupFile_' + item.id)
            } else {
                // 对于文件夹里的文件需要再找一次 ……
                Connector.send('http_proxy', { 'url': url }, 'downloadGroupFile_' + this.parent + '_' + item.id)
            }
        },
        /**
         * 加载子文件夹
         */
        loadFileDir (id: string, type: number) {
            if (type === 2 && this.item.sub_list === undefined) {
                // 加载群文件列表
                const url = `https://pan.qun.qq.com/cgi-bin/group_file/get_file_list?gc=${this.chat.show.id}&bkn=${runtimeData.loginInfo.bkn}&start_index=0&cnt=30&filter_code=0&folder_id=${id}&show_onlinedoc_folder=0`
                Connector.send('http_proxy', { 'url': url }, 'getGroupDirFiles_' + id)
            }
        }
    }
})
</script>
  