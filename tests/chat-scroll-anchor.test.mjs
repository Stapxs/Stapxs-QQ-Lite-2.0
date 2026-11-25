import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import {
    classifyMessageListChange,
    computeAnchoredScrollTop,
    computeBottomAnchoredScrollTop,
    computeDistanceFromBottomScrollTop,
    createChatScrollAnchor,
    DEFAULT_BOTTOM_THRESHOLD,
    isScrollAtBottom,
    selectBottomVisibleAnchorIndex,
    selectViewportAnchor,
} from '../src/renderer/src/function/utils/chatScrollAnchor.ts'

function createMockTimeline({ clientHeight = 600, initialHeights = [], bottomInset = 0 } = {}) {
    let suspended = false
    let headerHeight = 0
    let paddingInset = bottomInset
    let nextId = 1
    const pinnedHistory = []
    const listeners = new Map()
    const scrollToCalls = []

    const pan = {
        clientHeight,
        clientTop: 0,
        offsetTop: 0,
        offsetHeight: clientHeight,
        offsetParent: null,
        scrollTop: 0,
        scrollHeight: 0,
        style: { scrollBehavior: '' },
        contains(target) {
            return content.children.includes(target) || target === content
        },
        addEventListener(type, fn) {
            if (!listeners.has(type)) listeners.set(type, new Set())
            listeners.get(type).add(fn)
        },
        removeEventListener(type, fn) {
            listeners.get(type)?.delete(fn)
        },
        dispatch(type, extra = {}) {
            for (const fn of listeners.get(type) ?? []) {
                fn(extra)
            }
        },
        scrollTo({ top, behavior }) {
            scrollToCalls.push({ top, behavior })
        },
    }

    const content = {
        offsetTop: 0,
        clientTop: 0,
        offsetHeight: 0,
        offsetParent: pan,
        children: [],
    }

    function makeMsg(height, id = `chat-m-${nextId++}`) {
        return {
            id,
            offsetTop: 0,
            offsetHeight: height,
            offsetParent: content,
            clientTop: 0,
            isConnected: true,
        }
    }

    function relayout() {
        let cursor = headerHeight
        content.offsetTop = headerHeight
        let total = 0
        for (const child of content.children) {
            child.offsetTop = cursor - headerHeight
            cursor += child.offsetHeight
            total += child.offsetHeight
        }
        content.offsetHeight = total
        pan.scrollHeight = headerHeight + total + paddingInset
    }

    content.children = initialHeights.map((h) => makeMsg(h))
    relayout()

    const anchor = createChatScrollAnchor({
        getPan: () => pan,
        getContent: () => content,
        getBottomInset: () => paddingInset,
        isSuspended: () => suspended,
        onPinnedChange: (pinned) => pinnedHistory.push(pinned),
    })
    anchor.attach()

    return {
        pan,
        content,
        anchor,
        pinnedHistory,
        scrollToCalls,
        makeMsg,
        setSuspended(next) {
            suspended = next
        },
        setHeaderHeight(next) {
            headerHeight = next
            relayout()
        },
        setPaddingInset(next) {
            paddingInset = next
            relayout()
        },
        setClientHeight(next) {
            pan.clientHeight = next
            pan.offsetHeight = next
            const maxTop = Math.max(0, pan.scrollHeight - pan.clientHeight)
            if (pan.scrollTop > maxTop) pan.scrollTop = maxTop
        },
        relayout,
        prependMessages(heights) {
            const added = heights.map((h) => makeMsg(h))
            content.children.unshift(...added)
            relayout()
            return added
        },
        appendMessages(heights) {
            const added = heights.map((h) => makeMsg(h))
            content.children.push(...added)
            relayout()
            return added
        },
        userScrollTo(nextTop) {
            pan.scrollTop = nextTop
            anchor.handleScroll()
        },
        finishSmoothScroll(top) {
            const dest = top ?? scrollToCalls.at(-1)?.top ?? pan.scrollTop
            pan.scrollTop = Math.min(Math.max(0, dest), Math.max(0, pan.scrollHeight - pan.clientHeight))
            anchor.handleScroll()
            pan.dispatch('scrollend')
        },
    }
}

