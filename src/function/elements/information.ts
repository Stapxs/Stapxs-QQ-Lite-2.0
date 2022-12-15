import { number } from "@intlify/core-base"

export enum BotMsgType {
    CQCode, JSON
}

export interface RunTimeDataElem {
    sysConfig: { [key: string]: any }
    botInfo: { [key: string]: any }
    loginInfo: { [key: string]: any }
    userList: (UserFriendElem & UserGroupElem)[]
    showList?: (UserFriendElem & UserGroupElem)[]
    onMsgList: (UserFriendElem & UserGroupElem)[]
    chatInfo: ChatInfoElem
    pageView: {
        chatView: any,
        msgView: any
    },
    tags: {
        firstLoad: boolean
        msgType?: BotMsgType
        canLoadHistory: boolean
        openSideBar: boolean
    },
    messageList: any[]
    mergeMessageList?: [],
    stickerCache?: any[]
}

export interface ChatInfoElem {
    show: BaseChatInfoElem,
    info: {
        group_info: { [key: string]: any },
        user_info: { [key: string]: any },
        me_info: { [key: string]: any },
        group_members: GroupMemberInfoElem[],
        group_files: { [key: string]: any },
        group_sub_files: { [key: string]: any },
        group_notices?: { [key: string]: any },
        now_member_info?: { [key: string]: any }
    }
}

export interface BaseChatInfoElem {
    type: string,
    id: number,
    name: string,
    avatar: string,
    jump?: string
}

export interface UserFriendElem {
    group_id: number,
    group_name: string,
    member_count?: number,
    admin_flag?: boolean,
    new_msg?: boolean,
    raw_msg?: string,
    time?: number,
    always_top?: boolean
}

export interface UserGroupElem {
    user_id: number,
    nickname: string,
    remark: string,
    class_id?: number,
    new_msg?: boolean,
    raw_msg?: string,
    time?: number,
    always_top?: boolean
}

export interface GroupMemberInfoElem {
    user_id: number,
    title: string,
    card: string,
    join_time: number,
    last_sent_time: number,
    level: number,
    nickname: string,
    rank: string,
    role: string,
    sex: string,
    shutup_time: number,
}

export interface SQCodeElem {
    addText: boolean,
    addTop?: boolean,
    msgObj: MsgItemElem
}

export interface MsgItemElem {
    type: string,
    [key: string]: any
}