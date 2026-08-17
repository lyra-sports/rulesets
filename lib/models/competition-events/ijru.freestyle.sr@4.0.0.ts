import { RSRMissingJudgeResultError, RSRWrongJudgeTypeError } from '../../errors.js'
import type { MarkReducer } from '../../helpers/helpers.js'
import { clampNumber, filterMarkStream, normaliseTally, formatFactor, matchMeta, roundTo, roundToCurry, calculateTallyFactory, createMarkReducer, simpleReducer } from '../../helpers/helpers.js'
import type { CompetitionEventModel, JudgeTypeGetter, Options, TableDefinition } from '../types.js'
import { ijruAverage } from '../../helpers/ijru.js'

export type Option = 'interactions' |
  'maxRqGymnasticsPower' | 'maxRqMultiples' | 'maxRqRopeManipulation' |
  'maxRqInteractions' | 'rqFullCreditThresholdLevel'

// pres
const Fp = 0.6
const presWeights = {
  ent: 0.25,
  form: 0.25,
  music: 0.2,
  crea: 0.15,
  vari: 0.15,
}

// deduc
const Fv = 0.05
const Fb = 0.05
const Fq = 0.025
const Fm1 = 0.05
const Fm2 = 0.075
const Fm = 0.1

// reqEl
export function getRqMax (options: Options<Option>) {
  return {
    rqGymnasticsPower: typeof options.maxRqGymnasticsPower === 'number' ? options.maxRqGymnasticsPower : 6,
    rqMultiples: typeof options.maxRqMultiples === 'number' ? options.maxRqMultiples : 6,
    rqRopeManipulation: typeof options.maxRqRopeManipulation === 'number' ? options.maxRqRopeManipulation : 6,
    rqInteractions: typeof options.maxRqInteractions === 'number' ? options.maxRqInteractions : 4,
  }
}

export function formatPresentationFactor (value: number) {
  if (typeof value !== 'number' || isNaN(value)) return ''
  return formatFactor(1 + value)
}

// diff
export function L (l: number): number {
  if (l === 0) return 0
  return roundTo(0.1 * Math.pow(1.5, l), 2)
}

