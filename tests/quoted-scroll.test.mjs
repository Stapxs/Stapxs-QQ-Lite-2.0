/* global globalThis */
import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import { keepQuotedMessageInView } from '../src/renderer/src/function/utils/quotedScroll.ts'

const frames = new Map()
let nextFrame = 0
const observers = []
const globals = ['window', 'ResizeObserver', 'requestAnimationFrame', 'cancelAnimationFrame']
const previous = new Map(globals.map(key => [key, globalThis[key]]))
globalThis.window = new EventTarget()
globalThis.requestAnimationFrame = callback => { frames.set(++nextFrame, callback); return nextFrame }
globalThis.cancelAnimationFrame = id => frames.delete(id)
globalThis.ResizeObserver = class {
    constructor(callback) { this.callback = callback; observers.push(this) }
    observe(target) { (this.observed ??= []).push(target) }
    disconnect() { this.disconnected = true }
}
after(() => globals.forEach(key => {
    if (previous.get(key) === undefined) delete globalThis[key]
    else globalThis[key] = previous.get(key)
}))
function render() {
    const callbacks = [...frames.values()]
    frames.clear()
    callbacks.forEach(callback => callback())
}
function fixture() {
    const pan = new EventTarget()
    Object.assign(pan, {
        style: { scrollBehavior: 'smooth' }, isConnected: true,
        clientTop: 0, clientHeight: 600, scrollHeight: 100000, scrollTop: 50000,
        getBoundingClientRect: () => ({ top: 100, bottom: 700 }),
        parentElement: { querySelector: selector => ({ getBoundingClientRect: () => selector.includes('.info') ? { bottom: 200 } : { top: 650 } }) },
    })
    const target = {
        contentTop: 30000, height: 80, parentElement: {},
        getBoundingClientRect() { return { top: 100 + this.contentTop - pan.scrollTop, height: this.height } },
    }
    pan.contains = element => element === target
    let active = true, releases = 0
    const anchor = keepQuotedMessageInView({ pan, target, isActive: () => active, onRelease: () => releases++ })
    const observer = observers.at(-1)
    return { pan, target, anchor, observer, cancel: () => { active = false }, releases: () => releases }
}
function assertCentered(r) {
    assert.ok(Math.abs(r.target.getBoundingClientRect().top + r.target.height / 2 - 425) <= 0.5)
}

test('long quote positioning uses viewport geometry and the visible area between header and composer', () => {
    const r = fixture()
    assertCentered(r)
    assert.equal(r.pan.style.scrollBehavior, 'smooth')
    r.anchor.stop()
})

test('delayed images below the original do not move it away from the reading position', () => {
    const r = fixture()
    const position = r.pan.scrollTop
    r.pan.scrollHeight += 6000
    r.pan.scrollTop += 6000 // Reproduce a stale legacy image compensation/browser anchor change.
    r.observer.callback()
    render()
    assert.equal(r.pan.scrollTop, position)
    assertCentered(r)
    r.anchor.stop()
})

test('images above the original and changed target height re-align the actual original', () => {
    const r = fixture()
    r.target.contentTop += 2400
    r.target.height = 160
    r.observer.callback()
    render()
    assertCentered(r)
    r.anchor.stop()
})

test('an oversized original is aligned below the header rather than centering its hidden beginning', () => {
    const r = fixture()
    r.target.height = 900
    r.observer.callback()
    render()
    assert.equal(r.target.getBoundingClientRect().top, 200)
    r.anchor.stop()
})

test('an early original never hits the zero-scroll manual paging threshold', () => {
    const r = fixture()
    r.target.contentTop = 130
    r.anchor.correct()
    assert.equal(r.pan.scrollTop, 1)
    r.anchor.stop()
})

test('user scrolling releases the anchor and cancels queued correction', () => {
    for (const type of ['wheel', 'touchstart', 'pointerdown']) {
        const r = fixture()
        r.observer.callback()
        r.pan.dispatchEvent(new Event(type))
        r.pan.scrollTop = 1234
        render()
        r.observer.callback()
        render()
        assert.equal(r.pan.scrollTop, 1234)
        assert.equal(r.releases(), 1)
        assert.equal(r.observer.disconnected, true)
        assert.equal(r.anchor.correct(), false)
    }
})

test('keyboard scrolling releases the anchor while copy shortcuts leave it active', () => {
    const r = fixture()
    for (const key of ['c', 'PageDown']) {
        const event = new Event('keydown')
        Object.defineProperty(event, 'key', { value: key })
        r.pan.dispatchEvent(event)
        assert.equal(r.releases(), key === 'c' ? 0 : 1)
    }
})

test('clicking another navigation control releases the quote anchor', () => {
    const r = fixture()
    r.observer.callback()
    window.dispatchEvent(new Event('pointerdown'))
    r.pan.scrollTop = 1234
    render()
    assert.equal(r.pan.scrollTop, 1234)
    assert.equal(r.releases(), 1)
})

test('a cancelled generation or disconnected pane cannot be scrolled by a delayed resize', () => {
    for (const invalidate of [r => r.cancel(), r => { r.pan.isConnected = false }]) {
        const r = fixture()
        r.observer.callback()
        invalidate(r)
        r.pan.scrollTop = 1234
        render()
        assert.equal(r.pan.scrollTop, 1234)
        assert.equal(r.releases(), 1)
        assert.equal(r.observer.disconnected, true)
    }
})
