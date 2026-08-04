import { type CompetitionEventModel, type OverallModel, type CompetitionEventsOptions, type Options } from '../models/types.js'

export type CompetitionEventDefinition = `e.${string}.${'fs' | 'sp' | 'oa'}.${'sr' | 'dd' | 'wh' | 'ts' | 'xd'}.${string}.${number}.${`${number}x${number}` | number}@${string}`

export interface CompetitionEvent extends Omit<CompetitionEventModel, 'id'> {
  id: CompetitionEventDefinition
  modelId: CompetitionEventModel['id']
}

export interface PartiallyConfigureCompetitionEventModelOptions<Option extends string> {
  id: CompetitionEvent['id']
  name: string
  options: Options<Option>
}
export function partiallyConfigureCompetitionEventModel <Option extends string> (model: CompetitionEventModel<Option>, options: PartiallyConfigureCompetitionEventModelOptions<Option>): CompetitionEvent {
  return {
    id: options.id,
    modelId: model.id,
    name: options.name,
    options: model.options.filter(o => !(o.id in options.options)),
    judges: model.judges.map(j => (o: Partial<Record<Option, unknown>>) => j({ ...o, ...options.options })),
    calculateEntry (meta, results, o) {
      return model.calculateEntry(meta, results, { ...o, ...options.options })
    },
    rankEntries (results, o) {
      return model.rankEntries(results, { ...o, ...options.options })
    },
    previewTable (o) {
      return model.previewTable({ ...o, ...options.options })
    },
    resultTable (o) {
      return model.resultTable({ ...o, ...options.options })
    },
  }
}

export interface Overall extends Omit<OverallModel, 'id' | 'competitionEventOptions'> {
  id: CompetitionEventDefinition
  modelId: OverallModel['id']
  competitionEvents: CompetitionEventDefinition[]
  rankOverall: (results: Parameters<OverallModel['rankOverall']>[0], options: Parameters<OverallModel['rankOverall']>[1]) => ReturnType<OverallModel['rankOverall']>
}

export interface PartiallyConfigureOverallModelOptions<Option extends string, CompetitionEventOption extends string> {
  id: Overall['id']
  name: string
  options: Partial<Record<Option, unknown>>
  competitionEventOptions: CompetitionEventsOptions<CompetitionEventOption>
}
export function partiallyConfigureOverallModel <Option extends string, CompetitionEventOption extends string> (model: OverallModel<Option, CompetitionEventOption>, options: PartiallyConfigureOverallModelOptions<Option, CompetitionEventOption>): Overall {
  return {
    id: options.id,
    modelId: model.id,
    name: options.name,
    options: model.options.filter(o => !(o.id in options.options)),
    competitionEvents: Object.keys(options.competitionEventOptions) as CompetitionEventDefinition[],
    rankOverall (results, o) {
      return model.rankOverall(results, { ...o, ...options.options }, options.competitionEventOptions)
    },
    resultTable (o) {
      return model.resultTable({ ...o, ...options.options }, options.competitionEventOptions)
    },
  }
}
