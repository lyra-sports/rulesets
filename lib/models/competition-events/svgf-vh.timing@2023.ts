import { RSRWrongJudgeTypeError } from '../../errors.js'
import type { MarkReducer } from '../../helpers/helpers.js'
import { normaliseTally, matchMeta, roundTo, roundToCurry, createMarkReducer, calculateTallyFactory } from '../../helpers/helpers.js'
import type { CompetitionEventModel, GenericMark, JudgeTypeGetter, ScoreTally, TableDefinition } from '../types.js'
import { average } from './svgf-vh.speed@2023.js'

type Option = never

// ======
// JUDGES
// ======
  type MarkSchema = 'start' | 'pause'
  type TallySchema = 'seconds'
export const timingJudge: JudgeTypeGetter<Option, MarkSchema, TallySchema> = options => {
  const markDefinitions = [{
    schema: 'start',
    name: 'Start Timer',
  }, {
    schema: 'pause',
    name: 'Pause Timer',
  }] as const
  const tallyDefinitions = [{
    schema: 'seconds',
    name: 'Seconds',
    min: 0,
    step: 1,
  }] as const

  const reducer: MarkReducer<MarkSchema, TallySchema> = (tally, mark, marks) => {
    if (mark.schema === 'pause') {
      let lastStartMark: GenericMark<MarkSchema> | undefined
      for (let idx = marks.length - 1; idx >= 0; idx--) {
        if (marks[idx]?.schema === 'pause') break
        else if (marks[idx]?.schema === 'start') lastStartMark = marks[idx]
      }
      if (lastStartMark != null) {
        tally.seconds += Math.round((mark.timestamp - lastStartMark.timestamp) / 1000)
      }
    }
    return tally
  }

  const id = 'T'
  return {
    id,
    name: 'Timing',
    markDefinitions,
    tallyDefinitions,
    statusDefinitions: [],
    createMarkReducer: () => createMarkReducer(reducer, tallyDefinitions),
    calculateTally: calculateTallyFactory(id, reducer, tallyDefinitions),
    calculateJudgeResult: scsh => {
      if (!matchMeta(scsh.meta, { judgeTypeId: id })) throw new RSRWrongJudgeTypeError(scsh.meta.judgeTypeId, id)
      const tally: ScoreTally<(typeof tallyDefinitions)[number]['schema']> = normaliseTally(tallyDefinitions, scsh.tally)
      return {
        meta: scsh.meta,
        result: {
          t: tally.seconds ?? Infinity,
        },
        statuses: {},
      }
    },
  }
}

// ======
// TABLES
// ======
export const timingPreviewTableHeaders: TableDefinition = {
  headers: [
    { text: 'Seconds (t)', key: 't', formatter: roundToCurry(2) },
    { text: 'Result (R)', key: 'R' },
  ],
}

export const timingResultTableHeaders: TableDefinition = {
  headers: [
    { text: 'Seconds', key: 'R', primary: 'score' },
    { text: 'Rank', key: 'S', color: 'red', primary: 'rank' },
  ],
}

export default {
  id: 'svgf-vh.timing@2023',
  name: 'SvGF Vikingahoppet Timing 2023',
  options: [],
  statusDefinitions: [],
  judges: [timingJudge as JudgeTypeGetter<Option>],

  calculateEntry (meta, res, options) {
    const results = res.filter(r => matchMeta(r.meta, meta))
    if (!results.length) return

    // Calc t
    const ts = results.map(res => res.result.t).filter(t => typeof t === 'number')
    const t = average(ts) ?? 0

    return {
      meta,
      result: {
        t,
        R: roundTo(t, 2),
      },
      statuses: {},
    }
  },
  rankEntries (res, options) {
    let results = [...res]
    results.sort(function (a, b) {
      return (a.result.R ?? 0) - (b.result.R ?? 0) // sort ascending
    })

    results = results.map((el, _, arr) => ({
      ...el,
      result: {
        ...el.result,
        S: arr.findIndex(obj => obj.result.R === el.result.R) + 1,
      },
    }))

    return results
  },

  previewTable: options => timingPreviewTableHeaders,
  resultTable: options => timingResultTableHeaders,
} satisfies CompetitionEventModel<Option>
