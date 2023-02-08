'use strict'

import windowStateKeeper from 'electron-window-state'
import os from 'os'

import { ipcMain, Menu } from 'electron'
import { app, protocol, BrowserWindow } from 'electron'
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'
import installExtension, { VUEJS3_DEVTOOLS } from 'electron-devtools-installer'
import { GtkTheme, GtkData } from '@jakejarrett/gtk-theme'

const isDevelopment = process.env.NODE_ENV !== 'production'

protocol.registerSchemesAsPrivileged([
    { scheme: 'app', privileges: { secure: true, standard: true } }
])

let win = undefined as BrowserWindow | undefined

async function createWindow() {

    ipcMain.handle('opt:getSystemInfo', () => {
        const systemInfo = {} as { [key: string]: any }
        systemInfo.electron = process.versions.electron
        systemInfo.os = os.homedir()
        return systemInfo
    })
    ipcMain.handle('sys:getGTKTheme', () => {
        const gtkTheme = new GtkTheme({events: {
            themeChange: (data: GtkData) => {
                console.log('GTK 主题修改：' + data.name)
                const info = {} as {[key:string]:any}
                info.name = data.name
                info.css = data.gtk.css
                if(win) {
                    win.webContents.send('sys:updateGTKTheme', info)
                }
            }
        }})
        return gtkTheme.getTheme().gtk.css
    })
    ipcMain.on('win:openDevTools', () => {
        if(win) {
            win.webContents.openDevTools()
        }
    })
    
    let mainWindowState = windowStateKeeper({
        defaultWidth: 1200,
        defaultHeight: 800
    })
    win = new BrowserWindow({
        x: mainWindowState.x,
        y: mainWindowState.y,
        width: mainWindowState.width,
        height: mainWindowState.height,
        // frame: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    })

    if (process.env.WEBPACK_DEV_SERVER_URL) {
        await win.loadURL(process.env.WEBPACK_DEV_SERVER_URL as string)
        if (!process.env.IS_TEST) win.webContents.openDevTools()
    } else {
        createProtocol('app')
        win.loadURL('app://./index.html')
    }

    mainWindowState.manage(win)
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
        } catch (e: any) {
            console.error('Vue Devtools failed to install:', e.toString())
        }
    }
    Menu.setApplicationMenu(null)
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
