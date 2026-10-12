import assert from 'node:assert/strict'
import test from 'node:test'

import {
    createHistoryRuntime,
    flushHistoryCallbacks,
    historyMessage,
} from './helpers/history-runtime.mjs'

test('late local-cache results cannot replace a newly selected chat or send its old request', async () => {
    const env = await createHistoryRuntime()
    env.settings.sysConfig.enable_local_history = true
    const pending = []
    env.runtime.dbGetLatest = (_selfId, id) => new Promise(resolve => pending.push({ id, resolve }))
    const first = env.api.loadHistory(env.chat.chatInfo.show)
    env.chat.chatInfo.show = { id: 20002, type: 'group' }
    const second = env.api.loadHistory(env.chat.chatInfo.show)
    pending[1].resolve([historyMessage('B')])
    await second
    pending[0].resolve([historyMessage('A')])
    await first
    assert.equal(env.chat.messageList[0].message_id, 'B')
    assert.equal(env.sent.length, 1)
    assert.equal(env.sent[0][1].group_id, 20002)
})

test('message normalization cannot revive an old history request after A -> B -> A', async () => {
    const env = await createHistoryRuntime()
    const request = env.tracker.begin(env.chat.chatInfo.show)
    let finish
    env.runtime.normalizeMessagesFromPayload = () => new Promise(resolve => { finish = resolve })
    const saving = env.api.saveMsg({}, undefined, request.generation)
    env.tracker.begin({ id: 20002, type: 'group' })
    env.tracker.begin(env.chat.chatInfo.show)
    env.chat.messageList = [historyMessage('current A')]
    finish([historyMessage('old A')])
    await saving
    assert.equal(env.chat.messageList[0].message_id, 'current A')
    assert.equal(env.saved.length, 0)
})

test('missing, malformed and stale history echoes cannot change the active loading state', async () => {
    for (const echo of [['getChatHistory'], ['getChatHistory', 'invalid'], ['getChatHistory', '1']]) {
        const env = await createHistoryRuntime()
        env.tracker.begin(env.chat.chatInfo.show)
        env.chat.chatInfo.show = { id: 20002, type: 'group' }
        env.tracker.begin(env.chat.chatInfo.show)
        env.ui.nowGetHistory = true
        env.ui.historyBeforeTime = 200
        env.api.handleChatHistoryResponse({ data: null }, echo, true)
        assert.equal(env.ui.loadHistoryFail, false)
        assert.equal(env.ui.nowGetHistory, true)
        assert.equal(env.ui.historyBeforeTime, 200)
        assert.equal(env.notifications.length, 0)
    }
})

test('a current history failure releases pagination and reports the error', async () => {
    const env = await createHistoryRuntime()
    const request = env.tracker.begin(env.chat.chatInfo.show)
    env.ui.nowGetHistory = true
    env.ui.historyBeforeTime = 200
    env.api.handleChatHistoryResponse({ data: null }, ['getChatHistory', String(request.generation)], true)
    assert.equal(env.ui.loadHistoryFail, true)
    assert.equal(env.ui.nowGetHistory, false)
    assert.equal(env.ui.historyBeforeTime, undefined)
    assert.equal(env.notifications.length, 1)
})

test('normalization failures are caught for both initial history and pagination', async () => {
    for (const appendToTop of [false, true]) {
        const env = await createHistoryRuntime()
        const request = env.tracker.begin(env.chat.chatInfo.show)
        const error = new Error('invalid history payload')
        env.runtime.normalizeMessagesFromPayload = async () => { throw error }
        env.ui.nowGetHistory = appendToTop
        env.ui.historyBeforeTime = 200
        env.api.handleChatHistoryResponse({ data: [] }, ['getChatHistory', String(request.generation)], appendToTop)
        await flushHistoryCallbacks()
        assert.equal(env.ui.loadHistoryFail, true)
        assert.equal(env.ui.nowGetHistory, false)
        if (appendToTop) assert.equal(env.ui.historyBeforeTime, undefined)
        assert.equal(env.notifications.length, 1)
        assert.equal(env.errors[0][0], error)
    }
})

test('a rejected old history request cannot fail the second A load after A -> B -> A', async () => {
    for (const appendToTop of [false, true]) {
        const env = await createHistoryRuntime()
        const request = env.tracker.begin(env.chat.chatInfo.show)
        let reject
        env.runtime.normalizeMessagesFromPayload = () => new Promise((_resolve, fail) => { reject = fail })
        env.api.handleChatHistoryResponse({ data: [] }, ['getChatHistory', String(request.generation)], appendToTop)
        env.chat.chatInfo.show = { id: 20002, type: 'group' }
        env.tracker.begin(env.chat.chatInfo.show)
        env.chat.chatInfo.show = { id: 10001, type: 'group' }
        env.tracker.begin(env.chat.chatInfo.show)
        env.ui.nowGetHistory = true
        env.ui.historyBeforeTime = 300
        reject(new Error('late failure from first A load'))
        await flushHistoryCallbacks()
        assert.equal(env.ui.loadHistoryFail, false)
        assert.equal(env.ui.nowGetHistory, true)
        assert.equal(env.ui.historyBeforeTime, 300)
        assert.equal(env.notifications.length, 0)
    }
})

