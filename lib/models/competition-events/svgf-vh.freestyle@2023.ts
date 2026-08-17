import { RSRWrongJudgeTypeError } from '../../errors.js'
import type { MarkReducer } from '../../helpers/helpers.js'
import { clampNumber, normaliseTally, formatFactor, matchMeta, roundTo, roundToCurry, calculateTallyFactory, createMarkReducer, simpleReducer } from '../../helpers/helpers.js'
import type { CompetitionEventModel, JudgeTallyFieldDefinition, JudgeTypeGetter, TableDefinition } from '../types.js'
import { average } from './svgf-vh.speed@2023.js'

type Option = 'discipline'

export function L (l: number): number {
  if (l === 0) return 0
  return l === 0.5 ? 0.5 : (0.5 * l) + 0.5
}

// ======
// JUDGES
// ======
export const difficultyJudge: JudgeTypeGetter<Option> = options => {
  const fieldDefinitions = [
    {
      name: 'Level 0.5',
      schema: 'diffL0.5',
      min: 0,
      step: 1,
    },
    ...Array(5).fill(undefined).map((el, idx) => ({
      name: `Level ${idx + 1}`,
      schema: `diffL${idx + 1}` as const,
      min: 0,
      step: 1,
    })),
  ] as const
  const levels: Record<string, number> = Object.fromEntries(Array(8).fill(undefined).map((el, idx) => [`diffL${idx + 1}`, idx + 1] as const))
  levels['diffL0.5'] = 0.5
  const id = 'D'
  return {
    id,
    name: 'Difficulty',
    markDefinitions: fieldDefinitions,
    tallyDefinitions: fieldDefinitions,
    statusDefinitions: [],
    createMarkReducer: () => createMarkReducer(simpleReducer, fieldDefinitions),
    calculateTally: calculateTallyFactory(id, simpleReducer, fieldDefinitions),
    calculateJudgeResult: scsh => {
      if (!matchMeta(scsh.meta, { judgeTypeId: id })) throw new RSRWrongJudgeTypeError(scsh.meta.judgeTypeId, id)
      const tally = normaliseTally(fieldDefinitions, scsh.tally)
      const D = fieldDefinitions.map(f => (tally[f.schema] ?? 0) * L(levels[f.schema] ?? 0)).reduce((a, b) => a + b)
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

export const presentationJudge: JudgeTypeGetter<Option> = options => {
  const fieldDefinitions = [
    {
      schema: 'musicOnBeat',
      name: 'Takt',
      min: 1,
      max: 3,
      step: 1,
    },
    {
      schema: 'formExecution',
      name: 'Teknik',
      min: 1,
      max: 3,
      step: 1,
    },
    {
      schema: 'impression',
      name: 'Presentation',
      min: 1,
      max: 3,
      step: 1,
    },
    {
      schema: 'miss',
      name: 'Missar',
      min: 1,
      max: 3,
      step: 1,
    },
  ] as const

  const reducer: MarkReducer<string> = (tally, mark) => {
    tally[mark.schema] = mark.value ?? 1
    return tally
  }

  const id = 'P'
  return {
    id,
    name: 'Presentation',
    markDefinitions: fieldDefinitions,
    tallyDefinitions: fieldDefinitions,
    statusDefinitions: [],
    createMarkReducer: () => createMarkReducer(reducer, fieldDefinitions),
    calculateTally: calculateTallyFactory(id, reducer, fieldDefinitions),
    calculateJudgeResult: scsh => {
      if (!matchMeta(scsh.meta, { judgeTypeId: id })) throw new RSRWrongJudgeTypeError(scsh.meta.judgeTypeId, id)
      const tally = normaliseTally(fieldDefinitions, scsh.tally)

      const score = fieldDefinitions.map(f => tally[f.schema] ?? 0).reduce((a, b) => a + b)

      return {
        meta: scsh.meta,
        result: {
          P: roundTo(score, 2),
        },
        statuses: {},
      }
    },
  }
}

export const requiredElementsJudge: JudgeTypeGetter<Option> = options => {
  const isDD = options.discipline === 'dd'
  let fieldDefinitions: Array<JudgeTallyFieldDefinition<string>>

  if (isDD) {
    fieldDefinitions = [
      {
        schema: 'rqHighKnee',
        name: '4 höga knä',
        min: 0,
        max: 1,
        step: 1,
      },
      {
        schema: 'rqSki',
        name: '4 skidhopp',
        min: 0,
        max: 1,
        step: 1,
      },
      {
        schema: 'rqTurn',
        name: 'Snurra runt',
        min: 0,
        max: 1,
        step: 1,
      },
      {
        schema: 'rqPair',
        name: 'Parövning',
        min: 0,
        max: 1,
        step: 1,
      },
      {
        schema: 'rqTool',
        name: 'Handredskap',
        min: 0,
        max: 1,
        step: 1,
      },
    ]
  } else {
    fieldDefinitions = [
      {
        schema: 'rqHighKnee',
        name: '4 höga knä',
        min: 0,
        max: 1,
        step: 1,
      },
      {
        schema: 'rqBack',
        name: '4 baklänges hopp',
        min: 0,
        max: 1,
        step: 1,
      },
      {
        schema: 'rqCross',
        name: '4 korshopp',
        min: 0,
        max: 1,
        step: 1,
      },
      {
        schema: 'rqSideJump',
        name: '4 sidsväng-hopp',
        min: 0,
        max: 1,
        step: 1,
      },
      {
        schema: 'rqOutTogether',
        name: '4 ut-ihop med benen',
        min: 0,
        max: 1,
        step: 1,
      },
    ]
  }

  const id = 'O'
  return {
    id,
    name: 'Obligatoriska',
    markDefinitions: fieldDefinitions,
    tallyDefinitions: fieldDefinitions,
    statusDefinitions: [],
    createMarkReducer: () => createMarkReducer(simpleReducer, fieldDefinitions),
    calculateTally: calculateTallyFactory(id, simpleReducer, fieldDefinitions),
    calculateJudgeResult: scsh => {
      if (!matchMeta(scsh.meta, { judgeTypeId: id })) throw new RSRWrongJudgeTypeError(scsh.meta.judgeTypeId, id)
      const tally = normaliseTally(fieldDefinitions, scsh.tally)

      const completed = fieldDefinitions
        .map<number>(f => (tally[f.schema] ?? 0) >= 1 ? 1 : 0)
        .reduce((a, b) => a + b)

      const score = 1 - ((5 - completed) * 0.1)

      return {
        meta: scsh.meta,
        result: {
          O: roundTo(score, 1),
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
    { text: 'Obliga (O)', key: 'O', formatter: formatFactor },
    { text: 'Diff - Obliga (Rdo)', key: 'Rdo', formatter: roundToCurry(2) },
    { text: 'Pres (P)', key: 'P', formatter: roundToCurry(2) },
  ],
}

export const freestyleResultTableHeaders: TableDefinition = {
  headers: [
    { text: 'Pres', key: 'Rp', formatter: roundToCurry(2) },
    { text: 'Crea Rank', key: 'CRank', color: 'red' },

    { text: 'Diff - Obliga', key: 'Rdo', formatter: roundToCurry(2) },
    { text: 'Diff Rank', key: 'DRank', color: 'red' },

    { text: 'Rank Sum', key: 'T', color: 'green' },
    { text: 'Rank', key: 'S', color: 'red', primary: 'rank' },
  ],
}

export default {
  id: 'svgf-vh.freestyle@2023',
  name: 'SvGF Vikingahoppet Freestyle 2023',
  options: [
    { id: 'discipline', name: 'Discipline', type: 'enum', enum: ['sr', 'dd', 'wh', 'ts', 'xd'] },
  ],
  statusDefinitions: [],
  judges: [difficultyJudge, presentationJudge, requiredElementsJudge],

  calculateEntry (meta, res, options) {
    const results = res.filter(r => matchMeta(r.meta, meta))
    if (!results.length) return

    const Ps = results.map(res => res.result.P).filter(P => typeof P === 'number')
    const P = average(Ps) ?? 0

    const Ds = results.map(res => res.result.D).filter(D => typeof D === 'number')
    const D = average(Ds) ?? 0

    const Os = results.map(res => res.result.O).filter(O => typeof O === 'number')
    const O = average(Os) ?? 0

    const Rdo = clampNumber((D ?? 0) * (O ?? 1), { min: 0 })

    return {
      meta,
      result: {
        P: roundTo(P, 2),
        D: roundTo(D, 2),
        O: roundTo(O, 2),
        Rdo: roundTo(Rdo, 2),
        Rp: roundTo(P, 2),
      },
      statuses: {},
    }
  },
  rankEntries (res, options) {
    let results = [...res]
    const CScores = results.map(el => el.result.Rp ?? -Infinity)
    const DScores = results.map(el => el.result.Rdo ?? -Infinity)

    /* sort descending */
    CScores.sort(function (a, b) {
      return b - a // sort descending
    })
    DScores.sort(function (a, b) {
      return b - a // sort descending
    })

    results = results.map((el, idx, arr) => {
      const CRank = CScores.findIndex(score => score === el.result.Rp) + 1
      const DRank = DScores.findIndex(score => score === el.result.Rdo) + 1

      return {
        ...el,
        result: {
          ...el.result,
          CRank,
          DRank,
          T: CRank + DRank,
        },
      }
    })

    /* sort ascending on rank but alphabetically on id if ranksums are equal */
    results.sort((a, b) => {
      if (a.result.T === b.result.T) {
        return `${a.meta.participantId}`.localeCompare(`${b.meta.participantId}`)
      } else {
        return (a.result.T ?? 0) - (b.result.T ?? 0)
      }
    })

    results = results.map((el, idx, arr) => ({
      ...el,
      result: {
        ...el.result,
        S: arr.findIndex(score => score.result.T === el.result.T) + 1,
      },
    }))

    return results
  },

  previewTable: options => freestylePreviewTableHeaders,
  resultTable: options => freestyleResultTableHeaders,
} satisfies CompetitionEventModel<Option>