test('pure helpers classify list changes and compute bottom/top-edge anchors with inset clamping', () => {
    assert.equal(DEFAULT_BOTTOM_THRESHOLD, 24)
    assert.equal(classifyMessageListChange(['1', '2'], []), 'empty')
    assert.equal(classifyMessageListChange([], ['1', '2']), 'initial')
    assert.equal(classifyMessageListChange(['2', '3'], ['0', '1', '2', '3']), 'prepend')
    assert.equal(classifyMessageListChange(['1', '2'], ['1', '2', '3']), 'append')
    assert.equal(classifyMessageListChange(['1', '2', '3'], ['1', '2b', '3']), 'replace')
    assert.equal(classifyMessageListChange(['2', '3'], ['1', '2', '3', '4']), 'mixed')

    assert.equal(isScrollAtBottom({ scrollTop: 376, clientHeight: 600, scrollHeight: 1000 }), true)
    assert.equal(isScrollAtBottom({ scrollTop: 375, clientHeight: 600, scrollHeight: 1000 }), false)

    const items = [
        { top: 0, bottom: 200 },
        { top: 200, bottom: 500 },
        { top: 500, bottom: 800 },
        { top: 800, bottom: 1100 },
    ]
    assert.equal(selectBottomVisibleAnchorIndex(items, 250, 750), 2)
    assert.equal(selectBottomVisibleAnchorIndex(items, 1200, 1500), 3)
    assert.equal(selectBottomVisibleAnchorIndex(items, -300, -100), 0)
    assert.equal(selectBottomVisibleAnchorIndex([], 0, 600), -1)

    // Message #2 spans past viewportBottom (800 > 750) => anchor its visible top edge
    assert.deepEqual(selectViewportAnchor(items, 250, 750), { index: 2, edge: 'top' })
    // Message #2 fits inside viewport (800 <= 800) => anchor its bottom edge
    assert.deepEqual(selectViewportAnchor(items, 250, 800), { index: 2, edge: 'bottom' })

    assert.equal(
        computeAnchoredScrollTop({
            anchorCoord: 920,
            effectiveViewportHeight: 500,
            clientHeight: 600,
            scrollHeight: 2000,
            anchorOffset: 0,
        }),
        420,
    )
    assert.equal(
        computeBottomAnchoredScrollTop({
            anchorBottom: 1500,
            clientHeight: 600,
            scrollHeight: 2000,
            anchorBottomOffset: 50,
        }),
        850,
    )
    assert.equal(
        computeDistanceFromBottomScrollTop({
            scrollHeight: 2200,
            clientHeight: 600,
            distanceFromBottom: 400,
        }),
        1200,
    )
})

test('scenario 1: prepending 20 history messages and staggered upper image expansions keep viewport bottom locked without double shift', () => {
    const tl = createMockTimeline({
        clientHeight: 600,
        initialHeights: Array.from({ length: 25 }, () => 100),
    })
    tl.userScrollTo(1200)
    assert.equal(tl.anchor.isPinnedToBottom(), false)

    tl.anchor.setPinnedToBottom(false)
    const olderMsgs = tl.prependMessages([110, 110, ...Array.from({ length: 18 }, () => 100)])
    tl.anchor.reconcile()

    assert.equal(tl.pan.scrollTop, 3220)
    const anchorMsg = tl.content.children[20 + 17]
    const bottomDistance = () =>
        anchorMsg.offsetTop + anchorMsg.offsetHeight - (tl.pan.scrollTop + tl.pan.clientHeight)
    assert.equal(bottomDistance(), 0)

    olderMsgs[0].offsetHeight = 300
    tl.relayout()
    tl.pan.dispatch('load')
    assert.equal(tl.pan.scrollTop, 3410)
    assert.equal(bottomDistance(), 0)

    tl.anchor.reconcile()
    tl.anchor.reconcile()
    assert.equal(tl.pan.scrollTop, 3410)

    olderMsgs[1].offsetHeight = 300
    tl.relayout()
    tl.anchor.reconcile()
    assert.equal(tl.pan.scrollTop, 3600)
    assert.equal(bottomDistance(), 0)
})

