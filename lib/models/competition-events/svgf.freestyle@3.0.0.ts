import { RSRWrongJudgeTypeError } from '../../errors.js'
import { normaliseTally, formatFactor, matchMeta, roundTo, roundToCurry, calculateTallyFactory, createMarkReducer, simpleReducer, clampNumber } from '../../helpers/helpers.js'
import type { CompetitionEventModel, JudgeTallyFieldDefinition, JudgeTypeGetter, TableDefinition } from '../types.js'
import { ijruAverage } from '../../helpers/ijru.js'

type Option = 'noMusicality' | 'discipline' | 'interactions'

// pres
const Fp = 0.6
const FpM = Fp * 0.25
const FpE = Fp * 0.25
const FpF = Fp * 0.5

// deduc
const Fd = 0.025
const Fq = Fd
const Fm1 = 0.05
const Fm2 = 0.075
const Fm = 0.1

// Diff
export function L (l: number): number {
  if (l === 0) return 0
  return roundTo(0.1 * Math.pow(1.5, l), 2)
}

// ======
// JUDGES
// ======
export const routinePresentationJudge: JudgeTypeGetter<Option> = options => {
  const noMusicality = options.noMusicality === true

  const fieldDefinitions = [
    {
      schema: 'entertainmentPlus',
      name: 'Entertainment +',
      min: 0,
      step: 1,
    },
    {
      schema: 'entertainmentCheck',
      name: 'Entertainment ✓',
      min: 0,
      step: 1,
    },
    {
      schema: 'entertainmentMinus',
      name: 'Entertainment -',
      min: 0,
      step: 1,
    },

    ...(noMusicality
      ? []
      : [
          {
            schema: 'musicalityPlus',
            name: 'Musicality +',
            min: 0,
            step: 1,
          },
          {
            schema: 'musicalityCheck',
            name: 'Musicality ✓',
            min: 0,
            step: 1,
          },
          {
            schema: 'musicalityMinus',
            name: 'Musicality -',
            min: 0,
            step: 1,
          },
        ]),
  ]
  const id = 'Pr'
  return {
    id,
    name: 'Routine Presentation',
    markDefinitions: fieldDefinitions,
    tallyDefinitions: fieldDefinitions,
    createMarkReducer: () => createMarkReducer(simpleReducer, fieldDefinitions),
    calculateTally: calculateTallyFactory(id, simpleReducer, fieldDefinitions),
    calculateJudgeResult: scsh => {
      if (!matchMeta(scsh.meta, { judgeTypeId: id })) throw new RSRWrongJudgeTypeError(scsh.meta.judgeTypeId, id)
      const tally = normaliseTally(fieldDefinitions, scsh.tally)

      const enTop = 3 * ((tally.entertainmentPlus ?? 0) - (tally.entertainmentMinus ?? 0))
      const enBottom = (tally.entertainmentPlus ?? 0) + (tally.entertainmentCheck ?? 0) + (tally.entertainmentMinus ?? 0)
      const enAvg = enTop / (enBottom || 1)

      const muTop = 3 * ((tally.musicalityPlus ?? 0) - (tally.musicalityMinus ?? 0))
      const muBottom = (tally.musicalityPlus ?? 0) + (tally.musicalityCheck ?? 0) + (tally.musicalityMinus ?? 0)
      const muAvg = muTop / (muBottom || 1)

      return {
        meta: scsh.meta,
        result: noMusicality
          ? {
              aE: roundTo((enAvg * (FpE + FpM)), 6),
              aM: 0,
            }
          : {
              aE: roundTo((enAvg * FpE), 6),
              aM: roundTo((muAvg * FpM), 6),
            },
        statuses: {},
      }
    },
  }
}

export const athletePresentationJudge: JudgeTypeGetter<Option> = options => {
  const fieldDefinitions = [
    {
      name: 'Form and Execution +',
      schema: 'formExecutionPlus',
      min: 0,
      step: 1,
    },
    {
      name: 'Form and Execution ✓',
      schema: 'formExecutionCheck',
      min: 0,
      step: 1,
    },
    {
      name: 'Form and Execution -',
      schema: 'formExecutionMinus',
      min: 0,
      step: 1,
    },

    {
      name: 'Misses',
      schema: 'miss',
      min: 0,
    },
  ] as const
  const id = 'Pa'
  return {
    id,
    name: 'Athlete Presentation',
    markDefinitions: fieldDefinitions,
    tallyDefinitions: fieldDefinitions,
    createMarkReducer: () => createMarkReducer(simpleReducer, fieldDefinitions),
    calculateTally: calculateTallyFactory(id, simpleReducer, fieldDefinitions),
    calculateJudgeResult: scsh => {
      if (!matchMeta(scsh.meta, { judgeTypeId: id })) throw new RSRWrongJudgeTypeError(scsh.meta.judgeTypeId, id)
      const tally = normaliseTally(fieldDefinitions, scsh.tally)

      const top = 3 * ((tally.formExecutionPlus ?? 0) - (tally.formExecutionMinus ?? 0))
      const bottom = (tally.formExecutionPlus ?? 0) + (tally.formExecutionCheck ?? 0) + (tally.formExecutionMinus ?? 0)
      const avg = top / (bottom || 1)

      return {
        meta: scsh.meta,
        result: {
          m: tally.miss ?? 0,
          aF: roundTo(avg * FpF, 6),
        },
        statuses: {},
      }
    },
  }
}