test('local persistence failures are caught without rejecting displayed or gap-filled history', async () => {
    for (const gapFill of [false, true]) {
        const env = await createHistoryRuntime()
        const request = env.tracker.begin(env.chat.chatInfo.show)
        const error = new Error('local database unavailable')
        env.runtime.saveMessagesWithSideEffects = async () => { throw error }
        if (gapFill) {
            env.chat.messageList = [historyMessage('anchor')]
            env.api.gapFill('', { messages: [historyMessage('loaded')] }, ['getChatHistoryGapFill', String(request.generation), 'anchor'])
        } else {
            env.api.handleChatHistoryResponse({ data: [], messages: [historyMessage('loaded')] }, ['getChatHistoryFist', String(request.generation)])
        }
        await flushHistoryCallbacks()
        assert.equal(env.chat.messageList[0].message_id, 'loaded')
        assert.equal(env.ui.loadHistoryFail, false)
        assert.equal(env.notifications.length, 0)
        assert.equal(env.errors[0][0], error)
    }
})

test('unnumbered initial and pagination results cannot write or persist history', async () => {
    for (const appendToTop of [false, true]) {
        const env = await createHistoryRuntime()
        env.tracker.begin(env.chat.chatInfo.show)
        env.chat.messageList = [historyMessage('current')]
        env.api.handleChatHistoryResponse({ data: [], messages: [historyMessage('old')] }, ['getChatHistory'], appendToTop)
        await flushHistoryCallbacks()
        assert.equal(env.chat.messageList.length, 1)
        assert.equal(env.chat.messageList[0].message_id, 'current')
        assert.equal(env.saved.length, 0)
    }
})

test('a valid pagination response updates alternate views without a msgPan element', async () => {
    const env = await createHistoryRuntime()
    const request = env.tracker.begin(env.chat.chatInfo.show)
    env.runtime.document.getElementById = () => null
    env.chat.messageList = [historyMessage('current')]
    env.api.handleChatHistoryResponse({ data: [], messages: [historyMessage('older')] }, ['getChatHistory', String(request.generation)], true)
    await flushHistoryCallbacks()
    assert.equal(env.chat.messageList.some(message => message.message_id === 'older'), true)
    assert.equal(env.saved.length, 1)
    assert.equal(env.ticks.length, 0)
})

test('an active numbered pagination response preserves the scroll offset', async () => {
    const env = await createHistoryRuntime()
    const request = env.tracker.begin(env.chat.chatInfo.show)
    env.api.handleChatHistoryResponse({ data: [], messages: [historyMessage('older')] }, ['getChatHistory', String(request.generation)], true)
    await flushHistoryCallbacks()
    env.ticks.shift()()
    env.pan.scrollHeight = 500
    env.timers.shift()()
    assert.equal(env.pan.scrollTop, 400)
})

test('a delayed pagination scroll does not affect a later session or a replaced message panel', async () => {
    for (const replacePanel of [false, true]) {
        const env = await createHistoryRuntime()
        const request = env.tracker.begin(env.chat.chatInfo.show)
        env.api.handleChatHistoryResponse({ data: [], messages: [historyMessage('older')] }, ['getChatHistory', String(request.generation)], true)
        await flushHistoryCallbacks()
        env.ticks.shift()()
        if (replacePanel) {
            env.runtime.document.getElementById = () => ({ scrollHeight: 500 })
        } else {
            env.chat.chatInfo.show = { id: 20002, type: 'group' }
            env.tracker.begin(env.chat.chatInfo.show)
        }
        env.pan.scrollHeight = 500
        env.timers.shift()()
        assert.equal(env.pan.scrollTop, 0)
    }
})

test('gap-fill ignores missing generations and a session switch during normalization', async () => {
    const env = await createHistoryRuntime()
    const request = env.tracker.begin(env.chat.chatInfo.show)
    env.chat.messageList = [historyMessage('anchor')]
    env.api.gapFill('', { messages: [historyMessage('old')] }, ['getChatHistoryGapFill', 'invalid', 'anchor'])
    await flushHistoryCallbacks()
    assert.equal(env.chat.messageList.length, 1)
    let finish
    env.runtime.getMessageList = () => new Promise(resolve => { finish = resolve })
    env.api.gapFill('', { messages: [] }, ['getChatHistoryGapFill', String(request.generation), 'anchor'])
    env.chat.chatInfo.show = { id: 20002, type: 'group' }
    env.tracker.begin(env.chat.chatInfo.show)
    finish([historyMessage('old')])
    await flushHistoryCallbacks()
    assert.equal(env.chat.messageList.length, 1)
    assert.equal(env.saved.length, 0)
})

