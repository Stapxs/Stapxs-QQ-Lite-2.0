import app from '@renderer/main'
import { NotifyInfo, NotificationElem } from './elements/system'
import { jumpToChat } from './utils/appUtil'
import { get as getOption } from './option'
import {
    LocalNotificationSchema,
    DeliveredNotifications
} from '@capacitor/local-notifications'
import { backend } from '@renderer/runtime/backend'

export class Notify {
    // 针对 MSG 类型的通知，记录用户的通知数量
    private static userNotifyList: { [key: string]: number } = {}
    // Web 端端通知列表，key tag
    private static notifyList: { [key: string]: Notification } = {}

    /**
     * 获取通知驻留选项
     * @returns 是否驻留
     */
    private static isPersist(): boolean {
        return getOption('notice_persist') === true
    }

    /**
     * 发送一条通知
     * @param info 通知信息
     */
    public notify(info: NotifyInfo) {
        const { $t } = app.config.globalProperties
        // 判断当前 userId 是否已存在通知
        const userId = info.tag.split('/')[0]
        if (Notify.userNotifyList[userId] === undefined) {
            Notify.userNotifyList[userId] = 1
        } else {
            Notify.userNotifyList[userId]++
            // 修改通知内容为：“<内容>” 以及<数量>条消息
            info.body = $t('“{body}” 以及 {num} 条消息', {
                body: info.body,
                num: Notify.userNotifyList[userId] - 1,
            })
            // 关闭之前的通知
            this.closeAll(userId)
        }
        // 通知驻留判定
        info.is_persist = Notify.isPersist()
        // 发送消息
        if (backend.isDesktop()) {
            backend.call(undefined, 'sys:sendNotice', false, backend.type == 'tauri' ? { data: info } : info)
        } else if(backend.isMobile()) {
                const data = {
                    title: info.title,
                    body: info.body,
                    // id 相同的通知会被覆盖，这里使用用户 ID 作为通知 ID 便于覆盖
                    id: Number(info.tag.split('/')[0]),
                    schedule: {
                        at: new Date(Date.now() + 100)
                    },
                    sound: backend.platform === 'ios' ? 'beep.wav' : 'beep.mp3',
                    actionTypeId: 'msgQuickReply',
                    extra: {
                        userId: info.tag.split('/')[0],
                        msgId: info.tag.split('/')[1],
                        chatType: info.type
                    }
                } as LocalNotificationSchema
                backend.call('LocalNotifications', 'schedule', false, { notifications: [data] })
        } else {
            // Safari：在 iOS 下，如果页面没有被创建为主屏幕，通知无法被调用
            // 最见鬼的是它不是方法返回失败，而且整个 Notification 对象都没有
            const isSupported = () =>
                'Notification' in window &&
                'serviceWorker' in navigator &&
                'PushManager' in window
            if (isSupported()) {
                // 检查通知权限，老旧浏览器不支持这个功能
                if (Notification.permission === 'default') {
                    Notification.requestPermission(() => {
                        this.sendNotice(info)
                    })
                } else if (Notification.permission !== 'denied') {
                    this.sendNotice(info)
                }
            }
        }
    }

    /**
     * 发送独立通知
     * @param info 通知信息
     */
    public notifySingle(info: NotifyInfo) {
        // 通知驻留判定
        info.is_persist = Notify.isPersist()
        if (backend.isDesktop()) {
            backend.call(undefined, 'sys:sendNotice', false, backend.type == 'tauri' ? { data: info } : info)
        } else if (backend.isMobile()) {
                const data = {
                    title: info.title,
                    body: info.body,
                    // id 为随机数，不会被覆盖；主要用于应用的通知
                    id: Math.floor(Math.random() * 100000),
                    schedule: {
                        at: new Date(Date.now() + 100)
                    },
                    sound: backend.platform === 'ios' ? 'beep.wav' : 'beep.mp3'
                } as LocalNotificationSchema
                backend.call('LocalNotifications', 'schedule', false, { notifications: [data] })
        } else {
            // Safari：在 iOS 下，如果页面没有被创建为主屏幕，通知无法被调用
            // 最见鬼的是它不是方法返回失败，而且整个 Notification 对象都没有
            const isSupported = () =>
                'Notification' in window &&
                'serviceWorker' in navigator &&
                'PushManager' in window
            if (isSupported()) {
                // 检查通知权限，老旧浏览器不支持这个功能
                if (Notification.permission === 'default') {
                    Notification.requestPermission(() => {
                        this.sendNotice(info)
                    })
                } else if (Notification.permission !== 'denied') {
                    this.sendNotice(info)
                }
            }
        }
    }

