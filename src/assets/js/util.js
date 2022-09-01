/*
 * @FileDescription: 工具模块
 * @Author: Stapxs
 * @Date: 2022/08/02
 * @Version: 1.0
*/

function mergeList (a, b) {
  return a.concat(b)
}

function parseMsgId (id) {
  if (id !== undefined && id !== null && id.length > 0) {
    var binaryString = window.atob(id)
    var len = binaryString.length
    var bytes = new Uint8Array(len)
    for (var i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    var buffer = bytes.buffer
    var dv = new DataView(buffer, 0)
    if (id.length === 28) {
      return {
        gid: dv.getInt32(0),
        uid: dv.getInt32(4),
        seqid: dv.getInt32(8)
      }
    } else if (id.length === 24) {
      return {
        uid: dv.getInt32(0),
        seqid: dv.getInt32(4)
      }
    }
  }
  return { gid: '', uid: '', seqid: '' }
}

export function isExternal (path) {
  return /^(https?:|mailto:|tel:)/.test(path)
}

export default {
  mergeList,
  parseMsgId
}
