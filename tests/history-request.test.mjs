import assert from 'node:assert/strict'
import test from 'node:test'

import {
    createHistoryEcho,
    createHistoryRequestTracker,
    getHistoryGeneration,
} from '../src/renderer/src/function/utils/historyRequest.ts'

test('invalidates an earlier session when the user switches chats', () => {
    const tracker = createHistoryRequestTracker()
    const first = tracker.begin({ id: 10001, type: 'user' })
    const second = tracker.begin({ id: 20002, type: 'group' })

    assert.equal(tracker.isActive(first.generation, { id: 10001, type: 'user' }), false)
    assert.equal(tracker.isActive(second.generation, { id: 20002, type: 'group' }), true)
})

test('does not revive an old request after switching away and back', () => {
    const tracker = createHistoryRequestTracker()
    const oldRequest = tracker.begin({ id: 10001, type: 'user' })
    tracker.begin({ id: 20002, type: 'group' })
    const currentRequest = tracker.begin({ id: '10001', type: 'user' })

    assert.equal(tracker.isActive(oldRequest.generation, { id: 10001, type: 'user' }), false)
    assert.equal(tracker.isActive(currentRequest.generation, { id: 10001, type: 'user' }), true)
})

test('round-trips the request generation through an echo', () => {
    const tracker = createHistoryRequestTracker()
    const request = tracker.begin({ id: 10001, type: 'user' })
    const echo = createHistoryEcho('getChatHistoryGapFill', request, '9988')

    assert.equal(echo, `getChatHistoryGapFill_${request.generation}_9988`)
    assert.equal(getHistoryGeneration(echo.split('_')), request.generation)
    assert.equal(getHistoryGeneration(['getChatHistory', 'invalid']), undefined)
})
