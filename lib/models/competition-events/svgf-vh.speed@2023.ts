import { RSRWrongJudgeTypeError } from '../../errors.js'
import { normaliseTally, matchMeta, roundTo, roundToCurry, calculateTallyFactory, createMarkReducer, simpleReducer } from '../../helpers/helpers.js'
import type { CompetitionEventModel, JudgeTypeGetter, TableDefinition } from '../types.js'

type Option = never

export function average (scores: number[]): number {
  if (scores.length === 0) return 0
  return scores.reduce((a, b) => a + b) / scores.length
}

// ======
// JUDGES
// ======
export const speedJudge: JudgeTypeGetter<Option> = options => {
  const fieldDefinitions = [{
    schema: 'step',
    name: 'Score',
    min: 0,
    step: 1,
  }] as const
  const id = 'S'
  return {
    id,
    name: 'Speed',
    markDefinitions: fieldDefinitions,
    tallyDefinitions: fieldDefinitions,
    statusDefinitions: [],
    createMarkReducer: () => createMarkReducer(simpleReducer, fieldDefinitions),
    calculateTally: calculateTallyFactory(id, simpleReducer, fieldDefinitions),
    calculateJudgeResult: scsh => {
      if (!matchMeta(scsh.meta, { judgeTypeId: id })) throw new RSRWrongJudgeTypeError(scsh.meta.judgeTypeId, id)
      const tally = normaliseTally(fieldDefinitions, scsh.tally)
      return {
        meta: scsh.meta,
        result: {
          a: tally.step ?? 0,
        },
        statuses: {},
      }
    },
  }
}

// ======
// TABLES
// ======
export const speedPreviewTableHeaders: TableDefinition = {
  headers: [
    { text: 'Steps (a)', key: 'a', formatter: roundToCurry(0) },
    { text: 'Result (R)', key: 'R' },
  ],
}

export const speedResultTableHeaders: TableDefinition = {
  headers: [
    { text: 'Steps', key: 'R', primary: 'score' },
    { text: 'Rank', key: 'S', color: 'red', primary: 'rank' },
  ],
}

export default {
  id: 'svgf-vh.speed@2023',
  name: 'SvGF Vikingahoppet Speed 2023',
  options: [],
  statusDefinitions: [],
  judges: [speedJudge],

  calculateEntry (meta, res, options) {
    const results = res.filter(r => matchMeta(r.meta, meta))
    if (!results.length) return

    // Calc a
    const as = results.map(res => res.result.a).filter(a => typeof a === 'number')
    const a = average(as) ?? 0

    return {
      meta,
      result: {
        a,
        R: roundTo(a, 0),
      },
      statuses: {},
    }
  },
  rankEntries (res, options) {
    let results = [...res]
    results.sort(function (a, b) {
      return (b.result.R ?? 0) - (a.result.R ?? 0) // sort descending
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

  previewTable: options => speedPreviewTableHeaders,
  resultTable: options => speedResultTableHeaders,
} satisfies CompetitionEventModel<Option>
