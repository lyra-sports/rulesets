import { writeFile, mkdir } from 'node:fs/promises'
import { glob } from 'glob'
import path from 'node:path'
import { type OverallModelInfo, type CompetitionEventModelInfo, type CompetitionEventInfo, type OverallInfo, type RulesetInfo } from '../lib/listing-tools.js'
import { type OverallModel, type CompetitionEventModel } from '../lib/models/types.js'
import { type Overall, type CompetitionEvent } from '../lib/preconfigured/types.js'
import { type Ruleset } from '../lib/rulesets/types.js'

export function cEvtFromPath (p: string) {
  return path.basename(p).replace(/\.(js|ts)$/, '')
}

export async function globImport <T> (patterns: string | string[], fullPath = false) {
  const files = await glob(patterns, {
    cwd: path.resolve(__dirname, '../lib'),
    ignore: {
      ignored: p => p.name.includes('.test.') || p.name.startsWith('types.'),
    },
  })

  const imported: Array<[string, T]> = await Promise.all(files.map(async p => [
    fullPath ? p : cEvtFromPath(p),
    (await import(path.resolve(__dirname, '../lib', p))).default,
  ]))

  return Object.fromEntries<T>(imported)
}

async function run () {
  const dataDir = path.resolve(__dirname, '../data')
  try {
    await mkdir(dataDir)
  } catch (err) {
    if (!(err instanceof Error) || !('code' in err) || err.code !== 'EEXIST') throw err
  }

  // competition event models
  const cEvtModels = await globImport<CompetitionEventModel>('models/competition-events/*.ts')
  const cEvtModelInfo: Record<string, CompetitionEventModelInfo> = {}

  for (const [cEvt, model] of Object.entries(cEvtModels)) {
    cEvtModelInfo[cEvt] = {
      id: model.id,
      name: model.name,
      options: model.options,
      statusDefinitions: model.statusDefinitions,
      judges: model.judges.map(j => {
        const judge = j({})
        return { id: judge.id, name: judge.name }
      }),
    }
  }

  await writeFile(path.resolve(dataDir, 'competition-event-models.json'), JSON.stringify(cEvtModelInfo, null, 2), 'utf-8')

  // overall models
  const overallModels = await globImport<OverallModel>('models/overalls/*.ts')
  const overallModelsInfo: Record<string, OverallModelInfo> = {}

  for (const [cEvt, model] of Object.entries(overallModels)) {
    overallModelsInfo[cEvt] = {
      id: model.id,
      name: model.name,
      options: model.options,
      competitionEventOptions: model.competitionEventOptions,
      statusDefinitions: model.statusDefinitions,
    }
  }

  await writeFile(path.resolve(dataDir, 'overall-models.json'), JSON.stringify(overallModelsInfo, null, 2), 'utf-8')

  // preconfigured competition events
  const competitionEvents = await globImport<CompetitionEvent>('preconfigured/competition-events/**/*.ts')
  const competitionEventsInfo: Record<string, CompetitionEventInfo> = {}

  for (const [cEvt, model] of Object.entries(competitionEvents)) {
    competitionEventsInfo[cEvt] = {
      id: model.id,
      modelId: model.modelId,
      name: model.name,
      options: model.options,
      statusDefinitions: model.statusDefinitions,
      judges: model.judges.map(j => {
        const judge = j({})
        return { id: judge.id, name: judge.name }
      }),
    }
  }

  await writeFile(path.resolve(dataDir, 'competition-events.json'), JSON.stringify(competitionEventsInfo, null, 2), 'utf-8')

  // preconfigured overalls
  const overalls = await globImport<Overall>('preconfigured/overalls/**/*.ts')
  const overallsInfo: Record<string, OverallInfo> = {}

  for (const [cEvt, model] of Object.entries(overalls)) {
    overallsInfo[cEvt] = {
      id: model.id,
      modelId: model.modelId,
      name: model.name,
      options: model.options,
      statusDefinitions: model.statusDefinitions,
      competitionEvents: model.competitionEvents,
    }
  }

  await writeFile(path.resolve(dataDir, 'overalls.json'), JSON.stringify(overallsInfo, null, 2), 'utf-8')

  // rulesets
  const rulesets = await globImport<Ruleset>('rulesets/*.ts')
  const rulesetsInfo: Record<string, RulesetInfo> = {}

  for (const [cEvt, model] of Object.entries(rulesets)) {
    rulesetsInfo[cEvt] = {
      id: model.id,
      name: model.name,
      competitionEvents: model.competitionEvents.map(cEvt => competitionEventsInfo[cEvt.id]),
      overalls: model.overalls.map(cEvt => overallsInfo[cEvt.id]),
      competitionEventModels: model.competitionEventModels.map(cEvt => cEvtModelInfo[cEvt.id]),
      overallModels: model.overallModels.map(cEvt => overallModelsInfo[cEvt.id]),
    }
  }

  await writeFile(path.resolve(dataDir, 'rulesets.json'), JSON.stringify(rulesetsInfo, null, 2), 'utf-8')
}

run()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err)
    process.exit(1)
  })
