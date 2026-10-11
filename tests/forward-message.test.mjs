import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import ts from 'typescript'
import jp from 'jsonpath'
import yamlPlugin from '@modyfi/vite-plugin-yaml'

// Use the production mapper and preprocessing bodies with the shipped YAML maps.
function functionSource(file, name) {
    const text = readFileSync(new URL(`../${file}`, import.meta.url), 'utf8')
    const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true)
    const node = source.statements.find(item => ts.isFunctionDeclaration(item) && item.name?.text === name)
    assert.ok(node, `Missing production function ${name}`)
    return node.getText(source).replace(/^export\s+/, '')
}

async function createRuntime(mapName = 'NapCat.Onebot') {
    const file = `src/renderer/src/assets/pathMap/${mapName}.yaml`
    const transformed = await yamlPlugin().transform(readFileSync(new URL(`../${file}`, import.meta.url), 'utf8'), file)
    const map = Function(transformed.code.replace('export default data;', 'return data;'))()
    const calls = [], errors = []
    const auth = { loginInfo: { uin: 123 }, jsonMap: map }
    const ui = {}
    const runtime = {
        jp, msgPath: map,
        useAuthStore: () => auth, useUIStore: () => ui,
        BotMsgType: { CQCode: 'cq', Array: 'array' },
        logger: { error: error => errors.push(error), debug: () => {} },
        // parseCQ only needs HTML entity decoding; these fixtures use plain text.
        document: { createElement: () => ({ set innerHTML(value) { this.innerText = value } }) },
        Connector: { callApi: async (api, args) => {
            calls.push([api, args])
            return getMsgData(api, { data: { messages: responses[args.id] } }, map[api])
        } },
    }
    const utils = 'src/renderer/src/function/utils/msgUtil.ts'
    const msg = 'src/renderer/src/function/msg.ts'
    const bodies = [
        ...['getMsgData', 'replaceJPValue', 'parseMsgList', 'parseCQ'].map(name => functionSource(utils, name)),
        ...['getMessageList', 'msgPreprocess'].map(name => functionSource(msg, name)),
    ]
    const compiled = ts.transpileModule(bodies.join('\n'), {
        compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None },
    }).outputText
    const api = Function(...Object.keys(runtime), `${compiled}\nreturn {getMsgData, parseMsgList, getMessageList}`)(...Object.values(runtime))
    const { getMsgData } = api
    const responses = {}
    return { ...api, map, calls, errors, responses, ui }
}

const sender = { user_id: 456, nickname: 'Forward sender', card: 'Original card' }
const text = value => ({ type: 'text', data: { text: value } })
const forward = id => ({ message_id: 999, sender: { user_id: 123 }, message: [{ type: 'forward', data: { id } }] })

test('LLOneBot content nodes survive API mapping and renderable preprocessing', async () => {
    const r = await createRuntime()
    r.responses.ll = [{ sender: { ...sender }, time: 100, message_type: 'group', content: [text('LLBot message')] }]
    const [message] = await r.getMessageList([forward('ll')])
    assert.equal(r.errors.length, 0)
    const [node] = message.message[0].content
    assert.equal(node.message[0].text, 'LLBot message')
    assert.equal(node.sender.user_id, sender.user_id)
    assert.equal(node.sender.nickname, sender.nickname)
    assert.equal(node.sender.card, sender.card)
    assert.equal(node.time, 100)
    assert.equal(node.infoList.sender, sender.user_id)
    assert.equal(node.post_type, 'message')
    assert.equal('content' in node, false)
})

test('NapCat message nodes keep their sender, IDs and media segments', async () => {
    const r = await createRuntime()
    r.responses.nap = [{ message_id: 42, sender: { ...sender }, time: 200, message: [
        text('NapCat message'),
        { type: 'image', data: { url: 'https://example.com/image.png', file: 'image.png' } },
        { type: 'file', data: { file: 'document.txt' } },
    ] }]
    const [message] = await r.getMessageList([forward('nap')])
    assert.equal(r.errors.length, 0)
    const [node] = message.message[0].content
    assert.equal(node.message_id, 42)
    assert.equal(node.sender.nickname, sender.nickname)
    assert.equal(node.message[0].text, 'NapCat message')
    assert.equal(node.message[1].url, 'https://example.com/image.png')
    assert.equal(node.message[2].name, 'document.txt')
})

test('nested LLOneBot forwards are normalized through the same API path', async () => {
    const r = await createRuntime()
    r.responses.outer = [{ sender, time: 100, content: [{ type: 'forward', data: { id: 'inner' } }, text('Outer')] }]
    r.responses.inner = [{ sender, time: 90, content: [text('Nested')] }]
    const [message] = await r.getMessageList([forward('outer')])
    assert.equal(r.errors.length, 0)
    assert.equal(message.message[0].content[0].message[0].content[0].message[0].text, 'Nested')
    assert.equal(r.calls.length, 2)
})

test('inline LLOneBot content is usable without an additional API request', async () => {
    const r = await createRuntime()
    const message = forward('inline')
    message.message[0].data.content = [{ sender, time: 100, content: [text('Already included')] }]
    const [result] = await r.getMessageList([message])
    assert.equal(r.errors.length, 0)
    assert.equal(result.message[0].content[0].message[0].text, 'Already included')
    assert.equal(result.message[0].content[0].sender.nickname, sender.nickname)
    assert.equal(r.calls.length, 0)
})

test('content normalization runs before CQ-code detection', async () => {
    const r = await createRuntime()
    r.responses.cq = [{ sender, time: 100, content: 'Plain text[CQ:image,file=image.png]' }]
    const [message] = await r.getMessageList([forward('cq')])
    assert.equal(r.errors.length, 0)
    const [node] = message.message[0].content
    assert.equal(node.message[0].text, 'Plain text')
    assert.equal(node.message[1].type, 'image')
    assert.equal(node.message[1].file, 'image.png')
    assert.equal(node.sender.nickname, sender.nickname)
})

test('Lagrange content nodes retain their top-level sender fallback', async () => {
    const r = await createRuntime('Lagrange.OneBot')
    const nodes = r.getMsgData('forward_msg', { data: { message: [{ type: 'node', data: {
        user_id: 456, nickname: 'Lagrange sender', time: 100,
        content: [text('Lagrange'), { type: 'image', data: { file: 'https://example.com/image.png' } }],
    } }] } }, r.map.forward_msg)
    const [node] = await r.getMessageList(nodes)
    assert.equal(node.message[0].text, 'Lagrange')
    assert.equal(node.message[1].url, 'https://example.com/image.png')
    assert.equal(node.sender.user_id, 456)
    assert.equal(node.sender.nickname, 'Lagrange sender')
})

test('content normalization does not depend on a message_value mapping', async () => {
    const r = await createRuntime()
    r.map.message_value = undefined
    const [node] = await r.getMessageList([{ sender, content: [text('No value map')] }])
    assert.equal(node.message[0].text, 'No value map')
    assert.equal(node.sender.nickname, sender.nickname)
})

test('an existing message field takes precedence over content', async () => {
    const r = await createRuntime()
    const [node] = await r.getMessageList([{ sender, message: [text('Primary')], content: [text('Secondary')] }])
    assert.equal(node.message[0].text, 'Primary')
    assert.equal(node.sender.nickname, sender.nickname)
})
