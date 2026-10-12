import assert from 'node:assert/strict'
import test from 'node:test'
import {
    QuotedMessageLoader, QuoteRequestError, quotePreviewMessage, requestQuotedMessage, loadHistoryToQuotedMessage,
} from '../src/renderer/src/function/utils/quotedMessage.ts'

function deferred() {
    let resolve, reject
    const promise = new Promise((done, fail) => { resolve = done; reject = fail })
    return { promise, resolve, reject }
}
function message(id, extra = {}) {
    return { message_id: id, message_type: 'group', time: 1788000000, sender: { user_id: 2, nickname: 'Sender' },
        message: [{ type: 'text', text: 'Original message' }], ...extra }
}
function requestOptions(extra = {}) {
    return { id: '1', session: { id: 10, type: 'group' }, action: 'get_msg',
        call: async () => ({ status: 'ok', data: message(1, { group_id: '10' }) }),
        normalize: async raw => [raw], isActive: () => true, ...extra }
}

test('fetches only the original by ID with a bounded timeout', async () => {
    const calls = []
    const original = await requestQuotedMessage(requestOptions({ call: async (...args) => {
        calls.push(args)
        return { status: 'ok', data: message(1) }
    } }))
    assert.equal(original.message_id, 1)
    assert.deepEqual(calls, [['get_msg', { message_id: 1 }, 10000]])
})
test('honors the mapped single-message action', async () => {
    let action
    await requestQuotedMessage(requestOptions({ action: 'custom_get_message', call: async name => {
        action = name
        return { status: 'ok', data: message(1) }
    } }))
    assert.equal(action, 'custom_get_message')
})
test('retains opaque and large IDs while sending numeric OneBot IDs as numbers', async () => {
    for (const id of ['opaque-id', '9999999999999999999999', '-7']) {
        let transmitted
        await requestQuotedMessage(requestOptions({ id, call: async (_action, params) => {
            transmitted = params.message_id
            return { status: 'ok', data: message(id) }
        } }))
        assert.equal(transmitted, id === '-7' ? -7 : id)
    }
})
test('rejects failed, malformed, mismatched-ID and wrong-conversation responses', async () => {
    for (const response of [null, { status: 'failed', data: message(1) },
        { status: 'ok', retcode: 1, data: message(1) },
        { status: 'ok', data: message(2) },
        { status: 'ok', data: message(1, { sender: null }) },
        { status: 'ok', data: message(1, { time: 'invalid' }) },
        { status: 'ok', data: message(1, { time: null }) },
        { status: 'ok', data: message(1, { message_type: undefined }) },
        { status: 'ok', data: message(1, { group_id: 20 }) },
        { status: 'ok', data: message(1, { message_type: 'private' }) }]) {
        await assert.rejects(requestQuotedMessage(requestOptions({ call: async () => response })), QuoteRequestError)
    }
})
test('accepts standard OneBot get_msg group responses without the optional group_id extension', async () => {
    const original = await requestQuotedMessage(requestOptions({
        call: async () => ({ status: 'ok', retcode: 0, data: message(1) }),
    }))
    assert.equal(original.message_type, 'group')
    assert.equal(original.group_id, undefined)
})

