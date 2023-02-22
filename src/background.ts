'use strict'

import windowStateKeeper from 'electron-window-state'
import regIpcListener from './function/electron/ipc'
import path from 'path'

import { Menu } from 'electron'
import { app, protocol, BrowserWindow } from 'electron'
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'
import installExtension, { VUEJS3_DEVTOOLS } from 'electron-devtools-installer'

const isDevelopment = process.env.NODE_ENV !== 'production'

protocol.registerSchemesAsPrivileged([
    { scheme: 'app', privileges: { secure: true, standard: true } }
])

export let win = undefined as BrowserWindow | undefined

async function createWindow() {
    // 窗口创建前事务
    Menu.setApplicationMenu(null)
    regIpcListener()
    // 创建窗口
    let mainWindowState = windowStateKeeper({
        defaultWidth: 1200,
        defaultHeight: 800
    })
    win = new BrowserWindow({
        x: mainWindowState.x,
        y: mainWindowState.y,
        width: mainWindowState.width,
        height: mainWindowState.height,
        icon: path.join(__dirname,'./public/img/icons/icon.png'),
        // frame: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    })
    win.once('focus', () => {if(win)win.flashFrame(false)})
    mainWindowState.manage(win)     // 窗口状态管理器
    // 加载应用
    if (process.env.WEBPACK_DEV_SERVER_URL) {
        await win.loadURL(process.env.WEBPACK_DEV_SERVER_URL as string)
        if (!process.env.IS_TEST) win.webContents.openDevTools()
    } else {
        createProtocol('app')
        win.loadURL('app://./index.html')
    }
}

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

app.on('ready', async () => {
    if (isDevelopment && !process.env.IS_TEST) {
        try {
            await installExtension(VUEJS3_DEVTOOLS)
            // 这是个谷歌分析调试工具，好像用不了？？
            // await installExtension({
            //     id: 'ilnpmccnfdjdjjikgkefkcegefikecdc',
            //     electron: '>=1.2.1'
            // })
        } catch (e: any) {
            console.error('Vue Devtools failed to install:', e.toString())
        }
    }
    createWindow()
})

if (isDevelopment) {
    if (process.platform === 'win32') {
        process.on('message', (data) => {
            if (data === 'graceful-exit') {
                app.quit()
            }
        })
    } else {
        process.on('SIGTERM', () => {
            app.quit()
        })
    }
}
