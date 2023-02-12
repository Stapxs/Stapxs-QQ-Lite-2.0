import path from 'path'
import os from 'os'

import { dialog, ipcMain, shell, systemPreferences } from "electron"
import { GtkTheme, GtkData } from '@jakejarrett/gtk-theme'
import { Exception } from 'vue-gtag-next'
import { queryKeys } from './util'
import { win } from '@/background'

export default function regIpcListener() {
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
    const downloadInfo = {
        savedPath: ''
    }
    ipcMain.on('sys:download', (evt, args) => {
        const downloadPath = args.downloadPath
        const fileName = args.fileName
        let ext = path.extname(fileName)
        let filters = [{ name: '全部文件', extensions: ['*'] }]
        if (ext && ext !== '.' && ext != null) {
            const array = ext.match(/[a-zA-Z]+$/)
            if (array) {
                filters.unshift({ name: '', extensions: [array[0]] })
            }
        }
        if (win) {
            // 弹出另存为弹框，用于获取保存路径
            dialog.showSaveDialog(win, { filters, defaultPath: fileName })
                .then((result) => {
                    if (win && result.filePath) {
                        downloadInfo.savedPath = result.filePath
                        win.webContents.downloadURL(downloadPath)
                    }
                })
        }
    })
    if (win) {
        win.webContents.session.on('will-download', (event, item) => {
            //设置文件存放位置
            item.setSavePath(downloadInfo.savedPath)
            item.on('updated', (event, state) => {
                if (state === 'interrupted') {
                    console.log('Download is interrupted but can be resumed')
                } else if (state === 'progressing') {
                    if (item.isPaused()) {
                        console.log('Download is paused')
                    } else {
                        console.log(`Received bytes: ${item.getReceivedBytes()}`)
                        if(win){
                            win.webContents.send('sys:download', {
                                lengthComputable: true,
                                loaded: item.getReceivedBytes(),
                                total: item.getTotalBytes()
                            })
                            win.setProgressBar(item.getReceivedBytes() / item.getTotalBytes())
                        }
                    }
                }
            })
            item.once('done', (event, state) => {
                if (state === 'completed') {
                    console.log('Download successfully')
                     // 下载成功后打开文件所在文件夹
                    shell.showItemInFolder(downloadInfo.savedPath)
                } else {
                    console.log(`Download failed: ${state}`)
                }
            })
        })
    }
}
