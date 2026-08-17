import { RSUnsupported } from './errors.js'
import type { CompetitionEventModel, OverallModel } from './models/types.js'
import type { CompetitionEvent, Overall } from './preconfigured/types.js'
import type { Ruleset } from './rulesets/types.js'

const modelRegex = /^[a-z0-9-.]+@(?<version>[a-z0-9-.]+)$/
const evtDefRegex = /^e\.(?<org>[a-z]+)(?:\.(?:[a-z0-9-]+)){5}@(?<version>[a-z0-9-.]+)$/
const rulesetRegex = /^[a-z0-9-]+@(?<version>[a-z0-9-.]+)$/

function unwrapDefault<T> (mod: { default: T | { default: T } }): T {
  const def = mod.default
  return def != null && typeof def === 'object' && 'default' in def ? (def as { default: T }).default : (def as T)
}

function isModuleNotFoundError (err: unknown): boolean {
  return err instanceof Error && 'code' in err && (err.code === 'ERR_MODULE_NOT_FOUND' || err.code === 'MODULE_NOT_FOUND')
}

export async function importCompetitionEventModel (modelId: string): Promise<CompetitionEventModel> {
  if (!modelRegex.test(modelId)) throw new TypeError('Invalid modelId provided must be in the form of <model id>@<version>')
  try {
    return unwrapDefault<CompetitionEventModel>(await import(`./models/competition-events/${modelId}.js`))
  } catch (err) {
    if (!isModuleNotFoundError(err)) throw err
    throw new RSUnsupported('competition-event-model', modelId)
  }
}
export async function importOverallModel (modelId: string): Promise<OverallModel> {
  if (!modelRegex.test(modelId)) throw new TypeError('Invalid modelId provided must be in the form of <model id>@<version>')
  try {
    return unwrapDefault<OverallModel>(await import(`./models/overalls/${modelId}.js`))
  } catch (err) {
    if (!isModuleNotFoundError(err)) throw err
    throw new RSUnsupported('overall-model', modelId)
  }
}

export async function importPreconfiguredCompetitionEvent (competitionEvent: string): Promise<CompetitionEvent> {
  const match = evtDefRegex.exec(competitionEvent)
  if (match?.groups?.org == null || match.groups?.version == null) throw new TypeError('Invalid competitionEvent provided must be in the form of <event definition lookup code>@<version>')
  try {
    return unwrapDefault<CompetitionEvent>(await import(`./preconfigured/competition-events/${match.groups.org}/${match.groups.version}/${competitionEvent}.js`))
  } catch (err) {
    if (!isModuleNotFoundError(err)) throw err
    throw new RSUnsupported('competition-event-preconfigured', competitionEvent)
  }
}
export async function importPreconfiguredOverall (competitionEvent: string): Promise<Overall> {
  const match = evtDefRegex.exec(competitionEvent)
  if (match?.groups?.org == null || match.groups?.version == null) throw new TypeError('Invalid competitionEvent provided must be in the form of <event definition lookup code>@<version>')
  try {
    return unwrapDefault<Overall>(await import(`./preconfigured/overalls/${match.groups.org}/${match.groups.version}/${competitionEvent}.js`))
  } catch (err) {
    if (!isModuleNotFoundError(err)) throw err
    throw new RSUnsupported('overall-preconfigured', competitionEvent)
  }
}

export async function importRuleset (rulesetId: string): Promise<Ruleset> {
  if (!rulesetRegex.test(rulesetId)) throw new TypeError('Invalid rulesetId provided must be in the form of <ruleset id>@<version>')
  try {
    return unwrapDefault<Ruleset>(await import(`./rulesets/${rulesetId}.js`))
  } catch (err) {
    if (!isModuleNotFoundError(err)) throw err
    throw new RSUnsupported('ruleset', rulesetId)
  }
}
