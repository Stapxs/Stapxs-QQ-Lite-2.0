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
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><!--! Font Awesome Pro 6.2.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2022 Fonticons, Inc. --><path d="M169.4 470.6c12.5 12.5 32.8 12.5 45.3 0l160-160c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L224 370.8 224 64c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 306.7L54.6 265.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l160 160z"/></svg>
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

import { getTrueLang, getSizeFromBytes, htmlDecodeByRegExp } from '@/function/util'
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
            if (this.parent === undefined) {
                Connector.send('get_file_url', {
                    id: runtimeData.chatInfo.show.id,
                    message_id: runtimeData.messageList[0].message_id,
                    fid: item.id
                }, 'downloadGroupFile_' + item.id)
            } else {
                // 对于文件夹里的文件需要再找一次 ……
                Connector.send('http_proxy', {
                    id: runtimeData.chatInfo.show.id,
                    message_id: runtimeData.messageList[0].message_id,
                    fid: item.id
                }, 'downloadGroupFile_' + this.parent + '_' + item.id)
            }
            // PS：在发起下载后就要将百分比设置好 …… 因为下载部分不一定立刻会开始
            // 这时候如果用户疑惑为什么点了没反应会多次操作的（用户竟是我自己）
            item.downloadingPercentage = 0
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
  