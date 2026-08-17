import assert from 'node:assert'
import test from 'node:test'
import * as mod from './ijru.freestyle.sr@4.0.0.js'
import { type JudgeResult, type EntryMeta, type JudgeMeta } from '../types.js'
import { RSRWrongJudgeTypeError } from '../../errors.js'
import { markGeneratorFactory } from '../../helpers/helpers.test.js'

void test('ijru.freestyle.sr@4.0.0', async t => {
  await t.test('L', async t => {
    for (const [level, points] of [
      [0, 0],
      [0.5, 0.12],
      [1, 0.15],
      [2, 0.23],
      [3, 0.34],
      [4, 0.51],
      [5, 0.76],
      [6, 1.14],
      [7, 1.71],
      [8, 2.56],
    ]) {
      await t.test(`should calculate correct score for L(${level})`, () => {
        assert.strictEqual(mod.L(level), points)
      })
    }
  })

  await t.test('presentationJudge', async t => {
    const meta: JudgeMeta = {
      judgeId: '1',
      judgeTypeId: 'P',
      entryId: '1',
      participantId: '1',
      competitionEvent: 'e.ijru.fs.sr.srif.1.75@4.0.0',
    }
    const judge = mod.presentationJudge

    assert.strictEqual(judge({}).id, 'P')

    await t.test('Throws on incorrect meta.judgeTypeId', () => {
      assert.throws(
        () => judge({}).calculateTally({ meta: { ...meta, judgeTypeId: 'S' }, marks: [] }),
        new RSRWrongJudgeTypeError('S', 'P')
      )
      assert.throws(
        () => judge({}).calculateJudgeResult({ meta: { ...meta, judgeTypeId: 'S' }, tally: { step: 5 } }),
        new RSRWrongJudgeTypeError('S', 'P')
      )
    })

    await t.test('calculates a tally', () => {
      const m = markGeneratorFactory()
      assert.deepStrictEqual(
        judge({}).calculateTally({
          meta,
          marks: [m('entPlus'), m('entPlus'), m('miss'), m('formPlus'), m('musicMinus')],
        }),
        {
          meta,
          tally: {
            ent: 13,
            form: 12,
            music: 10,
            crea: 11,
            vari: 11,

            miss: 1,
          },
        }
      )
    })

    await t.test('calculates a judgeResult', () => {
      assert.deepStrictEqual(
        judge({}).calculateJudgeResult({
          meta,
          tally: {
            ent: 12,
            form: 15,
            music: 25,
            crea: 5,
            vari: 23,

            miss: 2,
          },
        }),
        { meta, result: { nm: 2, p: 15.75 }, statuses: {} }
      )
    })

    await t.test('Correct default values for empty scoresheet', () => {
      assert.deepStrictEqual(
        judge({}).calculateJudgeResult({ meta, tally: {} }),
        { meta, result: { p: 12, nm: 0 }, statuses: {} }
      )
    })
  })

  await t.test('technicalJudge', async t => {
    const meta: JudgeMeta = {
      judgeId: '1',
      judgeTypeId: 'T',
      entryId: '1',
      participantId: '1',
      competitionEvent: 'e.ijru.fs.sr.srif.1.75@4.0.0',
    }
    const judge = mod.technicalJudgeFactory({ discipline: 'sr' })

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

    await t.test('calculates a tally (SR, no interactions)', () => {
      const m = markGeneratorFactory()
      assert.deepStrictEqual(
        judge({}).calculateTally({
          meta,
          marks: [m('miss'), m('miss'), m('rqInteractions')],
        }),
        { meta, tally: { break: 0, miss: 2, spaceViolation: 0, timeViolation: 0 } }
      )
    })

    await t.test('calculates a judge result (SR, no interactions)', () => {
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
        { meta, result: { nb: 4, nm: 3, nv: 3 }, statuses: {} }
      )
    })

    await t.test('calculates a judge result (SR, interactions) with capping', () => {
      assert.deepStrictEqual(
        judge({ interactions: true }).calculateJudgeResult({
          meta,
          tally: {
            rqInteractions: 10,

            break: 2,
            miss: 1,
            timeViolation: 0,
            spaceViolation: 0,
          },
        }),
        { meta, result: { aqI: 0, nb: 2, nm: 1, nv: 0 }, statuses: {} }
      )
    })

    await t.test('Correct default values for empty scoresheet', () => {
      assert.deepStrictEqual(
        judge({}).calculateJudgeResult({ meta, tally: {} }),
        { meta, result: { nb: 0, nm: 0, nv: 0 }, statuses: {} }
      )

      assert.deepStrictEqual(
        judge({ interactions: true }).calculateJudgeResult({ meta, tally: {} }),
        { meta, result: { aqI: 4, nb: 0, nm: 0, nv: 0 }, statuses: {} }
      )
    })
  })

  await t.test('difficultyJudge', async t => {
    const meta: JudgeMeta = {
      judgeId: '1',
      judgeTypeId: 'Dm',
      entryId: '1',
      participantId: '1',
      competitionEvent: 'e.ijru.fs.sr.srif.1.75@4.0.0',
    }
    const judge = mod.difficultyJudgeFactory('Dm', 'Difficulty - Multiples', { discipline: 'sr' })

    assert.strictEqual(judge({}).id, 'Dm')

    await t.test('Throws on incorrect meta.judgeTypeId', () => {
      assert.throws(
        () => judge({}).calculateTally({ meta: { ...meta, judgeTypeId: 'S' }, marks: [] }),
        new RSRWrongJudgeTypeError('S', 'Dm')
      )
      assert.throws(
        () => judge({}).calculateJudgeResult({ meta: { ...meta, judgeTypeId: 'S' }, tally: { step: 5 } }),
        new RSRWrongJudgeTypeError('S', 'Dm')
      )
    })

    await t.test('calculate a tally', () => {
      const m = markGeneratorFactory()
      assert.deepStrictEqual(
        judge({}).calculateTally({
          meta,
          marks: [
            m('diffL0.5'),
            m('diffL1'), m('diffL1'),
            m('diffL2'), m('diffL2'), m('diffL2'),
            m('diffL3'), m('diffL3'), m('diffL3'), m('diffL3'),
            m('diffL4'), m('diffL4'), m('diffL4'), m('diffL4'), m('diffL4'),
            m('diffL5'), m('diffL5'), m('diffL5'), m('diffL5'), m('diffL5'), m('diffL5'),
            m('diffL6'), m('diffL6'), m('diffL6'), m('diffL6'), m('diffL6'), m('diffL6'), m('diffL6'),
            m('diffL7'), m('diffL7'), m('diffL7'), m('diffL7'), m('diffL7'), m('diffL7'), m('diffL7'), m('diffL7'),
            m('diffL8'), m('diffL8'), m('diffL8'), m('diffL8'), m('diffL8'), m('diffL8'), m('diffL8'), m('diffL8'), m('diffL8'),
          ],
        }),
        {
          meta,
          tally: {
            'diffL0.5': 1,
            diffL1: 2,
            diffL2: 3,
            diffL3: 4,
            diffL4: 5,
            diffL5: 6,
            diffL6: 7,
            diffL7: 8,
            diffL8: 9,

            rep: 0,
          },
        }
      )
    })

    await t.test('calculates a judge result', () => {
      assert.deepStrictEqual(
        judge({}).calculateJudgeResult({
          meta,
          tally: {
            'diffL0.5': 1,
            diffL1: 2,
            diffL2: 3,
            diffL3: 4,
            diffL4: 5,
            diffL5: 6,
            diffL6: 7,
            diffL7: 8,
            diffL8: 9,
          },
        }),
        { meta, result: { aqM: 0, d: 54.28 }, statuses: {} }
      )
    })

    await t.test('calculates reqEl deduction config', async t => {
      const judgeScore = { meta, tally: { 'diffL0.5': 0, diffL1: 1, diffL2: 3, diffL3: 1, diffL4: 0, diffL5: 0, diffL6: 0, diffL7: 0, diffL8: 0 } }
      const l1 = judgeScore.tally.diffL1
      const l2 = judgeScore.tally.diffL2
      const l3 = judgeScore.tally.diffL3

      await t.test('default config, partial credit', () => {
        assert.equal(judge({}).calculateJudgeResult(judgeScore).result.aqM, 6 - (l1 + l2) * 0.5 - l3)
      })

      await t.test('maxRqMultiples: 10', () => {
        assert.equal(judge({ maxRqMultiples: 10 }).calculateJudgeResult(judgeScore).result.aqM, 10 - ((l1 + l2) * 0.5) - l3)
      })

      await t.test('rqFullCreditThresholdLevel = 2', () => {
        assert.equal(judge({ rqFullCreditThresholdLevel: 2 }).calculateJudgeResult(judgeScore).result.aqM, 6 - (l1 * 0.5) - l2 - l3)
      })

      await t.test('rqFullCreditThresholdLevel = 0', () => {
        assert.equal(judge({ rqFullCreditThresholdLevel: 0 }).calculateJudgeResult(judgeScore).result.aqM, 6 - (l1 + l2) - l3)
      })
    })

    await t.test('Correct default values for empty scoresheet', () => {
      assert.deepStrictEqual(
        judge({}).calculateJudgeResult({ meta, tally: {} }),
        { meta, result: { aqM: 6, d: 0 }, statuses: {} }
      )
    })
  })

  await t.test('calculateEntry', async t => {
    const jMeta = (jId: string, jTId: string): JudgeMeta => ({
      judgeId: jId,
      judgeTypeId: jTId,
      entryId: '1',
      participantId: '1',
      competitionEvent: 'e.ijru.fs.sr.srif.1.75@4.0.0',
    })
    const eMeta: EntryMeta = {
      entryId: '1',
      participantId: '1',
      competitionEvent: 'e.ijru.fs.sr.srif.1.75@4.0.0',
    }
    {
      const options = {}
      const scores: JudgeResult[] = [
        { meta: jMeta('1', 'P'), result: { p: 20, nm: 2 }, statuses: {} },
        { meta: jMeta('2', 'P'), result: { p: 12, nm: 2 }, statuses: {} },
        { meta: jMeta('21', 'T'), result: { nb: 4, nm: 3, nv: 4 }, statuses: {} },
        { meta: jMeta('21', 'T'), result: { nb: 5, nm: 3, nv: 4 }, statuses: {} },
        { meta: jMeta('31', 'Dm'), result: { d: 10.5, aqM: 1 }, statuses: {} },
        { meta: jMeta('32', 'Dp'), result: { d: 31.22, aqP: 0 }, statuses: {} },
        { meta: jMeta('33', 'Dr'), result: { d: 35, aqR: 2 }, statuses: {} },
      ]
      const result = mod.default.calculateEntry(eMeta, scores, options)
      assert.deepStrictEqual(result, {
        meta: eMeta,
        result: {
          D: 25.57,
          P: 0.8,
          Q: 0.93,
          M: 0.32,
          R: 13.7,

          dM: 10.5,
          dP: 31.22,
          dR: 35,
          qM: 1,
          qP: 0,
          qR: 2,

          am: 3,
          ab: 5,
          av: 4,
          m: 0.225,
          b: 0.25,
          v: 0.2,
        },
        statuses: {},
      })
    }

    await t.test('Can\'t go below 0', () => {
      const options = {}
      const scores: JudgeResult[] = [
        { meta: jMeta('1', 'P'), result: { p: 20, nm: 20 }, statuses: {} },
        { meta: jMeta('2', 'P'), result: { p: 12, nm: 20 }, statuses: {} },
        { meta: jMeta('21', 'T'), result: { nb: 4, nm: 20, nv: 4 }, statuses: {} },
        { meta: jMeta('21', 'T'), result: { nb: 5, nm: 20, nv: 4 }, statuses: {} },
        { meta: jMeta('31', 'Dm'), result: { d: 10.5, aqM: 1 }, statuses: {} },
        { meta: jMeta('32', 'Dp'), result: { d: 31.22, aqP: 0 }, statuses: {} },
        { meta: jMeta('33', 'Dr'), result: { d: 35, aqR: 2 }, statuses: {} },
      ]
      const result = mod.default.calculateEntry(eMeta, scores, options)
      assert.deepStrictEqual(result, {
        meta: eMeta,
        result: {
          D: 25.57,
          P: 0.8,
          Q: 0.93,
          M: 0,
          R: 0,

          dM: 10.5,
          dP: 31.22,
          dR: 35,
          qM: 1,
          qP: 0,
          qR: 2,

          am: 20,
          ab: 5,
          av: 4,
          m: 1.925,
          b: 0.25,
          v: 0.2,
        },
        statuses: {},
      })
    })
  })
})
