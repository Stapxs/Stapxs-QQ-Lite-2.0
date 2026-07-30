import { i18n } from '@renderer/main'

import l10nConfig from '@renderer/assets/l10n/_l10nconfig.json'
import PO from 'pofile'
import { Logger, PopInfo, PopType } from '../base';
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
    const locale = i18n.global.locale
    const currentLocale = typeof locale === 'string' ? locale : locale.value
    l10nConfig.forEach((item) => {
        if (item.value === currentLocale) {
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

export type ForegroundTone = 'dark' | 'light'

/**
 * 根据图片 URL 计算前景色建议（深色或浅色）
 * 说明：返回 dark 表示背景偏亮，前景建议用深色；返回 light 表示背景偏暗，前景建议用浅色
 * @param url 图片地址
 * @param threshold 亮度阈值，范围 [0, 1]，默认 0.55
 */
export async function getForegroundToneFromImageUrl(
    url: string,
    threshold = 0.55,
): Promise<ForegroundTone> {
    const img = await loadImageElement(url)
    const size = 32
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) {
        return 'light'
    }

    try {
        ctx.drawImage(img, 0, 0, size, size)
        const { data } = ctx.getImageData(0, 0, size, size)
        let luminanceSum = 0
        let pixelCount = 0

        for (let i = 0; i < data.length; i += 4) {
            const alpha = data[i + 3] / 255
            if (alpha < 0.1) continue

            const r = srgbToLinear(data[i] / 255)
            const g = srgbToLinear(data[i + 1] / 255)
            const b = srgbToLinear(data[i + 2] / 255)

            const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b
            luminanceSum += luminance
            pixelCount += 1
        }

        if (pixelCount === 0) {
            return 'light'
        }

        const avgLuminance = luminanceSum / pixelCount
        return avgLuminance >= normalizeThreshold(threshold) ? 'dark' : 'light'
    } catch (error) {
        new Logger().error(error as Error, '读取图片像素失败，使用默认浅色前景')
        return 'light'
    }
}

/**
 * 将图片划分为 3x3 并返回每一块的前景色建议
 * @param url 图片地址
 * @param threshold 亮度阈值，范围 [0, 1]，默认 0.55
 */
export async function getForegroundToneGridFromImageUrl(
    url: string,
    threshold = 0.55,
): Promise<ForegroundTone[][]> {
    const img = await loadImageElement(url)
    const size = 90
    const grid = 3
    const cellSize = size / grid
    const safeThreshold = normalizeThreshold(threshold)
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) {
        return buildFallbackGrid(grid)
    }

    try {
        ctx.drawImage(img, 0, 0, size, size)
        const { data } = ctx.getImageData(0, 0, size, size)
        const result: ForegroundTone[][] = []

        for (let row = 0; row < grid; row++) {
            result.push([])
            for (let col = 0; col < grid; col++) {
                const startX = Math.floor(col * cellSize)
                const endX = Math.floor((col + 1) * cellSize)
                const startY = Math.floor(row * cellSize)
                const endY = Math.floor((row + 1) * cellSize)

                let luminanceSum = 0
                let pixelCount = 0

                for (let y = startY; y < endY; y++) {
                    for (let x = startX; x < endX; x++) {
                        const index = (y * size + x) * 4
                        const alpha = data[index + 3] / 255
                        if (alpha < 0.1) continue

                        const r = srgbToLinear(data[index] / 255)
                        const g = srgbToLinear(data[index + 1] / 255)
                        const b = srgbToLinear(data[index + 2] / 255)
                        const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b

                        luminanceSum += luminance
                        pixelCount += 1
                    }
                }

                const avgLuminance = pixelCount > 0 ? luminanceSum / pixelCount : 0
                result[row].push(avgLuminance >= safeThreshold ? 'dark' : 'light')
            }
        }

        return result
    } catch (error) {
        new Logger().error(error as Error, '读取图片分块像素失败，使用默认浅色前景')
        return buildFallbackGrid(grid)
    }
}

function loadImageElement(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const image = new Image()
        image.crossOrigin = 'anonymous'
        image.decoding = 'async'
        image.onload = () => resolve(image)
        image.onerror = () => reject(new Error(`图片加载失败: ${url}`))
        image.src = url
    })
}