    /**
     * 关闭用户的所有通知
     * @param userId 用户 ID
     */
    public async closeAll(userId: string) {
        if (backend.isDesktop()) {
            backend.call(undefined, 'sys:closeAllNotice', false, String(userId))
        } else if(backend.isMobile()) {
            const list = (await backend.call('LocalNotifications', 'getDeliveredNotifications', true)) as
                unknown as DeliveredNotifications
            if(list.notifications) {
                list.notifications.forEach((item) => {
                    if (item.extra.userId === userId) {
                        backend.call('LocalNotifications', 'cancel', false, { notifications: [{ id: item.id }] })
                    }
                })
            }
        } else {
            const keys = Object.keys(Notify.notifyList)
            keys.forEach((key) => {
                if (key.startsWith(userId)) {
                    this.close(key)
                }
            })
        }
        delete Notify.userNotifyList[userId]
    }

    /**
     * 关闭所有通知
     */
    public clear() {
        if (backend.isDesktop()) {
            backend.call(undefined, 'sys:clearNotice', false)
        } else if(backend.isMobile()) {
            backend.call('LocalNotifications', 'removeAllDeliveredNotifications', false)
        } else {
            const keys = Object.keys(Notify.notifyList)
            keys.forEach((key) => {
                this.close(key)
            })
        }
    }

    // ==============================
    // PS: 以下为 Web 端通知的方法

    /**
     * 关闭一条通知
     * @param tag 通知标签
     */
    private close(tag: string) {
        if (backend.isDesktop()) {
            backend.call(undefined, 'sys:closeNotice', false, tag)
        } else {
            Notify.notifyList[tag]?.close()
        }
    }

    /**
     * 关闭一条通知（如果是消息通知，则跳转到对应的聊天页面）
     * @param tag 通知标签
     * @returns 通知对象
     */
    private closeJump(tag: string | undefined) {
        if (tag !== undefined) {
            if (tag.indexOf('/') > 0) {
                // MSG 类型的通知
                const userId = tag.split('/')[0]
                const msgId = tag.substring(userId.length + 1, tag.length)
                delete Notify.userNotifyList[userId]
                // 跳转到这条消息的发送者页面
                window.focus()
                jumpToChat(userId, msgId)
            }
            this.close(tag)
            // MacOS：刷新 touchbar
            if (backend.isDesktop()) {
                backend.call(undefined, 'sys:newMessage', false)
            }
        }
    }

    /**
     * 发送一条通知（Web 端）
     * @param info 通知信息
     * @returns 通知对象
     */
    private sendNotice(info: NotifyInfo) {
        // 构建通知
        let notificationTile = ''
        const notificationBody = {} as NotificationElem
        // 通知驻留：开启后通知将持续显示直到被处理
        notificationBody.requireInteraction = info.is_persist === true
        notificationTile = info.title
        notificationBody.body = info.body
        notificationBody.tag = info.tag
        notificationBody.icon = info.icon
        // 发起通知
        const notification = new Notification(
            notificationTile,
            notificationBody,
        )
        notification.onclick = (event: Event) => {
            const info = event.target as NotificationOptions
            this.closeJump(info.tag)
        }
        // 保存通知对象
        Notify.notifyList[info.tag] = notification
    }
}
