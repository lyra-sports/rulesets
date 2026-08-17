import assert from 'node:assert'
import test from 'node:test'
import { importCompetitionEventModel, importOverallModel, importPreconfiguredCompetitionEvent, importPreconfiguredOverall, importRuleset } from './import-tools.js'
import { RSUnsupported } from './errors.js'

void test('import-tools', async t => {
  await t.test('importCompetitionEventModel', async t => {
    await t.test('imports a model', async () => {
      const model = await importCompetitionEventModel('ijru.speed@1.0.0')
      assert.strictEqual(model.id, 'ijru.speed@1.0.0')
      assert.strictEqual(typeof model.calculateEntry, 'function')
      assert.strictEqual(typeof model.rankEntries, 'function')
    })
    await t.test('throws TypeError on an invalid id', async () => {
      await assert.rejects(importCompetitionEventModel('not@@valid'), TypeError)
    })
    await t.test('throws RSUnsupported on an unknown id', async () => {
      await assert.rejects(importCompetitionEventModel('ijru.speed@0.0.1'), RSUnsupported)
    })
  })

  await t.test('importOverallModel', async t => {
    await t.test('imports a model', async () => {
      const model = await importOverallModel('ijru.overall@1.0.0')
      assert.strictEqual(model.id, 'ijru.overall@1.0.0')
      assert.strictEqual(typeof model.rankOverall, 'function')
    })
    await t.test('throws TypeError on an invalid id', async () => {
      await assert.rejects(importOverallModel('not@@valid'), TypeError)
    })
    await t.test('throws RSUnsupported on an unknown id', async () => {
      await assert.rejects(importOverallModel('ijru.overall@0.0.1'), RSUnsupported)
    })
  })

  await t.test('importPreconfiguredCompetitionEvent', async t => {
    await t.test('imports a competition event', async () => {
      const cEvt = await importPreconfiguredCompetitionEvent('e.ijru.fs.sr.srtf.4.75@4.2.0')
      assert.strictEqual(cEvt.id, 'e.ijru.fs.sr.srtf.4.75@4.2.0')
      assert.strictEqual(cEvt.modelId, 'ijru.freestyle.sr@4.2.0')
    })
    await t.test('throws TypeError on an invalid id', async () => {
      await assert.rejects(importPreconfiguredCompetitionEvent('srtf@4.2.0'), TypeError)
    })
    await t.test('throws RSUnsupported on an unknown id', async () => {
      await assert.rejects(importPreconfiguredCompetitionEvent('e.ijru.fs.sr.srtf.4.75@0.0.1'), RSUnsupported)
    })
  })

  await t.test('importPreconfiguredOverall', async t => {
    await t.test('imports an overall', async () => {
      const overall = await importPreconfiguredOverall('e.ijru.oa.sr.isro.1.0@4.0.0')
      assert.strictEqual(overall.id, 'e.ijru.oa.sr.isro.1.0@4.0.0')
      assert.strictEqual(overall.modelId, 'ijru.overall@1.0.0')
    })
    await t.test('throws TypeError on an invalid id', async () => {
      await assert.rejects(importPreconfiguredOverall('isro@4.0.0'), TypeError)
    })
    await t.test('throws RSUnsupported on an unknown id', async () => {
      await assert.rejects(importPreconfiguredOverall('e.ijru.oa.sr.isro.1.0@0.0.1'), RSUnsupported)
    })
  })

  await t.test('importRuleset', async t => {
    await t.test('imports a ruleset', async () => {
      const ruleset = await importRuleset('ijru@4.2.0')
      assert.strictEqual(ruleset.id, 'ijru@4.2.0')
      assert.ok(ruleset.competitionEvents.length > 0)
    })
    await t.test('throws TypeError on an invalid id', async () => {
      await assert.rejects(importRuleset('ijru'), TypeError)
    })
    await t.test('throws RSUnsupported on an unknown id', async () => {
      await assert.rejects(importRuleset('ijru@0.0.1'), RSUnsupported)
    })
  })
})
