/*
 * @FileDescription: MsgBody.vue 所使模块用的通用的消息显示相关
 * @Author: Stapxs
 * @Date: 2022/11/29
 * @Version: 1.0
 * @Description: 此模块抽离出了本来在 MsgBody.vue 中的一些较为通用的方法便于进行多 Bot 适配。
*/

import xss from 'xss'
import app from '@/main'

import { PopInfo, PopType } from '@/function/base'
import { Connector } from '@/function/connect'
import util from '../util'

const popInfo = new PopInfo()

export class MsgBodyFuns {
    /**
     * 判断消息块是否需要行内显示
     * @param typeName 消息类型
     * @returns T / F
     */
    static isMsgInline(typeName: string) {
        switch (typeName) {
            case 'at':
            case 'text':
            case 'face': return true
            case 'bface':
            case 'image':
            case 'record':
            case 'video':
            case 'file':
            case 'json':
            case 'xml': return false
        }
    }
    /**
     * 尝试解析渲染 XML 消息
     * @param xml 原始的 XML 消息内容 
     * @param id  XML 消息 ID（暂时不知道有什么用）
     * @param msgid 消息 ID
     * @returns 处理完成的 HTML 代码
     */
    static buildXML(xml: string, id: string, msgid: string) {
        // <msg> 标签内的为本体
        let item = xml.substring(xml.indexOf('<item'), xml.indexOf('</msg>'))
        // 尝试转换标签为 html
        // item = item.replaceAll('/>', '>')
        item = item.replaceAll('item', 'div') // item
        item = item.replaceAll('<div', '<div class="msg-xml"')
        item = item.replaceAll('title', 'p') // title
        item = item.replaceAll('summary', 'a') // summary
        item = item.replaceAll('<a', '<a class="msg-xml-summary"')
        item = item.replaceAll('<picture', '<img class="msg-xml-img"') // picture
        // 将不正确的参数改为 dataset
        item = item.replaceAll('size=', 'data-size=')
        item = item.replaceAll('linespace=', 'data-linespace=')
        item = item.replaceAll('cover=', 'src=')
        // 处理出处标签
        item = item.replace('source name=', 'source data-name=')
        // 处理错误的 style 位置
        const div = document.createElement('div')
        div.id = 'xml-' + msgid
        div.dataset.id = id
        div.innerHTML = item
        for (let i = 0; i < div.children[0].children.length; i++) {
            switch (div.children[0].children[i].nodeName) {
                case 'P': {
                    const pBody = div.children[0].children[i] as HTMLParagraphElement
                    pBody.style.fontSize = (Number(pBody.dataset.size) / 30).toString() + 'rem'
                    pBody.style.marginBottom = Number(pBody.dataset.size) / 5 + 'px'
                    break
                }
            }
        }
        // 解析 msg 消息体
        let msgHeader = xml.substring(xml.indexOf('<msg'), xml.indexOf('<item')) + '</msg>'
        msgHeader = msgHeader.replace('msg', 'div')
        msgHeader = msgHeader.replace('m_resid=', 'data-resid=')
        msgHeader = msgHeader.replace('url=', 'data-url=')
        const header = document.createElement('div')
        header.innerHTML = msgHeader
        // 处理特殊的出处
        let sourceBody = undefined
        for (let i = 0; i < div.children.length; i++) {
            if (div.children[i].nodeName === 'SOURCE') {
                sourceBody = div.children[i] as HTMLElement
            }
        }
        if (sourceBody !== undefined) {
            let source = sourceBody.dataset.name
            if(source) {
                if(source.indexOf('聊天记录') >= 0) source = '聊天记录'
                switch (source) {
                    case '聊天记录': {
                        // 合并转发消息
                        div.dataset.type = 'forward'
                        div.dataset.id = (header.children[0] as HTMLElement).dataset.resid
                        div.style.cursor = 'pointer'
                        break
                    }
                    case '群投票': {
                        // 群投票
                        return '<a class="msg-unknow">（' + app.config.globalProperties.$t('chat_xml_unsupport') + '：' + source + '）</a>'
                    }
                }
            }
        }
        // 附带链接的 xml 消息处理
        if ((header.children[0] as HTMLElement).dataset.url !== undefined) {
            div.dataset.url = (header.children[0] as HTMLElement).dataset.url
            div.style.cursor = 'pointer'
        }
        return div.outerHTML
    }