// ======
// JUDGES
// ======
export const presentationJudge: JudgeTypeGetter = options => {
  const components = ['ent', 'form', 'music', 'crea', 'vari'] as const
  const markDefinitions = [
    {
      schema: 'entPlus',
      name: 'Entertainment +',
    },
    {
      schema: 'entMinus',
      name: 'Entertainment -',
    },

    {
      schema: 'formPlus',
      name: 'Form/Execution +',
    },
    {
      schema: 'formMinus',
      name: 'Form/Execution -',
    },

    {
      schema: 'musicPlus',
      name: 'Musicality +',
    },
    {
      schema: 'musicMinus',
      name: 'Musicality -',
    },

    {
      schema: 'creaPlus',
      name: 'Creativity +',
    },
    {
      schema: 'creaMinus',
      name: 'Creativity -',
    },

    {
      schema: 'variPlus',
      name: 'Variety +',
    },
    {
      schema: 'variMinus',
      name: 'Repetitive -',
    },

    {
      schema: 'miss',
      name: 'Miss',
    },

    {
      schema: 'entPlusAdj',
      name: 'Adjustment Entertainment +',
    },
    {
      schema: 'entMinusAdj',
      name: 'Adjustment Entertainment -',
    },

    {
      schema: 'formPlusAdj',
      name: 'Adjustment Form/Execution +',
    },
    {
      schema: 'formMinusAdj',
      name: 'Adjustment Form/Execution -',
    },

    {
      schema: 'musicPlusAdj',
      name: 'Adjustment Musicality +',
    },
    {
      schema: 'musicMinusAdj',
      name: 'Adjustment Musicality -',
    },

    {
      schema: 'creaPlusAdj',
      name: 'Adjustment Creativity +',
    },
    {
      schema: 'creaMinusAdj',
      name: 'Adjustment Creativity -',
    },

    {
      schema: 'variPlusAdj',
      name: 'Adjustment Variety +',
    },
    {
      schema: 'variMinusAdj',
      name: 'Adjustment Repetitive -',
    },
  ] as const
  const tallyDefinitions = [
    {
      schema: 'ent',
      name: 'Entertainment',
      min: 0,
      max: 24,
      step: 1,
      default: 12,
    },
    {
      schema: 'form',
      name: 'Form/Execution',
      min: 0,
      max: 24,
      step: 1,
      default: 12,
    },
    {
      schema: 'music',
      name: 'Musicality',
      min: 0,
      max: 24,
      step: 1,
      default: 12,
    },
    {
      schema: 'crea',
      name: 'Creativity',
      min: 0,
      max: 24,
      step: 1,
      default: 12,
    },
    {
      schema: 'vari',
      name: 'Variety',
      min: 0,
      max: 24,
      step: 1,
      default: 12,
    },
    {
      schema: 'miss',
      name: 'Miss',
      min: 0,
      step: 1,
    },
  ] as const
  const tallyDefMap = new Map(tallyDefinitions.map(d => [d.schema, d]))
  type MarkSchema = typeof markDefinitions[number]['schema']
  type TallySchema = typeof tallyDefinitions[number]['schema']

  const reducer: MarkReducer<MarkSchema, TallySchema> = (_, __, marks) => {
    const tally = normaliseTally(tallyDefinitions)
    const stageOneMarks = components.flatMap(c => [`${c}Plus`, `${c}Minus`])

    for (const mark of marks) {
      if (stageOneMarks.includes(mark.schema)) {
        const sign = mark.schema.endsWith('Minus') ? -1 : 1
        const schema = mark.schema.replace(/(Plus|Minus)$/, '') as TallySchema

        tally[schema] = tally[schema] + ((mark.value ?? 1) * sign)
      } else if (mark.schema === 'miss') {
        tally.miss += 1
        for (const component of components) {
          tally[component] -= 1
        }
      }
    }

    for (const field of tallyDefinitions) {
      const v = tally[field.schema]
      if (typeof v !== 'number') continue
      tally[field.schema] = clampNumber(v, field)
    }

    const stageTwoMarks = components.flatMap(c => [`${c}PlusAdj`, `${c}MinusAdj`])

    for (const mark of marks) {
      if (stageTwoMarks.includes(mark.schema)) {
        const sign = mark.schema.endsWith('MinusAdj') ? -1 : 1
        const schema = mark.schema.replace(/(Plus|Minus)Adj$/, '') as TallySchema
        const field = tallyDefMap.get(schema)
        if (field == null) throw new TypeError(`Could not find tally field with schema ${schema} - This error should not occur.`)

        if (sign > 0 && 'max' in field && tally[schema] >= field.max) continue
        if (sign < 0 && 'min' in field && tally[schema] <= field.min) continue

        tally[schema] = tally[schema] + ((mark.value ?? 1) * sign)
      }
    }

    return tally
  }

  const id = 'P'
  return {
    id,
    name: 'Presentation',
    markDefinitions,
    tallyDefinitions,
    statusDefinitions: [],
    createMarkReducer: () => createMarkReducer(reducer as unknown as MarkReducer<string, string>, tallyDefinitions),
    calculateTally: scsh => {
      if (!matchMeta(scsh.meta, { judgeTypeId: id })) throw new RSRWrongJudgeTypeError(scsh.meta.judgeTypeId, id)
      const marks = filterMarkStream(scsh.marks)
      const tally = normaliseTally(tallyDefinitions)

      const stageOneMarks = components.flatMap(c => [`${c}Plus`, `${c}Minus`])

      for (const mark of marks) {
        if (stageOneMarks.includes(mark.schema)) {
          const sign = mark.schema.endsWith('Minus') ? -1 : 1
          const schema = mark.schema.replace(/(Plus|Minus)$/, '') as TallySchema

          tally[schema] = tally[schema] + ((mark.value ?? 1) * sign)
        } else if (mark.schema === 'miss') {
          tally.miss += 1
          for (const component of components) {
            tally[component] -= 1
          }
        }
      }

      for (const field of tallyDefinitions) {
        const v = tally[field.schema]
        if (typeof v !== 'number') continue
        tally[field.schema] = clampNumber(v, field)
      }

      const stageTwoMarks = components.flatMap(c => [`${c}PlusAdj`, `${c}MinusAdj`])

      for (const mark of marks) {
        if (stageTwoMarks.includes(mark.schema)) {
          const sign = mark.schema.endsWith('MinusAdj') ? -1 : 1
          const schema = mark.schema.replace(/(Plus|Minus)Adj$/, '') as TallySchema
          const field = tallyDefMap.get(schema)
          if (field == null) throw new TypeError(`Could not find tally field with schema ${schema} - This error should not occur.`)

          if (sign > 0 && 'max' in field && tally[schema] >= field.max) continue
          if (sign < 0 && 'min' in field && tally[schema] <= field.min) continue

          tally[schema] = tally[schema] + ((mark.value ?? 1) * sign)
        }
      }

      return { meta: scsh.meta, tally }
    },
    calculateJudgeResult: scsh => {
      if (!matchMeta(scsh.meta, { judgeTypeId: id })) throw new RSRWrongJudgeTypeError(scsh.meta.judgeTypeId, id)
      const tally = normaliseTally(tallyDefinitions, scsh.tally)
      let p = 0

      for (const component of components) {
        let cScore = (tally[component] ?? 12)
        cScore = clampNumber(cScore, { min: 0, max: 24, step: 1 })

        p += cScore * presWeights[component]
      }
      p = clampNumber(p, { min: 0, max: 24 })

      return {
        meta: scsh.meta,
        result: {
          p,
          nm: tally.miss ?? 0,
        },
        statuses: {},
      }
    },
  }
}

