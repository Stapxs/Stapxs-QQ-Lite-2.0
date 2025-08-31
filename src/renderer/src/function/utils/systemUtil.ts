import app from '@renderer/main'

import l10nConfig from '@renderer/assets/l10n/_l10nconfig.json'
import PO from 'pofile'
import { Logger } from '../base';
import { backend } from '@renderer/runtime/backend';

/**
 * 异步延迟
 * @param ms 延迟时间
 * @returns Promise<void>
 */
export function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 区分安卓、iOS、MacOS 和其他
 */
export function getDeviceType() {
    const userAgent = navigator.userAgent
    if (userAgent.indexOf('Android') > -1 || userAgent.indexOf('Adr') > -1) {
        return 'Android'
        // eslint-disable-next-line
    } else if (!!userAgent.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/)) {
        return 'iOS'
    } else if (userAgent.indexOf('Mac OS X') > -1) {
        return 'MacOS'
    } else {
        return 'Other'
    }
}

/**
 * 获取当前启用的语言的地区代码
 * @returns 符合规范的地区代码
 */
export function getTrueLang(): string {
    let back = 'zh-CN'
    l10nConfig.forEach((item) => {
        if (item.value === app.config.globalProperties.$i18n.locale) {
            back = item.lang
        }
    })
    return back
}

/**
 * 读取 PO 语言文件，转换为 JSON 格式
 * @param name 文件名
 */
export function getPortableFileLang(name: string) {
    const files = import.meta.glob('@renderer/assets/l10n/*.po',
        { eager: true, query: '?raw', import: 'default' })
    const filePath = Object.keys(files).find(
        (item) => item.includes(name))
    const final = {} as { [key: string]: string }
    if(filePath) {
        const file = files[filePath] as string
        const items = PO.parse(file).items
        for(const item of items) {
            final[item.msgid] = item.msgstr[0] == '' ? item.msgid : item.msgstr[0]
        }
    }
    return final
}

/**
 * 将被 HTML 编码的符号转回来
 * @param str 待处理的字符串
 * @returns 处理完成的字符串
 */
