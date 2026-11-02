import axios from 'axios'

import { BrowserWindow, NativeImage, TouchBar, nativeImage } from 'electron'
import { NotifyInfo } from './elements.ts'
const {
    TouchBarButton,
    TouchBarScrubber,
    TouchBarPopover,
    TouchBarSpacer,
    TouchBarLabel
} = TouchBar

export class touchBar {
    private win: BrowserWindow

    private nowView: 'Home' | 'FriendSearch' = 'Home'
    private itemList: { id: number, name: string, image: string }[] = []
    private msgList = {} as {[key: string]: { tag: string, title: string,
                            image: NativeImage | undefined, body: string }}

    touchBarScrubber = new TouchBarScrubber({
        overlayStyle: 'outline',
        showArrowButtons: false,
        continuous: true,
        mode: 'free',
        items: [],
        select: (index) => {
            const id = this.itemList[index].id
            this.win.webContents.send('app:jumpChat', {
                userId: id,
                messageId: 0
            })
        }
    })
    search = new TouchBarButton({
        icon: nativeImage.createFromNamedImage('NSImageNameTouchBarSearchTemplate', [-1, 0, 1]).resize({ width: 20, height: 20 }),
        click: () => {
            this.win.focus()
            this.win.webContents.send('app:changeTab', 'Friends')
        }
    })

    baseView = [
        this.search,
        new TouchBarPopover({
            icon: nativeImage.createFromNamedImage('NSImageNameListViewTemplate', [-1, 0, 1]).resize({ width: 20, height: 20 }),
            items: new TouchBar({ items: [ this.touchBarScrubber ]
        }), showCloseButton: true}),
        new TouchBarSpacer({ size: 'flexible' })
    ]

    // ====================================

    constructor(win: BrowserWindow) {
        this.win = win
    }

    /**
     * 刷新消息列表
     * @param messageList 消息列表
     */
    flushOnMessage(messageList: { id: number, name: string, image: string }[]) {
        this.itemList = messageList
        this.touchBarScrubber.items = messageList.map((item) => {
            return {
                label: item.name
            }
        })

        // 如果在主页就主动刷新，其他情况退出到主页时会刷新
        if(this.nowView == 'Home') this.loadHome()
    }

    /**
     * 刷新好友搜索
     * @param nameList 好友列表
     */
    flushFriendSearch(nameList: { id: number, name: string}[]) {
        if(nameList.length > 0) {
            this.nowView = 'FriendSearch'

            this.win.setTouchBar(new TouchBar({ items: [
                new TouchBarButton({
                    icon: nativeImage.createFromNamedImage('NSImageNameGoLeftTemplate', [-1, 0, 1]).resize({ width: 10, height: 15 }),
                    click: () => {
                        this.loadHome()
                        this.win.webContents.send('app:changeTab', 'Messages')
                    }
                }),
                new TouchBarButton({ label: '搜索联系人' }),
                new TouchBarScrubber({
                    overlayStyle: 'outline',
                    showArrowButtons: false,
                    continuous: false,
                    mode: 'free',
                    items: nameList.map((item) => {
                        return {
                            label: item.name
                        }
                    }),
                    select: (index) => {
                        const id = nameList[index].id
                        this.win.webContents.send('app:jumpChat', {
                            userId: id,
                            messageId: 0
                        })
                        this.loadHome()
                    }
                }),
                new TouchBarSpacer({ size: 'flexible' })
            ]}))
        } else {
            this.loadHome()
        }
    }

    /**
     * 保存新消息
     * @param data 新消息
     */
    async newMessage(data: NotifyInfo) {
        let image
        if(data.icon) {
            if (data.icon.startsWith('data:image/png;base64,')) {
                image = nativeImage.createFromDataURL(data.icon)
            } else {
                const response = await axios.get(data.icon, {
                    responseType: 'arraybuffer'
                })
                image = nativeImage.createFromBuffer(response.data)
            }
            image = image.resize({ width: 25, height: 25 })
        }
        this.msgList[data.tag] = {
            tag: data.tag,
            title: data.title,
            image: image,
            body: data.body
        }

        // 如果在主页就主动刷新，其他情况退出到主页时会刷新
        if(this.nowView == 'Home') this.loadHome()
    }

    /**
     * 删除消息
     * @param tag 消息标签
     */
    removeMessage(tag: string) {
        delete this.msgList[tag]

        // 如果在主页就主动刷新，其他情况退出到主页时会刷新
        if(this.nowView == 'Home') this.loadHome()
    }

    // ====================================

    /**
     * 刷新主页面
     */
    private loadHome() {
        this.nowView = 'Home'

        const count = Object.keys(this.msgList).length
        if(count > 0) {
            const data = Object.values(this.msgList)[0]
            const id = data.tag.split('/')[0]

            // 创建 poper
            const popover = new TouchBarPopover({
                icon: nativeImage.createFromNamedImage('NSImageNameTouchBarNewMessageTemplate', [-1, 0, 1]).resize({ width: 20, height: 20 }),
                label: count.toString(),
                items: new TouchBar({
                    items: [
                        new TouchBarButton({ icon: data.image, iconPosition: 'right', enabled: false, backgroundColor: '#000'}),
                        new TouchBarButton({ label: data.title, click: () => {
                            this.win.webContents.focus()
                            this.win.webContents.send('app:jumpChat', {
                                userId: id,
                                messageId: 0
                            })
                            this.win.setTouchBar(
                                new TouchBar({ items: this.baseView }))
                        }}),
                        new TouchBarSpacer({ size: 'small' }),
                        new TouchBarLabel({ label: data.body }),
                        new TouchBarSpacer({ size: 'flexible' })
                    ]
                }),
                showCloseButton: true
            })
            this.win.setTouchBar(
                new TouchBar({ items: this.baseView.concat(popover)}))
        } else {
            this.win.setTouchBar(new TouchBar({ items: this.baseView }))
        }
    }
}