test('scenario 2 & High-2: viewport placeholder bottom stays aligned while tall off-screen image growth does not push scrollTop', () => {
    const tl = createMockTimeline({
        clientHeight: 600,
        initialHeights: [200, 200, 200, 110, 200, 200],
    })
    tl.userScrollTo(110)
    assert.equal(tl.anchor.isPinnedToBottom(), false)

    tl.content.children[3].offsetHeight = 300
    tl.relayout()
    tl.anchor.reconcile()
    assert.equal(tl.pan.scrollTop, 300)

    // High-2: tall last visible message starts inside viewport (y=800..1100) with bottom outside (effectiveBottom=900)
    const tl2 = createMockTimeline({
        clientHeight: 600,
        initialHeights: [300, 500, 300, 200],
    })
    tl2.userScrollTo(300) // viewport 300..900, child[2] spans 800..1100
    tl2.content.children[2].offsetHeight = 460 // grows 160px off-screen below fold
    tl2.relayout()
    tl2.anchor.reconcile()
    assert.equal(tl2.pan.scrollTop, 300)
})

test('scenario 3: lower-viewport image growth and incoming bottom messages do not disturb unpinned reading position', () => {
    const tl = createMockTimeline({
        clientHeight: 600,
        initialHeights: Array.from({ length: 15 }, () => 100),
    })
    tl.userScrollTo(300)
    assert.equal(tl.anchor.isPinnedToBottom(), false)

    tl.content.children[12].offsetHeight = 400
    tl.relayout()
    tl.anchor.reconcile()
    assert.equal(tl.pan.scrollTop, 300)

    tl.anchor.capture()
    tl.appendMessages([120, 150])
    tl.anchor.reconcile()
    assert.equal(tl.pan.scrollTop, 300)
})

test('scenario 4 & High-4: pinned smooth scroll updates smoothly on media load and target jumps stay protected near bottom', () => {
    const tl = createMockTimeline({
        clientHeight: 600,
        initialHeights: Array.from({ length: 30 }, () => 100),
    })
    tl.anchor.scrollToBottom(false)
    assert.equal(tl.pan.scrollTop, 2400)
    assert.equal(tl.anchor.isPinnedToBottom(), true)

    const [newMsg] = tl.appendMessages([110])
    tl.anchor.scrollToBottom(true)
    assert.equal(tl.scrollToCalls.at(-1)?.top, 2510)
    assert.equal(tl.scrollToCalls.at(-1)?.behavior, 'smooth')

    // Image loads during in-flight smooth scroll-to-bottom: retarget smoothly instead of slamming scrollTop
    newMsg.offsetHeight = 350
    tl.relayout()
    tl.anchor.reconcile()
    assert.equal(tl.scrollToCalls.at(-1)?.top, 2750)
    assert.equal(tl.anchor.isPinnedToBottom(), true)
    tl.finishSmoothScroll()
    assert.equal(tl.pan.scrollTop, 2750)

    // Smooth jump to earlier message moving only 2px initially (still within 24px threshold) must NOT re-pin on media load
    const jumped = tl.anchor.scrollToTarget(tl.content.children[5], { smooth: true, centerInView: true })
    assert.equal(jumped, true)
    assert.equal(tl.anchor.isPinnedToBottom(), false)
    tl.userScrollTo(tl.pan.scrollTop - 2)
    tl.content.children[29].offsetHeight = 400
    tl.relayout()
    tl.pan.dispatch('load')
    assert.equal(tl.anchor.isPinnedToBottom(), false)
    tl.finishSmoothScroll()
    assert.equal(tl.anchor.isPinnedToBottom(), false)
})

