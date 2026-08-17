import assert from 'node:assert'
import test from 'node:test'
import * as mod from './ijru.freestyle@2.0.0.js'

void test('ijru.freestyle@2.0.0', async t => {
  await t.test('L', async t => {
    for (const [level, points] of [
      [0, 0],
      [0.5, 0.13],
      [1, 0.18],
      [2, 0.32],
      [3, 0.58],
      [4, 1.05],
      [5, 1.89],
      [6, 3.40],
      [7, 6.12],
      [8, 11.02],
    ] as const) {
      await t.test(`should calculate correct score for L(${level})`, () => {
        assert.strictEqual(mod.L(level), points)
      })
    }
  })
})
