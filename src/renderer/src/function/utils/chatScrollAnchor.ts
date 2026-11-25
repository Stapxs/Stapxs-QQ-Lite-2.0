export const DEFAULT_BOTTOM_THRESHOLD = 24

export interface ScrollMetrics {
    scrollTop: number
    clientHeight: number
    scrollHeight: number
}

export interface AnchorLayoutBox {
    top: number
    bottom: number
}

export type MessageListChangeKind =
    | 'empty'
    | 'initial'
    | 'prepend'
    | 'append'
    | 'replace'
    | 'mixed'

export interface ViewportAnchorSelection {
    index: number
    edge: 'top' | 'bottom'
}

export function classifyMessageListChange(
    prevIds: string[],
    nextIds: string[],
): MessageListChangeKind {
    if (nextIds.length === 0) return 'empty'
    if (prevIds.length === 0) return 'initial'

    const firstIdx = nextIds.indexOf(prevIds[0])
    const lastIdx = nextIds.lastIndexOf(prevIds[prevIds.length - 1])
    if (firstIdx === -1 && lastIdx === -1) return 'replace'

    const hasPrepended = firstIdx > 0
    const hasAppended = lastIdx !== -1 && lastIdx < nextIds.length - 1
    if (hasPrepended && hasAppended) return 'mixed'
    if (hasPrepended) return 'prepend'
    if (hasAppended) return 'append'
    return 'replace'
}

export function isScrollAtBottom(
    metrics: ScrollMetrics,
    threshold = DEFAULT_BOTTOM_THRESHOLD,
): boolean {
    return metrics.scrollHeight - (metrics.scrollTop + metrics.clientHeight) <= threshold
}

export function selectBottomVisibleAnchorIndex(
    items: AnchorLayoutBox[],
    viewportTop: number,
    viewportBottom: number,
): number {
    if (items.length === 0) return -1

    for (let i = items.length - 1; i >= 0; i--) {
        const item = items[i]
        if (item.top < viewportBottom && item.bottom > viewportTop) {
            return i
        }
    }

    for (let i = items.length - 1; i >= 0; i--) {
        if (items[i].bottom <= viewportBottom) {
            return i
        }
    }

    return 0
}

/**
 * Pick the bottom-most visible message and choose an edge inside the viewport.
 * When a tall message extends past the bottom edge, anchor its visible top edge
 * so off-screen media expansion below the fold cannot push scrollTop down.
 */
export function selectViewportAnchor(
    items: AnchorLayoutBox[],
    viewportTop: number,
    viewportBottom: number,
): ViewportAnchorSelection | null {
    const index = selectBottomVisibleAnchorIndex(items, viewportTop, viewportBottom)
    if (index < 0) return null
    const item = items[index]
    const edge: 'top' | 'bottom' =
        item.top < viewportBottom && item.bottom > viewportBottom + 1 ? 'top' : 'bottom'
    return { index, edge }
}

export function computeAnchoredScrollTop(params: {
    anchorCoord: number
    effectiveViewportHeight: number
    clientHeight: number
    scrollHeight: number
    anchorOffset: number
}): number {
    const maxTop = Math.max(0, params.scrollHeight - params.clientHeight)
    const rawTop = params.anchorCoord - params.effectiveViewportHeight - params.anchorOffset
    return Math.min(Math.max(0, rawTop), maxTop)
}

export function computeBottomAnchoredScrollTop(params: {
    anchorBottom: number
    clientHeight: number
    scrollHeight: number
    anchorBottomOffset: number
}): number {
    return computeAnchoredScrollTop({
        anchorCoord: params.anchorBottom,
        effectiveViewportHeight: params.clientHeight,
        clientHeight: params.clientHeight,
        scrollHeight: params.scrollHeight,
        anchorOffset: params.anchorBottomOffset,
    })
}

export function computeDistanceFromBottomScrollTop(params: {
    scrollHeight: number
    clientHeight: number
    distanceFromBottom: number
}): number {
    const maxTop = Math.max(0, params.scrollHeight - params.clientHeight)
    const rawTop = params.scrollHeight - params.clientHeight - params.distanceFromBottom
    return Math.min(Math.max(0, rawTop), maxTop)
}

function getOffsetTopFromRoot(node: HTMLElement): number {
    let top = 0
    let current: HTMLElement | null = node
    while (current) {
        top += current.offsetTop || 0
        const parent = current.offsetParent as HTMLElement | null
        if (!parent) break
        top += parent.clientTop || 0
        current = parent
    }
    return top
}

