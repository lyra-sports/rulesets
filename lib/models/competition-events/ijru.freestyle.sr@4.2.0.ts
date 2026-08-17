import { RSRWrongJudgeTypeError } from '../../errors.js'
import { clampNumber, normaliseTally, matchMeta, calculateTallyFactory, createMarkReducer, simpleReducer } from '../../helpers/helpers.js'
import type { CompetitionEventModel, JudgeTypeGetter, Options } from '../types.js'
import * as ijruFreestyleSr400 from './ijru.freestyle.sr@4.0.0.js'

// reqEl
export function getRqNumSkills (options: Options<ijruFreestyleSr400.Option>) {
  return {
    rqGymnasticsPower: typeof options.maxRqGymnasticsPower === 'number' ? options.maxRqGymnasticsPower : 6,
    rqMultiples: typeof options.maxRqMultiples === 'number' ? options.maxRqMultiples : 6,
    rqRopeManipulation: typeof options.maxRqRopeManipulation === 'number' ? options.maxRqRopeManipulation : 6,
    rqInteractions: typeof options.maxRqInteractions === 'number' ? options.maxRqInteractions : 4,
  }
}

// ======
// JUDGES
// ======
export const difficultyJudgeFactory: (id: string, name: string, opts: { discipline: 'sr' | 'wh' }) => JudgeTypeGetter<ijruFreestyleSr400.Option> = (id, name, { discipline }) => options => {
  const numRq = getRqNumSkills(options)
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
      const d = fieldDefinitions.filter(f => f.schema !== 'rep').map(f => (tally[f.schema] ?? 0) * ijruFreestyleSr400.L(levels[f.schema] ?? 0)).reduce((a, b) => a + b, 0)

      const rqType = id.charAt(1).toLocaleUpperCase()
      let numRqType = 6
      switch (rqType) {
        case 'P':
          numRqType = numRq.rqGymnasticsPower
          break
        case 'M':
          numRqType = numRq.rqMultiples
          break
        case 'R':
          numRqType = numRq.rqRopeManipulation
          break
      }

      const rqCount = { full: 0, partial: 0 }
      for (const field of fieldDefinitions.filter(f => f.schema !== 'rep')) {
        rqCount[(levels[field.schema] ?? 0) < (options.rqFullCreditThresholdLevel as number | undefined ?? 3) ? 'partial' : 'full'] += tally[field.schema] ?? 0
      }
      let rq = numRqType

      if (rqCount.full > numRqType) rq = 0
      else {
        rq -= rqCount.full
        rq -= Math.min(rqCount.partial, numRqType - rqCount.full) * 0.5
      }

      return {
        meta: scsh.meta,
        result: {
          d,

          ...(isWH
            ? {}
            : {
                [`aq${rqType}`]: clampNumber(rq, { min: 0 }),
              }
          ),
        },
        statuses: {},
      }
    },
  }
}

export default {
  ...ijruFreestyleSr400.default,
  id: 'ijru.freestyle.sr@4.2.0',
  name: 'IJRU Single Rope Freestyle v4.2.0',
  statusDefinitions: [],
  judges: [
    ijruFreestyleSr400.presentationJudge,
    ijruFreestyleSr400.technicalJudgeFactory({ discipline: 'sr' }),
    difficultyJudgeFactory('Dp', 'Difficulty - Power and Gymnastics', { discipline: 'sr' }),
    difficultyJudgeFactory('Dm', 'Difficulty - Multiples', { discipline: 'sr' }),
    difficultyJudgeFactory('Dr', 'Difficulty - Rope Manipulation', { discipline: 'sr' }),
  ],
} satisfies CompetitionEventModel<ijruFreestyleSr400.Option>
