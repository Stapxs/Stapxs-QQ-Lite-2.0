/*
 * @FileDescription: emoji 封装
 * @Author: Mr.Lee
 * @Date: 2025/08/30
 * @Version: 1.0
 */

import index from '@renderer/assets/img/qq-face/public/assets/qq_emoji/_index.json'
import app from '@renderer/main'
import { Logger } from '../base'
import { randomChoice } from '../utils/systemUtil'

export default class Emoji {
    static readonly apngMap = new Map<number, {super: boolean, suffix: number[]}>()
    static readonly descMap = new Map<string, string>()
    /**
     * 全部表情id列表
     */
    static readonly allList: Set<number> = new Set<number>()
    /**
     * 全部超级表情id列表
     */
    static readonly allSuperList: Set<number> = new Set<number>()
    /**
     * 超级表情列表
     */
    static readonly superList: readonly number[] = [
        5, 311, 312, 314, 317, 318, 319, 320, 324, 325, 337,
        338, 339, 341, 342, 343, 344, 345, 346, 181, 74, 75,
        351, 349, 350, 395, 114, 326, 53, 137, 333, 424, 415,
        392, 425, 427, 426, 419, 429
    ]
    /**
     * 小黄脸表情列表
     */
    static readonly normalList: readonly number[] = [
        14, 1, 2, 3, 4, 6, 7, 8, 9, 10, 11, 12, 13, 0, 15, 16,
        96, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30,
        31, 32, 33, 34, 35, 36, 37, 38, 39, 97, 98, 99, 100,
        101, 102, 103, 104, 105, 106, 107, 108, 305, 109, 110,
        111, 172, 182, 179, 173, 174, 212, 175, 178, 177, 176,
        183, 262, 263, 264, 265, 266, 267, 268, 269, 270, 271,
        272, 277, 307, 306, 281, 282, 283, 284, 285, 293, 286,
        287, 289, 294, 297, 298, 299, 300, 323, 332, 336, 353,
        355, 356, 354, 352, 357, 428, 334, 347, 303, 302, 295,
        49, 66, 63, 64, 187, 146, 116, 67, 60, 185, 76, 124,
        118, 78, 119, 79, 120, 121, 77, 123, 201, 273, 46, 112,
        56, 169, 171, 59, 144, 147, 89, 41, 125, 42, 43, 86, 129,
        85
    ]
    /**
     * emoji表情列表
     */
    static readonly emojiList: readonly number[] = [
        128522, 128524, 128538, 128531, 128560, 128541, 128513,
        128540, 9786, 128525,128532, 128516, 128527, 128530,
        128563, 128536, 128557, 128561, 128514, 128170,128074,
        128077, 128079, 128078, 128591, 128076, 128070, 128064,
        127836, 127847,127838, 127866, 127867, 9749, 127822,
        127827, 127817, 128684, 127801, 127881,128157, 128163,
        10024, 128168, 128166, 128293, 128164, 128169, 128137,
        128235,128014, 128103, 128102, 128053, 128055, 128046,
        128020, 128056, 128123, 128027,128054, 128051, 128098,
        9728, 10068, 128299, 128147, 127978
    ]
    /**
     * 回复表情 apng 列表
     */
    static readonly responseApngId: readonly number[] = [
        5, 314, 318, 319, 320, 324, 337, 338, 339, 341, 342, 343, 344,
        345, 346, 181, 74, 75, 351, 349, 350, 395, 326, 53, 333, 424,
        425, 427, 426, 14, 4, 8, 9, 10, 12, 16, 96, 21, 23, 24, 25, 26,
        27, 28, 29, 30, 32, 33, 34, 38, 39, 97, 98, 99, 100, 101, 102,
        103, 104, 106, 305, 109, 111, 182, 179, 173, 174, 212, 175, 176,
        183, 262, 264, 265, 266, 267, 268, 269, 270, 271, 272, 277, 307,
        306, 281, 282, 284, 285, 293, 287, 289, 294, 297, 298, 299, 332,
        336, 353, 355, 356, 354, 352, 357, 428, 334, 347, 303, 302, 295,
        49, 66, 63, 116, 60, 76, 124, 118, 78, 79, 120, 123, 201, 273,
        171, 144, 147, 89, 41, 125, 42, 43, 129, 85,
    ]
    /**
     * 回复表情 emoji 列表
     */
    static readonly responseEmojiId: readonly number[] = [
        128522, 128524, 128538, 128531, 128560, 128541, 128513, 128540,
        9786, 128532, 128516, 128527, 128530, 128563, 128536, 128557,
        128514, 128170, 128074, 128077, 128079, 128076, 127836, 127847,
        127838, 127866, 127867, 9749, 127822, 127827, 127817, 127801,
        127881, 128157, 10024, 128168, 128166, 128293, 128164, 128235,
        128103, 128102, 128053, 128046, 128027, 128051, 9728, 10068,
        128147
    ]
    private readonly suffixId?: number
    private constructor(
        public id: number,
        public type: 'apng' | 'emoji',
        public hasSuper: boolean,
        public superSuffix: number[],
    ) {
        if (superSuffix.length > 0)
            this.suffixId = randomChoice(...superSuffix)
    }