function srgbToLinear(value: number): number {
    if (value <= 0.04045) {
        return value / 12.92
    }
    return Math.pow((value + 0.055) / 1.055, 2.4)
}

function normalizeThreshold(value: number): number {
    if (Number.isNaN(value)) return 0.55
    if (value < 0) return 0
    if (value > 1) return 1
    return value
}

function buildFallbackGrid(grid: number): ForegroundTone[][] {
    const result: ForegroundTone[][] = []
    for (let row = 0; row < grid; row++) {
        result.push([])
        for (let col = 0; col < grid; col++) {
            result[row].push('light')
        }
    }
    return result
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
 * 从参数列表中随机选择一个元素
 * @param args 参数列表
 * @returns 随机选择的元素
 */
export function randomChoice<T>(...args: T[]): T{
    const id = randomNum(0, args.length - 1)
    return args[id]
}

/**
 * 将秒级或毫秒级 Unix 时间戳统一为毫秒。
 * 已是毫秒的输入会原样返回，因此允许在显示边界重复规范化。
 * @param time 秒级或毫秒级 Unix 时间戳
 * @returns 毫秒级 Unix 时间戳
 */
export function getViewTime(time: number) {
    if (time.toString().length === 10) {
        return time * 1000
    } else {
        return time
    }
}

/**
 * 格式化会话列表中的最新消息时间。输入可为秒或毫秒，内部仅规范化一次；
 * getViewTime 对已经由消息处理流程保存的毫秒值保持不变。
 * 今天显示时间，本周显示星期和时间，更早的消息显示日期。
 */
export function formatSessionTime(time: number | undefined, now = new Date()) {
    if (time === undefined) return ''

    const viewTime = getViewTime(Number(time))
    const date = new Date(viewTime)
    if (!Number.isFinite(viewTime) || Number.isNaN(date.getTime())) return ''

    const startOfToday = new Date(now)
    startOfToday.setHours(0, 0, 0, 0)
    const startOfTomorrow = new Date(startOfToday)
    startOfTomorrow.setDate(startOfTomorrow.getDate() + 1)

    const startOfWeek = new Date(startOfToday)
    const daysSinceMonday = (startOfWeek.getDay() + 6) % 7
    startOfWeek.setDate(startOfWeek.getDate() - daysSinceMonday)
    const startOfNextWeek = new Date(startOfWeek)
    startOfNextWeek.setDate(startOfNextWeek.getDate() + 7)

    let config: Intl.DateTimeFormatOptions
    if (date >= startOfToday && date < startOfTomorrow) {
        config = {
            hour: 'numeric',
            minute: 'numeric',
        }
    } else if (date >= startOfWeek && date < startOfNextWeek) {
        config = {
            weekday: 'short',
            hour: 'numeric',
            minute: 'numeric',
        }
    } else {
        config = {
            month: 'short',
            day: 'numeric',
        }
        if (date.getFullYear() !== now.getFullYear()) {
            config.year = 'numeric'
        }
    }

    return Intl.DateTimeFormat(getTrueLang(), config).format(date)
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

/**
 * 复制内容到剪贴板
 * @param text
 */
export async function copyToClipboard(text: string)
/**
 * 复制内容到剪贴板
 * @param content
 */
export async function copyToClipboard(content: ClipboardItem[])
export async function copyToClipboard(content: ClipboardItem[] | string) {
    if (window.navigator.clipboard === undefined) {
        new PopInfo().add(PopType.ERR, i18n.global.t('当前环境不支持剪贴板操作'))
        throw new Error('当前环境不支持剪贴板操作')
    }
    if (typeof content === 'string')
        await window.navigator.clipboard.writeText(content)
    else
        await window.navigator.clipboard.write(content)
}


