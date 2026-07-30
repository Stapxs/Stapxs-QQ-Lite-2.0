/**
 * 后端和前端的简易通信器，封装一些常用的交互
 */

import WebSocket from 'ws'
import log4js from 'log4js'
import { BrowserWindow, ipcMain } from 'electron'
import { logLevel } from '../index.ts'

export function buildWebSocketUrl(address: string, token?: string) {
    let url = address.trim()
    if (!/^wss?:\/\//i.test(url)) {
        url = 'wss://' + url
    }

    const parsedUrl = new URL(url)
    if (token) {
        parsedUrl.searchParams.set('access_token', token)
    }
    return parsedUrl
}

export class Connector {
    private logger = log4js.getLogger('connector')

    private win: BrowserWindow
    private websocket: WebSocket | undefined
    private reconnectTimes = 0

    constructor(win: BrowserWindow) {
        this.logger.level = logLevel
        this.win = win
        // 初始化 ipc
        ipcMain.on('onebot:send', (_, json) => {
            this.websocket?.send(json)
        })
        ipcMain.on('onebot:close', () => {
            this.websocket?.close(1000)
            this.websocket = undefined
        })
        this.logger.info('后端连接器已初始化')
    }

    connect(url: string, token?: string) {
        let parsedUrl: URL
        try {
            parsedUrl = buildWebSocketUrl(url, token)
        } catch (e) {
            this.logger.error('无效的 WebSocket 地址：', e)
            this.win.webContents.send('onebot:onclose', {
                code: 1000,
                message: 'Invalid WebSocket URL',
                address: url,
                token: token,
            })
            return
        }

        const connectionUrl = parsedUrl.toString()
        if (token) {
            parsedUrl.searchParams.delete('access_token')
        }
        url = parsedUrl.toString()

        if (!this.websocket) {
            this.logger.info('正在连接到：', url)
            this.websocket = new WebSocket(connectionUrl)
        } else {
            // 如果前端发起了连接请求，说明前端在未连接状态；断开已有连接，重新连接
            // PS：这种情况一般不会发生，大部分情况是因为 debug 模式前端热重载导致的
            this.websocket.close(1000)
            this.connect(url, token)
        }

        this.websocket.onopen = () => {
            this.reconnectTimes = 0
            this.logger.info('已成功连接到', url)
            this.win.webContents.send('onebot:onopen', {
                address: url,
                token: token,
            })
        }
        this.websocket.onmessage = (e) => {
            this.win.webContents.send('onebot:onmessage', e.data)
        }
        this.websocket.onclose = (e) => {
            this.websocket = undefined

            this.logger.info('连接已关闭，代码：', e.code)
            if (e.code != 1006 && e.code != 1015) {
                // 除了需要重连的情况，其他情况都直接常规处理
                this.win.webContents.send('onebot:onclose', {
                    code: e.code,
                    message: e.reason,
                    address: url,
                    token: token,
                })
            } else {
                this.win.webContents.send('onebot:onclose', {
                    code: -1,
                    message: e.reason,
                    address: url,
                    token: token,
                })
            }
            if (this.reconnectTimes < 4) {
                setTimeout(() => {
                    if (e.code == 1006) {
                        // 连接失败，尝试轮替协议重连
                        if (url.indexOf('wss://') >= 0) {
                            url = url.replace('wss://', 'ws://')
                        } else {
                            url = url.replace('ws://', 'wss://')
                        }
                        this.logger.warn('连接失败，尝试重连...')
                        this.connect(url, token)
                    }
                    this.reconnectTimes++
                }, 1500)
            }
        }
        this.websocket.onerror = (e) => {
            this.websocket = undefined
            this.logger.error('连接错误：', e)
        }
    }
}
