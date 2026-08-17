import assert from 'node:assert'
import test from 'node:test'
import * as mod from './svgf-rh.freestyle@2020.js'
import { type JudgeMeta } from '../types.js'
import { RSRWrongJudgeTypeError } from '../../errors.js'

void test('svgf-rh.freestyle@2020', async t => {
  await t.test('presentationJudge', async t => {
    const meta: JudgeMeta = {
      judgeId: '1',
      judgeTypeId: 'P',
      entryId: '1',
      participantId: '1',
      competitionEvent: 'e.svgf.fs.sr.srif-rh.1.75@2020',
    }

    await t.test('calculates a judge result', () => {
      const judge = mod.presentationJudge({})
      const result = judge.calculateJudgeResult({
        meta,
        tally: { musicOnBeat: 8, usingMusic: 7, movement: 6, formExecution: 5, impression: 9, miss: 4 },
      })
      assert.deepStrictEqual(result, {
        meta,
        result: { P: 39 },
        statuses: {},
      })
    })

    await t.test('calculates a judge result (DD)', () => {
      const judge = mod.presentationJudge({ discipline: 'dd' })
      const result = judge.calculateJudgeResult({
        meta,
        tally: { musicOnBeat: 8, interactions: 5, movement: 7, formExecution: 6, impression: 9, miss: 4 },
      })
      assert.deepStrictEqual(result, {
        meta,
        result: { P: 39 },
        statuses: {},
      })
    })

    await t.test('throws on incorrect meta.judgeTypeId', () => {
      const judge = mod.presentationJudge({})
      assert.throws(
        () => judge.calculateJudgeResult({ meta: { ...meta, judgeTypeId: 'D' }, tally: {} }),
        RSRWrongJudgeTypeError
      )
    })
  })

  await t.test('difficultyJudge', async t => {
    const meta: JudgeMeta = {
      judgeId: '1',
      judgeTypeId: 'D',
      entryId: '1',
      participantId: '1',
      competitionEvent: 'e.svgf.fs.sr.srif-rh.1.75@2020',
    }

    await t.test('calculates a judge result', () => {
      const judge = mod.difficultyJudge({})
      const result = judge.calculateJudgeResult({
        meta,
        tally: { 'diffL0.5': 2, diffL1: 3, diffL2: 1 },
      })
      assert.deepStrictEqual(result, {
        meta,
        result: { D: 5.5 },
        statuses: {},
      })
    })

    await t.test('throws on incorrect meta.judgeTypeId', () => {
      const judge = mod.difficultyJudge({})
      assert.throws(
        () => judge.calculateJudgeResult({ meta: { ...meta, judgeTypeId: 'P' }, tally: {} }),
        RSRWrongJudgeTypeError
      )
    })
  })
})