    /**
     * 根据 id 获取一个表情
     * @param id 表情id
     * @returns
     */
    static get(id: number): Emoji | undefined {
        if (id < 5000) {
            const value = this.apngMap.get(id)
            if (value) return new Emoji(id, 'apng', value.super, value.suffix)
            else return undefined
        }else {
            return new Emoji(id, 'emoji', false, [])
        }
    }

    /**
     * 判断表情是否存在
     * @param id 表情id
     * @returns
     */
    static has(id: number): boolean {
        if (id < 5000)
            return this.apngMap.has(id)
        else
            return true
    }

    static init() {
        // 数据收集
        for (const item of index) {
            // 描述注册
            this.descMap.set(
                item.emojiId,
                item.describe.replace('/', '')
            )

            // 检查表情
            let hasApng = false
            let hasSuper = false
            const suffixes: number[] = []
            for (const asset of item.assets) {
                if (asset.type === 2) hasApng = true
                else if (asset.type === 3) {
                    hasSuper = true
                    if (asset.name.startsWith(`${item.emojiId}_`)) {
                        const suffix = Number(asset.name.split('_')[1].split('.')[0])
                        if (!isNaN(suffix)) suffixes.push(suffix)
                    }
                }
            }
            if (!hasApng) continue

            const id = Number(item.emojiId)


            this.apngMap.set(id, {super: hasSuper, suffix: suffixes})
            if (hasSuper) this.allSuperList.add(id)
            this.allList.add(id)
        }

        // 验证表情全面性
        const testList = [
            ...this.superList,
            ...this.normalList,
            ...this.responseApngId
        ]
        for (const id of testList) {
            if (!this.allList.has(id))
                new Logger().error(null, `Emoji not found: ${id}`)
        }
        for (const id of this.superList) {
            if (!this.allSuperList.has(id))
                new Logger().error(null, `Super Emoji not found: ${id}`)
        }
    }

    /**
     * 回应表情 id
     */
    static get responseId(): readonly number[] {
        return [...this.responseApngId, ...this.responseEmojiId]
    }

    /**
     * 表情描述
     */
    get description(): string {
        const key = this.type === 'apng' ? this.id.toString() : this.value
        return Emoji.descMap.get(key) || app.config.globalProperties.$t('表情')
    }

    get value(): string {
        if (this.type === 'apng')
            return `./img/qqface/${this.id}/apng/${this.id}.png`
        else
            return String.fromCodePoint(this.id)
    }

    get superValue(): string | undefined {
        if (!this.hasSuper) return undefined
        if (this.superSuffix.length === 0) return `./img/qqface/${this.id}/lottie/${this.id}.json`
        return `./img/qqface/${this.id}/lottie/${this.id}_${this.suffixId}.json`
    }
}

setTimeout(Emoji.init.bind(Emoji), 0)
