import { RSUnsupported } from './errors.js'
import type { CompetitionEventModel, OverallModel } from './models/types.js'
import type { CompetitionEvent, Overall } from './preconfigured/types.js'
import type { Ruleset } from './rulesets/types.js'

const modelRegex = /^[a-z0-9-.]+@(?<version>[a-z0-9-.]+)$/
const evtDefRegex = /^e\.(?<org>[a-z]+)(?:\.(?:[a-z0-9-]+)){5}@(?<version>[a-z0-9-.]+)$/
const rulesetRegex = /^[a-z0-9-]+@(?<version>[a-z0-9-.]+)$/

export async function importCompetitionEventModel (modelId: string): Promise<CompetitionEventModel> {
  if (!modelRegex.test(modelId)) throw new TypeError('Invalid competitionEvent provided must be in the form of <model id>@<version>')
  try {
    return (await import(`./models/competition-events/${modelId}.js`)).default.default
  } catch {
    throw new RSUnsupported('competition-event-model', modelId)
  }
}
export async function importOverallModel (modelId: string): Promise<OverallModel> {
  if (!modelRegex.test(modelId)) throw new TypeError('Invalid competitionEvent provided must be in the form of <model id>@<version>')
  try {
    return (await import(`./models/overalls/${modelId}.js`)).default.default
  } catch {
    throw new RSUnsupported('overall-model', modelId)
  }
}

export async function importPreconfiguredCompetitionEvent (competitionEvent: string): Promise<CompetitionEvent> {
  const match = evtDefRegex.exec(competitionEvent)
  if (match?.groups?.org == null || match.groups?.version == null) throw new TypeError('Invalid competitionEvent provided must be in the form of <event definition lookup code>@<version>')
  try {
    return (await import(`./preconfigured/competition-events/${match.groups.org}/${match.groups.version}/${competitionEvent}.js`)).default.default
  } catch {
    throw new RSUnsupported('competition-event-preconfigured', competitionEvent)
  }
}
export async function importPreconfiguredOverall (competitionEvent: string): Promise<Overall> {
  const match = evtDefRegex.exec(competitionEvent)
  if (match?.groups?.org == null || match.groups?.version == null) throw new TypeError('Invalid competitionEvent provided must be in the form of <event definition lookup code>@<version>')
  try {
    return (await import(`./preconfigured/overalls/${match.groups.org}/${match.groups.version}/${competitionEvent}.js`)).default.default
  } catch {
    throw new RSUnsupported('overall-preconfigured', competitionEvent)
  }
}

export async function importRuleset (rulesetId: string): Promise<Ruleset> {
  if (!rulesetRegex.test(rulesetId)) throw new TypeError('Invalid competitionEvent provided must be in the form of <ruleset id>@<version>')
  if (rulesetId === 'types') throw new RSUnsupported('ruleset', rulesetId)
  try {
    return (await import(`./rulesets/${rulesetId}.js`)).default.default
  } catch {
    throw new RSUnsupported('ruleset', rulesetId)
  }
}
