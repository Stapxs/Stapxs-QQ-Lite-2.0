import Store from 'electron-store'
import path from 'path'
import os from 'os'
import log4js from 'log4js'
import axios from 'axios'

import {
    ipcMain,
    systemPreferences,
    app,
    Menu,
    MenuItemConstructorOptions,
    Notification as ELNotification,
    shell,
} from 'electron'
import { runCommand } from './util.ts'
import { win, touchBarInstance } from '../index.ts'
import { Connector } from './connector.ts'
import { logLevel } from '../index.ts'
import ScanNetwork from './scannetwork.ts'
import { execSync } from 'child_process'

let connector = undefined as Connector | undefined
const store = new Store()
const logger = log4js.getLogger('ipc')
let template = [] as any[]

// 消息缓存，key 为 tag
const noticeList = {} as { [key: string]: ELNotification }

export function regIpcListener() {
    // 后端连接模式
    ipcMain.on('onebot:connect', (_, args) => {
        if (!connector && win) {
            connector = new Connector(win)
        }
        connector?.connect(args.address, args.token)
    })
    // 获取系统平台
    ipcMain.handle('sys:getPlatform', () => {
        return process.platform
    })
    ipcMain.handle('sys:getRelease', () => {
        const osName = os.type() // 'Linux', 'Darwin', 'Windows_NT'
        let osVersion = os.release()
        if(osName === 'Darwin') {
            osVersion = execSync('sw_vers -productVersion').toString().trim()
            if (osVersion.split('.').length === 2) {
                osVersion += '.0';
            }
        }
        let releaseInfo = ''
        if (osName === 'Linux') releaseInfo = 'Linux ' + osVersion
        if (osName === 'Darwin') releaseInfo = 'macOS ' + osVersion
        if (osName === 'Windows_NT') releaseInfo = 'Windows ' + osVersion
        // 获取架构
        const arch = os.arch()
        return { release: releaseInfo, arch: arch }
    })
    // 获取最终 URL
    ipcMain.handle('sys:getFinalRedirectUrl', async (_, str: string) => {
        try {
            const url = new URL(str);
            if (!['http:', 'https:'].includes(url.protocol)) {
                return str
            }
            if (str.length > 2000) {
                return str
            }
            const MAX_REDIRECTS = 10;
            const response = await axios.get(url.toString(), {
                maxRedirects: MAX_REDIRECTS,
                validateStatus: (status) => status < 400
            })
            return response.request.res.responseUrl
        } catch (error) {
            return str
        }
    })
    // 获取 html 内容
    ipcMain.handle('sys:getHtml', async (_, link: string) => {
        try {
            const res = await axios.get(link, {
                headers: { Accept: 'text/html' }
            })
            const contentType = res.headers['content-type']
            if(contentType && contentType.includes('text/html')) {
                return res.data
            }
        } catch (error) {
            logger.error(error as Error, '获取 html 内容失败')
        }
        return null
    })
    // 获取 api 数据
    ipcMain.handle('sys:getApi', async (_, link: string) => {
        try {
            const response = await axios.get(link, { timeout: 10000 })
            return response.data
        } catch (error) {
            logger.error(error as Error, '获取 api 数据失败')
        }
    })
    // 关闭窗口
    ipcMain.on('win:close', () => {
        if (win) win.close()
    })
    // 最小化
    ipcMain.on('win:minimize', () => {
        if (win) win.minimize()
    })
    // 最大化
    ipcMain.on('win:maximize', () => {
        if (win) win.maximize()
    })
    // 重启应用
    ipcMain.on('win:relaunch', () => {
        app.relaunch()
        app.exit()
    })
    // 置顶窗口
    ipcMain.on('win:alwaysTop', (_, args) => {
        if (win) win.setAlwaysOnTop(args)
    })
    // 获取窗口信息
    ipcMain.handle('win:getWindowInfo', () => {
        if (win) {
            const [x, y] = win.getPosition()
            const [width, height] = win.getSize()
            return {
                x: x,
                y: y,
                width: width,
                height: height,
            }
        }
        return {
            x: 0,
            y: 0,
            width: 0,
            height: 0,
        }
    })
    // 移动窗口位置
    ipcMain.on('win:move', (_, point) => {
        if (win) {
            win.setPosition(point.x, point.y)
        }
    })
    // 保存信息
    ipcMain.on('opt:store', (_, arg) => {
        store.set(arg.key, arg.value)
    })
    // 保存设置
    // PS：升级至 electron 27 后 cookie 已完全无法持久化，只能进行保存
    ipcMain.on('opt:saveAll', (_, arg) => {
        store.store = arg
    })
    // 获取设置
    ipcMain.on('opt:getAll', (event) => {
        event.returnValue = store.store
    })
    ipcMain.on('opt:get', (event, arg) => {
        event.returnValue = store.get(arg)
    })
    // 重置设置
    ipcMain.on('opt:clearAll', (event) => {
        store.clear()
        event.returnValue = true
    })
    // 获取补充的调试信息
    ipcMain.handle('opt:getSystemInfo', () => {
        const systemInfo = {} as { [key: string]: [string, string] }
        systemInfo.electron = ['Electron Version', process.versions.electron]
        return systemInfo
    })
    // 打开开发者工具
    ipcMain.on('win:openDevTools', () => {
        if (win) win.webContents.openDevTools()
    })
    // 下载文件 - 使用集中式处理器避免处理器累积
    // 存储待处理的下载信息（key 为 downloadPath）
    const pendingDownloads = new Map<string, string>() // downloadPath -> fileName

    // 注册一次 will-download 处理器
    if (win) {
        win.webContents.session.on('will-download', (_, item) => {
            // 从 URL 中提取 downloadPath 作为标识
            const downloadUrl = item.getURL()
            const fileName = pendingDownloads.get(downloadUrl) || item.getFilename()
            pendingDownloads.delete(downloadUrl)

            item.setSaveDialogOptions({
                defaultPath: path.join(app.getPath('downloads'), fileName)
            })

            item.on('updated', (_, state) => {
                if (state === 'progressing') {
                    if (!item.isPaused()) {
                        if (win) {
                            win.webContents.send('sys:downloadBack', {
                                lengthComputable: true,
                                loaded: item.getReceivedBytes(),
                                total: item.getTotalBytes(),
                            })
                            win.setProgressBar( item.getReceivedBytes() / item.getTotalBytes())
                        }
                    }
                }
            })
            item.on('done', () => {
                win?.setProgressBar(-1)
                logger.info('下载完成')
                shell.showItemInFolder(item.getSavePath())
            })
        })
    }

    ipcMain.on('sys:download', (_, args) => {
        logger.level = logLevel
        logger.info('下载文件：' + args.downloadPath)

        const downloadPath = args.downloadPath
        const fileName = args.fileName
        if (win) {
            // 记录下载信息，供 will-download 处理器使用
            pendingDownloads.set(downloadPath, fileName)
            win.webContents.downloadURL(downloadPath)
        }
    })
    // 发送通知
    ipcMain.on('sys:sendNotice', async (_, data) => {
        logger.level = logLevel
        logger.info('创建通知：' + data.tag + ' - ' + data.body)
        // MacOS: 刷新 TouchBar
        if(touchBarInstance && data.base_type === 'msg') {
            touchBarInstance.newMessage(data)
        }

        const userId = data.tag.split('/')[0]
        const msgId = data.tag.split('/')[1]

        let showData = {
            title: data.title,
            body: data.body,
            icon: data.icon,
        } as Electron.NotificationConstructorOptions
        if (process.platform === 'darwin') {
            showData = {
                ...showData,
                replyPlaceholder: '快速回复……',
                hasReply: true,
            }
            if (data.is_important) {
                showData = {
                    ...showData,
                    sound: 'resources/tri-tone.aif',
                }
            }
        }
        if (process.platform === 'win32') {
            showData = {
                toastXml: `
                <toast launch="stapx-qq-lite:action=click" activationType="protocol">
                    <visual>
                        <binding template="ToastGeneric">
                            <image placement="appLogoOverride" hint-crop="circle" src="${(data.icon as string).replaceAll('&', '&amp;')}"/>
                            <text>${data.title}</text>
                            <text>${data.body}</text>
                        </binding>
                    </visual>
                    <actions>
                        <input id="quick" type="text" placeHolderContent="reply"/>
                        <action
                            content="▶"
                            hint-inputId="quick"
                            arguments="stapx-qq-lite:action=reply&amp;data=%quick%"
                            activationType="protocol"/>
                    </actions>
                </toast>`,
            }
        }
        if (process.platform === 'linux') {
            if (data.is_important) {
                showData = {
                    ...showData,
                    urgency: 'critical',
                }
            }
        }
        const notification = new ELNotification(showData)
        notification.show()
        // 通知事件
        notification.on('click', () => {
            win?.focus()
            win?.webContents.send('app:jumpChat', {
                userId: userId,
                msgId: msgId,
            })
        })
        notification.on('reply', (_, reply) => {
            win?.webContents.send('bot:quickReply', {
                type: data.type,
                id: userId,
                msg: msgId,
                content: reply,
            })
        })
        // 保存通知对象
        noticeList[data.tag] = notification
    })
    // 关闭通知
    ipcMain.on('sys:closeNotice', (_, tag) => {
        if(noticeList[tag]) {
            logger.level = logLevel
            logger.info('关闭通知：' + tag)
            noticeList[tag].close()
            delete noticeList[tag]
            // macOS: 刷新 TouchBar
            if(touchBarInstance) {
                touchBarInstance.removeMessage(tag)
            }
        }
    })
    // 清空通知
    ipcMain.on('sys:clearNotice', () => {
        Object.keys(noticeList).forEach((key) => {
            logger.level = logLevel
            logger.info('清空通知')
            noticeList[key].close()
            delete noticeList[key]
        })
    })
    // 关闭指定 ID 的所有通知
    ipcMain.on('sys:closeAllNotice', (_, id) => {
        Object.keys(noticeList).forEach((key) => {
            if(key.startsWith(id)) {
                logger.level = logLevel
                logger.info('关闭所有通知：' + id)
                noticeList[key].close()
                delete noticeList[key]
                // macOS: 刷新 TouchBar
                if(touchBarInstance) {
                    touchBarInstance.removeMessage(key)
                }
            }
        })
    })
    // 运行命令
    ipcMain.handle('sys:runCommand', async (_, cmd) => {
        try {
            const info = await runCommand(cmd)
            const str = info.stdout as string
            return { success: true, message: str }
        } catch (ex) {
            return { success: false, message: (ex as Error).message }
        }
    })
    // 启用服务发现
    ipcMain.on('sys:findService', () => {
        if(win)
            new ScanNetwork(win).scanNetwork()
    })

    // Windows：闪烁状态栏图标
    ipcMain.on('win:flashWindow', () => {
        if (win) win.flashFrame(true)
    })
    // Winodws：通过注册表获取系统主题色
    ipcMain.handle('sys:getWinColor', () => {
        // 订阅颜色修改事件
        systemPreferences.addListener('accent-color-changed', () => {
            if (win) {
                win.webContents.send(
                    'sys:WinColorChanged',
                    systemPreferences.getAccentColor(),
                )
            }
        })
        return systemPreferences.getAccentColor()
    })

    // Linux：获取 gnome extension 设置
    // dconf dump /org/gnome/shell/extensions/ |
    //          awk -v RS='' '/\[blur-my-shell\/applications\]/'
    ipcMain.handle('sys:getGnomeExt', async () => {
        try {
            const info = await runCommand(
                'dconf dump /org/gnome/shell/extensions/ | awk -v RS=\'\' \'/\\[blur-my-shell\\/applications\\]/\'',
            )
            const str = info.stdout as string
            const data = {} as { [key: string]: string }
            if (str && str.startsWith('[blur-my-shell/applications]')) {
                const lines = str.split('\n').slice(1)
                lines.forEach((line) => {
                    const [key, value] = line.split('=')
                    if (key != '') data[key] = value
                })
            }
            return data
        } catch (ex) {
            return (ex as Error).message
        }
    })

    // MacOS：初始化菜单
    // PS：由于本地化的存在，需要让 vue 获取到本地化信息之后再由 electron 构建
    ipcMain.on('sys:createMenu', (_, args) => {
        const repoName = import.meta.env.VITE_APP_REPO_NAME
        if (process.platform === 'darwin') {
            template = [
                {
                    label: args.title,
                    submenu: [
                        {
                            label: args.about,
                            click: () => {
                                sendMenuClick('app:about')
                            },
                        },
                        { label: args.update },
                        { type: 'separator' },
                        { label: args.hide, role: 'hide' },
                        { label: args.hideOthers, role: 'hideothers' },
                        { label: args.unhide, role: 'unhide' },
                        { type: 'separator' },
                        { label: args.quit, role: 'quit' },
                    ],
                },
                {
                    label: args.edit,
                    role: 'editMenu',
                    submenu: [
                        { label: args.undo, role: 'undo' },
                        { label: args.redo, role: 'redo' },
                        { type: 'separator' },
                        { label: args.cut, role: 'cut' },
                        { label: args.copy, role: 'copy' },
                        { label: args.paste, role: 'paste' },
                        { type: 'separator' },
                        { label: args.selectAll, role: 'selectall' },
                    ],
                },
                {
                    label: args.account,
                    submenu: [
                        { id: 'userName', label: args.login },
                        {
                            id: 'logout',
                            label: args.logout,
                            visible: false,
                            click: () => {
                                sendMenuClick('bot:logout')
                            },
                        },
                        { type: 'separator' },
                        {
                            id: 'userList',
                            label: args.userList,
                            click: () => {
                                sendMenuClick('app:changeTab', 'Friends')
                            },
                        },
                        {
                            label: args.flushUser,
                            click: () => {
                                sendMenuClick('bot:flushUser')
                            },
                        },
                    ],
                },
                {
                    label: args.help,
                    role: 'help',
                    submenu: [
                        {
                            label: args.doc,
                            click: () => {
                                sendMenuClick(
                                    'app:openLink',
                                    `https://github.com/${repoName}/wiki`,
                                )
                            },
                        },
                        {
                            label: args.feedback,
                            click: () => {
                                sendMenuClick(
                                    'app:openLink',
                                    `https://github.com/${repoName}/issues`,
                                )
                            },
                        },
                        { type: 'separator' },
                        {
                            label: args.license,
                            click: () => {
                                sendMenuClick(
                                    'app:openLink',
                                    `https://github.com/${repoName}/blob/master/LICENSE`,
                                )
                            },
                        },
                    ],
                },
            ] as MenuItemConstructorOptions[]
            Menu.setApplicationMenu(Menu.buildFromTemplate(template))
        }
    })
    ipcMain.on('sys:updateMenu', (_, args) => {
        if (process.platform === 'darwin') {
            const id = args.id
            const action = args.action
            const value = args.value
            // 在 template 里寻找这个 id 修改对应的值
            let menuIndex = -1
            let itemIndex = -1
            for (let i = 0; i < template.length; i++) {
                const menuItem = template[i]
                if (menuItem.id == id) {
                    menuIndex = i
                    break
                }
            }
            if (menuIndex == -1) {
                for (let i = 0; i < template.length; i++) {
                    const menuItem = template[i]
                    const submenu =
                        menuItem.submenu as MenuItemConstructorOptions[]
                    if (submenu && submenu.length > 0) {
                        for (let j = 0; j < submenu.length; j++) {
                            const subMenuItem = submenu[j]
                            if (subMenuItem.id == id) {
                                menuIndex = i
                                itemIndex = j
                                break
                            }
                        }
                    }
                }
            }
            if (menuIndex > -1) {
                const item =
                    itemIndex > -1? template[menuIndex].submenu[itemIndex]: template[menuIndex]
                switch (action) {
                    case 'label':
                        item.label = value
                        break
                    case 'visible':
                        item.visible = value == 'true'
                        break
                }
            }
            Menu.setApplicationMenu(Menu.buildFromTemplate(template))
        }
    })
    function sendMenuClick(name: string, value = undefined as any) {
        if (win) {
            win.focus()
            if (value) {
                win.webContents.send(name, value)
            } else {
                win.webContents.send(name)
            }
        }
    }
    // MacOS：touchBar 相关功能
    ipcMain.on('sys:flushOnMessage', (_, list) => {
        if(touchBarInstance) {
            touchBarInstance.flushOnMessage(list)
        }
    })
    ipcMain.on('sys:flushFriendSearch', (_, list) => {
        if(touchBarInstance) {
            touchBarInstance.flushFriendSearch(list)
        }
    })

    // 选择文件夹
    ipcMain.handle('sys:selectFolder', async () => {
        const { dialog } = await import('electron')
        const result = await dialog.showOpenDialog({
            title: '选择文件夹',
            properties: ['openDirectory']
        })
        if (!result.canceled && result.filePaths.length > 0) {
            return result.filePaths[0]
        }
        return null
    })

    // 选择图片文件
    ipcMain.handle('sys:selectImage', async () => {
        const { dialog } = await import('electron')
        const { pathToFileURL } = await import('url')
        const result = await dialog.showOpenDialog({
            title: '选择图片',
            properties: ['openFile'],
            filters: [
                {
                    name: 'Images',
                    extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'],
                },
            ],
        })

        if (!result.canceled && result.filePaths.length > 0) {
            const filePath = result.filePaths[0]
            return {
                path: filePath,
                url: pathToFileURL(filePath).href,
            }
        }
        return null
    })

    // 获取本地表情列表
    ipcMain.handle('sys:getLocalEmojis', async (_, folderPath: string) => {
        const fs = await import('fs')
        const path = await import('path')
        const { pathToFileURL } = await import('url')

        try {
            // 验证路径是否存在且为目录
            const stats = fs.statSync(folderPath)
            if (!stats.isDirectory()) {
                throw new Error('路径不是一个文件夹')
            }

            // 支持的图片格式
            const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg']

            // 读取文件夹中的所有文件
            const files = fs.readdirSync(folderPath)
            const emojis = [] as Array<{ name: string; path: string; url: string }>

            for (const file of files) {
                const filePath = path.join(folderPath, file)
                const stats = fs.statSync(filePath)

                // 只处理文件（不包括子文件夹）
                if (stats.isFile()) {
                    const ext = path.extname(file).toLowerCase()

                    // 检查是否为支持的图片格式
                    if (imageExtensions.includes(ext)) {
                        // 使用 pathToFileURL 将文件路径转换为 file:// URL
                        const fileUrl = pathToFileURL(filePath).href
                        emojis.push({
                            name: file,
                            path: filePath,
                            url: fileUrl
                        })
                    }
                }
            }

            logger.info(`成功加载 ${emojis.length} 个本地表情`)
            return emojis
        } catch (error) {
            logger.error('读取文件夹失败:', error)
            throw error
        }
    })

    // 读取文件为 base64
    ipcMain.handle('sys:readFileAsBase64', async (_, filePath: string) => {
        const fs = await import('fs')

        try {
            // 读取文件内容
            const fileData = fs.readFileSync(filePath)

            // 转换为 base64
            return fileData.toString('base64')
        } catch (error) {
            logger.error('读取文件失败:', error)
            throw error
        }
    })
}
