import { type CompetitionEventDefinition } from './preconfigured/types.js'
import { type ModelOption, type ModelStatus } from './models/types.js'

export interface CompetitionEventModelInfo {
  id: string
  name: string
  options: Readonly<Array<ModelOption<string>>>
  // The formatter is a function and doesn't survive the JSON serialisation
  statusDefinitions: Readonly<Array<Omit<ModelStatus<string>, 'formatter'>>>
  // We can't include fieldDefinitions here since they depend on options
  judges: Readonly<Array<{ id: string, name: string }>>
}

export interface OverallModelInfo {
  id: string
  name: string
  options: Readonly<Array<ModelOption<string>>>
  competitionEventOptions: Readonly<Array<ModelOption<string>>>
  // The formatter is a function and doesn't survive the JSON serialisation
  statusDefinitions: Readonly<Array<Omit<ModelStatus<string>, 'formatter'>>>
}

export interface CompetitionEventInfo extends Omit<CompetitionEventModelInfo, 'id'> {
  id: CompetitionEventDefinition
  modelId: CompetitionEventModelInfo['id']
}

export interface OverallInfo extends Omit<OverallModelInfo, 'id' | 'competitionEventOptions'> {
  id: CompetitionEventDefinition
  modelId: OverallModelInfo['id']
  competitionEvents: readonly CompetitionEventDefinition[]
}

export interface RulesetInfo {
  id: string
  name: string
  competitionEvents: readonly CompetitionEventInfo[]
  overalls: readonly OverallInfo[]
  competitionEventModels: readonly CompetitionEventModelInfo[]
  overallModels: readonly OverallModelInfo[]
}

export async function listCompetitionEventModels () {
  return (await import('../data/competition-event-models.json', { assert: { type: 'json' } })).default
}
export async function listOverallModels () {
  return (await import('../data/overall-models.json', { assert: { type: 'json' } })).default
}

export async function listPreconfiguredCompetitionEvents () {
  return (await import('../data/competition-events.json', { assert: { type: 'json' } })).default
}
export async function listPreconfiguredOveralls () {
  return (await import('../data/overalls.json', { assert: { type: 'json' } })).default
}

export async function listRulesets () {
  return (await import('../data/rulesets.json', { assert: { type: 'json' } })).default
}
