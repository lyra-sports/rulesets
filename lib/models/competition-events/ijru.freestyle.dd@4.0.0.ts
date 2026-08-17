import { RSRMissingJudgeResultError, RSRWrongJudgeTypeError } from '../../errors.js'
import type { MarkReducer } from '../../helpers/helpers.js'
import { clampNumber, normaliseTally, formatFactor, matchMeta, roundTo, roundToCurry, createMarkReducer, calculateTallyFactory } from '../../helpers/helpers.js'
import { ijruAverage } from '../../helpers/ijru.js'
import type { CompetitionEventModel, GenericMark, JudgeTypeGetter, Mark, TableDefinition } from '../types.js'
import { presentationJudge, technicalJudgeFactory } from './ijru.freestyle.sr@4.0.0.js'

export type Option = 'diffTurnerSkillDivisor'

const Fdj = 0.35 / 0.25
const Fdt = 1
const Fp = 0.4

const Fv = 0.05
const Fm1 = 0.05
const Fm2 = 0.075
const Fm = 0.1

export function L (l: number): number {
  if (l === 0) return 0
  return roundTo(Math.pow(1.5, l), 2)
}

export function formatPresentationFactor (value: number) {
  if (typeof value !== 'number' || isNaN(value)) return ''
  return formatFactor(1 + value)
}

// ======
// JUDGES
// ======
export const difficultyJumperJudge: JudgeTypeGetter<Option> = options => {
  const markDefinitions = [
    { schema: 'diffPlus', name: 'Difficulty +' },
    { schema: 'diffMinus', name: 'Difficulty -' },
    { schema: 'break', name: 'Break' },

    ...Array(5).fill(undefined).map((el, idx) => ({
      name: `Level ${idx + 1}`,
      schema: `diffL${idx + 1}` as const,
    })),
  ]
  const tallyDefinitions = [
    { schema: 'break', name: 'Breaks', min: 0, step: 1 },

    ...Array(5).fill(undefined).flatMap((el, idx) => [
      {
        name: `Level ${idx + 1}-`,
        schema: `diffL${idx + 1}Minus` as const,
        min: 0,
        step: 1,
      },
      {
        name: `Level ${idx + 1}`,
        schema: `diffL${idx + 1}` as const,
        min: 0,
        step: 1,
      },
      {
        name: `Level ${idx + 1}+`,
        schema: `diffL${idx + 1}Plus` as const,
        min: 0,
        step: 1,
      },
    ] as const),
  ]

  type DiffMarkSchema = 'break' | `diff${'Plus' | 'Minus'}` | `diffL${1 | 2 | 3 | 4 | 5}`
  type DiffTallySchema = 'break' | `diffL${1 | 2 | 3 | 4 | 5}${'' | 'Plus' | 'Minus'}`
  const diffMarkRegex = /^diffL[0-5]$/
  function isDiffMark (x: Mark<DiffMarkSchema>): x is GenericMark<Exclude<DiffMarkSchema, 'break' | 'diffPlus' | 'diffMinus'>> {
    return diffMarkRegex.test(x.schema)
  }

  const markLevels: Record<DiffTallySchema, number> = {
    break: 0,
    ...Object.fromEntries(Array(5).fill(undefined).flatMap((el, idx) => [
      [`diffL${idx + 1}Minus`, idx + 1 - 0.25] as const,
      [`diffL${idx + 1}`, idx + 1] as const,
      [`diffL${idx + 1}Plus`, idx + 1 + 0.5] as const,
    ] as const)) as Record<Exclude<DiffTallySchema, 'break'>, number>,
  }

  const reducer: MarkReducer<DiffMarkSchema, DiffTallySchema> = (tally, mark, marks) => {
    if (mark.schema === 'diffMinus' || mark.schema === 'diffPlus') {
      const type = mark.schema.endsWith('Plus') ? 'Plus' : 'Minus'
      const prevMark = marks.at(-2)

      // A plus/minus mark must come directly after a difficulty mark to be valid
      // And the tally must have a score above 0 for that level (unlikely it
      // won't since we checked that we just gave such a mark, but hey)
      if (prevMark != null && isDiffMark(prevMark) && tally[prevMark.schema] > 0) {
        tally[prevMark.schema] -= mark.value ?? 1
        tally[`${prevMark.schema}${type}`] += mark.value ?? 1
      }
    } else {
      tally[mark.schema] += mark.value ?? 1
    }

    return tally
  }

  const id = 'Dj'
  return {
    id,
    name: 'Difficulty - Jumpers',
    markDefinitions,
    tallyDefinitions,
    statusDefinitions: [],
    createMarkReducer: () => createMarkReducer(reducer as unknown as MarkReducer<string, string>, tallyDefinitions),
    calculateTally: calculateTallyFactory(id, reducer as unknown as MarkReducer<string, string>, tallyDefinitions),
    calculateJudgeResult: (scsh) => {
      if (!matchMeta(scsh.meta, { judgeTypeId: id })) throw new RSRWrongJudgeTypeError(scsh.meta.judgeTypeId, id)
      const tally = normaliseTally(tallyDefinitions, scsh.tally)

      const sumScore = tallyDefinitions.map(f => (tally[f.schema] ?? 0) * L(markLevels[f.schema as DiffTallySchema])).reduce((a, b) => a + b, 0)
      const numMarks = tallyDefinitions.map(f => (tally[f.schema] ?? 0)).reduce((a, b) => a + b, 0)
      const d = numMarks === 0 ? 0 : sumScore / numMarks

      return {
        meta: scsh.meta,
        result: {
          d,
        },
        statuses: {},
      }
    },
  }
}