export const technicalJudgeFactory = ({ discipline }: { discipline: 'sr' | 'wh' | 'dd' }): JudgeTypeGetter<Option> => options => {
  const isWH = discipline === 'wh'
  const isSR = discipline === 'sr'
  const isDD = discipline === 'dd'
  const hasInteractions = options.interactions === true

  const maxRq = getRqMax(options)

  const fieldDefinitions = [
    {
      schema: 'timeViolation',
      name: 'Time Violations',
      min: 0,
      max: isDD ? 13 : 2,
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
    ...(!isDD
      ? [
          {
            schema: 'break',
            name: 'Breaks',
            min: 0,
            step: 1,
          },
        ]
      : []
    ),

    ...(isWH
      ? [{
          schema: 'rqGymnasticsPower',
          name: 'Power/Gymnastics',
          min: 0,
          max: maxRq.rqGymnasticsPower,
          step: 1,
        }, {
          schema: 'rqMultiples',
          name: 'Multiples',
          min: 0,
          max: maxRq.rqMultiples,
          step: 1,
        }, {
          schema: 'rqRopeManipulation',
          name: 'Rope manipulation',
          min: 0,
          max: maxRq.rqRopeManipulation,
          step: 1,
        }, {
          schema: 'rqInteractions',
          name: 'Partner interactions',
          min: 0,
          max: maxRq.rqInteractions,
          step: 1,
        }]
      : []
    ),

    ...(isSR && hasInteractions
      ? [{
          schema: 'rqInteractions',
          name: 'Pairs interactions',
          min: 0,
          max: maxRq.rqInteractions,
          step: 1,
        }]
      : []
    ),
  ]
  const id = 'T'
  return {
    id,
    name: 'Technical Judge',
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
          nm: tally.miss ?? 0,
          nv: (tally.timeViolation ?? 0) + (tally.spaceViolation ?? 0),
          ...(!isDD
            ? { nb: tally.break ?? 0 }
            : {}
          ),

          ...(isWH
            ? {
                aqP: clampNumber(maxRq.rqGymnasticsPower - (tally.rqGymnasticsPower ?? 0), { min: 0 }),
                aqM: clampNumber(maxRq.rqMultiples - (tally.rqMultiples ?? 0), { min: 0 }),
                aqR: clampNumber(maxRq.rqRopeManipulation - (tally.rqRopeManipulation ?? 0), { min: 0 }),
                aqI: clampNumber(maxRq.rqInteractions - (tally.rqInteractions ?? 0), { min: 0 }),
              }
            : {}
          ),

          ...(isSR && hasInteractions
            ? {
                aqI: clampNumber(maxRq.rqInteractions - (tally.rqInteractions ?? 0), { min: 0 }),
              }
            : {}
          ),
        },
        statuses: {},
      }
    },
  }
}

