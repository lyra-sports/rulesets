import { RSRWrongJudgeTypeError } from '../../errors.js'
import { normaliseTally, matchMeta, roundTo, calculateTallyFactory, createMarkReducer, simpleReducer } from '../../helpers/helpers.js'
import type { CompetitionEventModel, JudgeTypeGetter, TableDefinition } from '../types.js'
import { ijruAverage } from '../../helpers/ijru.js'

type Option = 'falseSwitches'
type Status = 'withinThree'

// deduc
const SpeedDed = 10

// ======
// JUDGES
// ======
export const speedJudge: JudgeTypeGetter< Option> = options => {
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

export const speedHeadJudge: JudgeTypeGetter<Option> = options => {
  const falseSwitches = Number.isSafeInteger(options.falseSwitches) && options.falseSwitches as number > 0 ? options.falseSwitches as number : undefined
  const fieldDefinitions = [
    {
      schema: 'step',
      name: 'Score',
      min: 0,
      step: 1,
    },
    {
      schema: 'falseStart',
      name: 'False Start',
      min: 0,
      max: 1,
      step: 1,
    },
    ...(falseSwitches != null
      ? [{
          schema: 'falseSwitch',
          name: 'False Switches',
          min: 0,
          max: falseSwitches,
          step: 1,
        }]
      : []),
  ] as const
  const id = 'Shj'
  return {
    id,
    name: 'Speed Head Judge',
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
          m: ((tally.falseStart ?? 0) + (tally.falseSwitch ?? 0)) * SpeedDed,
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
    { text: 'Steps (a)', key: 'a' },
    { text: 'Deduc (m)', key: 'm' },
    { text: 'Result (R)', key: 'R' },

    { text: 'Reskip Allowed', status: true, key: 'withinThree', formatter: (n) => n ? 'No' : 'Yes' },
  ],
}

export const speedResultTableHeaders: TableDefinition = {
  headers: [
    { text: 'Score', key: 'R', primary: 'score' },
    { text: 'Rank', key: 'S', color: 'red', primary: 'rank' },
  ],
}

export default {
  id: 'ijru.speed@1.0.0',
  name: 'IJRU Speed v1.0.0',
  options: [
    { id: 'falseSwitches', name: 'False Switches', type: 'number' },
  ],
  statusDefinitions: [
    {
      id: 'withinThree',
      name: 'Reskip allowed',
      formatter: (value) => ({
        text: value === false ? 'Yes' : 'No',
        severity: value === false ? 'warning' : 'neutral',
      }),
    },
  ],
  judges: [speedJudge, speedHeadJudge],

  calculateEntry (meta, res, options) {
    const results = res.filter(r => matchMeta(r.meta, meta))
    if (!results.length) return

    // Calc a
    const as = results.map(res => res.result.a).filter(a => typeof a === 'number')
    const a = ijruAverage(as) ?? 0

    // Calc m
    const ms = results.map(res => res.result.m).filter(m => typeof m === 'number')
    const m = ijruAverage(ms) ?? 0

    // calc withinThree
    const minDiff = Math.min(...results
      .map(res => res.result.a)
      .sort((a, b) => a - b)
      .flatMap((res, idx, arr) => arr[idx + 1] - res)
      .filter(n => !Number.isNaN(n)))
    const withinThree = minDiff <= 3

    return {
      meta,
      result: {
        a,
        m,
        R: roundTo(a - m, 2),
      },
      statuses: {
        withinThree,
      },
    }
  },
  rankEntries (res, options) {
    let results = [...res]
    results.sort(function (a, b) {
      return (b.result.R ?? 0) - (a.result.R ?? 0) // sort descending
    })

    const high = results.length > 0 ? results[0].result.R ?? 0 : 0
    const low = results.length > 1 ? results[results.length - 1].result.R ?? 0 : 0

    results = results.map((el, _, arr) => ({
      ...el,
      result: {
        ...el.result,
        S: arr.findIndex(obj => obj.result.R === el.result.R) + 1,
        N: high === low ? 100 : roundTo((((100 - 1) * ((el.result.R ?? 0) - low)) / (high - low)) + 1, 2),
      },
    }))

    return results
  },

  previewTable: options => speedPreviewTableHeaders,
  resultTable: options => speedResultTableHeaders,
} satisfies CompetitionEventModel<Option, Status>
