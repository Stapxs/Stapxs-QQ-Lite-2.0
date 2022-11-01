/*
 * @FileDescription: 消息发送模块
 * @Author: Stapxs
 * @Date: 2022/10/20
 * @Version: 1.0
 * @Description: 此模块包括消息发送相关的功能
*/

// 消息类型结构参考
// https://github.com/takayama-lily/oicq/blob/main/lib/message/elements.ts
import Vue from 'vue'

// 将纯文本标记字符串解析为消息 json
export function parseMsg (msg, cache) {
  let back = []
  // 判断某浏览器
  // 如果消息发送框功能是启用的，则先将 cache 的图片插入到返回列表的最前面
  // TODO 这边还没有判断设置项
  if (Vue.cacheImg != null) {
    Vue.cacheImg.forEach((item) => {
      back.push({type: 'image', file: 'base64://' + item.substring(item.indexOf('base64,') + 7, item.length)})
    })
  }
  const specialList = getSQList(msg)
  if (specialList !== null) {
    specialList.forEach((item) => {
      const index = item.replace('[', '').replace(']', '').split(':')[1]
      regCut = RegExp('^[^\\[]*\\[SQ:' + index + '\\]', 'g')
      // 处理内容
      const cutList = msg.match(regCut)
      if (cutList !== null) {
        const cutMsg = cutList[0].replace(item, '')
        // 添加前段文本
        if (cutMsg !== '') {
          back.push({ type: 'text', text: cutMsg })
        }
        // 添加后段特殊消息
        if (cache[index] !== null) {
          back.push(cache[index])
        }
        // 去除内容
        msg = msg.replace(cutList[0], '')
      }
    })
  }
  if (msg !== '') {
    back.push({ type: 'text', text: msg })
  }
  return back
}

export function getSQList (msg) {
  reg = /\[SQ:\d+\]/gm
  return msg.match(reg)
}

export default {
  parseMsg,
  getSQList
}