export const difficultyJudgeFactory: (id: string, name: string, opts: { discipline: 'sr' | 'wh' }) => JudgeTypeGetter<Option> = (id, name, { discipline }) => options => {
  const maxRq = getRqMax(options)
  const isWH = discipline === 'wh'

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
  return {
    id,
    name,
    markDefinitions: fieldDefinitions,
    tallyDefinitions: fieldDefinitions,
    statusDefinitions: [],
    createMarkReducer: () => createMarkReducer(simpleReducer, fieldDefinitions),
    calculateTally: calculateTallyFactory(id, simpleReducer, fieldDefinitions),
    calculateJudgeResult: scsh => {
      if (!matchMeta(scsh.meta, { judgeTypeId: id })) throw new RSRWrongJudgeTypeError(scsh.meta.judgeTypeId, id)
      const tally = normaliseTally(fieldDefinitions, scsh.tally)
      const d = fieldDefinitions.filter(f => f.schema !== 'rep').map(f => (tally[f.schema] ?? 0) * L(levels[f.schema] ?? 0)).reduce((a, b) => a + b, 0)
      const rq = fieldDefinitions.filter(f => f.schema !== 'rep').map(f => (tally[f.schema] ?? 0) * ((levels[f.schema] ?? 0) < (options.rqFullCreditThresholdLevel as number | undefined ?? 3) ? 0.5 : 1)).reduce((a, b) => a + b, 0)

      const rqType = id.charAt(1).toLocaleUpperCase()
      let maxRqType = 6
      switch (rqType) {
        case 'P':
          maxRqType = maxRq.rqGymnasticsPower
          break
        case 'M':
          maxRqType = maxRq.rqMultiples
          break
        case 'R':
          maxRqType = maxRq.rqRopeManipulation
          break
      }

      return {
        meta: scsh.meta,
        result: {
          d,

          ...(isWH
            ? {}
            : {
                [`aq${rqType}`]: clampNumber(maxRqType - (rq ?? 0), { min: 0 }),
              }
          ),
        },
        statuses: {},
      }
    },
  }
}

