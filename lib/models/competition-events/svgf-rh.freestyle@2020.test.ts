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

    await t.test('throws on incorrect meta.judgeTypeId', () => {
      const judge = mod.difficultyJudge({})
      assert.throws(
        () => judge.calculateJudgeResult({ meta: { ...meta, judgeTypeId: 'P' }, tally: {} }),
        RSRWrongJudgeTypeError
      )
    })
  })
})
