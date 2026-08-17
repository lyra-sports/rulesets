import { roundTo, roundToCurry } from '../../helpers/helpers.js'
import { type CompetitionEventDefinition } from '../../preconfigured/types.js'
import { type TableHeaderGroup, type OverallModel, type TableDefinitionGetter, type TableHeader, type EntryResult } from '../types.js'

type Option = never
type CompetitionEventOptions = 'name' | 'rankMultiplier' | 'resultMultiplier' | 'normalisationMultiplier'

export const overallTableFactory: TableDefinitionGetter<Option, CompetitionEventOptions> = (options, cEvtOptions) => {
  if (cEvtOptions == null) throw new TypeError('Missing competitionEventOptions argument')
  const groups: TableHeaderGroup[][] = []
  const cEvtDefs = Object.keys(cEvtOptions) as CompetitionEventDefinition[]

  const srEvts = cEvtDefs.filter(cEvt => cEvt.split('.')[3] === 'sr')
  const ddEvts = cEvtDefs.filter(cEvt => cEvt.split('.')[3] === 'dd')

  const disciplineGroup: TableHeaderGroup[] = []

  if (srEvts.length) {
    disciplineGroup.push({
      text: 'Single Rope',
      key: 'sr',
      colspan: srEvts.length * 2,
    })
  }

  if (ddEvts.length) {
    disciplineGroup.push({
      text: 'Double Dutch',
      key: 'dd',
      colspan: ddEvts.length * 2,
    })
  }

  disciplineGroup.push({
    text: 'Overall',
    key: 'oa',
    colspan: 3,
    rowspan: 2,
  })

  groups.push(disciplineGroup)

  const evtGroup: TableHeaderGroup[] = []

  for (const cEvt of [...srEvts, ...ddEvts]) {
    evtGroup.push({
      text: typeof cEvtOptions[cEvt].name === 'string' ? cEvtOptions[cEvt].name.replace(/^(Double Dutch|Single Rope) /, '') : cEvt.split('.')[4] ?? '',
      key: cEvt,
      colspan: 2,
    })
  }

  groups.push(evtGroup)

  const headers: TableHeader[] = []

  for (const cEvt of [...srEvts, ...ddEvts]) {
    headers.push({
      text: 'Score',
      key: 'R',
      component: cEvt,
    }, {
      text: 'Rank',
      key: 'S',
      component: cEvt,
      color: 'red',
    })
  }

  headers.push({
    text: 'Normalised',
    key: 'B',
    color: 'gray',
    formatter: roundToCurry(2),
  }, {
    text: 'Rank Sum',
    key: 'T',
    color: 'green',
    primary: 'score',
  }, {
    text: 'Rank',
    key: 'S',
    color: 'red',
    primary: 'rank',
  })

  return {
    groups,
    headers,
  }
}

export default {
  id: 'ijru.overall@1.0.0',
  name: 'IJRU Overall v1.0.0',
  options: [],
  competitionEventOptions: [
    { id: 'name', name: 'Name', type: 'string' },
    { id: 'rankMultiplier', name: 'Rank Multiplier', type: 'number' },
    { id: 'resultMultiplier', name: 'Result Multiplier', type: 'number' },
    { id: 'normalisationMultiplier', name: 'Normalisation Multiplier', type: 'number' },
  ],
  statusDefinitions: [],
  resultTable: overallTableFactory,
  rankOverall (results, options, competitionEventOptions) {
    const components: Partial<Record<CompetitionEventDefinition, readonly EntryResult[]>> = {}
    const competitionEventIds: CompetitionEventDefinition[] = Object.keys(competitionEventOptions) as CompetitionEventDefinition[]

    for (const cEvtDef of competitionEventIds) {
      const ranked = results.filter(result => result.meta.competitionEvent === cEvtDef)
      components[cEvtDef] = ranked
    }

    const participantIds = [...new Set(results.map(r => r.meta.participantId))]

    const ranked = participantIds.map(participantId => {
      const cRes = competitionEventIds
        .map((cEvt) => components[cEvt]?.find(r => r.meta.participantId === participantId))
        .filter(r => !!r)

      const R = roundTo(cRes.reduce((acc, curr) =>
        acc + (
          (curr.result.R ?? 0) *
        (Number.isInteger(competitionEventOptions[curr.meta.competitionEvent]?.resultMultiplier) ? competitionEventOptions[curr.meta.competitionEvent]?.resultMultiplier as number : 1)
        )
      , 0), 4)
      const T = cRes.reduce((acc, curr) =>
        acc + (
          (curr.result.S ?? 0) *
        (Number.isInteger(competitionEventOptions[curr.meta.competitionEvent]?.rankMultiplier) ? competitionEventOptions[curr.meta.competitionEvent]?.rankMultiplier as number : 1)
        )
      , 0)
      const B = roundTo(cRes.reduce((acc, curr) =>
        acc + (
          (curr.result.N ?? 0) *
        (Number.isInteger(competitionEventOptions[curr.meta.competitionEvent]?.normalisationMultiplier) ? competitionEventOptions[curr.meta.competitionEvent]?.normalisationMultiplier as number : 1)
        )
      , 0), 2)

      return {
        meta: { participantId },
        result: { R, T, B, S: 0 },
        componentResults: Object.fromEntries(cRes.map(r => [r.meta.competitionEvent, r])),
        statuses: {},
      }
    })

    ranked.sort((a, b) => {
      if (a.result.T !== b.result.T) return a.result.T - b.result.T
      return b.result.B - a.result.B
    })

    for (const result of ranked) {
      result.result.S = ranked.findIndex(obj => obj.result.B === result.result.B) + 1
    }

    return ranked
  },
} satisfies OverallModel<Option, CompetitionEventOptions>
