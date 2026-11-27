/*
 * @FileDescription: 图片节点
 * @Author: Mr.Lee
 * @Date: 2025/08/23
 * @Version: 1.0
 * @Description: 图片节点，主用给图片预览器使用
 */

import { backend } from '@renderer/runtime/backend'
import { shallowRef, toRaw } from 'vue'

export class Img {
    _src: string
    private resolvedSource?: string
    private readonly segment?: object
    readonly _prev = shallowRef<Img | undefined>()
    readonly _next = shallowRef<Img | undefined>()
    constructor(src: string, segment?: object, private readonly loadSource?: () => Promise<string | undefined>) {
        this._src = src
        this.segment = segment && toRaw(segment)
    }

    get src(): string {
        return this.resolvedSource ?? backend.proxyUrl(this._src)
    }

    async resolveSrc() {
        this.resolvedSource ??= await this.loadSource?.()
        return this.src
    }

    getBySegment(segment: object): Img | undefined {
        const rawSegment = toRaw(segment)
        if (this.segment === rawSegment) return this
        for (let item = this.next; item; item = item.next) {
            if (item.segment === rawSegment) return item
        }
        return undefined
    }

    /**
     * 根据 src 获取图片节点
     *
     * ** 此方法在大量图片时，性能较差，请谨慎使用 **
     * @param src 图片地址
     * @returns 图片节点
     */
    getBySrc(src: string): Img | undefined {
        if (this._src === src) return this
        if (this.next) return this.next.getBySrc(src)
        return undefined
    }

    /**
     * 删除图片
     */
    delete() {
        if (this.prev) this.prev.next = this.next
        if (this.next) this.next.prev = this.prev
    }

    /**
     * 尾部添加图片
     * @param other 其他图片
     */
    insertNext(other: Img) {
        other.prev = this
        other.next = this.next
        this.next = other
    }
    /**
     * 头部添加图片
     * @param other 其他图片
     */
    insertPrev(other: Img) {
        other.prev = this.prev
        other.next = this
        this.prev = other
    }

    /**
     * 向后合并图片列表
     * @param otherHead 其他图片列表
     */
    concatNext(otherHead: Img) {
        if (otherHead.prev) throw new Error('otherHead.prev 不为空，不能合并，请使用 extendNext')
        if (this.next) throw new Error('this.next 不为空，不能合并，请使用 extendNext')
        this.next = otherHead
        otherHead.prev = this
    }
    /**
     * 向前合并图片列表
     * @param otherTail 其他图片列表
     */
    concatPrev(otherTail: Img) {
        if (otherTail.next) throw new Error('otherTail.next 不为空，不能合并，请使用 extendPrev')
        if (this.prev) throw new Error('this.prev 不为空，不能合并，请使用 extendPrev')
        this.prev = otherTail
        otherTail.next = this
    }

    /**
     * 向后插入图片列表
     * @param other 其他图片列表
     */
    extendNext(other: Img) {
        const next = other.next
        this.insertNext(other)
        if (next) other.extendNext(next)
    }
    /**
     * 向前插入图片列表
     * @param other 其他图片列表
     */
    extendPrev(other: Img) {
        const prev = other.prev
        this.insertPrev(other)
        if (prev) other.extendPrev(prev)
    }

    get prev() {
        return this._prev.value
    }

    get next() {
        return this._next.value
    }

    set prev(img: Img | undefined) {
        this._prev.value = img
    }

    set next(img: Img | undefined) {
        this._next.value = img
    }

    /**
     * 将链表内容转换为数组
     * @returns 图片地址数组
     */
    toArray(): string[] {
        const result: string[] = []
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        let cur: Img | undefined = this
        while (cur) {
            result.push(cur._src)
            cur = cur.next
        }
        return result
    }

    /**
     * 从 srcList 构建链表
     */
    static fromList(srcList: (string | Img)[]): Img | undefined {
        if (srcList.length === 0) return undefined
        const head = typeof srcList[0] === 'string' ? new Img(srcList[0]) : srcList[0]
        let cur = head
        for (let i = 1; i < srcList.length; i++) {
            const source = srcList[i]
            const node = typeof source === 'string' ? new Img(source) : source
            cur.insertNext(node)
            cur = node
        }
        return head
    }
}
