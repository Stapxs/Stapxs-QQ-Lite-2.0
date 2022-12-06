/*
 * @FileDescription: 消息发送模块
 * @Author: Stapxs
 * @Date: 2022/10/20
 * @Version: 1.0
 * @Description: 此模块包括消息发送相关的功能
*/

// 消息类型结构参考
// https://github.com/takayama-lily/oicq/blob/main/lib/message/elements.ts
// CQ Code 参考
// https://docs.go-cqhttp.org/cqcode/#%E8%BD%AC%E4%B9%89

import Vue from 'vue'

import { runtimeData } from './msg'

// 将纯文本标记字符串解析为消息 json
export function parseMsg (msg, cache) {
  let back
  if (runtimeData.tags.msgType === undefined || runtimeData.tags.msgType === 'JSON') {
    back = parseMsgToJSON(msg, cache)
  } else if (runtimeData.tags.msgType === 'CQCode') {
    back = parseMsgToCQ(msg, cache)
  }
  return back
}

export function getSQList (msg) {
  const reg = /\[SQ:\d+\]/gm
  return msg.match(reg)
}

export default {
  parseMsg,
  getSQList
}

// ========================================

function parseMsgToJSON (msg, cache) {
  const back = []
  // 如果消息发送框功能是启用的，则先将 cache 的图片插入到返回列表的最前面
  if (Vue.cacheImg != null) {
    Vue.cacheImg.forEach((item) => {
      back.push({ type: 'image', file: 'base64://' + item.substring(item.indexOf('base64,') + 7, item.length) })
    })
  }
  // 处理消息文本
  const specialList = getSQList(msg)
  if (specialList !== null) {
    specialList.forEach((item) => {
      const index = item.replace('[', '').replace(']', '').split(':')[1]
      const regCut = RegExp('^[^\\[]*\\[SQ:' + index + '\\]', 'g')
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
  // 在缓存堆中寻找其他需要特殊处理的消息
  cache.forEach((item) => {
    switch (item.type) {
      // ba回复消息移到第一个防止官方端显示错误
      case 'reply': back.unshift(item); break
    }
  })
  // 返回
  return back
}

function parseMsgToCQ (msg, cache) {
  let back = ''
  // 如果消息发送框功能是启用的，则先将 cache 的图片插入到返回列表的最前面
  if (Vue.cacheImg != null) {
    Vue.cacheImg.forEach((item) => {
      back += `[CQ:image,file=${'base64://' + item.substring(item.indexOf('base64,') + 7, item.length)}]`
    })
  }
  // 处理消息文本
  const specialList = getSQList(msg)
  if (specialList !== null) {
    specialList.forEach((item) => {
      const index = item.replace('[', '').replace(']', '').split(':')[1]
      const regCut = RegExp('^[^\\[]*\\[SQ:' + index + '\\]', 'g')
      // 处理内容
      const cutList = msg.match(regCut)
      if (cutList !== null) {
        const cutMsg = cutList[0].replace(item, '')
        // 添加前段文本
        if (cutMsg !== '') {
          back += cutMsg
        }
        // 添加后段特殊消息
        if (cache[index] !== null) {
          let cqstr = '[CQ:' + cache[index].type
          Object.keys(cache[index]).forEach((item) => {
            if (item !== 'type') {
              cqstr += ',' + item + '=' + cache[index][item]
            }
          })
          back += cqstr + ']'
        }
        // 去除内容
        msg = msg.replace(cutList[0], '')
      }
    })
  }
  if (msg !== '') {
    back += msg
  }
  // 返回
  return back
}