// ======
// TABLES
// ======
export const freestylePreviewTableHeadersFactory = ({ discipline }: { discipline: 'sr' | 'wh' }) => (options: Options<Option>) => {
  const isWH = discipline === 'wh'
  if (isWH) {
    return {
      headers: [
        { text: 'Diff (dA)', key: 'dA', formatter: roundToCurry(2) },
        { text: 'Diff (dB)', key: 'dB', formatter: roundToCurry(2) },
        { text: 'Diff (D)', key: 'D', formatter: roundToCurry(2) },
        { text: 'Pres (P)', key: 'P', formatter: formatPresentationFactor },
        { text: 'Req. El (Q)', key: 'Q', formatter: formatFactor },
        { text: 'Misses (am)', key: 'am', formatter: roundToCurry(0) },
        { text: 'Breaks (ab)', key: 'ab', formatter: roundToCurry(0) },
        { text: 'Violations (av)', key: 'av', formatter: roundToCurry(0) },
        { text: 'Deduc (M)', key: 'M', formatter: formatFactor },
        { text: 'Result (R)', key: 'R', formatter: roundToCurry(2) },
      ],
    }
  } else {
    return {
      headers: [
        { text: 'Diff (dP)', key: 'dP', formatter: roundToCurry(2) },
        { text: 'Diff (dM)', key: 'dM', formatter: roundToCurry(2) },
        { text: 'Diff (dR)', key: 'dR', formatter: roundToCurry(2) },
        { text: 'Diff (D)', key: 'D', formatter: roundToCurry(2) },
        { text: 'Pres (P)', key: 'P', formatter: formatPresentationFactor },
        { text: 'Req. El (Q)', key: 'Q', formatter: formatFactor },
        { text: 'Deduc (M)', key: 'M', formatter: formatFactor },
        { text: 'Result (R)', key: 'R', formatter: roundToCurry(2) },
      ],
    }
  }
}

export const freestyleResultTableHeaders: TableDefinition = {
  headers: [
    { text: 'Diff', key: 'D', color: 'gray', formatter: roundToCurry(2) },
    { text: 'Pres', key: 'P', color: 'gray', formatter: formatPresentationFactor },
    { text: 'Req. El', key: 'Q', color: 'gray', formatter: formatFactor },
    { text: 'Deduc', key: 'M', color: 'gray', formatter: formatFactor },

    { text: 'Score', key: 'R', formatter: roundToCurry(2), primary: 'score' },
    { text: 'Rank', key: 'S', color: 'red', primary: 'rank' },
  ],
}

export function calculateEntryFactory ({ discipline }: { discipline: 'sr' | 'wh' }): CompetitionEventModel<Option>['calculateEntry'] {
  return function calculateEntry (meta, res, options) {
    const results = res.filter(r => matchMeta(r.meta, meta))
    if (!results.length) return

    const isWH = discipline === 'wh'
    const hasInteractions = options.interactions === true
    const diffTypes = isWH ? ['A', 'B'] : ['P', 'M', 'R']
    const techReqEls = isWH
      ? ['P', 'M', 'R', 'I']
      : (hasInteractions ? ['I'] : [])

    const raw: Record<string, number> = {}

    for (const diffType of diffTypes) {
      const judgeTypeId = `D${diffType.toLocaleLowerCase()}`
      const judgeTypeResults = results
        .filter(el => el.meta.judgeTypeId === judgeTypeId)

      const dScores = judgeTypeResults
        .map(el => el.result.d)
        .filter(el => typeof el === 'number')
      const dScore = ijruAverage(dScores)
      if (dScore == null) throw new RSRMissingJudgeResultError(judgeTypeId)
      raw[`d${diffType}`] = dScore

      if (!isWH) {
        const aqScores = judgeTypeResults
          .map(el => el.result[`aq${diffType}`])
          .filter(el => typeof el === 'number')
        const aqScore = ijruAverage(aqScores)
        if (aqScore == null) throw new RSRMissingJudgeResultError(judgeTypeId)
        raw[`q${diffType}`] = Math.round(aqScore)
      }
    }
    raw.D = roundTo(
      diffTypes.map(diffType => raw[`d${diffType}`]).filter(el => typeof el === 'number').reduce((a, b) => a + b, 0) /
      diffTypes.length,
      2
    )

    const pScores = results
      .map(el => el.result.p)
      .filter(el => typeof el === 'number')
    const pScore = ijruAverage(pScores)
    if (pScore == null) throw new RSRMissingJudgeResultError('P')
    raw.P = roundTo(pScore * ((2 * Fp) / 24), 2)

    for (const reqEl of techReqEls) {
      const aqScores = results
        .map(el => el.result[`aq${reqEl}`])
        .filter(el => typeof el === 'number')
      const aqScore = ijruAverage(aqScores)
      if (aqScore == null) throw new RSRMissingJudgeResultError('T')
      raw[`q${reqEl}`] = Math.round(aqScore)
    }
    raw.Q = roundTo(
      1 - (Fq * (['qP', 'qM', 'qR', 'qI'].map(score => raw[score] ?? 0).reduce((a, b) => a + b, 0))),
      2
    )

    const amScore = ijruAverage(results
      .map(el => el.result.nm)
      .filter(el => typeof el === 'number'))
    const abScore = ijruAverage(results
      .map(el => el.result.nb)
      .filter(el => typeof el === 'number'))
    const avScore = ijruAverage(results
      .map(el => el.result.nv)
      .filter(el => typeof el === 'number'))
    if (amScore == null || abScore == null || avScore == null) throw new RSRMissingJudgeResultError('T')
    raw.am = Math.round(amScore)
    raw.ab = Math.round(abScore)
    raw.av = Math.round(avScore)

    raw.m = (Fm1 * clampNumber(raw.am, { max: 1 })) +
      (Fm2 * clampNumber(raw.am - 1, { min: 0, max: 1 })) +
      (Fm * clampNumber(raw.am - 2, { min: 0 }))
    raw.b = Fb * raw.ab
    raw.v = Fv * raw.av

    raw.M = roundTo(1 - (raw.m + raw.b + raw.v), 2)
    raw.M = raw.M < 0 ? 0 : raw.M

    raw.R = roundTo(raw.D * (1 + raw.P) * raw.Q * raw.M, 2)
    raw.R = raw.R < 0 ? 0 : raw.R

    return {
      meta,
      result: raw,
      statuses: {},
    }
  }
}