/**
 * Compute an element's layout coordinates relative to the scroll container's
 * scrollable origin without being affected by CSS transforms (e.g. TransitionGroup moves).
 */
export function getLayoutOffsetInContainer(
    el: HTMLElement,
    container: HTMLElement,
): { top: number; bottom: number; height: number } {
    const top =
        getOffsetTopFromRoot(el) -
        getOffsetTopFromRoot(container) -
        (container.clientTop || 0)
    const height = el.offsetHeight || 0
    return {
        top,
        bottom: top + height,
        height,
    }
}

export interface ChatScrollAnchorOptions {
    getPan: () => HTMLElement | null
    getContent: () => HTMLElement | null
    getBottomInset?: () => number
    isSuspended?: () => boolean
    onPinnedChange?: (pinned: boolean) => void
    bottomThreshold?: number
}

export interface ChatScrollAnchorController {
    attach: () => void
    detach: () => void
    refreshObservers: () => void
    capture: () => void
    handleScroll: () => void
    reconcile: (opts?: { forceBottom?: boolean; smoothBottom?: boolean }) => void
    scrollToBottom: (smooth?: boolean) => void
    scrollToTarget: (
        target: HTMLElement,
        opts?: { smooth?: boolean; centerInView?: boolean },
    ) => boolean
    setPinnedToBottom: (pinned: boolean) => void
    isPinnedToBottom: () => boolean
    reset: (pinned?: boolean) => void
}

interface AnchorSnapshot {
    el: HTMLElement
    id: string
    edge: 'top' | 'bottom'
    offset: number
}

interface ActiveScrollAnimation {
    kind: 'bottom' | 'target'
    targetEl?: HTMLElement | null
    targetTop: number
    centerInView?: boolean
}

function isMeasurableChild(node: unknown): node is HTMLElement {
    if (!node || typeof node !== 'object') return false
    if (typeof HTMLElement !== 'undefined' && !(node instanceof HTMLElement)) {
        return false
    }
    return Number((node as HTMLElement).offsetHeight) > 0
}

function isElementContained(pan: HTMLElement, el: HTMLElement): boolean {
    if (typeof (el as { isConnected?: boolean }).isConnected === 'boolean' && !el.isConnected) {
        return false
    }
    if (typeof pan.contains === 'function') {
        return pan.contains(el)
    }
    return true
}

function hasValidSize(pan: HTMLElement): boolean {
    return pan.clientHeight > 0 && pan.scrollHeight > 0
}

function computeTargetScrollTop(
    pan: HTMLElement,
    target: HTMLElement,
    centerInView: boolean,
): number {
    const layout = getLayoutOffsetInContainer(target, pan)
    const maxTop = Math.max(0, pan.scrollHeight - pan.clientHeight)
    const rawTop = centerInView ? Math.max(1, layout.top - (pan.clientHeight - layout.height) / 2) : Math.max(1, layout.top - layout.height + 10)
    return Math.min(Math.max(0, rawTop), maxTop)
}