test('late local pagination cannot prepend messages, fill gaps or send an old network request', async () => {
    const env = await createHistoryRuntime()
    env.tracker.begin(env.chat.chatInfo.show)
    env.settings.sysConfig.enable_local_history = true
    env.chat.messageList = [historyMessage('anchor', 100)]
    let finish
    env.runtime.dbGetBeforeByTime = () => new Promise(resolve => { finish = resolve })
    const loading = env.api.loadMoreHistory()
    env.chat.chatInfo.show = { id: 20002, type: 'group' }
    env.tracker.begin(env.chat.chatInfo.show)
    env.chat.messageList = [historyMessage('B')]
    finish([historyMessage('old A')])
    await loading
    assert.equal(env.chat.messageList.length, 1)
    assert.equal(env.chat.messageList[0].message_id, 'B')
    assert.equal(env.sent.length, 0)
})

test('current local pagination prepends cached history and sends a numbered network request', async () => {
    const env = await createHistoryRuntime()
    const request = env.tracker.begin(env.chat.chatInfo.show)
    env.settings.sysConfig.enable_local_history = true
    env.chat.messageList = [historyMessage('anchor', 100)]
    env.runtime.dbGetBeforeByTime = async () => [historyMessage('cached', 50)]
    await env.api.loadMoreHistory()
    assert.deepEqual(env.chat.messageList.map(message => message.message_id), ['cached', 'anchor'])
    assert.equal(env.sent.length, 1)
    assert.equal(env.sent[0][1].message_id, 'anchor')
    assert.equal(env.sent[0][2], `getChatHistory_${request.generation}`)
})

test('danmaku and terminal pagination use the active generation and retain their page sizes', async () => {
    for (const mode of ['danmaku', 'terminal']) {
        const env = await createHistoryRuntime()
        const request = env.tracker.begin(env.chat.chatInfo.show)
        env.chat.messageList = Array.from({ length: 20 }, (_, index) => historyMessage(String(index)))
        if (mode === 'danmaku') env.api.updateDanmakuList()
        else env.api.terminalCommand('ssqq history', ['ssqq', 'history'])
        assert.equal(env.sent.length, 1)
        assert.equal(env.sent[0][0], 'group_history')
        assert.equal(env.sent[0][1].message_id, '0')
        assert.equal(env.sent[0][1].count, mode === 'danmaku' ? 10 : 20)
        assert.equal(env.sent[0][2], `getChatHistory_${request.generation}`)
    }
})

test('the shared pagination entry selects private/full-page mappings and rejects stale sessions', async () => {
    const env = await createHistoryRuntime()
    env.chat.chatInfo.show = { id: 20002, type: 'user' }
    const request = env.tracker.begin(env.chat.chatInfo.show)
    env.auth.jsonMap.message_list.pagerType = 'full'
    env.chat.messageList = [historyMessage('current')]
    env.api.loadMoreHistoryMessages('anchor', 20, request)
    assert.equal(env.sent[0][0], 'private_history')
    assert.equal(env.sent[0][1].user_id, 20002)
    assert.equal(env.sent[0][1].count, 21)
    env.chat.chatInfo.show = { id: 30003, type: 'group' }
    env.tracker.begin(env.chat.chatInfo.show)
    assert.equal(env.api.loadMoreHistoryMessages('old anchor', 20, request), false)
    assert.equal(env.sent.length, 1)
})

test('default first-history requests are numbered while custom preview callbacks retain their echo', async () => {
    const env = await createHistoryRuntime()
    const request = env.tracker.begin(env.chat.chatInfo.show)
    env.api.loadHistoryMessage(10001, 'group')
    env.api.loadHistoryMessage(20002, 'user', 1, 'readMemberMessage')
    assert.equal(env.sent[0][2], `getChatHistoryFist_${request.generation}`)
    assert.equal(env.sent[1][2], 'readMemberMessage')
})

test('live incoming messages still append without a history generation', async () => {
    const env = await createHistoryRuntime()
    env.chat.messageList = [historyMessage('current')]
    await env.api.saveMsg({ messages: [historyMessage('new')] }, 'bottom')
    assert.equal(env.chat.messageList.length, 2)
    assert.equal(env.chat.messageList[1].message_id, 'new')
})

