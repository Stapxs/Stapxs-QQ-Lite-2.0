/*
 * @FileDescription: 基础功能模块
 * @Author: Stapxs
 * @Date: 2022/10/20
 * @Version: 1.0
 * @Description: 此模块主要为程序相关的基础功能
*/

import Option from './option'
import { reactive } from 'vue'
import { PopInfoElem } from './elements/system'

// =============== 日志 ===============

export enum LogType {
    WS, UI, ERR, INFO, DEBUG
}

export class Logger {

    private logTypeInfo: [string, string][]

    constructor() {
        // 日志类型输出文本前缀样式，顺序对应 LogType
        this.logTypeInfo = [
            ['7abb7e', 'fff'], ['b573f7', 'fff'], ['ff5370', 'fff'],
            ['99b3db', 'fff'], ['677480', 'fff']
        ]
    }

    /**
     * 输出一条日志
     * @param mode 日志类型
     * @param args 日志内容
     */
    add(type: LogType, args: string) {
        const logLevel = Option.get('log_level')
        // PS：info 级别是指除了 ws、ui 和 debug 类型以外的其他日志
        if (logLevel === 'all' && (type === LogType.WS || type === LogType.UI) ||
            logLevel === 'debug' && type === LogType.DEBUG ||
            logLevel === 'info' && type === LogType.INFO ||
            logLevel === 'err' && type === LogType.ERR) {
            this.print(type, args)
        }
    }
    error(args: string) {
        this.add(LogType.ERR, args)
    }
    debug(args: string) {
        this.add(LogType.DEBUG, args)
    }

    /**
     * 打印一条日志
     * @param type 日志类型
     * @param args 日志内容
     */
    private print(type: LogType, args: string) {
        console.log(`%c${LogType[type]}%c ${args}`, `background:#${this.logTypeInfo[type][0]};color:#${this.logTypeInfo[type][1]};border-radius:7px 0 0 7px;display:inline-block;padding:2px 4px 2px 7px;`, '');
    }
}

// =============== 系统消息 ===============

export enum PopType {
    INFO = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M256 0C114.6 0 0 114.6 0 256s114.6 256 256 256s256-114.6 256-256S397.4 0 256 0zM232 152C232 138.8 242.8 128 256 128s24 10.75 24 24v128c0 13.25-10.75 24-24 24S232 293.3 232 280V152zM256 400c-17.36 0-31.44-14.08-31.44-31.44c0-17.36 14.07-31.44 31.44-31.44s31.44 14.08 31.44 31.44C287.4 385.9 273.4 400 256 400z"/></svg>',
    ERR = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M256 512c141.4 0 256-114.6 256-256S397.4 0 256 0S0 114.6 0 256S114.6 512 256 512zM175 175c9.4-9.4 24.6-9.4 33.9 0l47 47 47-47c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9l-47 47 47 47c9.4 9.4 9.4 24.6 0 33.9s-24.6 9.4-33.9 0l-47-47-47 47c-9.4 9.4-24.6 9.4-33.9 0s-9.4-24.6 0-33.9l47-47-47-47c-9.4-9.4-9.4-24.6 0-33.9z"/></svg>'
}


export class PopInfo {
    /**
     * 
     * @param typeInfo 消息类型
     * @param args 消息内容
     * @param isAutoClose 是否自动关闭（默认为 true）
     */
    add(icon: PopType, args: string, isAutoClose = true) {
        const data: PopInfoElem = {
            id: popList.length,
            svg: icon,
            text: args,
            autoClose: isAutoClose
        }
        popList.splice(popList.length, 0, data)
        // 创建定时器
        if (data.autoClose) {
            setTimeout(() => {
                this.remove(data.id)
            }, 5000)
        }
    }

    /**
     * 移除一条消息
     * @param id 消息编号
     */
    remove(id: number) {
        const index = popList.findIndex((item) => {
            return item.id === id
        })
        if (index !== -1) {
            popList.splice(index, 1)
        }
    }
}

export const popList: PopInfoElem[] = reactive([])