export function createChatScrollAnchor(
    options: ChatScrollAnchorOptions,
): ChatScrollAnchorController {
    const threshold = options.bottomThreshold ?? DEFAULT_BOTTOM_THRESHOLD
    let pinnedToBottom = true
    let primaryAnchor: AnchorSnapshot | null = null
    let fallbackAnchors: AnchorSnapshot[] = []
    let distanceFromBottom = 0
    let programmaticScrollTop: number | null = null
    let activeAnimation: ActiveScrollAnimation | null = null
    let isPointerInteracting = false
    let pendingReconcileAfterInteraction = false
    let lastObservedScrollTop = 0
    let lastObservedMaxScrollTop = 0
    let attachedPan: HTMLElement | null = null
    let observedContent: HTMLElement | null = null
    let observedAnchor: HTMLElement | null = null
    let resizeObserver: ResizeObserver | undefined

    function setPinned(next: boolean) {
        if (pinnedToBottom === next) return
        pinnedToBottom = next
        options.onPinnedChange?.(next)
    }

    function clearAnchors() {
        primaryAnchor = null
        fallbackAnchors = []
        distanceFromBottom = 0
        syncObservedAnchor(null)
    }

    function syncObservedAnchor(nextAnchor: HTMLElement | null) {
        if (!resizeObserver || observedAnchor === nextAnchor) return
        if (observedAnchor) resizeObserver.unobserve(observedAnchor)
        observedAnchor = nextAnchor
        if (observedAnchor) resizeObserver.observe(observedAnchor)
    }

    function getEffectiveHeight(pan: HTMLElement): number {
        const bottomInset = Math.max(0, options.getBottomInset?.() ?? 0)
        return Math.max(0, pan.clientHeight - bottomInset)
    }

    function getAnchorCandidates(content: HTMLElement): HTMLElement[] {
        return Array.from(content.children ?? []).filter(isMeasurableChild)
    }

    function createSnapshot(
        el: HTMLElement,
        layout: { top: number; bottom: number },
        effectiveBottom: number,
        forcedEdge?: 'top' | 'bottom',
    ): AnchorSnapshot {
        const edge: 'top' | 'bottom' = forcedEdge ?? (layout.top < effectiveBottom && layout.bottom > effectiveBottom + 1 ? 'top' : 'bottom')
        const coord = edge === 'top' ? layout.top : layout.bottom
        return {
            el,
            id: typeof el.id === 'string' ? el.id : '',
            edge,
            offset: coord - effectiveBottom,
        }
    }

    function capture() {
        const pan = options.getPan()
        if (!pan || !hasValidSize(pan)) return

        const effectiveHeight = getEffectiveHeight(pan)
        const viewportTop = pan.scrollTop
        const effectiveBottom = viewportTop + effectiveHeight
        distanceFromBottom = Math.max(
            0,
            pan.scrollHeight - (pan.scrollTop + effectiveHeight),
        )
        lastObservedScrollTop = pan.scrollTop
        lastObservedMaxScrollTop = Math.max(0, pan.scrollHeight - pan.clientHeight)

        const content = options.getContent()
        if (!content) {
            primaryAnchor = null
            fallbackAnchors = []
            syncObservedAnchor(null)
            return
        }
        const candidates = getAnchorCandidates(content)
        if (candidates.length === 0) {
            primaryAnchor = null
            fallbackAnchors = []
            syncObservedAnchor(null)
            return
        }
        const layouts = candidates.map((el) => getLayoutOffsetInContainer(el, pan))
        const selection = selectViewportAnchor(layouts, viewportTop, effectiveBottom)
        if (!selection) {
            primaryAnchor = null
            fallbackAnchors = []
            syncObservedAnchor(null)
            return
        }

        primaryAnchor = createSnapshot(
            candidates[selection.index],
            layouts[selection.index],
            effectiveBottom,
            selection.edge,
        )
        const neighborOffsets = [-1, -2, 1, 2]
        fallbackAnchors = neighborOffsets
            .map((delta) => selection.index + delta)
            .filter((idx) => idx >= 0 && idx < candidates.length)
            .map((idx) =>
                createSnapshot(candidates[idx], layouts[idx], effectiveBottom),
            )
        syncObservedAnchor(primaryAnchor.el)
    }

    function applyImmediateScrollTop(targetTop: number) {
        const pan = options.getPan()
        if (!pan) return
        const maxTop = Math.max(0, pan.scrollHeight - pan.clientHeight)
        const clamped = Math.min(Math.max(0, targetTop), maxTop)
        if (pan.style) pan.style.scrollBehavior = 'auto'
        pan.scrollTop = clamped
        programmaticScrollTop = pan.scrollTop
        lastObservedScrollTop = pan.scrollTop
        lastObservedMaxScrollTop = maxTop
    }

    function resolveSnapshotElement(
        pan: HTMLElement,
        snap: AnchorSnapshot,
        candidates: HTMLElement[],
    ): HTMLElement | null {
        if (isElementContained(pan, snap.el)) return snap.el
        if (snap.id) {
            return candidates.find((el) => el.id === snap.id) ?? null
        }
        return null
    }

    function reconcile(opts?: { forceBottom?: boolean; smoothBottom?: boolean }) {
        const pan = options.getPan()
        if (!pan || !hasValidSize(pan) || options.isSuspended?.()) return

        if (isPointerInteracting && !opts?.forceBottom) {
            pendingReconcileAfterInteraction = true
            return
        }

        if (activeAnimation?.kind === 'target' && !opts?.forceBottom) {
            const targetEl = activeAnimation.targetEl
            if (targetEl && isElementContained(pan, targetEl)) {
                activeAnimation.targetTop = computeTargetScrollTop(
                    pan,
                    targetEl,
                    activeAnimation.centerInView === true,
                )
            }
            return
        }

        if (opts?.forceBottom || pinnedToBottom) {
            const bottomTop = Math.max(0, pan.scrollHeight - pan.clientHeight)
            setPinned(true)
            clearAnchors()

            if (activeAnimation?.kind === 'bottom' && !opts?.forceBottom) {
                if (
                    Math.abs(activeAnimation.targetTop - bottomTop) > 1 &&
                    typeof pan.scrollTo === 'function'
                ) {
                    activeAnimation.targetTop = bottomTop
                    pan.scrollTo({ top: bottomTop, behavior: 'smooth' })
                }
                return
            }

            if (
                opts?.smoothBottom &&
                Math.abs(pan.scrollTop - bottomTop) > 1 &&
                typeof pan.scrollTo === 'function'
            ) {
                activeAnimation = { kind: 'bottom', targetTop: bottomTop }
                pan.scrollTo({ top: bottomTop, behavior: 'smooth' })
                return
            }

            activeAnimation = null
            applyImmediateScrollTop(bottomTop)
            return
        }

        const effectiveHeight = getEffectiveHeight(pan)
        const content = options.getContent()
        const candidates = content ? getAnchorCandidates(content) : []

        const trySnap = (snap: AnchorSnapshot | null): { targetTop: number; el: HTMLElement } | null => {
            if (!snap) return null
            const el = resolveSnapshotElement(pan, snap, candidates)
            if (!el) return null
            const layout = getLayoutOffsetInContainer(el, pan)
            const coord = snap.edge === 'top' ? layout.top : layout.bottom
            const targetTop = computeAnchoredScrollTop({
                anchorCoord: coord,
                effectiveViewportHeight: effectiveHeight,
                clientHeight: pan.clientHeight,
                scrollHeight: pan.scrollHeight,
                anchorOffset: snap.offset,
            })
            return { targetTop, el }
        }

        const primaryResolved = trySnap(primaryAnchor)
        if (primaryResolved) {
            if (Math.abs(pan.scrollTop - primaryResolved.targetTop) > 0.5) {
                applyImmediateScrollTop(primaryResolved.targetTop)
            }
            if (primaryAnchor && primaryResolved.el !== primaryAnchor.el) {
                capture()
            } else {
                distanceFromBottom = Math.max(
                    0,
                    pan.scrollHeight - (pan.scrollTop + effectiveHeight),
                )
            }
            return
        }

        for (const fallback of fallbackAnchors) {
            const resolved = trySnap(fallback)
            if (!resolved) continue
            if (Math.abs(pan.scrollTop - resolved.targetTop) > 0.5) {
                applyImmediateScrollTop(resolved.targetTop)
            }
            capture()
            return
        }

        const fallbackTop = computeDistanceFromBottomScrollTop({
            scrollHeight: pan.scrollHeight,
            clientHeight: effectiveHeight,
            distanceFromBottom,
        })
        if (Math.abs(pan.scrollTop - fallbackTop) > 0.5) {
            applyImmediateScrollTop(fallbackTop)
        }
        capture()
    }

    function handleScroll() {
        const pan = options.getPan()
        if (!pan || !hasValidSize(pan)) return

        if (programmaticScrollTop !== null) {
            const expected = programmaticScrollTop
            programmaticScrollTop = null
            if (Math.abs(pan.scrollTop - expected) <= 1) {
                lastObservedScrollTop = pan.scrollTop
                lastObservedMaxScrollTop = Math.max(0, pan.scrollHeight - pan.clientHeight)
                return
            }
        }

        const maxTop = Math.max(0, pan.scrollHeight - pan.clientHeight)
        const atBottomRaw = isScrollAtBottom(pan, threshold)

        if (activeAnimation) {
            lastObservedScrollTop = pan.scrollTop
            lastObservedMaxScrollTop = maxTop
            if (activeAnimation.kind === 'bottom') {
                if (atBottomRaw) {
                    activeAnimation = null
                    setPinned(true)
                    clearAnchors()
                }
                return
            }
            setPinned(false)
            if (Math.abs(pan.scrollTop - activeAnimation.targetTop) <= 2) {
                activeAnimation = null
                capture()
            }
            return
        }

        const clampedByShrink =
            maxTop <= 1 ||
            (maxTop < lastObservedMaxScrollTop - 0.5 && atBottomRaw)
        const movedUp = !clampedByShrink && pan.scrollTop < lastObservedScrollTop - 0.5
        lastObservedScrollTop = pan.scrollTop
        lastObservedMaxScrollTop = maxTop

        const atBottom = !movedUp && atBottomRaw
        setPinned(atBottom)
        if (atBottom) {
            clearAnchors()
        } else {
            capture()
        }
    }

    function scrollToBottom(smooth = false) {
        setPinned(true)
        clearAnchors()
        reconcile({ forceBottom: true, smoothBottom: smooth })
    }

    function scrollToTarget(
        target: HTMLElement,
        opts?: { smooth?: boolean; centerInView?: boolean },
    ): boolean {
        const pan = options.getPan()
        if (!pan || !hasValidSize(pan) || !isElementContained(pan, target)) return false

        const centerInView = opts?.centerInView === true
        const targetTop = computeTargetScrollTop(pan, target, centerInView)
        setPinned(false)
        clearAnchors()

        if (
            opts?.smooth !== false &&
            Math.abs(pan.scrollTop - targetTop) > 1 &&
            typeof pan.scrollTo === 'function'
        ) {
            activeAnimation = {
                kind: 'target',
                targetEl: target,
                targetTop,
                centerInView,
            }
            pan.scrollTo({ top: targetTop, behavior: 'smooth' })
            return true
        }

        activeAnimation = null
        applyImmediateScrollTop(targetTop)
        capture()
        return true
    }

    function setPinnedToBottom(pinned: boolean) {
        activeAnimation = null
        setPinned(pinned)
        if (pinned) {
            clearAnchors()
        } else {
            capture()
        }
    }

    function reset(pinned = true) {
        activeAnimation = null
        isPointerInteracting = false
        pendingReconcileAfterInteraction = false
        programmaticScrollTop = null
        const pan = options.getPan()
        lastObservedScrollTop = pan?.scrollTop ?? 0
        lastObservedMaxScrollTop = pan ? Math.max(0, pan.scrollHeight - pan.clientHeight) : 0
        setPinned(pinned)
        if (pinned) {
            clearAnchors()
        } else {
            capture()
        }
    }

    function onWheel(event: Event) {
        const pan = options.getPan()
        if (!pan || !hasValidSize(pan)) return
        const wheelEvent = event as WheelEvent
        const maxTop = Math.max(0, pan.scrollHeight - pan.clientHeight)
        const scrollingUp = typeof wheelEvent?.deltaY === 'number' && wheelEvent.deltaY < 0
        if (activeAnimation) {
            activeAnimation = null
            if (maxTop > 0 && (scrollingUp || !isScrollAtBottom(pan, threshold))) {
                setPinned(false)
                capture()
            }
            return
        }
        if (scrollingUp && maxTop > 0) {
            setPinned(false)
            capture()
        }
    }

    function onPointerStart() {
        isPointerInteracting = true
        pendingReconcileAfterInteraction = false
        const pan = options.getPan()
        if (!activeAnimation || !pan || !hasValidSize(pan)) return
        activeAnimation = null
        const atBottom = isScrollAtBottom(pan, threshold)
        setPinned(atBottom)
        if (!atBottom) capture()
    }

    function onPointerEnd() {
        if (!isPointerInteracting) return
        isPointerInteracting = false
        const pan = options.getPan()
        if (!pan || !hasValidSize(pan)) {
            pendingReconcileAfterInteraction = false
            return
        }
        const maxTop = Math.max(0, pan.scrollHeight - pan.clientHeight)
        const movedUp = maxTop > 0 && pan.scrollTop < lastObservedScrollTop - 0.5
        lastObservedScrollTop = pan.scrollTop
        lastObservedMaxScrollTop = maxTop
        const atBottom = !movedUp && isScrollAtBottom(pan, threshold)
        setPinned(atBottom)
        const shouldReconcile = pendingReconcileAfterInteraction
        pendingReconcileAfterInteraction = false
        if (atBottom) {
            clearAnchors()
            if (shouldReconcile) reconcile({ forceBottom: false })
        } else {
            capture()
        }
    }

    function onKeyDown(event: KeyboardEvent) {
        const key = event?.key
        const isUpKey = ['ArrowUp', 'PageUp', 'Home'].includes(key)
        const isNavKey =
            isUpKey || ['ArrowDown', 'PageDown', 'End', ' '].includes(key)
        if (!isNavKey) return

        const pan = options.getPan()
        if (!pan || !hasValidSize(pan)) return
        const maxTop = Math.max(0, pan.scrollHeight - pan.clientHeight)
        if (activeAnimation) {
            activeAnimation = null
        }
        if (isUpKey && maxTop > 0) {
            setPinned(false)
            capture()
        } else {
            const atBottom = isScrollAtBottom(pan, threshold)
            setPinned(atBottom)
            if (!atBottom) capture()
        }
    }

    function onScrollEnd() {
        if (!activeAnimation) return
        const finished = activeAnimation
        activeAnimation = null
        const pan = options.getPan()
        if (!pan || !hasValidSize(pan)) return
        if (finished.kind === 'bottom') {
            reconcile({ forceBottom: false })
        } else {
            setPinned(false)
            capture()
        }
    }

    function onMediaLoad() {
        reconcile()
    }

    function refreshObservers() {
        if (typeof ResizeObserver === 'undefined') return
        if (!resizeObserver) {
            resizeObserver = new ResizeObserver(() => {
                reconcile()
            })
        }
        const pan = options.getPan()
        const content = options.getContent()
        if (pan && pan !== attachedPan) {
            if (attachedPan) resizeObserver.unobserve(attachedPan)
            resizeObserver.observe(pan)
        }
        if (content !== observedContent) {
            if (observedContent) resizeObserver.unobserve(observedContent)
            observedContent = content
            if (observedContent) resizeObserver.observe(observedContent)
        }
        if (primaryAnchor?.el && pan && isElementContained(pan, primaryAnchor.el)) {
            syncObservedAnchor(primaryAnchor.el)
        } else {
            syncObservedAnchor(null)
        }
    }

    function attach() {
        const pan = options.getPan()
        if (!pan) return
        if (attachedPan && attachedPan !== pan) {
            detach()
        }
        if (attachedPan !== pan) {
            lastObservedScrollTop = pan.scrollTop
            lastObservedMaxScrollTop = Math.max(0, pan.scrollHeight - pan.clientHeight)
            pan.addEventListener('wheel', onWheel, { passive: true })
            pan.addEventListener('touchstart', onPointerStart, { passive: true })
            pan.addEventListener('pointerdown', onPointerStart, { passive: true })
            pan.addEventListener('pointerup', onPointerEnd, { passive: true })
            pan.addEventListener('pointercancel', onPointerEnd, { passive: true })
            pan.addEventListener('touchend', onPointerEnd, { passive: true })
            pan.addEventListener('touchcancel', onPointerEnd, { passive: true })
            pan.addEventListener('keydown', onKeyDown)
            pan.addEventListener('scrollend', onScrollEnd)
            pan.addEventListener('load', onMediaLoad, true)
            pan.addEventListener('loadedmetadata', onMediaLoad, true)
            if (typeof window !== 'undefined') {
                window.addEventListener('pointerup', onPointerEnd, { passive: true })
                window.addEventListener('pointercancel', onPointerEnd, { passive: true })
                window.addEventListener('touchend', onPointerEnd, { passive: true })
                window.addEventListener('touchcancel', onPointerEnd, { passive: true })
            }
            refreshObservers()
            attachedPan = pan
        } else {
            refreshObservers()
        }
    }

    function detach() {
        if (resizeObserver) {
            resizeObserver.disconnect()
            resizeObserver = undefined
        }
        observedContent = null
        observedAnchor = null
        isPointerInteracting = false
        pendingReconcileAfterInteraction = false
        activeAnimation = null
        if (typeof window !== 'undefined') {
            window.removeEventListener('pointerup', onPointerEnd)
            window.removeEventListener('pointercancel', onPointerEnd)
            window.removeEventListener('touchend', onPointerEnd)
            window.removeEventListener('touchcancel', onPointerEnd)
        }
        if (attachedPan) {
            attachedPan.removeEventListener('wheel', onWheel)
            attachedPan.removeEventListener('touchstart', onPointerStart)
            attachedPan.removeEventListener('pointerdown', onPointerStart)
            attachedPan.removeEventListener('pointerup', onPointerEnd)
            attachedPan.removeEventListener('pointercancel', onPointerEnd)
            attachedPan.removeEventListener('touchend', onPointerEnd)
            attachedPan.removeEventListener('touchcancel', onPointerEnd)
            attachedPan.removeEventListener('keydown', onKeyDown)
            attachedPan.removeEventListener('scrollend', onScrollEnd)
            attachedPan.removeEventListener('load', onMediaLoad, true)
            attachedPan.removeEventListener('loadedmetadata', onMediaLoad, true)
            attachedPan = null
        }
    }

    return {
        attach,
        detach,
        refreshObservers,
        capture,
        handleScroll,
        reconcile,
        scrollToBottom,
        scrollToTarget,
        setPinnedToBottom,
        isPinnedToBottom: () => pinnedToBottom,
        reset,
    }
}
