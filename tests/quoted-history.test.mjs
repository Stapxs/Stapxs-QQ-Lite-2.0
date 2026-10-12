import assert from 'node:assert/strict'
import test from 'node:test'
import { createQuotedHistoryRuntime } from './helpers/quoted-history-runtime.mjs'

const message = id => ({ message_id: id, time: Number(id), message: [{ type: 'text', text: 'message' }] })
const response = messages => ({ status: 'ok', retcode: 0, data: { messages } })

test('quote navigation uses mapped group/private paging and the full-page count convention', async () => {
    for (const type of ['group', 'private']) {
        const r = await createQuotedHistoryRuntime()
        r.chat.chatInfo.show.type = type
        r.chat.messageList.push(message(21), message(22))
        r.auth.jsonMap.message_list.pagerType = 'full'
        r.runtime.response = response([message(1), message(21), message(22)])
        assert.equal(await r.api.loadMoreHistory({ isActive: () => true }), true)
        const [action, params, timeout] = r.calls[0]
        assert.equal(action, type === 'group' ? 'group_history' : 'private_history')
        assert.equal(params[type === 'group' ? 'group_id' : 'user_id'], 10)
        assert.equal(params.message_id, 21)
        assert.equal(params.count, 22)
        assert.equal(timeout, 10000)
        assert.equal(r.chat.messageList.map(item => item.message_id).join(','), '1,21,22')
        assert.equal(r.ui.nowGetHistory, false)
    }
})

test('incremental quote pages use the existing ordered deduplicating merge', async () => {
    const r = await createQuotedHistoryRuntime()
    r.chat.messageList.push(message(21), message(22))
    r.runtime.response = response([message(21), message(1), message(2)])
    await r.api.loadMoreHistory({ isActive: () => true })
    assert.equal(r.chat.messageList.map(item => item.message_id).join(','), '1,2,21,22')
    assert.equal(r.saved.length, 1)
})

test('quote navigation retains previously read messages when a full-page adapter returns an older window', async () => {
    const r = await createQuotedHistoryRuntime()
    r.chat.messageList.push(message(21), message(22))
    r.auth.jsonMap.message_list.pagerType = 'full'
    r.runtime.response = response([message(1), message(2)])
    await r.api.loadMoreHistory({ isActive: () => true })
    assert.equal(r.chat.messageList.map(item => item.message_id).join(','), '1,2,21,22')
})

test('a late network response does not change the new chat or its loading state', async () => {
    const r = await createQuotedHistoryRuntime()
    r.chat.messageList.push(message(21))
    let done, active = true
    r.runtime.Connector.callRawApi = () => new Promise(resolve => { done = resolve })
    const pending = r.api.loadMoreHistory({ isActive: () => active })
    active = false
    r.chat.messageList.splice(0, 1, message(101))
    r.ui.nowGetHistory = true
    done(response([message(1)]))
    assert.equal(await pending, false)
    assert.equal(r.chat.messageList[0].message_id, 101)
    assert.equal(r.ui.nowGetHistory, true)
    assert.equal(r.saved.length, 0)
})

test('ownership is checked after delayed history normalization and before persistence', async () => {
    const r = await createQuotedHistoryRuntime()
    r.chat.messageList.push(message(21))
    let done, active = true
    r.runtime.normalizeMessagesFromPayload = () => new Promise(resolve => { done = resolve })
    const pending = r.api.appendHistoryForQuotedMessage(response([message(1)]), () => active)
    active = false
    done([message(1)])
    await pending
    assert.equal(r.chat.messageList[0].message_id, 21)
    assert.equal(r.saved.length, 0)
})

test('history failure releases navigation loading and preserves the current messages', async () => {
    const r = await createQuotedHistoryRuntime()
    r.chat.messageList.push(message(21))
    r.runtime.response = { status: 'failed', retcode: 100, data: null }
    assert.equal(await r.api.loadMoreHistory({ isActive: () => true }), false)
    assert.equal(r.ui.nowGetHistory, false)
    assert.equal(r.ui.loadHistoryFail, true)
    assert.equal(r.chat.messageList[0].message_id, 21)
})

test('manual paging keeps its existing callback rather than starting quote navigation', async () => {
    const r = await createQuotedHistoryRuntime()
    r.chat.messageList.push(message(21))
    await r.api.loadMoreHistory()
    assert.equal(r.calls.length, 1)
    assert.equal(r.calls[0][2], 'getChatHistory')
})
