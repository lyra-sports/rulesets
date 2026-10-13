import assert from 'node:assert'
import test from 'node:test'
import { partiallyConfigureCompetitionEventModel, partiallyConfigureOverallModel } from './types.js'
import ijruSpeed100 from '../models/competition-events/ijru.speed@1.0.0.js'
import ijruOverall100 from '../models/overalls/ijru.overall@1.0.0.js'
import srss from './competition-events/ijru/1.0.0/e.ijru.sp.sr.srss.1.30@1.0.0.js'
import srsr from './competition-events/ijru/1.0.0/e.ijru.sp.sr.srsr.4.4x30@1.0.0.js'

void test('preconfigured/types', async t => {
  await t.test('partiallyConfigureCompetitionEventModel', async t => {
    await t.test('exposes the preset options as configuredOptions', () => {
      const cEvt = partiallyConfigureCompetitionEventModel(ijruSpeed100, {
        id: 'e.test.sp.sr.test.1.30@1.0.0',
        name: 'Test',
        options: { falseSwitches: 2 },
      })
      assert.deepStrictEqual(cEvt.configuredOptions, { falseSwitches: 2 })
      assert.deepStrictEqual(cEvt.options, [])
    })
  })

  await t.test('partiallyConfigureOverallModel', async t => {
    await t.test('exposes the preset options as configuredOptions', () => {
      const overall = partiallyConfigureOverallModel(ijruOverall100, {
        id: 'e.test.oa.sr.test.1.0@1.0.0',
        name: 'Test',
        options: {},
        competitionEventOptions: {},
      })
      assert.deepStrictEqual(overall.configuredOptions, {})
    })
  })

  await t.test('e.ijru.sp.sr.srss.1.30@1.0.0', async t => {
    await t.test('presets zero false switches', () => {
      assert.strictEqual(srss.configuredOptions.falseSwitches, 0)
    })
    await t.test('head judge has no falseSwitch field', () => {
      const headJudge = srss.judges.map(j => j({})).find(j => j.id === 'Shj')
      assert.ok(headJudge)
      assert.strictEqual(headJudge.tallyDefinitions.find(d => d.schema === 'falseSwitch'), undefined)
      assert.strictEqual(headJudge.markDefinitions.find(d => d.schema === 'falseSwitch'), undefined)
    })
  })

  await t.test('e.ijru.sp.sr.srsr.4.4x30@1.0.0', async t => {
    await t.test('presets three false switches', () => {
      assert.strictEqual(srsr.configuredOptions.falseSwitches, 3)
    })
    await t.test('head judge has a falseSwitch field with max 3', () => {
      const headJudge = srsr.judges.map(j => j({})).find(j => j.id === 'Shj')
      assert.ok(headJudge)
      const falseSwitch = headJudge.tallyDefinitions.find(d => d.schema === 'falseSwitch')
      assert.ok(falseSwitch)
      assert.strictEqual(falseSwitch.max, 3)
    })
  })
})
