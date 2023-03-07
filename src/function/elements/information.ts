export enum BotMsgType {
    CQCode, JSON, JSON_OICQ_1
}

export interface RunTimeDataElem {
    sysConfig: { [key: string]: any }
    botInfo: { [key: string]: any }
    loginInfo: { [key: string]: any }
    userList: (UserFriendElem & UserGroupElem)[]
    showList?: (UserFriendElem & UserGroupElem)[]
    onMsgList: (UserFriendElem & UserGroupElem)[]
    systemNoticesList?: { [key: string]: any }
    chatInfo: ChatInfoElem
    pageView: {
        chatView: any,
        msgView: any
    },
    tags: {
        firstLoad: boolean
        msgType: BotMsgType
        canLoadHistory: boolean
        openSideBar: boolean,
        viewer: {
            show?: boolean,
            index: number
        },
        loginWaveTimer?: any,
        isElectron: boolean
    },
    messageList: any[]
    mergeMessageList?: [],
    stickerCache?: any[],
    popBoxList: {                   // 通用弹窗
        svg?: string,                   // 弹窗图标
        title?: string,                 // 弹窗标题（缺省将没有标题栏和关闭按钮）
        html?: string,                  // 填充 html（和下面的模板必须有一个）
        template?: any,                 // 填充模板（如果都有，优先填充 html）
        templateValue?: any,            // 模板 props
        data?: any,                     // 模板的附加传参，只有这一个
        full?: boolean,                 // 是否填充整个页面
        button?: {                      // 按钮
            master?: boolean,               // 是否高亮（主按钮）
            fun?: (value: any) => void,     // 按钮回调
            text: string                    // 按钮文本
        }[]
    }[]
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
        now_member_info?: { [key: string]: any },
        image_list?: { index: number, message_id: string, img_url: string }[]
        jin_info: {
            data: {
                msg_list: { [key: string]: any }[],
                [key: string]: any
            },
            retcode?: number,
            retmsg?: string
        }
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
    always_top?: boolean,
    message_id?: string
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
    message_id?: string
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