test('scenario 5 & High-5: wheel/16px upward scroll unpins immediately and active scrollbar drag blocks reconcile', () => {
    const tl = createMockTimeline({
        clientHeight: 600,
        initialHeights: Array.from({ length: 20 }, () => 100),
    })
    tl.anchor.scrollToBottom(false)
    assert.equal(tl.pan.scrollTop, 1400)

    // Wheel up even 16px (within 24px threshold) immediately unpins
    tl.userScrollTo(1384)
    assert.equal(tl.anchor.isPinnedToBottom(), false)
    tl.appendMessages([100])
    tl.anchor.reconcile()
    assert.equal(tl.pan.scrollTop, 1384)

    // Scroll back down within threshold -> re-pins
    tl.userScrollTo(1485)
    assert.equal(tl.anchor.isPinnedToBottom(), true)

    // High-5: active pointer drag suppresses reconcile until pointer release and keeps user position
    tl.userScrollTo(1299)
    tl.pan.dispatch('pointerdown')
    tl.content.children[0].offsetHeight = 260
    tl.relayout()
    tl.anchor.reconcile()
    assert.equal(tl.pan.scrollTop, 1299)
    tl.pan.dispatch('pointerup')
    assert.equal(tl.pan.scrollTop, 1299)
    assert.equal(tl.anchor.isPinnedToBottom(), false)
})

test('scenario 6: wheel input during smooth scroll-to-bottom cancels auto scroll and yields control to user', () => {
    const tl = createMockTimeline({
        clientHeight: 600,
        initialHeights: Array.from({ length: 20 }, () => 100),
    })
    tl.pan.scrollTop = 1000
    tl.anchor.scrollToBottom(true)
    assert.equal(tl.scrollToCalls.length, 1)

    tl.userScrollTo(1200)
    assert.equal(tl.anchor.isPinnedToBottom(), true)

    tl.pan.dispatch('wheel', { deltaY: -40 })
    assert.equal(tl.anchor.isPinnedToBottom(), false)

    tl.appendMessages([120])
    tl.anchor.reconcile()
    assert.equal(tl.pan.scrollTop, 1200)
})

test('scenario 7: suspended state prevents reconcile from interfering with reply jump anchoring', () => {
    const tl = createMockTimeline({
        clientHeight: 600,
        initialHeights: Array.from({ length: 20 }, () => 100),
    })
    tl.userScrollTo(600)
    tl.setSuspended(true)

    tl.content.children[0].offsetHeight = 300
    tl.relayout()
    tl.anchor.reconcile()
    assert.equal(tl.pan.scrollTop, 600)

    tl.setSuspended(false)
    tl.anchor.reconcile()
    assert.equal(tl.pan.scrollTop, 800)
})

