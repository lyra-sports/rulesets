const assert = require('node:assert/strict')
const { readdirSync } = require('node:fs')
const path = require('node:path')

const pkg = '@ropescore/rulesets'

const root = require(pkg)

async function run () {
  for (const fn of ['listCompetitionEventModels', 'listOverallModels', 'listPreconfiguredCompetitionEvents', 'listPreconfiguredOveralls', 'listRulesets']) {
    const data = await root[fn]()
    assert.ok(Object.keys(data).length > 0, `${fn} returned no entries`)
  }

  const ruleset = await root.importRuleset('ijru@4.2.0')
  assert.equal(ruleset.id, 'ijru@4.2.0')
  const model = await root.importCompetitionEventModel('ijru.speed@1.0.0')
  assert.equal(model.id, 'ijru.speed@1.0.0')

  const deepRuleset = require(`${pkg}/rulesets/ijru@4.2.0`).default
  assert.equal(deepRuleset.id, 'ijru@4.2.0')
  const deepPreconfigured = require(`${pkg}/preconfigured/competition-events/ijru/4.2.0/e.ijru.fs.sr.srtf.4.75@4.2.0`).default
  assert.equal(deepPreconfigured.id, 'e.ijru.fs.sr.srtf.4.75@4.2.0')
  const deepModel = require(`${pkg}/models/competition-events/ijru.speed@1.0.0`).default
  assert.equal(deepModel.id, 'ijru.speed@1.0.0')

  const cjsDir = path.resolve(require.resolve(pkg), '../..')
  const files = readdirSync(cjsDir, { recursive: true })
    .map(f => f.toString())
    .filter(f => f.endsWith('.js'))
  for (const file of files) {
    require(path.join(cjsDir, file))
  }
  assert.ok(files.length > 100, `expected the CJS build to contain more than 100 modules, found ${files.length}`)

  console.log(`CJS smoke OK (${files.length} modules required)`)
}

run().catch(err => {
  console.error(err)
  process.exit(1)
})
