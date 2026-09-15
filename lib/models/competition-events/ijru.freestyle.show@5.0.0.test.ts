import assert from 'node:assert'
import test from 'node:test'
import * as mod from './ijru.freestyle.show@5.0.0.js'
import { type JudgeResult, type EntryMeta, type EntryResult, type JudgeMeta } from '../types.js'
import { RSRWrongJudgeTypeError } from '../../errors.js'
import { markGeneratorFactory } from '../../helpers/helpers.test.js'

void test('ijru.freestyle.show@5.0.0', async t => {
  await t.test('L', async t => {
    for (const [level, points] of [
      [0, 0],
      [0.5, 1.22],
      [1, 1.5],
      [2, 2.25],
      [3, 3.38],
      [4, 5.06],
      [5, 7.59],
    ] as const) {
      await t.test(`should calculate correct score for L(${level})`, () => {
        assert.strictEqual(mod.L(level), points)
      })
    }
  })

  await t.test('technicalJudge', async t => {
    const meta: JudgeMeta = {
      judgeId: '1',
      judgeTypeId: 'T',
      entryId: '1',
      participantId: '1',
      competitionEvent: 'e.ijru.fs.ts.sctf.8.300@5.0.0',
    }
    const judge = mod.technicalJudge

    assert.strictEqual(judge({}).id, 'T')

    await t.test('Throws on incorrect meta.judgeTypeId', () => {
      assert.throws(
        () => judge({}).calculateTally({ meta: { ...meta, judgeTypeId: 'S' }, marks: [] }),
        new RSRWrongJudgeTypeError('S', 'T')
      )
      assert.throws(
        () => judge({}).calculateJudgeResult({ meta: { ...meta, judgeTypeId: 'S' }, tally: { step: 5 } }),
        new RSRWrongJudgeTypeError('S', 'T')
      )
    })

    await t.test('calculates a tally', () => {
      const m = markGeneratorFactory()
      assert.deepStrictEqual(
        judge({}).calculateTally({
          meta,
          marks: [m('miss'), m('miss'), m('rqSingleRope')],
        }),
        {
          meta,
          tally: {
            miss: 2,
            timeViolation: 0,
            rqSingleRope: 1,
            rqDoubleDutch: 0,
            rqWheel: 0,
            rqLongRope: 0,
            rqTraveller: 0,
          },
        }
      )
    })

    await t.test('calculates a judge result', () => {
      assert.deepStrictEqual(
        judge({}).calculateJudgeResult({
          meta,
          tally: {
            miss: 3,
            timeViolation: 1,
            rqSingleRope: 1,
            rqDoubleDutch: 1,
            rqWheel: 0,
            rqLongRope: 2,
            rqTraveller: 0,
          },
        }),
        { meta, result: { nm: 3, nv: 1, aq: 2 }, statuses: {} }
      )
    })

    await t.test('Correct default values for empty scoresheet', () => {
      assert.deepStrictEqual(
        judge({}).calculateJudgeResult({ meta, tally: {} }),
        { meta, result: { nm: 0, nv: 0, aq: 5 }, statuses: {} }
      )
    })
  })

  await t.test('difficultyJudge', async t => {
    const meta: JudgeMeta = {
      judgeId: '1',
      judgeTypeId: 'D',
      entryId: '1',
      participantId: '1',
      competitionEvent: 'e.ijru.fs.ts.sctf.8.300@5.0.0',
    }
    const judge = mod.difficultyJudge

    assert.strictEqual(judge({}).id, 'D')

    await t.test('Throws on incorrect meta.judgeTypeId', () => {
      assert.throws(
        () => judge({}).calculateTally({ meta: { ...meta, judgeTypeId: 'S' }, marks: [] }),
        new RSRWrongJudgeTypeError('S', 'D')
      )
      assert.throws(
        () => judge({}).calculateJudgeResult({ meta: { ...meta, judgeTypeId: 'S' }, tally: { step: 5 } }),
        new RSRWrongJudgeTypeError('S', 'D')
      )
    })

    await t.test('calculate a tally', () => {
      const m = markGeneratorFactory()
      assert.deepStrictEqual(
        judge({}).calculateTally({
          meta,
          marks: [
            m('diffL1'), m('diffL1'),
            m('diffL2'), m('diffL2'), m('diffL2'),
            m('diffL3'), m('diffL3'), m('diffL3'), m('diffL3'),
            m('diffL4'), m('diffL4'), m('diffL4'), m('diffL4'), m('diffL4'),
            m('diffL5'), m('diffL5'), m('diffL5'), m('diffL5'), m('diffL5'), m('diffL5'),
            m('diffL0'), m('diffL0'),
            m('diffL1'), m('diffPlus'),
            m('diffL5'), m('diffMinus'),
          ],
        }),
        {
          meta,
          tally: {
            diffL1Minus: 0,
            diffL1: 2,
            diffL1Plus: 1,

            diffL2Minus: 0,
            diffL2: 3,
            diffL2Plus: 0,

            diffL3Minus: 0,
            diffL3: 4,
            diffL3Plus: 0,

            diffL4Minus: 0,
            diffL4: 5,
            diffL4Plus: 0,

            diffL5Minus: 1,
            diffL5: 6,
            diffL5Plus: 0,

            diffL0: 2,
          },
        }
      )
    })

    await t.test('calculates a judge result', () => {
      assert.deepStrictEqual(
        judge({}).calculateJudgeResult({
          meta,
          tally: {
            diffL0: 2,
            diffL1: 2,
            diffL2: 3,
            diffL3: 4,
            diffL4: 5,
            diffL5: 6,

            diffL1Plus: 1,
            diffL5Minus: 1,
          },
        }),
        { meta, result: { d: 4.28375 }, statuses: {} }
      )
    })

    await t.test('Correct default values for empty scoresheet', () => {
      assert.deepStrictEqual(
        judge({}).calculateJudgeResult({ meta, tally: {} }),
        { meta, result: { d: 0 }, statuses: {} }
      )
    })
  })

  await t.test('calculateEntry', async t => {
    const jMeta = (jId: string, jTId: string): JudgeMeta => ({
      judgeId: jId,
      judgeTypeId: jTId,
      entryId: '1',
      participantId: '1',
      competitionEvent: 'e.ijru.fs.ts.sctf.8.300@5.0.0',
    })
    const eMeta: EntryMeta = {
      entryId: '1',
      participantId: '1',
      competitionEvent: 'e.ijru.fs.ts.sctf.8.300@5.0.0',
    }
    {
      const options = {}
      const scores: JudgeResult[] = [
        { meta: jMeta('1', 'P'), result: { p: 20, nm: 2 }, statuses: {} },
        { meta: jMeta('2', 'P'), result: { p: 12, nm: 2 }, statuses: {} },
        { meta: jMeta('21', 'T'), result: { nm: 3, nv: 4, aq: 0 }, statuses: {} },
        { meta: jMeta('21', 'T'), result: { nm: 3, nv: 4, aq: 2 }, statuses: {} },
        { meta: jMeta('31', 'D'), result: { d: 8.5 }, statuses: {} },
        { meta: jMeta('32', 'D'), result: { d: 5.55 }, statuses: {} },
      ]
      const result = mod.default.calculateEntry(eMeta, scores, options)
      assert.deepStrictEqual(result, {
        meta: eMeta,
        result: {
          D: 7.03,
          P: 0.8,
          Q: 0.95,
          M: 0.74,
          R: 8.9,

          am: 3,
          av: 4,
          m: 0.06,
          v: 0.2,
          q: 0.05,
        },
        statuses: {},
      })
    }

    await t.test('Can\'t go below 0', () => {
      const options = {}
      const scores: JudgeResult[] = [
        { meta: jMeta('1', 'P'), result: { p: 20, nm: 50 }, statuses: {} },
        { meta: jMeta('2', 'P'), result: { p: 12, nm: 50 }, statuses: {} },
        { meta: jMeta('21', 'T'), result: { nm: 50, nv: 10, aq: 5 }, statuses: {} },
        { meta: jMeta('21', 'T'), result: { nm: 50, nv: 10, aq: 5 }, statuses: {} },
        { meta: jMeta('31', 'D'), result: { d: 8.5 }, statuses: {} },
        { meta: jMeta('32', 'D'), result: { d: 5.55 }, statuses: {} },
      ]
      const result = mod.default.calculateEntry(eMeta, scores, options)
      assert.deepStrictEqual(result, {
        meta: eMeta,
        result: {
          D: 7.03,
          P: 0.8,
          Q: 0.75,
          M: 0,
          R: 0,

          am: 50,
          av: 10,
          m: 1,
          v: 0.5,
          q: 0.25,
        },
        statuses: {},
      })
    })

    await t.test('returns undefined when the difficulty judge type has no results', () => {
      const scores: JudgeResult[] = [
        { meta: jMeta('1', 'P'), result: { p: 20, nm: 2 }, statuses: {} },
        { meta: jMeta('21', 'T'), result: { nm: 3, nv: 4, aq: 0 }, statuses: {} },
      ]
      assert.strictEqual(mod.default.calculateEntry(eMeta, scores, {}), undefined)
    })

    await t.test('returns undefined when the presentation judge has no results', () => {
      const scores: JudgeResult[] = [
        { meta: jMeta('21', 'T'), result: { nm: 3, nv: 4, aq: 0 }, statuses: {} },
        { meta: jMeta('31', 'D'), result: { d: 8.5 }, statuses: {} },
      ]
      assert.strictEqual(mod.default.calculateEntry(eMeta, scores, {}), undefined)
    })

    await t.test('returns undefined when the technical judge has no results', () => {
      const scores: JudgeResult[] = [
        { meta: jMeta('1', 'P'), result: { p: 20, nm: 2 }, statuses: {} },
        { meta: jMeta('31', 'D'), result: { d: 8.5 }, statuses: {} },
      ]
      assert.strictEqual(mod.default.calculateEntry(eMeta, scores, {}), undefined)
    })
  })

  await t.test('rankEntries', async t => {
    const rMeta = (id: string): EntryMeta => ({
      entryId: id,
      participantId: id,
      competitionEvent: 'e.ijru.fs.ts.sctf.8.300@5.0.0',
    })

    await t.test('ranks and normalises', () => {
      const scores: EntryResult[] = [
        { meta: rMeta('1'), result: { D: 10, P: 0.5, M: 1, Q: 0.75, R: 15 }, statuses: {} },
        { meta: rMeta('2'), result: { D: 14, P: 0.5, M: 1, Q: 0.95, R: 21 }, statuses: {} },
      ]
      const result = mod.default.rankEntries(scores, {})
      assert.deepStrictEqual(result.map(el => ({ entryId: el.meta.entryId, S: el.result.S, N: el.result.N })), [
        { entryId: '2', S: 1, N: 100 },
        { entryId: '1', S: 2, N: 1 },
      ])
    })

    await t.test('when the whole field ties every entry keeps the minimum normalised score', () => {
      const scores: EntryResult[] = [
        { meta: rMeta('1'), result: { D: 10, P: 0.5, M: 1, Q: 0.75, R: 15 }, statuses: {} },
        { meta: rMeta('2'), result: { D: 10, P: 0.5, M: 1, Q: 0.75, R: 15 }, statuses: {} },
      ]
      const result = mod.default.rankEntries(scores, {})
      assert.deepStrictEqual(result.map(el => ({ entryId: el.meta.entryId, S: el.result.S, N: el.result.N })), [
        { entryId: '1', S: 1, N: 1 },
        { entryId: '2', S: 1, N: 1 },
      ])
    })
  })
})