export const requiredElementsJudge: JudgeTypeGetter<Option> = options => {
  const isDD = options.discipline === 'dd'
  const hasInteractions = options.interactions === true
  const fieldDefinitions = [
    {
      schema: 'timeViolation',
      name: 'Time Violations',
      min: 0,
      max: 2,
      step: 1,
    },
    {
      schema: 'spaceViolation',
      name: 'Space Violations',
      min: 0,
      step: 1,
    },
    {
      schema: 'miss',
      name: 'Misses',
      min: 0,
      step: 1,
    },

    {
      schema: 'rqGymnasticsPower',
      name: 'Amount of different Gymnastics and Power Skills',
      min: 0,
      max: 4,
      step: 1,
    },
    ...(isDD
      ? [{
          schema: 'rqTurnerInvolvement',
          name: 'Amount of different Turner Involvement Skills',
          min: 0,
          max: 4,
          step: 1,
        }]
      : [{
          schema: 'rqMultiples',
          name: 'Amount of different Multiples',
          min: 0,
          max: 4,
          step: 1,
        }, {
          schema: 'rqWrapsReleases',
          name: 'Amount of different Wraps and Releases',
          min: 0,
          max: 4,
          step: 1,
        }]),
    ...(hasInteractions
      ? [{
          schema: 'rqInteractions',
          name: 'Amount of different Interactions',
          min: 0,
          max: 4,
          step: 1,
        }]
      : []),
  ] as const
  const rqFields = fieldDefinitions.filter(f => f.schema.startsWith('rq'))
  const max: number = rqFields.reduce((acc, f: JudgeTallyFieldDefinition<string>) => (acc + (f.max ?? 0)), 0)
  const id = 'R'
  return {
    id,
    name: 'Required Elements',
    markDefinitions: fieldDefinitions,
    tallyDefinitions: fieldDefinitions,
    createMarkReducer: () => createMarkReducer(simpleReducer, fieldDefinitions),
    calculateTally: calculateTallyFactory(id, simpleReducer, fieldDefinitions),
    calculateJudgeResult: scsh => {
      if (!matchMeta(scsh.meta, { judgeTypeId: id })) throw new RSRWrongJudgeTypeError(scsh.meta.judgeTypeId, id)
      const tally = normaliseTally(fieldDefinitions, scsh.tally)

      let score = rqFields.map(f => tally[f.schema] ?? 0).reduce((a, b) => a + b)
      score = score > max ? max : score
      const missing = max - score

      return {
        meta: scsh.meta,
        result: {
          Q: roundTo(1 - (missing * Fq), 3),
          m: tally.miss ?? 0,
          v: (tally.spaceViolation ?? 0) + (tally.timeViolation ?? 0),
        },
        statuses: {},
      }
    },
  }
}

export const difficultyJudge: JudgeTypeGetter<Option> = options => {
  const fieldDefinitions = [
    {
      name: 'Level 0.5',
      schema: 'diffL0.5',
      min: 0,
      step: 1,
    },
    ...Array(8).fill(undefined).map((el, idx) => ({
      name: `Level ${idx + 1}`,
      schema: `diffL${idx + 1}` as const,
      min: 0,
      step: 1,
    })),

    // Not used in any math, just for tracking
    {
      name: 'Repeated Skills',
      schema: 'rep',
      min: 0,
      step: 1,
    },
  ] as const
  const levels: Record<string, number> = Object.fromEntries(Array(8).fill(undefined).map((el, idx) => [`diffL${idx + 1}`, idx + 1] as const))
  levels['diffL0.5'] = 0.5
  const id = 'D'
  return {
    id,
    name: 'Difficulty',
    markDefinitions: fieldDefinitions,
    tallyDefinitions: fieldDefinitions,
    createMarkReducer: () => createMarkReducer(simpleReducer, fieldDefinitions),
    calculateTally: calculateTallyFactory(id, simpleReducer, fieldDefinitions),
    calculateJudgeResult: scsh => {
      if (!matchMeta(scsh.meta, { judgeTypeId: id })) throw new RSRWrongJudgeTypeError(scsh.meta.judgeTypeId, id)
      const tally = normaliseTally(fieldDefinitions, scsh.tally)

      const D = fieldDefinitions.filter(f => f.schema !== 'rep').map(f => (tally[f.schema] ?? 0) * L(levels[f.schema])).reduce((a, b) => a + b)
      return {
        meta: scsh.meta,
        result: {
          D: roundTo(D, 2),
        },
        statuses: {},
      }
    },
  }
}