export function escape2Html(str: string): string {
    let s = ''
    if (str.length === 0) return ''
    s = str.replace(/&amp;/g, '&')
    s = s.replace(/&lt;/g, '<')
    s = s.replace(/&gt;/g, '>')
    s = s.replace(/&nbsp;/g, ' ')
    s = s.replace(/&#39;/g, '\'')
    s = s.replace(/&quot;/g, '"')
    return s
}

/**
 * 将 gitmoji 字符串转为 emoji 符号
 * @param name 名称
 * @returns emoji 符号
 */
export function gitmojiToEmoji(name: string) {
    return {
        ':art:': '🎨',
        ':zap:': '⚡️',
        ':fire:': '🔥',
        ':bug:': '🐛',
        ':ambulance:': '🚑️',
        ':sparkles:': '✨',
        ':memo:': '📝',
        ':rocket:': '🚀',
        ':lipstick:': '💄',
        ':tada:': '🎉',
        ':white_check_mark:': '✅',
        ':lock:': '🔒️',
        ':closed_lock_with_key:': '🔐',
        ':bookmark:': '🔖',
        ':rotating_light:': '🚨',
        ':construction:': '🚧',
        ':green_heart:': '💚',
        ':arrow_down:': '⬇️',
        ':arrow_up:': '⬆️',
        ':pushpin:': '📌',
        ':construction_worker:': '👷',
        ':chart_with_upwards_trend:': '📈',
        ':recycle:': '♻️',
        ':heavy_plus_sign:': '➕',
        ':heavy_minus_sign:': '➖',
        ':wrench:': '🔧',
        ':hammer:': '🔨',
        ':globe_with_meridians:': '🌐',
        ':pencil2:': '✏️',
        ':poop:': '💩',
        ':rewind:': '⏪️',
        ':twisted_rightwards_arrows:': '🔀',
        ':package:': '📦️',
        ':alien:': '👽️',
        ':truck:': '🚚',
        ':page_facing_up:': '📄',
        ':boom:': '💥',
        ':bento:': '🍱',
        ':wheelchair:': '♿️',
        ':bulb:': '💡',
        ':beers:': '🍻',
        ':speech_balloon:': '💬',
        ':card_file_box:': '🗃️',
        ':loud_sound:': '🔊',
        ':mute:': '🔇',
        ':busts_in_silhouette:': '👥',
        ':children_crossing:': '🚸',
        ':building_construction:': '🏗️',
        ':iphone:': '📱',
        ':clown_face:': '🤡',
        ':egg:': '🥚',
        ':see_no_evil:': '🙈',
        ':camera_flash:': '📸',
        ':alembic:': '⚗️',
        ':mag:': '🔍️',
        ':label:': '🏷️',
        ':seedling:': '🌱',
        ':triangular_flag_on_post:': '🚩',
        ':goal_net:': '🥅',
        ':dizzy:': '💫',
        ':wastebasket:': '🗑️',
        ':passport_control:': '🛂',
        ':adhesive_bandage:': '🩹',
        ':monocle_face:': '🧐',
        ':coffin:': '⚰️',
        ':test_tube:': '🧪',
        ':necktie:': '👔',
        ':stethoscope:': '🩺',
        ':bricks:': '🧱',
        ':technologist:': '🧑‍💻',
        ':money_with_wings:': '💸',
        ':thread:': '🧵',
        ':safety_vest:': '🦺',
    }[name]
}

/**
 * RGB 颜色值转换为 HSL.
 * 转换公式参考自 http://en.wikipedia.org/wiki/HSL_color_space.
 * r, g, 和 b 需要在 [0, 255] 范围内
 * 返回的 h, s, 和 l 在 [0, 1] 之间
 *
 * @param r 红色色值
 * @param g 绿色色值
 * @param b 蓝色色值
 * @return HSL各值数组
 */
export function rgbToHsl(r: number, g: number, b: number) {
    (r /= 255), (g /= 255), (b /= 255)
    const max = Math.max(r, g, b),
        min = Math.min(r, g, b)
    let h = 0,
        s
    const l = (max + min) / 2

    if (max == min) {
        h = s = 0
    } else {
        const d = max - min
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
        switch (max) {
            case r:
                h = (g - b) / d + (g < b ? 6 : 0)
                break
            case g:
                h = (b - r) / d + 2
                break
            case b:
                h = (r - g) / d + 4
                break
        }
        h /= 6
    }

    return [h, s, l]
}

/**
 * HSL颜色值转换为RGB.
 * 换算公式改编自 http://en.wikipedia.org/wiki/HSL_color_space.
 * h, s, 和 l 设定在 [0, 1] 之间
 * 返回的 r, g, 和 b 在 [0, 255]之间
 *
 * @param h 色相
 * @param s 饱和度
 * @param l 亮度
 * @return RGB色值数值
 */
export function hslToRgb(h: number, s: number, l: number) {
    let r, g, b

    if (s == 0) {
        r = g = b = l
    } else {
        const hue2rgb = function hue2rgb(p: number, q: number, t: number) {
            if (t < 0) t += 1
            if (t > 1) t -= 1
            if (t < 1 / 6) return p + (q - p) * 6 * t
            if (t < 1 / 2) return q
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
            return p
        }

        const q = l < 0.5 ? l * (1 + s) : l + s - l * s
        const p = 2 * l - q
        r = hue2rgb(p, q, h + 1 / 3)
        g = hue2rgb(p, q, h)
        b = hue2rgb(p, q, h - 1 / 3)
    }

    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)]
}

/**
 * 将字节大小转为可读的文件大小
 * @param size 字节大小
 * @returns
 */
export function getSizeFromBytes(size: number): string {
    if (!size) {
        return ''
    }

    const num = 1024.0

    if (size < num) {
        return size + 'B'
    }
    if (size < Math.pow(num, 2)) {
        return (size / num).toFixed(2) + 'K'
    }
    if (size < Math.pow(num, 3)) {
        return (size / Math.pow(num, 2)).toFixed(2) + 'M'
    }
    if (size < Math.pow(num, 4)) {
        return (size / Math.pow(num, 3)).toFixed(2) + 'G'
    }
    return (size / Math.pow(num, 4)).toFixed(2) + 'T'
}