export const difficultyTurnerJudge: JudgeTypeGetter<Option> = options => {
  const markDefinitions = [
    { schema: 'diffPlus', name: 'Difficulty +' },
    { schema: 'diffMinus', name: 'Difficulty -' },

    ...Array(5).fill(undefined).map((el, idx) => ({
      name: `Level ${idx + 1}`,
      schema: `diffL${idx + 1}` as const,
    })),
  ]
  const tallyDefinitions = [
    ...Array(5).fill(undefined).flatMap((el, idx) => [
      {
        name: `Level ${idx + 1}-`,
        schema: `diffL${idx + 1}Minus` as const,
        min: 0,
        step: 1,
      },
      {
        name: `Level ${idx + 1}`,
        schema: `diffL${idx + 1}` as const,
        min: 0,
        step: 1,
      },
      {
        name: `Level ${idx + 1}+`,
        schema: `diffL${idx + 1}Plus` as const,
        min: 0,
        step: 1,
      },
    ] as const),
  ]

  type DiffMarkSchema = `diff${'Plus' | 'Minus'}` | `diffL${1 | 2 | 3 | 4 | 5}`
  type DiffTallySchema = `diffL${1 | 2 | 3 | 4 | 5}${'' | 'Plus' | 'Minus'}`
  const diffMarkRegex = /^diffL[0-5]$/
  function isDiffMark (x: Mark<DiffMarkSchema>): x is GenericMark<Exclude<DiffMarkSchema, 'break' | 'diffPlus' | 'diffMinus'>> {
    return diffMarkRegex.test(x.schema)
  }

  const diffHighLow = [5, 4, 3, 2, 1].flatMap(lev => [
    [`diffL${lev}Plus`, lev + 0.5],
    [`diffL${lev}`, lev],
    [`diffL${lev}Minus`, lev - 0.25],
  ]) as Array<[`diffL${1 | 2 | 3 | 4 | 5}${'' | 'Plus' | 'Minus'}`, number]>

  const reducer: MarkReducer<DiffMarkSchema, DiffTallySchema> = (tally, mark, marks) => {
    if (mark.schema === 'diffMinus' || mark.schema === 'diffPlus') {
      const type = mark.schema.endsWith('Plus') ? 'Plus' : 'Minus'
      const prevMark = marks.at(-2)

      // A plus/minus mark must come directly after a difficulty mark to be valid
      // And the tally must have a score above 0 for that level (unlikely it
      // won't since we checked that we just gave such a mark, but hey)
      if (prevMark != null && isDiffMark(prevMark) && tally[prevMark.schema] > 0) {
        tally[prevMark.schema] -= mark.value ?? 1
        tally[`${prevMark.schema}${type}`] += mark.value ?? 1
      }
    } else {
      tally[mark.schema] += mark.value ?? 1
    }

    return tally
  }

  const id = 'Dt'
  return {
    id,
    name: 'Difficulty - Turners',
    markDefinitions,
    tallyDefinitions,
    statusDefinitions: [],
    createMarkReducer: () => createMarkReducer(reducer as unknown as MarkReducer<string, string>, tallyDefinitions),
    calculateTally: calculateTallyFactory(id, reducer as unknown as MarkReducer<string, string>, tallyDefinitions),
    calculateJudgeResult: (scsh) => {
      if (!matchMeta(scsh.meta, { judgeTypeId: id })) throw new RSRWrongJudgeTypeError(scsh.meta.judgeTypeId, id)
      const tally = normaliseTally(tallyDefinitions, scsh.tally)

      const numSkills = typeof options.diffTurnerSkillDivisor === 'number' && options.diffTurnerSkillDivisor > 0
        ? options.diffTurnerSkillDivisor
        : 20

      let sumScore = 0
      let remaining = numSkills
      for (const [schema, l] of diffHighLow) {
        const marks = tally[schema] ?? 0
        if (marks > remaining) {
          sumScore += remaining * L(l)
          break
        } else {
          sumScore += marks * L(l)
          remaining -= marks
        }
      }
      const d = sumScore / numSkills

      return {
        meta: scsh.meta,
        result: {
          d,
        },
        statuses: {},
      }
    },
  }
}

