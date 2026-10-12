/** Keep a quoted original visible while delayed media changes the timeline layout. */
export function keepQuotedMessageInView(options: {
    pan: HTMLElement
    target: HTMLElement
    isActive: () => boolean
    onRelease: () => void
}): { correct: () => boolean; stop: () => void } {
    const { pan, target } = options
    let stopped = false
    let frame = 0
    const observer = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(schedule)
    const inputs = ['wheel', 'touchstart', 'pointerdown']

    function stop() {
        if (stopped) return
        stopped = true
        cancelAnimationFrame(frame)
        observer?.disconnect()
        inputs.forEach(type => pan.removeEventListener(type, stop))
        pan.removeEventListener('keydown', keydown)
        pan.removeEventListener('load', schedule, true)
        pan.removeEventListener('transitionend', schedule)
        window.removeEventListener('resize', schedule)
        window.removeEventListener('pointerdown', stop)
        options.onRelease()
    }

    function correct(): boolean {
        if (stopped) return false
        if (!options.isActive() || !pan.isConnected || !pan.contains(target)) {
            stop()
            return false
        }
        const top = quotedMessageScrollTop(pan, target)
        if (Math.abs(pan.scrollTop - top) > 0.5) {
            const behavior = pan.style.scrollBehavior
            pan.style.scrollBehavior = 'auto'
            pan.scrollTop = top
            pan.style.scrollBehavior = behavior
        }
        return true
    }

    function schedule() {
        if (stopped || frame) return
        frame = requestAnimationFrame(() => {
            frame = 0
            correct()
        })
    }

    function keydown(event: KeyboardEvent) {
        if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(event.key)) stop()
    }

    inputs.forEach(type => pan.addEventListener(type, stop, { passive: true }))
    pan.addEventListener('keydown', keydown)
    pan.addEventListener('load', schedule, true)
    pan.addEventListener('transitionend', schedule)
    window.addEventListener('resize', schedule)
    window.addEventListener('pointerdown', stop, { passive: true })
    observer?.observe(pan)
    observer?.observe(target)
    if (target.parentElement) observer?.observe(target.parentElement)
    correct()
    return { correct, stop }
}

function quotedMessageScrollTop(pan: HTMLElement, target: HTMLElement): number {
    const viewport = pan.getBoundingClientRect()
    const message = target.getBoundingClientRect()
    const header = pan.parentElement?.querySelector(':scope > .info')?.getBoundingClientRect()
    const footer = pan.parentElement?.querySelector(':scope > .more')?.getBoundingClientRect()
    const top = Math.max(viewport.top + pan.clientTop, header?.bottom ?? viewport.top)
    const bottom = Math.min(viewport.top + pan.clientTop + pan.clientHeight, footer?.top ?? viewport.bottom)
    const position = top + Math.max(0, (bottom - top - message.height) / 2)
    const offset = pan.scrollTop + message.top - position
    // Zero is the manual older-history trigger. A quote jump must stay above it.
    return Math.min(Math.max(1, offset), Math.max(0, pan.scrollHeight - pan.clientHeight))
}
