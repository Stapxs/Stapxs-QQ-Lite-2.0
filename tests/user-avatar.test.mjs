import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { getUserAvatar } from '../src/renderer/src/function/utils/userAvatar.ts'

// Read the shipped capability map so a renamed/missing entry cannot hide behind a fixture.
const yaml = readFileSync(new URL('../src/renderer/src/assets/pathMap/SnowLuma.yaml', import.meta.url), 'utf8')
const device_contacts = Object.fromEntries(
    [...yaml.matchAll(/^\s+(211392921[7-9]): (computer|phone|tablet)$/gm)]
        .map((match) => [match[1], match[2]]),
)
const snowluma = { name: 'SnowLuma', device_contacts }
const qlogo = (id) => 'https://q1.qlogo.cn/g?b=qq&s=0&nk=' + id

test('the shipped SnowLuma map identifies all three device peers', () => {
    assert.deepEqual(device_contacts, {
        2113929217: 'computer', 2113929218: 'phone', 2113929219: 'tablet',
    })
    const urls = Object.keys(device_contacts).map((id) => getUserAvatar(Number(id), snowluma))
    assert.equal(new Set(urls).size, 3)
    for (const url of urls) {
        assert.ok(url.startsWith('data:image/svg+xml,'))
        assert.match(decodeURIComponent(url), /<svg/)
        assert.doesNotMatch(url, /qlogo/)
    }
})

test('numeric and string IDs select the same icon without altering the caller', () => {
    const peer = Object.freeze({ user_id: '2113929218', nickname: '我的手机' })
    assert.equal(getUserAvatar(peer.user_id, snowluma), getUserAvatar(2113929218, snowluma))
    assert.equal(peer.user_id, '2113929218')
})

test('the same IDs on other backends and real QQ users retain their existing avatar', () => {
    for (const id of [2113929217, '2113929218', 2113929219, 12345678]) {
        for (const pathMap of [undefined, { name: 'NapCat.Onebot' }, { name: 'LLOneBot', device_contacts }]) {
            assert.equal(getUserAvatar(id, pathMap), qlogo(id))
        }
    }
    assert.equal(getUserAvatar(12345678, snowluma), qlogo(12345678))
    assert.equal(getUserAvatar(2113929220, snowluma), qlogo(2113929220))
})

test('backend switching and missing capabilities do not retain an old device classification', () => {
    const id = '2113929217'
    assert.ok(getUserAvatar(id, snowluma).startsWith('data:'))
    assert.equal(getUserAvatar(id, { name: 'SnowLuma' }), qlogo(id))
    assert.equal(getUserAvatar(id, { name: 'NapCat.Onebot', device_contacts }), qlogo(id))
    assert.ok(getUserAvatar(id, snowluma).startsWith('data:'))
})

test('an explicitly declared device with an unknown icon uses a neutral local fallback', () => {
    for (const kind of ['unknown', 'constructor', '__proto__']) {
        assert.equal(
            getUserAvatar(2113929217, { name: 'SnowLuma', device_contacts: { 2113929217: kind } }),
            getUserAvatar(2113929217, snowluma),
        )
    }
})
