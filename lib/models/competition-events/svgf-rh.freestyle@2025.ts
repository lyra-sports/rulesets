import { RSRWrongJudgeTypeError } from '../../errors.js'
import type { MarkReducer } from '../../helpers/helpers.js'
import { clampNumber, normaliseTally, matchMeta, roundTo, roundToCurry, calculateTallyFactory, createMarkReducer, simpleReducer } from '../../helpers/helpers.js'
import { type JudgeTypeGetter, type TableDefinition, type CompetitionEventModel } from '../types.js'
import { ijruAverage } from '../../helpers/ijru.js'

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
  const isDD = options.discipline === 'dd'
  const fieldDefinitions = [
    {
      schema: 'musicality',
      name: 'Musikalitet',
      min: 0,
      max: 10,
      step: 0.5,
    },
    ...(isDD
      ? [{
          schema: 'interactions',
          name: 'Interaktioner',
          min: 0,
          max: 10,
          step: 0.5,
        }]
      : []
    ),
    {
      schema: 'movement',
      name: 'Rörelse',
      min: 0,
      max: 10,
      step: 0.5,
    },
    {
      schema: 'formExecution',
      name: 'Utförande, teknik',
      min: 0,
      max: 10,
      step: 0.5,
    },
    {
      schema: 'impression',
      name: 'Helhetsintryck',
      min: 0,
      max: 10,
      step: 0.5,
    },
    {
      schema: 'miss',
      name: 'Missar',
      min: 0,
      step: 1,
    },
  ]

  const reducer: MarkReducer<typeof fieldDefinitions[number]['schema']> = (tally, mark) => {
    if (mark.schema !== 'miss') tally[mark.schema] = mark.value ?? 1
    else tally[mark.schema] = (tally[mark.schema] ?? 0) + (mark.value ?? 1)
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

      const score = fieldDefinitions
        .map(f => {
          if (f.schema !== 'miss') {
            return tally[f.schema] ?? 0
          } else {
            // First miss is free
            const missDeducs = clampNumber((tally.miss ?? 0) - 1, { min: 0 })
            return clampNumber(10 - missDeducs, { min: 0, max: 10 })
          }
        })
        .reduce((a, b) => a + b)

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

// ======
// TABLES
// ======
export const freestylePreviewTableHeaders: TableDefinition = {
  headers: [
    { text: 'Pres (P)', key: 'P', formatter: roundToCurry(2) },
    { text: 'Diff (D)', key: 'D', formatter: roundToCurry(2) },
    { text: 'Result (R)', key: 'R', formatter: roundToCurry(2) },
  ],
}

export const freestyleResultTableHeaders: TableDefinition = {
  headers: [
    { text: 'Pres', key: 'P', formatter: roundToCurry(2) },
    { text: 'Crea Rank', key: 'CRank', color: 'red', primary: 'rank' },

    { text: 'Diff', key: 'D', formatter: roundToCurry(2) },
    { text: 'Diff Rank', key: 'DRank', color: 'red', primary: 'rank' },

    { text: 'Rank Sum', key: 'T', color: 'green' },
  ],
}

export default {
  id: 'svgf-rh.freestyle@2025',
  name: 'SvGF Rikshoppet Freestyle 2025',
  options: [
    { id: 'discipline', name: 'Discipline', type: 'enum', enum: ['sr', 'dd', 'wh', 'ts', 'xd'] },
  ],
  statusDefinitions: [],
  judges: [difficultyJudge, presentationJudge],
  calculateEntry (meta, res, options) {
    const results = res.filter(r => matchMeta(r.meta, meta))
    if (!results.length) return

    const Ps = results.map(res => res.result.P).filter(P => typeof P === 'number')
    const P = ijruAverage(Ps) ?? 0

    const Ds = results.map(res => res.result.D).filter(D => typeof D === 'number')
    const D = ijruAverage(Ds) ?? 0

    const R = clampNumber((D ?? 0) + (P ?? 0), { min: 0 })

    return {
      meta,
      result: {
        P: roundTo(P, 2),
        D: roundTo(D, 2),
        R: roundTo(R, 2),
      },
      statuses: {},
    }
  },
  rankEntries (res, options) {
    let results = [...res]
    const CScores = results.map(el => el.result.P ?? -Infinity)
    const DScores = results.map(el => el.result.D ?? -Infinity)

    /* sort descending */
    CScores.sort(function (a, b) {
      return b - a // sort descending
    })
    DScores.sort(function (a, b) {
      return b - a // sort descending
    })

    results = results.map((el, idx, arr) => {
      const CRank = CScores.findIndex(score => score === el.result.P) + 1
      const DRank = DScores.findIndex(score => score === el.result.D) + 1

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

    /* sort ascending on rank but descending on score if ranksums are equal */
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
