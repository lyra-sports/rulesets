import assert from 'node:assert/strict'
import { readdirSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const pkg = '@ropescore/rulesets'

const root = await import(pkg)

for (const fn of ['listCompetitionEventModels', 'listOverallModels', 'listPreconfiguredCompetitionEvents', 'listPreconfiguredOveralls', 'listRulesets']) {
  const data = await root[fn]()
  assert.ok(Object.keys(data).length > 0, `${fn} returned no entries`)
}

const ruleset = await root.importRuleset('ijru@4.2.0')
assert.equal(ruleset.id, 'ijru@4.2.0')
const model = await root.importCompetitionEventModel('ijru.speed@1.0.0')
assert.equal(model.id, 'ijru.speed@1.0.0')
const cEvt = await root.importPreconfiguredCompetitionEvent('e.ijru.fs.sr.srtf.4.75@4.2.0')
assert.equal(cEvt.id, 'e.ijru.fs.sr.srtf.4.75@4.2.0')
const overall = await root.importPreconfiguredOverall('e.ijru.oa.sr.isro.1.0@4.0.0')
assert.equal(overall.id, 'e.ijru.oa.sr.isro.1.0@4.0.0')

const deepRuleset = (await import(`${pkg}/rulesets/ijru@4.2.0`)).default
assert.equal(deepRuleset.id, 'ijru@4.2.0')
const deepPreconfigured = (await import(`${pkg}/preconfigured/competition-events/ijru/4.2.0/e.ijru.fs.sr.srtf.4.75@4.2.0`)).default
assert.equal(deepPreconfigured.id, 'e.ijru.fs.sr.srtf.4.75@4.2.0')
const deepModel = (await import(`${pkg}/models/competition-events/ijru.speed@1.0.0`)).default
assert.equal(deepModel.id, 'ijru.speed@1.0.0')

const require = createRequire(import.meta.url)
const esmDir = path.resolve(require.resolve(pkg), '../../../esm')
const files = readdirSync(esmDir, { recursive: true })
  .map(f => f.toString())
  .filter(f => f.endsWith('.js'))
for (const file of files) {
  await import(pathToFileURL(path.join(esmDir, file)).href)
}
assert.ok(files.length > 100, `expected the ESM build to contain more than 100 modules, found ${files.length}`)

console.log(`ESM smoke OK (${files.length} modules imported)`)
