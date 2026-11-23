/**
 * 连接历史记录项
 */
export interface ConnectionHistoryItem {
    address: string
    token: string
    uin?: string
    nickname?: string
    lastConnected: number
}

/**
 * 登录状态记录（地址、密钥、状态等）
 */
export interface LoginCacheElem {
    quickLogin: { address: string, port: number }[] | null
    address: string
    token: string
    status: boolean,
    creating: boolean
    connectionHistory: ConnectionHistoryItem[]
}

export interface PopInfoElem {
    id: number
    svg: string
    text: string
    autoClose?: boolean
}

export interface BotActionElem {
    action: string
    params?: { [key: string]: any }
    echo?: string
}

export interface MsgIdInfoElem {
    gid?: number
    uid?: number
    seqid?: number
}

export interface ContributorElem {
    url: string
    link: string
    title: string
    contributions: number
    isMe: boolean
    isSuperThakns: boolean
}

export interface NotificationElem {
    body: string
    tag: string
    icon: string
    image?: string
    requireInteraction: boolean
}

export interface NotifyInfo {
    base_type: 'msg' | 'app',

    title: string
    body: string
    tag: string
    icon: string
    image?: string
    type: string
    is_important: boolean
    /**
     * 通知驻留：通知显示后将保持驻留，直到用户处理或关闭它
     */
    is_persist?: boolean
}

export interface NoticeBodyV3 {
    version: 3
    client: string          // 渠道标识，对应 env 里的 VITE_APP_CLIENT_TAG
    id: number
    add_time: number
    show_date: number[][]       // 显示日期，二维数组，内层数组为[开始日期, 结束日期]，日期格式为时间戳（毫秒）
    pops: {
        title?: string
        html: string
        template: string        // 内嵌模板和 html 二选一
        template_data?: { [key: string]: any }
        link_url?: string       // 链接地址，如果有这个参数将显示一个打开按钮
        button_text?: string    // 关闭按钮文字，默认“确定”
    }[]
    is_important: boolean       // 是否重要公告，有这个属性的公告将每次启动都显示

    is_show?: boolean
}