// ======
// TABLES
// ======
export const freestylePreviewTableHeaders: TableDefinition = {
  headers: [
    { text: 'Diff (D)', key: 'D', formatter: roundToCurry(2) },
    { text: 'Pres (P)', key: 'P', formatter: formatFactor },
    { text: 'Req. El (Q)', key: 'Q', formatter: formatFactor },
    { text: 'Deduc (M)', key: 'M', formatter: formatFactor },
    { text: 'Result (R)', key: 'R', formatter: roundToCurry(2) },
  ],
}

export const freestyleResultTableHeaders: TableDefinition = {
  headers: [
    { text: 'Diff', key: 'D', color: 'gray', formatter: roundToCurry(2) },
    { text: 'Pres', key: 'P', color: 'gray', formatter: formatFactor },
    { text: 'Req. El', key: 'Q', color: 'gray', formatter: formatFactor },
    { text: 'Deduc', key: 'M', color: 'gray', formatter: formatFactor },

    { text: 'Score', key: 'R', formatter: roundToCurry(2), primary: 'score' },
    { text: 'Rank', key: 'S', color: 'red', primary: 'rank' },
  ],
}

export default {
  id: 'svgf.freestyle@3.0.0',
  name: 'SvGF Freestyle (IJRU v3+v4) v3.0.0',
  options: [
    { id: 'noMusicality', name: 'No Musicality', type: 'boolean' },
    { id: 'discipline', name: 'Discipline', type: 'enum', enum: ['sr', 'dd', 'wh', 'ts', 'xd'] },
    { id: 'interactions', name: 'Has Interactions', type: 'boolean' },
  ],
  judges: [routinePresentationJudge, athletePresentationJudge, requiredElementsJudge, difficultyJudge],

  calculateEntry (meta, res, options) {
    const noMusic = options.noMusicality === true
    const results = res.filter(r => matchMeta(r.meta, meta))
    if (!results.length) return

    const raw: Record<string, number> = {}

    for (const scoreType of ['D', 'aF', 'aE', 'aM', 'm', 'v', 'Q'] as const) {
      const scores = results.map(el => el.result[scoreType]).filter(el => typeof el === 'number')
      if (['m', 'v'].includes(scoreType)) raw[scoreType] = roundTo(ijruAverage(scores), 0)
      else if (['aF', 'aE', 'aM'].includes(scoreType)) raw[scoreType] = roundTo(ijruAverage(scores), 6)
      else raw[scoreType] = roundTo(ijruAverage(scores), 2) // D, Q

      if (typeof raw[scoreType] !== 'number' || isNaN(raw[scoreType])) raw[scoreType] = (['D', 'aF', 'aE', 'aM'].includes(scoreType) ? 0 : 1)
      if (scoreType === 'aM' && noMusic) raw[scoreType] = 0
    }

    raw.m = (Fm1 * clampNumber(raw.m, { max: 1 })) +
      (Fm2 * clampNumber(raw.m - 1, { min: 0, max: 1 })) +
      (Fm * clampNumber(raw.m - 2, { min: 0 }))
    raw.v = Fd * raw.v

    raw.M = roundTo(1 - (raw.m + raw.v), 2)
    raw.M = raw.M < 0 ? 0 : raw.M

    raw.P = roundTo(1 + (raw.aE + raw.aF + raw.aM), 2)

    raw.R = roundTo(raw.D * raw.P * raw.M * raw.Q, 2)
    raw.R = raw.R < 0 ? 0 : raw.R

    return {
      meta,
      result: raw,
      statuses: {},
    }
  },
  rankEntries (res, options) {
    let results = [...res]
    // const tiePriority = ['R', 'M', 'Q', 'P', 'D'] as const
    results.sort(function (a, b) {
      if (a.result.R !== b.result.R) return (b.result.R ?? 0) - (a.result.R ?? 0) // descending 100 wins over 50
      if (a.result.M !== b.result.M) return (b.result.M ?? 1) - (a.result.M ?? 1) // descending *1 wins over *.9
      if (a.result.Q !== b.result.Q) return (b.result.Q ?? 1) - (a.result.Q ?? 1) // descending *1 wins over *.9
      if (a.result.P !== b.result.P) return (b.result.P ?? 1) - (a.result.P ?? 1) // descending 1.35 wins over 0.95
      if (a.result.D !== b.result.D) return (b.result.D ?? 0) - (a.result.D ?? 0) // descending 100 wins over 50
      return 0
    })

    const high = results.length > 0 ? results[0].result.R ?? 0 : 0
    const low = results.length > 1 ? results[results.length - 1].result.R ?? 0 : 0

    results = results.map((el, idx, arr) => ({
      ...el,
      result: {
        ...el.result,
        S: arr.findIndex(score =>
          score.result.R === el.result.R &&
        score.result.M === el.result.M &&
        score.result.Q === el.result.Q &&
        score.result.P === el.result.P &&
        score.result.D === el.result.D
        ) + 1,
        N: roundTo((((100 - 1) * ((el.result.R ?? 0) - low)) / ((high - low) !== 0 ? high - low : 1)) + 1, 2),
      },
    }))

    return results
  },

  previewTable: options => freestylePreviewTableHeaders,
  resultTable: options => freestyleResultTableHeaders,
} satisfies CompetitionEventModel<Option>
