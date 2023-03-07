import Store from 'electron-store'
import path from 'path'
import os from 'os'

import { ipcMain, shell, systemPreferences, app } from "electron"
import { GtkTheme, GtkData } from '@jakejarrett/gtk-theme'
import { Exception } from 'vue-gtag-next'
import { queryKeys } from './util'
import { win } from '@/background'

export default function regIpcListener() {
    // 关闭窗口
    ipcMain.on('win:close', () => {
        if(win) win.close()
    })
    // 最小化
    ipcMain.on('win:minimize', () => {
        if(win) win.minimize()
    })
    // 重启应用
    ipcMain.on('win:relaunch', () => {
        app.relaunch()
        app.exit()
    })
    // 单独用于保存窗口框架是否显示的设置
    // PS：因为改变窗口框架需要在窗口创建前设置，所以单独保存设置便于获取
    ipcMain.on('opt:saveNoWindow', (event, arg) => {
        const store = new Store()
        store.set('opt_no_window', Boolean(arg))
    })
    // 获取补充的调试信息
    ipcMain.handle('opt:getSystemInfo', () => {
        const systemInfo = {} as { [key: string]: any }
        systemInfo.electron = process.versions.electron
        systemInfo.os = os.homedir()
        return systemInfo
    })
    // 获取 GTK 主题 CSS
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
    // 打开开发者工具
    ipcMain.on('win:openDevTools', () => {
        if(win) win.webContents.openDevTools()
    })
    // 聚焦窗口
    ipcMain.on('win:fouesWindow', () => {
        if(win) win.focus()
    })
    // Windows 的特有功能，闪烁状态栏图标
    ipcMain.on('win:flashWindow', () => {
        if(win) win.flashFrame(true)
    })
    // Winodws 通过注册表获取系统主题色
    ipcMain.handle('sys:getWinColor', async () => {
        // 订阅颜色修改事件
        systemPreferences.addListener('accent-color-changed', async () => {
            if(win) {
                win.webContents.send('sys:WinColorChanged', await getWinSysColor())
            }
        })
        return getWinSysColor()
    })
    async function getWinSysColor() {
        const keyPath = 'HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\DWM\\'
        try {
            const info = await queryKeys(keyPath, 'AccentColor')
            const color = info.stdout.substring(info.stdout.lastIndexOf('0xff') + 4)
            return { color: [parseInt('0x' + color.substring(4, 6)), parseInt('0x' + color.substring(2, 4)), parseInt('0x' + color.substring(0, 2))] }
        } catch(ex) {
            return { err: (ex as Exception).description }
        }
    }
    // 下载文件
    ipcMain.on('sys:download', (evt, args) => {
        const downloadPath = args.downloadPath
        const fileName = args.fileName
        const ext = path.extname(fileName)
        const filters = [{ name: '全部文件', extensions: ['*'] }]
        if (ext && ext !== '.' && ext != null) {
            const array = ext.match(/[a-zA-Z]+$/)
            if (array) {
                filters.unshift({ name: '', extensions: [array[0]] })
            }
        }
        if (win) {
            win.webContents.session.on('will-download', (event, item) => {
                item.on('updated', (event, state) => {
                    if (state === 'progressing') {
                        if (!item.isPaused()) {
                            if (win) {
                                win.webContents.send('sys:downloadBack', {
                                    lengthComputable: true,
                                    loaded: item.getReceivedBytes(),
                                    total: item.getTotalBytes()
                                })
                                win.setProgressBar(item.getReceivedBytes() / item.getTotalBytes())
                            }
                        }
                    }
                })
                item.on('done', (event, state) => {
                    shell.showItemInFolder((event as any).sender.getSavePath())
                })
            })
            win.webContents.downloadURL(downloadPath)
        }
    })
}
