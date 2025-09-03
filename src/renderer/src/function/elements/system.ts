/**
 * 登录状态记录（地址、密钥、状态等）
 */
export interface LoginCacheElem {
    quickLogin: { address: string, port: number }[] | null
    address: string
    token: string
    status: boolean,
    creating: boolean
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
}
