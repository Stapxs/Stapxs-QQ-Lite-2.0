/*
 * @FileDescription: 基础功能模块
 * @Author: Stapxs
 * @Date: 2022/10/20
 * @Version: 1.0
 * @Description: 此模块主要为程序相关的基础功能
*/

import Option from './options'

// 日志
class Logger {
  constructor () {
    this.logMode = {
      ws: ['7abb7e', 'fff', 'WS'],
      ui: ['b573f7', 'fff', 'UI'],
      err: ['ff5370', 'fff', 'ERR'],
      info: ['99b3db', 'fff', 'INFO'],
      debug: ['677480', 'fff', 'DEBUG']
    }
  }

  add (mode, args) {
    const logLevel = Option.get('log_level')
    // PS：info 级别是指除了 ws、ui 和 debug 类型以外的其他日志
    /* eslint-disable */
    switch(logLevel) {
      case 'all': {
        if (mode === this.logMode.ws || mode === this.logMode.ui) {
          console.log(`%c${mode[2]}%c ${args}`, `background:#${mode[0]};color:#${mode[1]};border-radius:7px 0 0 7px;display:inline-block;padding:2px 4px 2px 7px;`, '')
        }
      }
      case 'debug': {
        if (mode === this.logMode.debug) {
          console.log(`%c${mode[2]}%c ${args}`, `background:#${mode[0]};color:#${mode[1]};border-radius:7px 0 0 7px;display:inline-block;padding:2px 4px 2px 7px;`, '')
        }
      }
      case 'info': {
        if (mode === this.logMode.info) {
          console.log(`%c${mode[2]}%c ${args}`, `background:#${mode[0]};color:#${mode[1]};border-radius:7px 0 0 7px;display:inline-block;padding:2px 4px 2px 7px;`, '')
        }
      }
      case 'err': {
        if (mode === this.logMode.err) {
          console.log(`%c${mode[2]}%c ${args}`, `background:#${mode[0]};color:#${mode[1]};border-radius:7px 0 0 7px;display:inline-block;padding:2px 4px 2px 7px;`, '')
        }
      }
    }
    /* eslint-enable */
  }

  error (args) {
    this.add(this.logMode.err, args)
  }

  debug (args) {
    this.add(this.logMode.debug, args)
  }
}

// 全局消息
class PopInfo {
  constructor () {
    this.appMsgType = {
      info: ['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M256 0C114.6 0 0 114.6 0 256s114.6 256 256 256s256-114.6 256-256S397.4 0 256 0zM232 152C232 138.8 242.8 128 256 128s24 10.75 24 24v128c0 13.25-10.75 24-24 24S232 293.3 232 280V152zM256 400c-17.36 0-31.44-14.08-31.44-31.44c0-17.36 14.07-31.44 31.44-31.44s31.44 14.08 31.44 31.44C287.4 385.9 273.4 400 256 400z"/></svg>'],
      err: ['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M256 512c141.4 0 256-114.6 256-256S397.4 0 256 0S0 114.6 0 256S114.6 512 256 512zM175 175c9.4-9.4 24.6-9.4 33.9 0l47 47 47-47c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9l-47 47 47 47c9.4 9.4 9.4 24.6 0 33.9s-24.6 9.4-33.9 0l-47-47-47 47c-9.4 9.4-24.6 9.4-33.9 0s-9.4-24.6 0-33.9l47-47-47-47c-9.4-9.4-9.4-24.6 0-33.9z"/></svg>']
    }
  }

  add (typeInfo, args, isAutoClose) {
    const data = {
      id: popList.length,
      svg: typeInfo[0],
      text: args,
      autoClose: isAutoClose === undefined ? true : isAutoClose
    }
    popList.splice(popList.length, 0, data)
    // 创建定时器
    if (data.autoClose) {
      setTimeout(() => {
        this.remove(data.id)
      }, 5000)
    }
  }

  remove (id) {
    const index = popList.findIndex((item) => {
      return item.id === id
    })
    if (index !== -1) {
      popList.splice(index, 1)
    }
  }
}

export const logger = new Logger()
export const popInfo = new PopInfo()
export const popList = []