/**
 * 根据区间和位数生成指定长度的随机数
 * @param num 是否包含数字
 * @param maxA 是否包含大写字母
 * @param minlA 是否包含小写字母
 * @param fqy 生成的随机数的位数
 * @returns 生成的随机数字符串
 */
export function getRandom(
    num: boolean,
    maxA: boolean,
    minlA: boolean,
    fqy: number,
): string {
    const arr = [] as number[]
    const arr1 = [] as number[]
    const arr2 = [] as number[]
    if (num) {
        for (let m = 0; m <= 9; m++) {
            arr.push(m)
        }
    }
    if (maxA) {
        for (let m = 65; m <= 90; m++) {
            arr1.push(m)
        }
    }
    if (minlA) {
        for (let m = 97; m <= 122; m++) {
            arr2.push(m)
        }
    }
    const mergeArr = arr.concat(arr1)
    const mergeArr1 = mergeArr.concat(arr2)
    const _length = mergeArr1.length
    let text = ''
    for (let m = 0; m < fqy; m++) {
        let text1 = ''
        let max = 0
        let min = _length
        if (_length > 0) {
            max = _length
            min = 0
        }
        const random = parseInt((Math.random() * (max - min)).toString()) + min
        if (mergeArr1[random] <= 9) {
            text1 = mergeArr1[random].toString()
        } else if (mergeArr1[random] > 9) {
            text1 = String.fromCharCode(mergeArr1[random])
        }
        text += text1
    }
    return text
}

/**
 * 根据区间生成一个随机数
 * @param minNum 最小值
 * @param maxNum 最大值
 * @returns 随机数
 */
export function randomNum(minNum: number, maxNum: number) {
    switch (arguments.length) {
        case 1:
            return parseInt((Math.random() * minNum + 1).toString(), 10)
        case 2:
            return parseInt(
                (Math.random() * (maxNum - minNum + 1) + minNum).toString(),
                10,
            )
        default:
            return 0
    }
}

/**
 * 获取显示的时间，由于获得的时间戳可能是秒级的，也可能是毫秒级的，所以需要判断
 * @param time
 * @param i0n
 */
export function getViewTime(time: number) {
    if (time.toString().length === 10) {
        return time * 1000
    } else {
        return time
    }
}

/**
 * 获取时间的配置
 * @param date
 * @returns
 */
export function getTimeConfig(date: Date) {
    const base = {
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
    } as Intl.DateTimeFormatOptions
    const nowDate = new Date()
    const todayDate = new Date().setHours(0, 0, 0, 0)
    const paramsDate = date.setHours(0, 0, 0, 0)
    if (todayDate != paramsDate) {
        if (
            nowDate.getFullYear() == date.getFullYear() &&
            nowDate.getMonth() == date.getMonth()
        ) {
            base.weekday = 'short'
        } else if (nowDate.getFullYear() == date.getFullYear()) {
            base.day = 'numeric'
            base.month = 'short'
        } else {
            base.day = 'numeric'
            base.month = 'short'
            base.year = 'numeric'
        }
    }
    return base
}

/**
 * 获得一英尺的像素点数
 */
export function getInch(): number {
    const div = document.createElement('div')
    div.style.width = '1in'
    div.style.visibility = 'hidden'
    document.body.appendChild(div)
    const dpi = div.offsetWidth
    document.body.removeChild(div)
    return dpi
}

/**
 * 请求 API，暂时未支持 method: string, data: any
 * @param url 请求的地址
 */
export async function getApi(url: string) {
    // 先尝试在前端请求
    try {
        const response = await fetch(url)
        if(response.ok) {
            const data = await response.json()
            return data
        }
    } catch (error) {
        new Logger().error(error as Error, '前端请求 API 失败，尝试后端请求……')
        if(!backend.isWeb()) {
            return await backend.call('Onebot', 'sys:getApi', true, url)
        } else {
            return null
        }
    }
}

export function needBar(): boolean {
    if (backend.platform === 'win32')
        return true
    if (backend.platform === 'linux' && !backend.isTiling)
        return true

    return false
}