// ======
// TABLES
// ======
export const freestylePreviewTableHeaders = {
  headers: [
    { text: 'Diff Jump', key: 'Dj', formatter: roundToCurry(2) },
    { text: 'Diff Turn', key: 'Dt', formatter: roundToCurry(2) },
    { text: 'Diff (D)', key: 'D', formatter: roundToCurry(2) },
    { text: 'Pres (P)', key: 'P', formatter: formatPresentationFactor },
    { text: 'Misses (am)', key: 'am', formatter: roundToCurry(0) },
    { text: 'Violations (av)', key: 'av', formatter: roundToCurry(0) },
    { text: 'Deduc (M)', key: 'M', formatter: formatFactor },
    { text: 'Result (R)', key: 'R', formatter: roundToCurry(2) },
  ],
}

export const freestyleResultTableHeaders: TableDefinition = {
  headers: [
    { text: 'Diff', key: 'D', color: 'gray', formatter: roundToCurry(2) },
    { text: 'Pres', key: 'P', color: 'gray', formatter: formatPresentationFactor },
    { text: 'Deduc', key: 'M', color: 'gray', formatter: formatFactor },

    { text: 'Score', key: 'R', formatter: roundToCurry(2), primary: 'score' },
    { text: 'Rank', key: 'S', color: 'red', primary: 'rank' },
  ],
}

export default {
  id: 'ijru.freestyle.dd@4.0.0',
  name: 'IJRU Double Dutch Freestyle v4.0.0',
  options: [
    { id: 'diffTurnerSkillDivisor', name: 'Difficulty Turner - number of skills counted', type: 'number', min: 0, step: 1 },
  ],
  statusDefinitions: [],
  judges: [presentationJudge, technicalJudgeFactory({ discipline: 'dd' }) as JudgeTypeGetter<Option>, difficultyJumperJudge, difficultyTurnerJudge],

  calculateEntry: (meta, res, options) => {
    const results = res.filter(r => matchMeta(r.meta, meta))
    if (!results.length) return

    const raw: Record<string, number> = {}

    const djScore = ijruAverage(results
      .filter(el => el.meta.judgeTypeId === 'Dj')
      .map(el => el.result.d)
      .filter(el => typeof el === 'number'))
    if (djScore == null) throw new RSRMissingJudgeResultError('Dj')
    raw.Dj = roundTo(djScore, 2)
    const dtScore = ijruAverage(results
      .filter(el => el.meta.judgeTypeId === 'Dt')
      .map(el => el.result.d)
      .filter(el => typeof el === 'number'))
    if (dtScore == null) throw new RSRMissingJudgeResultError('Dt')
    raw.Dt = roundTo(dtScore, 2)

    raw.D = roundTo(
      (raw.Dj * Fdj) + (raw.Dt * Fdt),
      2
    )

    const pScores = results
      .map(el => el.result.p)
      .filter(el => typeof el === 'number')
    const pScore = ijruAverage(pScores)
    if (pScore == null) throw new RSRMissingJudgeResultError('P')
    raw.P = roundTo(pScore * ((2 * Fp) / 24), 2)

    const amScore = ijruAverage(results
      .map(el => el.result.nm)
      .filter(el => typeof el === 'number'))
    const avScore = ijruAverage(results
      .map(el => el.result.nv)
      .filter(el => typeof el === 'number'))
    if (amScore == null || avScore == null) throw new RSRMissingJudgeResultError('T')
    raw.am = Math.round(amScore)
    raw.av = Math.round(avScore)

    raw.m = (Fm1 * clampNumber(raw.am, { max: 1 })) +
      (Fm2 * clampNumber(raw.am - 1, { min: 0, max: 1 })) +
      (Fm * clampNumber(raw.am - 2, { min: 0 }))
    raw.v = Fv * raw.av

    raw.M = roundTo(1 - (raw.m + raw.v), 2)
    raw.M = raw.M < 0 ? 0 : raw.M

    raw.R = roundTo(raw.D * (1 + raw.P) * raw.M, 2)
    raw.R = raw.R < 0 ? 0 : raw.R

    return {
      meta,
      result: raw,
      statuses: {},
    }
  },
  rankEntries: (res, options) => {
    let results = [...res]
    // const tiePriority = ['R', 'M', 'P', 'D'] as const
    results.sort(function (a, b) {
      if (a.result.R !== b.result.R) return (b.result.R ?? 0) - (a.result.R ?? 0) // descending 100 wins over 50
      if (a.result.M !== b.result.M) return (b.result.M ?? 1) - (a.result.M ?? 1) // descending *1 wins over *.9
      if (a.result.P !== b.result.P) return (b.result.P ?? 1) - (a.result.P ?? 1) // descending 1.35 wins over 0.95
      if (a.result.D !== b.result.D) return (b.result.D ?? 0) - (a.result.D ?? 0) // descending 100 wins over 50
      return 0
    })

    const high = results[0]?.result.R ?? 0
    const low = results.length > 1 ? results[results.length - 1]?.result.R ?? 0 : 0

    results = results.map((el, idx, arr) => ({
      ...el,
      result: {
        ...el.result,
        S: arr.findIndex(score =>
          score.result.R === el.result.R &&
          score.result.M === el.result.M &&
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