test('Medium 1-4: bottom inset compensation, hidden zero-size preservation, short list clamp, and neighbor fallback anchor', () => {
    // Medium 1: composer/drawer bottomInset grows by 100px => scrollTop shifts +100px to keep visible bottom line uncovered
    const tl1 = createMockTimeline({
        clientHeight: 600,
        initialHeights: Array.from({ length: 20 }, () => 100),
    })
    tl1.userScrollTo(320) // effectiveBottom = 920
    tl1.setPaddingInset(100)
    tl1.anchor.reconcile()
    assert.equal(tl1.pan.scrollTop, 420)

    // Medium 2: hidden (v-show zero clientHeight) preserves unpinned snapshot even if messages arrive while hidden
    tl1.userScrollTo(500) // effectiveHeight = 500 -> effectiveBottom = 1000
    const oldClient = tl1.pan.clientHeight
    tl1.pan.clientHeight = 0
    tl1.pan.scrollHeight = 0
    tl1.pan.scrollTop = 0
    tl1.anchor.handleScroll()
    tl1.anchor.capture()
    tl1.appendMessages([120, 120])
    assert.equal(tl1.anchor.isPinnedToBottom(), false)
    tl1.pan.clientHeight = oldClient
    tl1.relayout()
    tl1.anchor.reconcile()
    assert.equal(tl1.pan.scrollTop, 500) // effectiveBottom remains 1000 with 100px inset -> scrollTop=500

    // Medium 3: expanding viewport so pinned list becomes shorter than viewport keeps pinned=true
    const tl3 = createMockTimeline({
        clientHeight: 500,
        initialHeights: Array.from({ length: 8 }, () => 100),
    })
    tl3.anchor.scrollToBottom(false)
    assert.equal(tl3.pan.scrollTop, 300)
    tl3.setClientHeight(900)
    tl3.anchor.handleScroll()
    assert.equal(tl3.pan.scrollTop, 0)
    assert.equal(tl3.anchor.isPinnedToBottom(), true)

    // Medium 4: anchor node replaced while lower off-screen message grows 130px uses neighbor fallback, not distanceFromBottom
    const tl4 = createMockTimeline({
        clientHeight: 600,
        initialHeights: Array.from({ length: 20 }, () => 100),
    })
    tl4.userScrollTo(400) // viewport 400..1000, primaryAnchor index 9 (id chat-m-10), neighbors index 8, 7, 10, 11
    // Replace primary anchor element with a different id and grow a lower off-screen row (#15) by 130px
    tl4.content.children[9] = tl4.makeMsg(100, 'chat-m-replaced')
    tl4.content.children[15].offsetHeight = 230
    tl4.relayout()
    tl4.anchor.reconcile()
    assert.equal(tl4.pan.scrollTop, 400)
})

test('source invariants cover msg.ts, appUtil.ts, Chat.vue, and chat.css fixes', () => {
    const chatCss = readFileSync(
        new URL('../src/renderer/src/assets/css/chat.css', import.meta.url),
        'utf8',
    )
    const chatVue = readFileSync(
        new URL('../src/renderer/src/pages/Chat.vue', import.meta.url),
        'utf8',
    )
    const appUtil = readFileSync(
        new URL('../src/renderer/src/function/utils/appUtil.ts', import.meta.url),
        'utf8',
    )
    const msgTs = readFileSync(
        new URL('../src/renderer/src/function/msg.ts', import.meta.url),
        'utf8',
    )

    assert.match(chatCss, /\.chat-pan > div\.chat\s*\{[\s\S]*?overflow-anchor:\s*none;/)

    // Blocking 1: msg.ts handleChatHistoryResponse has no legacy 200ms timer writing scrollTop
    const historyRespMatch = msgTs.match(/function handleChatHistoryResponse[\s\S]*?\n\}/)
    assert.ok(historyRespMatch)
    assert.doesNotMatch(historyRespMatch[0], /setTimeout\s*\(/)
    assert.doesNotMatch(historyRespMatch[0], /scrollTop/)

    // High 4 & High 3: appUtil.ts exports jump handler registration and loadHistory clearBeforeLoad option
    assert.match(appUtil, /export function registerChatScrollJumpHandler/)
    assert.match(appUtil, /clearBeforeLoad\?: boolean/)
    const scrollToMsgMatch = appUtil.match(/export function scrollToMsg[\s\S]*?\n\}/)
    assert.ok(scrollToMsgMatch)
    assert.doesNotMatch(scrollToMsgMatch[0], /pan\.style\.scrollBehavior = 'smooth'/)

    // Chat.vue invariants
    assert.doesNotMatch(chatVue, /id="msgPan"[^>]*scroll-behavior:\s*smooth/)
    assert.match(chatVue, /suppressListMoveAnimation/)
    assert.match(chatVue, /classifyMessageListChange/)
    assert.match(chatVue, /function chatScroll\(event: Event, pass: boolean\) \{\s*\r?\n\s*if \(pass\) return/)
    assert.match(chatVue, /searchJumpTimer/)
    assert.match(chatVue, /if \(!jumped\)/)
})
