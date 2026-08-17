import assert from 'node:assert'
import test from 'node:test'
import * as mod from './ijru.freestyle@2.0.0.js'
import { type JudgeResult, type EntryMeta, type EntryResult, type JudgeMeta } from '../types.js'

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

  await t.test('calculateEntry', async t => {
    const jMeta = (jId: string, jTId: string): JudgeMeta => ({
      judgeId: jId,
      judgeTypeId: jTId,
      entryId: '1',
      participantId: '1',
      competitionEvent: 'e.ijru.fs.sr.srif.1.75@2.0.0',
    })
    const eMeta: EntryMeta = {
      entryId: '1',
      participantId: '1',
      competitionEvent: 'e.ijru.fs.sr.srif.1.75@2.0.0',
    }

    await t.test('calculates an entry result', () => {
      const scores: JudgeResult[] = [
        { meta: jMeta('1', 'Pr'), result: { aE: 0.1125, aM: -0.064286 }, statuses: {} },
        { meta: jMeta('2', 'Pr'), result: { aE: -0.87, aM: -0.12 }, statuses: {} },
        { meta: jMeta('11', 'Pa'), result: { aF: 1.12, m: 0.95 }, statuses: {} },
        { meta: jMeta('12', 'Pa'), result: { aF: 1.15, m: 0.925 }, statuses: {} },
        { meta: jMeta('21', 'R'), result: { Q: 0.925, m: 0.95, v: 0.925, U: 1.822 }, statuses: {} },
        { meta: jMeta('22', 'R'), result: { Q: 0.9, m: 0.975, v: 0.975, U: 2.033 }, statuses: {} },
        { meta: jMeta('31', 'D'), result: { D: 10.5 }, statuses: {} },
        { meta: jMeta('32', 'D'), result: { D: 31.22 }, statuses: {} },
        { meta: jMeta('33', 'D'), result: { D: 35 }, statuses: {} },
      ]
      const result = mod.default.calculateEntry(eMeta, scores, {})
      assert.deepStrictEqual(result, {
        meta: eMeta,
        result: {
          D: 33.11,
          M: 0.9,
          P: 1.66,
          Q: 0.91,
          U: 1.93,
          R: 42.39,
          m: 0.95,
          v: 0.95,
          aE: -0.37875,
          aF: 1.135,
          aM: -0.092143,
        },
        statuses: {},
      })
    })

    await t.test('returns undefined when a judge type has no results', () => {
      const scores: JudgeResult[] = [
        { meta: jMeta('1', 'Pr'), result: { aE: 0.1125, aM: -0.064286 }, statuses: {} },
        { meta: jMeta('11', 'Pa'), result: { aF: 1.12, m: 0.95 }, statuses: {} },
        { meta: jMeta('21', 'R'), result: { Q: 0.925, m: 0.95, v: 0.925, U: 1.822 }, statuses: {} },
      ]
      assert.strictEqual(mod.default.calculateEntry(eMeta, scores, {}), undefined)
    })
  })

  await t.test('rankEntries', async t => {
    const rMeta = (id: string): EntryMeta => ({
      entryId: id,
      participantId: id,
      competitionEvent: 'e.ijru.fs.sr.srif.1.75@2.0.0',
    })

    await t.test('ranks and normalises', () => {
      const scores: EntryResult[] = [
        { meta: rMeta('1'), result: { D: 20, U: 0, P: 1.1, Q: 1, M: 1, R: 22 }, statuses: {} },
        { meta: rMeta('2'), result: { D: 30, U: 0, P: 1.1, Q: 1, M: 1, R: 33 }, statuses: {} },
      ]
      const result = mod.default.rankEntries(scores, {})
      assert.deepStrictEqual(result.map(el => ({ entryId: el.meta.entryId, S: el.result.S, N: el.result.N })), [
        { entryId: '2', S: 1, N: 100 },
        { entryId: '1', S: 2, N: 1 },
      ])
    })

    await t.test('when the whole field ties every entry keeps the minimum normalised score', () => {
      const scores: EntryResult[] = [
        { meta: rMeta('1'), result: { D: 20, U: 0, P: 1.1, Q: 1, M: 1, R: 22 }, statuses: {} },
        { meta: rMeta('2'), result: { D: 20, U: 0, P: 1.1, Q: 1, M: 1, R: 22 }, statuses: {} },
      ]
      const result = mod.default.rankEntries(scores, {})
      assert.deepStrictEqual(result.map(el => ({ entryId: el.meta.entryId, S: el.result.S, N: el.result.N })), [
        { entryId: '1', S: 1, N: 1 },
        { entryId: '2', S: 1, N: 1 },
      ])
    })
  })
})