test('supports private messages and string/number group identities', async () => {
    assert.equal((await requestQuotedMessage(requestOptions())).message_id, 1)
    const result = await requestQuotedMessage(requestOptions({ session: { id: '2', type: 'private' },
        call: async () => ({ status: 'ok', data: message(1, { message_type: 'private' }) }) }))
    assert.equal(result.message_id, 1)
})
test('stale responses never start normalization', async () => {
    const pending = deferred()
    let active = true, normalized = false
    const result = requestQuotedMessage(requestOptions({ call: () => pending.promise,
        isActive: () => active, normalize: async raw => { normalized = true; return [raw] } }))
    active = false
    pending.resolve({ status: 'ok', data: message(1) })
    assert.equal(await result, null)
    assert.equal(normalized, false)
})
test('rejects a private original belonging to a different peer', async () => {
    await assert.rejects(requestQuotedMessage(requestOptions({ session: { id: '2', type: 'private', selfId: 99 },
        call: async () => ({ status: 'ok', data: message(1, { user_id: 3, message_type: 'private' }) }) })),
    QuoteRequestError)
    const original = await requestQuotedMessage(requestOptions({ session: { id: 2, type: 'private', selfId: '99' },
        call: async () => ({ status: 'ok', data: message(1, { user_id: 2, target_id: 99, message_type: 'private' }) }) }))
    assert.equal(original.message_id, 1)
})
test('rechecks ownership after asynchronous normalization', async () => {
    const normalized = deferred()
    let active = true
    const result = requestQuotedMessage(requestOptions({ normalize: () => normalized.promise, isActive: () => active }))
    await Promise.resolve()
    active = false
    normalized.resolve([message(1)])
    assert.equal(await result, null)
})
test('distinguishes connector timeouts from unavailable originals', async () => {
    const timeout = Object.assign(new Error(), { echo: 'request' })
    await assert.rejects(requestQuotedMessage(requestOptions({ call: async () => { throw timeout } })),
        error => error.failure === 'timeout')
})
test('deduplicates concurrent references and reuses the cached original', async () => {
    const pending = deferred()
    let calls = 0
    const loader = new QuotedMessageLoader(() => { calls++; return pending.promise })
    const first = loader.load(1)
    assert.equal(loader.load('1'), first)
    pending.resolve(message(1))
    await first
    assert.equal((await loader.load('1')).message_id, 1)
    assert.equal(calls, 1)
})
test('limits active requests to two and drains the queue', async () => {
    const pending = [deferred(), deferred(), deferred()]
    let started = 0
    const loader = new QuotedMessageLoader(() => pending[started++].promise)
    const results = [loader.load(1), loader.load(2), loader.load(3)]
    assert.equal(started, 2)
    pending[0].resolve(message(1))
    await results[0]
    assert.equal(started, 3)
    pending[1].resolve(message(2))
    pending[2].resolve(message(3))
    await Promise.all(results)
})
test('A -> B -> A drops old requests without erasing new work for the same ID', async () => {
    const old = deferred(), fresh = deferred()
    let calls = 0
    const loader = new QuotedMessageLoader(() => (++calls === 1 ? old : fresh).promise)
    const stale = loader.load(1)
    loader.reset()
    loader.reset()
    const current = loader.load(1)
    old.resolve(message(1, { raw_message: 'stale' }))
    assert.equal(await stale, null)
    assert.equal(loader.load(1), current)
    fresh.resolve(message(1, { raw_message: 'current' }))
    await current
    assert.equal(loader.entries.get('1').message.raw_message, 'current')
})
test('reset cancels queued requests and clears error/cache state', async () => {
    const pending = deferred()
    const loader = new QuotedMessageLoader(() => pending.promise)
    const first = loader.load(1), second = loader.load(2), queued = loader.load(3)
    loader.reset()
    assert.equal(await queued, null)
    pending.reject(new Error('offline'))
    await Promise.all([first, second])
    assert.equal(loader.entries.size, 0)
})
test('failure is stable until explicitly retried', async () => {
    let calls = 0
    const loader = new QuotedMessageLoader(async id => {
        if (++calls === 1) throw new QuoteRequestError('timeout')
        return message(id)
    })
    assert.equal(await loader.load(1), null)
    assert.equal(loader.entries.get('1').failure, 'timeout')
    assert.equal(await loader.load(1), null)
    assert.equal(calls, 1)
    assert.equal((await loader.load(1, true)).message_id, '1')
})
test('evicts least recently used completed entries', async () => {
    const loader = new QuotedMessageLoader(async id => message(id), () => {}, 2)
    await loader.load(1)
    await loader.load(2)
    await loader.load(1)
    await loader.load(3)
    assert.deepEqual([...loader.entries.keys()], ['1', '3'])
})
test('recalls during a request prevent the response from restoring the content', async () => {
    const pending = deferred()
    const loader = new QuotedMessageLoader(() => pending.promise)
    const result = loader.load(1)
    loader.revoke(1)
    pending.resolve(message(1))
    await result
    assert.equal(loader.entries.get('1').message.revoke, true)
    assert.deepEqual(loader.entries.get('1').message.message, [])
})
test('does not fetch originals recalled before a queued request starts', async () => {
    const pending = deferred()
    let calls = 0
    const loader = new QuotedMessageLoader(() => { calls++; return pending.promise })
    const first = loader.load(1), second = loader.load(2), third = loader.load(3)
    loader.revoke(3)
    pending.resolve(message(1))
    await Promise.all([first, second, third])
    assert.equal(calls, 2)
    assert.equal(loader.entries.get('3').message.revoke, true)
})
test('a recalled in-flight original stays hidden even if its cache entry is evicted', async () => {
    const pending = deferred()
    const loader = new QuotedMessageLoader(() => pending.promise, () => {}, 1)
    const result = loader.load(1)
    loader.revoke(1)
    loader.revoke(2)
    assert.equal(loader.entries.has('1'), false)
    pending.resolve(message(1))
    await result
    assert.equal(loader.entries.has('1'), false)
})
test('invalid normalized results cannot become successful previews', async () => {
    const loader = new QuotedMessageLoader(async () => message('wrong'))
    assert.equal(await loader.load(1), null)
    assert.equal(loader.entries.get('1').status, 'error')
})
test('compact previews preserve one image and omit nested replies without mutating originals', () => {
    const original = message(1, { message: [{ type: 'reply', id: 0 }, { type: 'text', text: 'hello' },
        { type: 'image', url: 'one' }, { type: 'image', url: 'two' }] })
    const preview = quotePreviewMessage(original)
    assert.equal(original.message.length, 4)
    assert.deepEqual(preview.message.map(item => item.type), ['text', 'image'])
    assert.equal(preview.message[1].url, 'one')
    for (const type of ['video', 'record', 'file', 'json', 'xml', 'forward']) {
        assert.equal(quotePreviewMessage(message(1, { message: [{ type }] })), null)
    }
    assert.equal(quotePreviewMessage(message(1, { revoke: true })), null)
})

