import assert from 'node:assert/strict'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import { cacheNotificationIcon } from '../src/electron/function/notificationIcon.ts'
import { getUserAvatar } from '../src/renderer/src/function/utils/userAvatar.ts'
import ts from 'typescript'

const tempRoot = join(tmpdir(), '.agents')
mkdirSync(tempRoot, { recursive: true })

test('device notification icons become reusable PNG files and Windows file URLs', () => {
    const parent = mkdtempSync(join(tempRoot, 'stapxs-device-icons-'))
    try {
        const cache = join(parent, 'icons')
        for (const [id, kind] of Object.entries({
            2113929217: 'computer', 2113929218: 'phone', 2113929219: 'tablet',
        })) {
            const source = getUserAvatar(id, { name: 'SnowLuma', device_contacts: { [id]: kind } })
            const url = cacheNotificationIcon(source, cache)
            assert.ok(url.startsWith('file:'))
            assert.deepEqual(readFileSync(fileURLToPath(url)), Buffer.from(source.split(',')[1], 'base64'))
            assert.equal(cacheNotificationIcon(source, cache), url)
        }
        assert.equal(readdirSync(cache).length, 3)
    } finally {
        rmSync(parent, { recursive: true })
    }
})

test('ordinary notification images do not create cache files or change URLs', () => {
    const parent = mkdtempSync(join(tempRoot, 'stapxs-device-icons-'))
    try {
        const cache = join(parent, 'icons')
        for (const source of ['', 'https://q1.qlogo.cn/g?b=qq&s=0&nk=12345678']) {
            assert.equal(cacheNotificationIcon(source, cache), source)
        }
        assert.equal(existsSync(cache), false)
    } finally {
        rmSync(parent, { recursive: true })
    }
})

test('the production Touch Bar handler decodes local PNGs without HTTP and retains the message', async () => {
    const source = readFileSync(new URL('../src/electron/function/touchbar.ts', import.meta.url), 'utf8')
    const parsed = ts.createSourceFile('touchbar.ts', source, ts.ScriptTarget.Latest, true)
    const owner = parsed.statements.find((node) => ts.isClassDeclaration(node) && node.name.text === 'touchBar')
    const method = owner.members.find((node) => node.name?.getText(parsed) === 'newMessage')
    const compiled = ts.transpileModule(
        method.getText(parsed).replace('async newMessage', 'async function newMessage'),
        { compilerOptions: { target: ts.ScriptTarget.ESNext } },
    ).outputText
    let decoded
    let dimensions
    const image = { resize: (size) => { dimensions = size; return image } }
    const nativeImage = { createFromDataURL: (url) => { decoded = url; return image } }
    const axios = { get: () => assert.fail('local device icons must not trigger HTTP') }
    const newMessage = new Function('nativeImage', 'axios', compiled + ';return newMessage')(nativeImage, axios)
    const state = { msgList: {}, nowView: 'FriendSearch' }
    const avatar = getUserAvatar(2113929218, {
        name: 'SnowLuma', device_contacts: { 2113929218: 'phone' },
    })
    await newMessage.call(state, { tag: '2113929218/test', title: '我的手机', body: 'local fixture', icon: avatar })
    assert.equal(decoded, avatar)
    assert.deepEqual(dimensions, { width: 25, height: 25 })
    assert.equal(state.msgList['2113929218/test'].image, image)
    assert.equal(state.msgList['2113929218/test'].title, '我的手机')
})