    /**
     * 尝试渲染 JSON 消息
     * @param data JSON 消息字符串
     * @param msgId 消息 ID
     * @returns 
     */
    static buildJSON(data: string, msgId: string) {
        // 解析 JSON
        const json = JSON.parse(data)
        const body = json.meta[Object.keys(json.meta)[0]]
        // App 信息
        let name = body.tag === undefined ? body.title : body.tag
        let icon = body.icon === undefined ? body.source_icon : body.icon

        let title = body.title
        let desc = body.desc

        let preview = body.preview
        if (preview !== undefined && preview.indexOf('http') === -1) preview = '//' + preview

        const div = document.createElement('div')

        // 一些特殊判定
        if (json.desc === '群公告') {
            title = json.desc
            desc = json.prompt
            preview = undefined
            icon = ''
            name = json.desc
        }
        if(json.desc.indexOf('聊天记录') >= 1) {
            title = json.meta.detail.source
            desc = '<div style="padding: 15px 20px 5px 20px">'
            json.meta.detail.news.forEach((item: any) => {
                desc += '<span>' + item.text + '</span><br>'
            })
            desc += '</div>'
            icon = ''
            name = json.meta.detail.summary
            
            div.dataset.type = 'forward'
            div.dataset.id = json.meta.detail.resid
            div.style.cursor = 'pointer'
        }

        const url = body.qqdocurl === undefined ? body.jumpUrl : body.qqdocurl
        // 构建 HTML
        const html = '<p>' + title + '</p>' +
            '<span>' + desc + '</span>' +
            '<img style="' + (preview === undefined ? 'display:none' : '') + '" src="' + preview + '">' +
            '<div><img src="' + icon + '"><span>' + name + '</span></div>'

        div.className = 'msg-json'
        div.id = 'json-' + msgId
        div.dataset.url = url
        div.innerHTML = html

        // 返回
        return div.outerHTML
    }

    /**
     * xml, json 消息的点击事件
     * @param bodyId 用来寻找 DOM 的 ID
     */
    static cardClick(bodyId: string) {
        const sender = document.getElementById(bodyId)
        if (sender !== null) {
            const type = sender.dataset.type
            // 如果存在 url 项，优先打开 url
            if (sender.dataset.url !== undefined && sender.dataset.url !== 'undefined' && sender.dataset.url !== '') {
                util.openLink(sender.dataset.url)
                return
            }
            // 接下来按类型处理
            switch(type) {
                case 'forward': {
                    // 解析合并转发消息
                    popInfo.add(PopType.INFO, app.config.globalProperties.$t('pop_get_forward'))
                    this.getForwardMsg(sender.dataset.id)
                    break
                }
            }
        }
    }

    static getForwardMsg(id: any) {
        if (id !== 'undefined') {
            // resid 是 oicq 的， message_id 是 gocqhttp 的
            Connector.send('get_forward_msg', { 'resid': id, 'message_id': id }, 'getForwardMsg')
        } else {
            popInfo.add(PopType.INFO, app.config.globalProperties.$t('pop_chat_forward_toooomany'))
        }
    }

    /**
     * 处理纯文本消息（处理换行，转义字符并进行 xss 过滤便于高亮链接）
     * @param { string } text 文本
     * @returns 处理完成的文本
     */
    static parseText(text: string) {
        // 把 r 转为 n
        text = text.replaceAll('\r\n', '\n').replaceAll('\r', '\n')
        // 防止意外渲染转义字符串
        text = text.replaceAll('&', '&amp;')
        // XSS 过滤
        text = xss(text, {whiteList: {a: ["href", "target"]}})
        // 返回
        return text
    }
}