test('an already rendered original jumps without loading older history', async () => {
    let calls = 0
    assert.equal(await loadHistoryToQuotedMessage({ isActive: () => true, hasTarget: () => true,
        boundary: () => '20', loadOlder: async () => { calls++; return true }, rendered: async () => {} }), 'found')
    assert.equal(calls, 0)
})

test('one click loads every required page before the original is rendered', async () => {
    let oldest = 61, rendered = 61
    const anchors = []
    const result = await loadHistoryToQuotedMessage({ isActive: () => true, hasTarget: () => rendered === 1,
        boundary: () => String(oldest), loadOlder: async () => {
            anchors.push(oldest)
            oldest -= 20
            return true
        }, rendered: async () => { rendered = oldest } })
    assert.equal(result, 'found')
    assert.deepEqual(anchors, [61, 41, 21])
})

test('a repeated page stops navigation even if live messages grow the list', async () => {
    let calls = 0, liveCount = 0
    assert.equal(await loadHistoryToQuotedMessage({ isActive: () => true, hasTarget: () => false,
        boundary: () => '61', loadOlder: async () => { calls++; liveCount++; return true },
        rendered: async () => {} }), 'unavailable')
    assert.equal(calls, 1)
    assert.equal(liveCount, 1)
})

test('history exhaustion and request failures stop without another page', async () => {
    let calls = 0
    assert.equal(await loadHistoryToQuotedMessage({ isActive: () => true, hasTarget: () => false,
        boundary: () => '61', loadOlder: async () => { calls++; return false }, rendered: async () => {} }), 'unavailable')
    assert.equal(calls, 1)
})

test('a superseded jump or chat switch cancels pending navigation', async () => {
    const pending = deferred()
    let active = true, calls = 0
    const result = loadHistoryToQuotedMessage({ isActive: () => active, hasTarget: () => false,
        boundary: () => '61', loadOlder: () => { calls++; return pending.promise }, rendered: async () => {} })
    await Promise.resolve()
    active = false
    pending.resolve(true)
    assert.equal(await result, 'cancelled')
    assert.equal(calls, 1)
})

test('cancellation before navigation never requests a page', async () => {
    let calls = 0
    assert.equal(await loadHistoryToQuotedMessage({ isActive: () => false, hasTarget: () => false,
        boundary: () => '61', loadOlder: async () => { calls++; return true }, rendered: async () => {} }), 'cancelled')
    assert.equal(calls, 0)
})
