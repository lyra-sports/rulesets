import assert from 'node:assert'
import test from 'node:test'
import * as mod from './svgf.freestyle@3.0.0.js'
import { ijruAverage } from '../../helpers/ijru.js'
import { type JudgeResult, type EntryMeta, type JudgeMeta } from '../types.js'
import { RSRWrongJudgeTypeError } from '../../errors.js'

void test('svgf.freestyle@3.0.0', async t => {
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
    ] as const) {
      await t.test(`should calculate correct score for L(${level})`, () => {
        assert.strictEqual(mod.L(level), points)
      })
    }
  })

  await t.test('ijruAverage', async t => {
    await t.test('Should return undefined for an empty list', () => {
      assert.strictEqual(ijruAverage([]), undefined)
    })

    await t.test('Should return single number', () => {
      assert.strictEqual(ijruAverage([1]), 1)
    })

    await t.test('Should average two numbers', () => {
      assert.strictEqual(ijruAverage([1, 3]), 2)
    })

    await t.test('Should average the closest two of three numbers, when the lower two are closest', () => {
      assert.strictEqual(ijruAverage([1, 10, 3]), 2)
    })

    await t.test('Should average the closest two of three numbers, when the higher two are closest', () => {
      assert.strictEqual(ijruAverage([1, 10, 8]), 9)
    })

    await t.test('Should average the highest two of three numbers, when the numbers are equidistant', () => {
      assert.strictEqual(ijruAverage([1, 1 + 3, 1 + 3 + 3]), 5.5)
    })

    await t.test('Should average all except highest and lowest for four numbers', () => {
      assert.strictEqual(ijruAverage([119, 114, 111, 118]), 116)
    })

    await t.test('Should average all except highest and lowest for five numbers', () => {
      assert.strictEqual(ijruAverage([119, 114, 131, 111, 118]), 117)
    })
  })

  await t.test('routinePresentationJudge', async t => {
    const meta: JudgeMeta = {
      judgeId: '1',
      judgeTypeId: 'Pr',
      entryId: '1',
      participantId: '1',
      competitionEvent: 'e.ijru.fs.sr.srif.1.75@3.0.0',
    }
    const judge = mod.routinePresentationJudge

    assert.strictEqual(judge({}).id, 'Pr')

    await t.test('Throws on incorrect meta.judgeTypeId', () => {
      assert.throws(
        () => judge({}).calculateTally({ meta: { ...meta, judgeTypeId: 'S' }, marks: [] }),
        new RSRWrongJudgeTypeError('S', 'Pr')
      )
      assert.throws(
        () => judge({}).calculateJudgeResult({ meta: { ...meta, judgeTypeId: 'S' }, tally: { step: 5 } }),
        new RSRWrongJudgeTypeError('S', 'Pr')
      )
    })

    await t.test('calculates a tally scoresheet', () => {
      assert.deepStrictEqual(
        judge({}).calculateJudgeResult({
          meta,
          tally: {
            entertainmentPlus: 10,
            entertainmentCheck: 15,
            entertainmentMinus: 3,

            musicalityPlus: 5,
            musicalityCheck: 20,
            musicalityMinus: 10,
          },
        }),
        { meta, result: { aE: 0.1125, aM: -0.064286 }, statuses: {} }
      )
    })

    await t.test('calculates a tally scoresheet with musicality turned off', () => {
      assert.deepStrictEqual(
        judge({ noMusicality: true }).calculateJudgeResult({
          meta,
          tally: {
            entertainmentPlus: 10,
            entertainmentCheck: 15,
            entertainmentMinus: 3,

            musicalityPlus: 5,
            musicalityCheck: 20,
            musicalityMinus: 10,
          },
        }),
        { meta, result: { aE: 0.225, aM: 0 }, statuses: {} }
      )
    })

    await t.test('Correct default values for empty scoresheet', () => {
      assert.deepStrictEqual(
        judge({}).calculateJudgeResult({ meta, tally: {} }),
        { meta, result: { aE: 0, aM: 0 }, statuses: {} }
      )
    })
  })

  await t.test('athletePresentationJudge', async t => {
    const meta: JudgeMeta = {
      judgeId: '1',
      judgeTypeId: 'Pa',
      entryId: '1',
      participantId: '1',
      competitionEvent: 'e.ijru.fs.sr.srif.1.75@3.0.0',
    }
    const judge = mod.athletePresentationJudge

    assert.strictEqual(judge({}).id, 'Pa')

    await t.test('Throws on incorrect meta.judgeTypeId', () => {
      assert.throws(
        () => judge({}).calculateTally({ meta: { ...meta, judgeTypeId: 'S' }, marks: [] }),
        new RSRWrongJudgeTypeError('S', 'Pa')
      )
      assert.throws(
        () => judge({}).calculateJudgeResult({ meta: { ...meta, judgeTypeId: 'S' }, tally: { step: 5 } }),
        new RSRWrongJudgeTypeError('S', 'Pa')
      )
    })

    await t.test('calculates a tally scoresheet', () => {
      assert.deepStrictEqual(
        judge({}).calculateJudgeResult({
          meta,
          tally: {
            formExecutionPlus: 10,
            formExecutionCheck: 15,
            formExecutionMinus: 3,

            miss: 2,
          },
        }),
        { meta, result: { aF: 0.225, m: 2 }, statuses: {} }
      )
    })

    await t.test('Correct default values for empty scoresheet', () => {
      assert.deepStrictEqual(
        judge({}).calculateJudgeResult({ meta, tally: {} }),
        { meta, result: { m: 0, aF: 0 }, statuses: {} }
      )
    })
  })

  await t.test('requiredElementsJudge', async t => {
    const meta: JudgeMeta = {
      judgeId: '1',
      judgeTypeId: 'R',
      entryId: '1',
      participantId: '1',
      competitionEvent: 'e.ijru.fs.sr.srif.1.75@3.0.0',
    }
    const judge = mod.requiredElementsJudge

    assert.strictEqual(judge({}).id, 'R')

    await t.test('Throws on incorrect meta.judgeTypeId', () => {
      assert.throws(
        () => judge({}).calculateTally({ meta: { ...meta, judgeTypeId: 'S' }, marks: [] }),
        new RSRWrongJudgeTypeError('S', 'R')
      )
      assert.throws(
        () => judge({}).calculateJudgeResult({ meta: { ...meta, judgeTypeId: 'S' }, tally: { step: 5 } }),
        new RSRWrongJudgeTypeError('S', 'R')
      )
    })

    await t.test('calculates a tally scoresheet (SR, no interactions) with capping', () => {
      assert.deepStrictEqual(
        judge({}).calculateJudgeResult({
          meta,
          tally: {
            rqGymnasticsPower: 6,
            rqMultiples: 2,
            rqWrapsReleases: 3,

            rqInteractions: 0,

            miss: 2,
            timeViolation: 1,
            spaceViolation: 2,
          },
        }),
        { meta, result: { Q: 0.925, m: 2, v: 3 }, statuses: {} }
      )
    })

    await t.test('calculates a tally scoresheet (SR, interactions)', () => {
      assert.deepStrictEqual(
        judge({ interactions: true }).calculateJudgeResult({
          meta,
          tally: {
            rqGymnasticsPower: 3,
            rqMultiples: 3,
            rqWrapsReleases: 3,
            rqInteractions: 2,

            rqTurnerInvolvement: 0,

            miss: 10,
            timeViolation: 0,
            spaceViolation: 0,
          },
        }),
        { meta, result: { Q: 0.875, m: 10, v: 0 }, statuses: {} }
      )
    })

    await t.test('calculates a tally scoresheet (DD, no interactions) with capping', () => {
      assert.deepStrictEqual(
        judge({ discipline: 'dd' }).calculateJudgeResult({
          meta,
          tally: {
            rqGymnasticsPower: 6,
            rqTurnerInvolvement: 4,

            rqMultiples: 2,
            rqWrapsReleases: 3,
            rqInteractions: 0,

            miss: 200,
            timeViolation: 0,
            spaceViolation: 1,
          },
        }),
        { meta, result: { Q: 1, m: 200, v: 1 }, statuses: {} }
      )
    })

    await t.test('calculates a tally scoresheet (DD, interactions)', () => {
      assert.deepStrictEqual(
        judge({ interactions: true, discipline: 'dd' }).calculateJudgeResult({
          meta,
          tally: {
            rqGymnasticsPower: 6,
            rqTurnerInvolvement: 4,
            rqInteractions: 0,

            rqMultiples: 2,
            rqWrapsReleases: 3,

            miss: 10,
            timeViolation: 0,
            spaceViolation: 0,
          },
        }),
        { meta, result: { Q: 0.9, m: 10, v: 0 }, statuses: {} }
      )
    })

    await t.test('Correct default values for empty scoresheet', () => {
      assert.deepStrictEqual(
        judge({}).calculateJudgeResult({ meta, tally: {} }),
        { meta, result: { Q: 0.7, m: 0, v: 0 }, statuses: {} }
      )

      assert.deepStrictEqual(
        judge({ interactions: true }).calculateJudgeResult({ meta, tally: {} }),
        { meta, result: { Q: 0.6, m: 0, v: 0 }, statuses: {} }
      )

      assert.deepStrictEqual(
        judge({ discipline: 'dd' }).calculateJudgeResult({ meta, tally: {} }),
        { meta, result: { Q: 0.8, m: 0, v: 0 }, statuses: {} }
      )

      assert.deepStrictEqual(
        judge({ interactions: true, discipline: 'dd' }).calculateJudgeResult({ meta, tally: {} }),
        { meta, result: { Q: 0.7, m: 0, v: 0 }, statuses: {} }
      )
    })
  })

  await t.test('difficultyJudge', async t => {
    const meta: JudgeMeta = {
      judgeId: '1',
      judgeTypeId: 'D',
      entryId: '1',
      participantId: '1',
      competitionEvent: 'e.ijru.fs.sr.srif.1.75@3.0.0',
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

    await t.test('calculates a tally scoresheet', () => {
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
        { meta, result: { D: 54.28 }, statuses: {} }
      )
    })

    await t.test('Correct default values for empty scoresheet', () => {
      assert.deepStrictEqual(
        judge({}).calculateJudgeResult({ meta, tally: {} }),
        { meta, result: { D: 0 }, statuses: {} }
      )
    })
  })

  await t.test('calculateEntry', async t => {
    const jMeta = (jId: string, jTId: string): JudgeMeta => ({
      judgeId: jId,
      judgeTypeId: jTId,
      entryId: '1',
      participantId: '1',
      competitionEvent: 'e.ijru.fs.sr.srif.1.75@3.0.0',
    })
    const eMeta: EntryMeta = {
      entryId: '1',
      participantId: '1',
      competitionEvent: 'e.ijru.fs.sr.srif.1.75@3.0.0',
    }
    {
      const options = {}
      const scores: JudgeResult[] = [
        { meta: jMeta('1', 'Pr'), result: { aE: 0.1125, aM: -0.064286 }, statuses: {} },
        { meta: jMeta('2', 'Pr'), result: { aE: -0.87, aM: -0.12 }, statuses: {} },
        { meta: jMeta('11', 'Pa'), result: { aF: 1.12, m: 3 }, statuses: {} },
        { meta: jMeta('12', 'Pa'), result: { aF: 1.15, m: 3 }, statuses: {} },
        { meta: jMeta('21', 'R'), result: { Q: 0.925, m: 2, v: 2 }, statuses: {} },
        { meta: jMeta('22', 'R'), result: { Q: 0.9, m: 3, v: 2 }, statuses: {} },
        { meta: jMeta('31', 'D'), result: { D: 10.5 }, statuses: {} },
        { meta: jMeta('32', 'D'), result: { D: 31.22 }, statuses: {} },
        { meta: jMeta('33', 'D'), result: { D: 35 }, statuses: {} },
      ]
      const result = mod.default.calculateEntry(eMeta, scores, options)
      assert.deepStrictEqual(result, {
        meta: eMeta,
        result: {
          D: 33.11,
          M: 0.73,
          P: 1.66,
          Q: 0.91,
          R: 36.51,
          m: 0.225,
          v: 0.05,
          aE: -0.37875,
          aF: 1.135,
          aM: -0.092143,
        },
        statuses: {},
      })
    }

    await t.test('Can\'t go below 0', () => {
      const options = {}
      const scores: JudgeResult[] = [
        { meta: jMeta('1', 'Pr'), result: { aE: 0.1125, aM: -0.064286 }, statuses: {} },
        { meta: jMeta('2', 'Pr'), result: { aE: -0.87, aM: -0.12 }, statuses: {} },
        { meta: jMeta('11', 'Pa'), result: { aF: 1.12, m: 20 }, statuses: {} },
        { meta: jMeta('12', 'Pa'), result: { aF: 1.15, m: 20 }, statuses: {} },
        { meta: jMeta('21', 'R'), result: { Q: 0.925, m: 20, v: 2 }, statuses: {} },
        { meta: jMeta('22', 'R'), result: { Q: 0.9, m: 20, v: 2 }, statuses: {} },
        { meta: jMeta('31', 'D'), result: { D: 10.5 }, statuses: {} },
        { meta: jMeta('32', 'D'), result: { D: 31.22 }, statuses: {} },
        { meta: jMeta('33', 'D'), result: { D: 35 }, statuses: {} },
      ]
      const result = mod.default.calculateEntry(eMeta, scores, options)
      assert.deepStrictEqual(result, {
        meta: eMeta,
        result: {
          D: 33.11,
          M: 0,
          P: 1.66,
          Q: 0.91,
          R: 0,
          m: 1.925,
          v: 0.05,
          aE: -0.37875,
          aF: 1.135,
          aM: -0.092143,
        },
        statuses: {},
      })
    })
  })
})
