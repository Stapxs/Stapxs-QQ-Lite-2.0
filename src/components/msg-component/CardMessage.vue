<!--
 * @FileDescription: 卡片消息消息组件
 * @Author: Stapxs
 * @Date: 2023/05/23
 * @Version: 1.0 - 初始版本
 * @Description: 卡片消息的单独组件，由于卡片消息的类型过于复杂越写越乱，所以单独写一个组件
                 同时也是为了优化消息刷新机制的性能，可以对不同的卡片类型设置 v-once。
-->

<!--
    附加补充：
        这儿主要针对更复杂的 json 卡片消息 …… xml 类型的卡片消息因为自定义性比 json 低
        其实已经被官方放弃了，除了比较旧的一些卡片消息，现在基本上都是 json 类型的卡片消息。
-->

<template>
    <div>
        <div v-if="item.type == 'xml'" v-html="View.buildXML(item.data, item.id, id)" @click="View.cardClick('xml-' + id)"></div>
        <div v-else>
            <div v-if="info.type == 'default'" v-html="buildJSON(info, id)" @click="View.cardClick('json-' + id)"></div>
            <div v-once v-else-if="info.type == 'tencent.map'" class="msg-comp-map" @click="View.cardClick('map-' + id)">
                <p>{{ info.app.title }}</p>
                <span>{{ info.app.desc }}</span>
                <div
                    class="map"
                    :data-url="createMap()"
                    data-urlOpenType="_self"
                    :id="'map-' + id"></div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import app from '@/main'

import { defineComponent } from 'vue'
import { MsgBodyFuns as ViewFuns } from '@/function/model/msg-body'

export default defineComponent({
    name: 'CardMessage',
    props: [ 'item', 'id' ],
    components: {},
    data() {
        return {
            View: ViewFuns,
            info: ViewFuns.getJSONType(this.item.data),
        }
    },
    methods: {
        /**
         * 构建基础 JSON 消息
         * @param info 卡片信息
         * @param id 消息 ID
         */
        buildJSON(data: any, id: string) {
            try {
                const info = data.app
                const div = document.createElement('div')
                // 构建 HTML
                const html = '<p>' + info.title + '</p>' +
                    '<span>' + info.desc + '</span>' +
                    '<img style="' + (info.preview === undefined ? 'display:none' : '') + '" src="' + info.preview + '">' +
                    (info.name ? '<div><img src="' + info.icon + '"><span>' + info.name + '</span></div>' : '')

                div.className = 'msg-json'
                div.id = 'json-' + id
                div.dataset.url = info.url
                div.dataset.urlOpenType = info.urlOpenType
                div.innerHTML = html
                // 附加信息
                if (Object.keys(data.append).length > 0) {
                    // 将 append 里的信息附加到 div 上
                    for (const key in data.append) {
                        div.dataset[key] = data.append[key]
                    }
                }
                // 返回
                return div.outerHTML
            } catch (ex) {
                return '<span v-else class="msg-unknown">( ' + app.config.globalProperties.$t('chat_show_msg_error') + ': json )</span>'
            }
        },

        /**
         * 创建高德地图模块
         */
         createMap() {
            const json = JSON.parse(this.item.data)
            window.createMap(
                process.env.VUE_APP_AMAP_KEY,
                this.id,
                {
                    lat: json.meta['Location.Search'].lat,
                    lng: json.meta['Location.Search'].lng
                }
            )
            return this.info.app.url
        }
    }
})
</script>

<style scoped>
.msg-comp-map {
    cursor: pointer;
}
.msg-comp-map > p {
    font-weight: bold;
    margin-bottom: 0;
}
.msg-comp-map > span {
    font-size: 0.9rem;
    opacity: 0.7;
}
.msg-comp-map > div.map {
    height: 200px;
    border-radius: 7px;
    margin-top: 10px;
    width: 400px;
    max-width: calc(100vw - 150px);
    pointer-events: none;
}
</style>