export default {
  id: 'ijru.freestyle.sr@4.0.0',
  name: 'IJRU Single Rope Freestyle v4.0.0',
  options: [
    { id: 'interactions', name: 'Has Interactions', type: 'boolean' },
    { id: 'rqFullCreditThresholdLevel', name: 'Required Elements Full Credit Threshold Level', type: 'enum', enum: [0.5, 1, 2, 3, 4, 5, 6, 7, 8] },
    { id: 'maxRqGymnasticsPower', name: 'Power/Gymnastics Required Elements', type: 'number', min: 0, step: 1 },
    { id: 'maxRqMultiples', name: 'Multiples Required Elements', type: 'number', min: 0, step: 1 },
    { id: 'maxRqRopeManipulation', name: 'Rope Manipulation Required Elements', type: 'number', min: 0, step: 1 },
    { id: 'maxRqInteractions', name: 'Interactions Required Elements', type: 'number', min: 0, step: 1 },
  ],
  statusDefinitions: [],
  judges: [presentationJudge, technicalJudgeFactory({ discipline: 'sr' }), difficultyJudgeFactory('Dp', 'Difficulty - Power and Gymnastics', { discipline: 'sr' }), difficultyJudgeFactory('Dm', 'Difficulty - Multiples', { discipline: 'sr' }), difficultyJudgeFactory('Dr', 'Difficulty - Rope Manipulation', { discipline: 'sr' })],

  calculateEntry: calculateEntryFactory({ discipline: 'sr' }),
  rankEntries: (res, options) => {
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

    const high = results[0]?.result.R ?? 0
    const low = results.length > 1 ? results[results.length - 1]?.result.R ?? 0 : 0

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
        N: high === low ? 100 : roundTo((((100 - 1) * ((el.result.R ?? 0) - low)) / (high - low)) + 1, 2),
      },
    }))

    return results
  },

  previewTable: options => freestylePreviewTableHeadersFactory({ discipline: 'sr' })(options),
  resultTable: options => freestyleResultTableHeaders,
} satisfies CompetitionEventModel<Option>
