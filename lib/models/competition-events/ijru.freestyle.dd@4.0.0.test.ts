import assert from 'node:assert'
import test from 'node:test'
import * as mod from './ijru.freestyle.dd@4.0.0.js'
import * as srMod from './ijru.freestyle.sr@4.0.0.js'
import { type JudgeResult, type EntryMeta, type JudgeMeta } from '../types.js'
import { RSRMissingJudgeResultError, RSRWrongJudgeTypeError } from '../../errors.js'
import { markGeneratorFactory } from '../../helpers/helpers.test.js'

void test('ijru.freestyle.dd@4.0.0', async t => {
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
      competitionEvent: 'e.ijru.fs.dd.ddpf.4.75@4.0.0',
    }
    const judge = srMod.technicalJudgeFactory({ discipline: 'dd' })

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

    await t.test('calculates a tally (DD)', () => {
      const m = markGeneratorFactory()
      assert.deepStrictEqual(
        judge({}).calculateTally({
          meta,
          marks: [m('miss'), m('miss'), m('rqInteractions')],
        }),
        { meta, tally: { miss: 2, spaceViolation: 0, timeViolation: 0 } }
      )
    })

    await t.test('calculates a judge result (DD)', () => {
      assert.deepStrictEqual(
        judge({}).calculateJudgeResult({
          meta,
          tally: {
            break: 4,
            miss: 3,
            timeViolation: 1,
            spaceViolation: 2,
          },
        }),
        { meta, result: { nm: 3, nv: 3 }, statuses: {} }
      )
    })

    await t.test('Correct default values for empty scoresheet', () => {
      assert.deepStrictEqual(
        judge({}).calculateJudgeResult({ meta, tally: {} }),
        { meta, result: { nm: 0, nv: 0 }, statuses: {} }
      )

      assert.deepStrictEqual(
        judge({ interactions: true }).calculateJudgeResult({ meta, tally: {} }),
        { meta, result: { nm: 0, nv: 0 }, statuses: {} }
      )
    })
  })

  await t.test('difficultyJumperJudge', async t => {
    const meta: JudgeMeta = {
      judgeId: '1',
      judgeTypeId: 'Dj',
      entryId: '1',
      participantId: '1',
      competitionEvent: 'e.ijru.fs.dd.ddpf.4.75@4.0.0',
    }
    const judge = mod.difficultyJumperJudge

    assert.strictEqual(judge({}).id, 'Dj')

    await t.test('Throws on incorrect meta.judgeTypeId', () => {
      assert.throws(
        () => judge({}).calculateTally({ meta: { ...meta, judgeTypeId: 'S' }, marks: [] }),
        new RSRWrongJudgeTypeError('S', 'Dj')
      )
      assert.throws(
        () => judge({}).calculateJudgeResult({ meta: { ...meta, judgeTypeId: 'S' }, tally: { step: 5 } }),
        new RSRWrongJudgeTypeError('S', 'Dj')
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
            m('break'), m('break'),
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

            break: 2,
          },
        }
      )
    })

    await t.test('calculates a judge result', () => {
      assert.deepStrictEqual(
        judge({}).calculateJudgeResult({
          meta,
          tally: {
            diffL1: 2,
            diffL2: 3,
            diffL3: 4,
            diffL4: 5,
            diffL5: 6,
            break: 2,
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

  await t.test('difficultyTurnerJudge', async t => {
    const meta: JudgeMeta = {
      judgeId: '1',
      judgeTypeId: 'Dt',
      entryId: '1',
      participantId: '1',
      competitionEvent: 'e.ijru.fs.dd.ddpf.4.75@4.0.0',
    }
    const judge = mod.difficultyTurnerJudge

    assert.strictEqual(judge({}).id, 'Dt')

    await t.test('Throws on incorrect meta.judgeTypeId', () => {
      assert.throws(
        () => judge({}).calculateTally({ meta: { ...meta, judgeTypeId: 'S' }, marks: [] }),
        new RSRWrongJudgeTypeError('S', 'Dt')
      )
      assert.throws(
        () => judge({}).calculateJudgeResult({ meta: { ...meta, judgeTypeId: 'S' }, tally: { step: 5 } }),
        new RSRWrongJudgeTypeError('S', 'Dt')
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
          },
        }
      )
    })

    await t.test('calculates a judge result', () => {
      assert.deepStrictEqual(
        judge({}).calculateJudgeResult({
          meta,
          tally: {
            diffL1: 2,
            diffL1Plus: 1,
            diffL2: 3,
            diffL3: 4,
            diffL4: 5,
            diffL5: 6,
            diffL5Minus: 1,
          },
        }),
        { meta, result: { d: 4.990499999999999 }, statuses: {} }
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
      competitionEvent: 'e.ijru.fs.dd.ddpf.4.75@4.0.0',
    })
    const eMeta: EntryMeta = {
      entryId: '1',
      participantId: '1',
      competitionEvent: 'e.ijru.fs.dd.ddpf.4.75@4.0.0',
    }
    {
      const options = {}
      const scores: JudgeResult[] = [
        { meta: jMeta('1', 'P'), result: { p: 20, nm: 2 }, statuses: {} },
        { meta: jMeta('2', 'P'), result: { p: 12, nm: 2 }, statuses: {} },
        { meta: jMeta('21', 'T'), result: { nm: 3, nv: 4 }, statuses: {} },
        { meta: jMeta('21', 'T'), result: { nm: 3, nv: 4 }, statuses: {} },
        { meta: jMeta('31', 'Dj'), result: { d: 8.5 }, statuses: {} },
        { meta: jMeta('32', 'Dj'), result: { d: 5.55 }, statuses: {} },
        { meta: jMeta('41', 'Dt'), result: { d: 4.7 }, statuses: {} },
        { meta: jMeta('42', 'Dt'), result: { d: 4.5 }, statuses: {} },
      ]
      const result = mod.default.calculateEntry(eMeta, scores, options)
      assert.deepStrictEqual(result, {
        meta: eMeta,
        result: {
          D: 14.44,
          P: 0.53,
          M: 0.57,
          R: 12.59,

          Dj: 7.03,
          Dt: 4.6,

          am: 3,
          av: 4,
          m: 0.225,
          v: 0.2,
        },
        statuses: {},
      })
    }

    await t.test('Can\'t go below 0', () => {
      const options = {}
      const scores: JudgeResult[] = [
        { meta: jMeta('1', 'P'), result: { p: 20, nm: 10 }, statuses: {} },
        { meta: jMeta('2', 'P'), result: { p: 12, nm: 10 }, statuses: {} },
        { meta: jMeta('21', 'T'), result: { nm: 10, nv: 4 }, statuses: {} },
        { meta: jMeta('21', 'T'), result: { nm: 10, nv: 4 }, statuses: {} },
        { meta: jMeta('31', 'Dj'), result: { d: 8.5 }, statuses: {} },
        { meta: jMeta('32', 'Dj'), result: { d: 5.55 }, statuses: {} },
        { meta: jMeta('41', 'Dt'), result: { d: 4.7 }, statuses: {} },
        { meta: jMeta('42', 'Dt'), result: { d: 4.5 }, statuses: {} },
      ]
      const result = mod.default.calculateEntry(eMeta, scores, options)
      assert.deepStrictEqual(result, {
        meta: eMeta,
        result: {
          D: 14.44,
          P: 0.53,
          M: 0,
          R: 0,

          Dj: 7.03,
          Dt: 4.6,

          am: 10,
          av: 4,
          m: 0.925,
          v: 0.2,
        },
        statuses: {},
      })
    })

    await t.test('throws when a judge type has no results', () => {
      const scores: JudgeResult[] = [
        { meta: jMeta('1', 'P'), result: { p: 20, nm: 2 }, statuses: {} },
        { meta: jMeta('21', 'T'), result: { nm: 3, nv: 4 }, statuses: {} },
        { meta: jMeta('31', 'Dj'), result: { d: 8.5 }, statuses: {} },
      ]
      assert.throws(() => mod.default.calculateEntry(eMeta, scores, {}), RSRMissingJudgeResultError)
    })
  })
})
