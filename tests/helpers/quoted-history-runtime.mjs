import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync, unlinkSync, rmdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import ts from 'typescript'

// Execute the actual history adapter/application bodies without starting the app.
function functionSource(file, name) {
    let text = readFileSync(new URL(`../../${file}`, import.meta.url), 'utf8')
    if (file.endsWith('.vue')) text = text.match(/<script[^>]*>([\s\S]*?)<\/script>/)[1]
    const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
    const node = source.statements.find(item => ts.isFunctionDeclaration(item) && item.name?.text === name)
    assert.ok(node, `Missing production function ${name}`)
    return node.getText(source).replace(/^export\s+/, '')
}

export async function createQuotedHistoryRuntime() {
    const chat = { chatInfo: { show: { id: 10, type: 'group' } }, messageList: [] }
    const ui = { nowGetHistory: false, canLoadHistory: true, loadHistoryFail: false }
    const auth = { loginInfo: { uin: 99 }, jsonMap: { message_list: { name: 'group_history', private_name: 'private_history' } } }
    const settings = { sysConfig: { enable_local_history: false, mixed_load_messages: false } }
    const calls = [], saved = [], errors = []
    const runtime = {
        uiStore: ui, chatStore: chat, authStore: auth, settingsStore: settings,
        list: new Proxy([], { get: (_target, key) => {
            const value = chat.messageList[key]
            return typeof value === 'function' ? value.bind(chat.messageList) : value
        } }),
        useUIStore: () => ui, useChatStore: () => chat, useAuthStore: () => auth,
        useSettingsStore: () => settings, useContactStore: () => ({ userList: [], baseOnMsgList: new Map() }),
        Connector: { send: (...args) => calls.push(args), callRawApi: async (...args) => {
            calls.push(args)
            return runtime.response
        } },
        Logger: class { error(...args) { errors.push(args) } },
        normalizeMessagesFromPayload: async payload => payload.data.messages,
        getMsgData: () => undefined, msgPath: { message_info: {} },
        saveMessagesWithSideEffects: (_account, messages) => saved.push(messages),
        sendMsgAppendInfo: () => {}, updateBaseOnMsgList: () => {},
        dbGetBefore: async () => [], dbGetBeforeByTime: async () => [],
    }
    const msgFile = 'src/renderer/src/function/msg.ts'
    const chatFile = 'src/renderer/src/pages/Chat.vue'
    const names = ['loadMoreHistory', 'loadLocalOlderHistory', 'requestQuotedHistoryPage', 'detectSeqGaps', 'fillSeqGaps']
    const bodies = [
        ...names.map(name => functionSource(chatFile, name)),
        ...['saveMsg', 'isSavedMessageForCurrentChat', 'filterSavedHistory', 'applySavedMessages', 'updateSavedHistoryPreview',
            'appendHistoryForQuotedMessage', 'mergeMessagesByIdAndTime', 'replaceMessageListInPlace',
            'normalizeMessageId', 'getMessageTimestamp', 'buildFallbackMessageKey', 'compareMessageOrder',
            'getImageSegments', 'hasImageMessage', 'hasResolvableImageSource', 'shouldReplaceDuplicateMessage']
            .map(name => functionSource(msgFile, name)),
    ]
    const code = `runtime => {
        ${Object.keys(runtime).map(name => typeof runtime[name] === 'function' && name !== 'Logger' ?`const ${name} = (...args) => runtime.${name}(...args)` : `const ${name} = runtime.${name}`).join('\n')}
        ${bodies.join('\n')}
        return { loadMoreHistory, appendHistoryForQuotedMessage }
    }`
    const compiled = ts.transpileModule(`export default ${code}`, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText
    const base = path.join(tmpdir(), '.agents')
    mkdirSync(base, { recursive: true })
    const folder = mkdtempSync(path.join(base, 'quoted-history-'))
    const file = path.join(folder, 'runtime.mjs')
    let api
    try {
        writeFileSync(file, compiled)
        api = (await import(pathToFileURL(file).href)).default(runtime)
    } finally {
        unlinkSync(file)
        rmdirSync(folder)
    }
    return { api, runtime, chat, ui, auth, settings, calls, saved, errors }
}
