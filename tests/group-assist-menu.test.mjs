import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import {
    hasAccountSessionId,
    isSessionMenuTarget,
    toggleAccountSessionId,
} from '../src/renderer/src/function/utils/sessionUtil.ts'

test('isSessionMenuTarget accepts folded groups and friends without new_msg property', () => {
    // Folded group under default config (bubble_sort_user=true, group_notice_type='none') has no new_msg key
    assert.equal(
        isSessionMenuTarget({ group_id: 123456, group_name: 'Default Group' }),
        true,
    )
    // Friend session without new_msg key
    assert.equal(
        isSessionMenuTarget({ user_id: 234567, nickname: 'Friend' }),
        true,
    )
    // Session with explicit new_msg boolean
    assert.equal(
        isSessionMenuTarget({ group_id: 123456, new_msg: false }),
        true,
    )

    // System notice and invalid targets must be rejected
    assert.equal(isSessionMenuTarget(undefined), false)
    assert.equal(isSessionMenuTarget(null), false)
    assert.equal(isSessionMenuTarget({ user_id: -10000 }), false)
    assert.equal(
        isSessionMenuTarget({ user_id: -10000, is_system_notice: true }),
        false,
    )
})

test('toggleAccountSessionId and hasAccountSessionId initialize missing account slots and update safely', () => {
    const emptyDefault = {}

    // First pin / notice enable on fresh default config creates account slot without mutating input
    const step1 = toggleAccountSessionId(emptyDefault, 10001, 888001, true)
    assert.deepEqual(emptyDefault, {})
    assert.deepEqual(step1, { 10001: [888001] })
    assert.equal(hasAccountSessionId(step1, '10001', 888001), true)
    assert.equal(hasAccountSessionId(step1, 10001, '888001'), true)

    // Enabling a second group does not require matching active chat ID and avoids duplicates
    const step2 = toggleAccountSessionId(step1, '10001', 888002, true)
    const step2Dup = toggleAccountSessionId(step2, 10001, 888002, true)
    assert.deepEqual(step2Dup, { 10001: [888001, 888002] })

    // Disabling a non-existent session ID never splices out an existing entry (regression for splice(-1, 1))
    const step3 = toggleAccountSessionId(step2Dup, 10001, 999999, false)
    assert.deepEqual(step3, { 10001: [888001, 888002] })

    // Disabling an enabled group removes only that group
    const step4 = toggleAccountSessionId(step3, 10001, 888001, false)
    assert.deepEqual(step4, { 10001: [888002] })
    assert.equal(hasAccountSessionId(step4, 10001, 888001), false)
    assert.equal(hasAccountSessionId(step4, 10001, 888002), true)

    // Handles null/undefined/non-object maps and isolates different accounts
    const fromNull = toggleAccountSessionId(null, 20002, 777001, true)
    assert.deepEqual(fromNull, { 20002: [777001] })
    assert.equal(hasAccountSessionId(fromNull, 10001, 777001), false)
    assert.equal(hasAccountSessionId(undefined, 20002, 777001), false)
})

test('Messages.vue uses isSessionMenuTarget and toggleAccountSessionId instead of new_msg/show.id bugs', () => {
    const messagesSource = readFileSync(
        new URL('../src/renderer/src/pages/Messages.vue', import.meta.url),
        'utf8',
    )

    assert.doesNotMatch(messagesSource, /'new_msg' in item/)
    assert.doesNotMatch(messagesSource, /topList\.indexOf\(props\.chat\.show\.id\)/)
    assert.match(messagesSource, /isSessionMenuTarget\(item\)/)
    assert.match(messagesSource, /toggleAccountSessionId\(/)
})
