import { filterParticipatingInAll, parseCompetitionEventDefinition, roundTo } from '../../helpers/helpers.js'
import { type CompetitionEventDefinition } from '../../preconfigured/types.js'
import { type TableHeaderGroup, type OverallModel, type TableDefinitionGetter, type TableHeader, type EntryResult } from '../types.js'

type Option = never
type CompetitionEventOptions = 'name' | 'rankMultiplier'

export const overallTableFactory: TableDefinitionGetter<Option, CompetitionEventOptions> = (options, cEvtOptions) => {
  if (cEvtOptions == null) throw new TypeError('Missing competitionEventOptions argument')
  const groups: TableHeaderGroup[][] = []
  const cEvtDefs = Object.keys(cEvtOptions) as CompetitionEventDefinition[]

  const srEvts = cEvtDefs
    .filter(cEvt => parseCompetitionEventDefinition(cEvt).discipline === 'sr')
  const srEvtCols = srEvts
    .map(cEvt => parseCompetitionEventDefinition(cEvt).type === 'sp' ? 2 : 4)
    .reduce((acc, curr) => acc + curr, 0)
  const ddEvts = cEvtDefs
    .filter(cEvt => parseCompetitionEventDefinition(cEvt).discipline === 'dd')
  const ddEvtCols = ddEvts
    .map(cEvt => parseCompetitionEventDefinition(cEvt).type === 'sp' ? 2 : 4)
    .reduce((acc, curr) => acc + curr, 0)

  const disciplineGroup: TableHeaderGroup[] = []

  if (srEvtCols) {
    disciplineGroup.push({
      text: 'Single Rope',
      key: 'sr',
      colspan: srEvtCols,
    })
  }

  if (ddEvtCols) {
    disciplineGroup.push({
      text: 'Double Dutch',
      key: 'dd',
      colspan: ddEvtCols,
    })
  }

  disciplineGroup.push({
    text: 'Overall',
    key: 'oa',
    colspan: 2,
    rowspan: 2,
  })

  groups.push(disciplineGroup)

  const evtGroup: TableHeaderGroup[] = []

  for (const cEvt of [...srEvts, ...ddEvts]) {
    const isSp = cEvt.split('.')[2] === 'sp'
    const name = cEvtOptions[cEvt]?.name
    evtGroup.push({
      text: typeof name === 'string' ? name.replace(/^(Wheel|Single Rope) /, '') : cEvt.split('.')[4] ?? '',
      key: cEvt,
      colspan: isSp ? 2 : 4,
    })
  }

  groups.push(evtGroup)

  const headers: TableHeader[] = []

  for (const cEvt of [...srEvts, ...ddEvts]) {
    const isSp = parseCompetitionEventDefinition(cEvt).type === 'sp'
    if (isSp) {
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
    } else {
      headers.push({
        text: 'Pres',
        key: 'P',
        component: cEvt,
      }, {
        text: 'Rank',
        key: 'CRank',
        component: cEvt,
        color: 'red',
      }, {
        text: 'Diff',
        key: 'D',
        component: cEvt,
      }, {
        text: 'Rank',
        key: 'DRank',
        component: cEvt,
        color: 'red',
      })
    }
  }

  headers.push({
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
  id: 'svgf-rh.overall@2020',
  name: 'SvGF Rikshoppet Overall 2020',
  options: [],
  competitionEventOptions: [
    { id: 'name', name: 'Name', type: 'string' },
    { id: 'rankMultiplier', name: 'Rank Multiplier', type: 'number' },
  ],
  statusDefinitions: [],
  resultTable: overallTableFactory,
  rankOverall (results, options, competitionEventOptions) {
    const components: Partial<Record<CompetitionEventDefinition, readonly EntryResult[]>> = {}
    const competitionEventIds: CompetitionEventDefinition[] = Object.keys(competitionEventOptions) as CompetitionEventDefinition[]

    const eligibleResults = filterParticipatingInAll(results, competitionEventIds)

    for (const cEvtDef of competitionEventIds) {
      const ranked = eligibleResults.filter(result => result.meta.competitionEvent === cEvtDef)
      components[cEvtDef] = ranked
    }

    const participantIds = [...new Set(eligibleResults.map(r => r.meta.participantId))]

    const ranked = participantIds.map(participantId => {
      const cRes = competitionEventIds
        .map((cEvt) => components[cEvt]?.find(r => r.meta.participantId === participantId))
        .filter(r => !!r)

      const R = roundTo(cRes.reduce((acc, curr) => acc + (curr.result.R ?? 0), 0), 4)
      const T = cRes.reduce((acc, curr) =>
        acc + (
          (curr.result.T ?? curr.result.S ?? 0) *
        (Number.isInteger(competitionEventOptions[curr.meta.competitionEvent]?.rankMultiplier) ? competitionEventOptions[curr.meta.competitionEvent]?.rankMultiplier as number : 1)
        )
      , 0)

      return {
        meta: { participantId },
        result: { R, T, S: 0 },
        componentResults: Object.fromEntries(cRes.map(r => [r.meta.competitionEvent, r])),
        statuses: {},
      }
    })

    ranked.sort((a, b) => {
      return a.result.T - b.result.T
    })

    for (const result of ranked) {
      result.result.S = ranked.findIndex(obj => obj.result.T === result.result.T) + 1
    }

    return ranked
  },
} satisfies OverallModel<Option, CompetitionEventOptions>