test('a live incoming message is discarded if normalization finishes in another chat', async () => {
    const env = await createHistoryRuntime()
    let finish
    env.runtime.normalizeMessagesFromPayload = () => new Promise(resolve => { finish = resolve })
    const saving = env.api.saveMsg({}, 'bottom')
    env.chat.chatInfo.show = { id: 20002, type: 'group' }
    env.chat.messageList = [historyMessage('B')]
    finish([historyMessage('late A')])
    await saving
    assert.equal(env.chat.messageList.length, 1)
    assert.equal(env.chat.messageList[0].message_id, 'B')
})

test('a current initial response replaces history and refreshes the session preview', async () => {
    const env = await createHistoryRuntime()
    const request = env.tracker.begin(env.chat.chatInfo.show)
    const contact = { group_id: 10001 }
    env.contacts.userList.push(contact)
    env.chat.messageList = [historyMessage('old')]
    env.api.handleChatHistoryResponse({ data: [], messages: [historyMessage('latest')] }, ['getChatHistoryFist', String(request.generation)])
    await flushHistoryCallbacks()
    assert.equal(env.chat.messageList.length, 1)
    assert.equal(env.chat.messageList[0].message_id, 'latest')
    assert.equal(contact.message_id, 'latest')
    assert.equal(env.contacts.baseOnMsgList.get(10001), contact)
})

test('mixed initial history merges the local cache while full-page network history replaces it', async () => {
    for (const mixed of [false, true]) {
        const env = await createHistoryRuntime()
        const request = env.tracker.begin(env.chat.chatInfo.show)
        env.settings.sysConfig.enable_local_history = mixed
        env.auth.jsonMap.message_list.pagerType = 'full'
        env.chat.messageList = [historyMessage('local')]
        await env.api.saveMsg({ messages: [historyMessage('network')] }, 'top', request.generation)
        assert.equal(env.chat.messageList.length, mixed ? 2 : 1)
        assert.equal(env.chat.messageList.at(-1).message_id, 'network')
    }
})

test('an empty incremental history page preserves messages and releases the loading flag', async () => {
    const env = await createHistoryRuntime()
    const request = env.tracker.begin(env.chat.chatInfo.show)
    env.chat.messageList = [historyMessage('current')]
    env.ui.nowGetHistory = true
    await env.api.saveMsg({ messages: [] }, 'top', request.generation)
    assert.equal(env.chat.messageList[0].message_id, 'current')
    assert.equal(env.ui.canLoadHistory, false)
    assert.equal(env.ui.nowGetHistory, false)
})

test('a page filtered out by the mixed-history boundary preserves messages and permits another load', async () => {
    const env = await createHistoryRuntime()
    const request = env.tracker.begin(env.chat.chatInfo.show)
    env.chat.messageList = [historyMessage('current', 100)]
    env.ui.historyBeforeTime = 100
    env.ui.nowGetHistory = true
    await env.api.saveMsg({ messages: [historyMessage('newer', 200)] }, 'top', request.generation)
    assert.equal(env.chat.messageList[0].message_id, 'current')
    assert.equal(env.ui.historyBeforeTime, undefined)
    assert.equal(env.ui.canLoadHistory, true)
    assert.equal(env.ui.nowGetHistory, false)
})

test('a response containing another chat cannot update or persist the current history', async () => {
    const env = await createHistoryRuntime()
    const request = env.tracker.begin(env.chat.chatInfo.show)
    env.chat.messageList = [historyMessage('current')]
    const wrong = { ...historyMessage('wrong chat'), infoList: [{ group_id: 20002 }] }
    await env.api.saveMsg({ messages: [wrong] }, undefined, request.generation)
    assert.equal(env.chat.messageList[0].message_id, 'current')
    assert.equal(env.saved.length, 0)
})

test('a current gap-fill response still inserts and persists its messages', async () => {
    const env = await createHistoryRuntime()
    const request = env.tracker.begin(env.chat.chatInfo.show)
    env.chat.messageList = [historyMessage('anchor')]
    env.api.gapFill('', { messages: [historyMessage('gap')] }, ['getChatHistoryGapFill', String(request.generation), 'anchor'])
    await flushHistoryCallbacks()
    assert.equal(env.chat.messageList.length, 2)
    assert.equal(env.chat.messageList[0].message_id, 'gap')
    assert.equal(env.saved.length, 1)
})

test('terminal pagination handles an empty list after removing its startup hints', async () => {
    const env = await createHistoryRuntime()
    env.tracker.begin(env.chat.chatInfo.show)
    env.chat.messageList = Array.from({ length: 4 }, () => ({ commandOut: true }))
    env.api.terminalCommand('ssqq history', ['ssqq', 'history'])
    assert.equal(env.sent.length, 1)
    assert.equal(env.sent[0][1].message_id, 0)
})
