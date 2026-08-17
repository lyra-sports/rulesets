import assert from 'node:assert'
import test from 'node:test'
import model from './svgf-rh.overall@2025.js'
import { type EntryResult, type EntryMeta } from '../types.js'
import { type CompetitionEventDefinition } from '../../preconfigured/types.js'

const srif: CompetitionEventDefinition = 'e.svgf.fs.sr.srif-rh.1.75@2025'
const srss: CompetitionEventDefinition = 'e.svgf.sp.sr.srss.1.30@2025'

const competitionEventOptions = {
  [srif]: {},
  [srss]: {},
}

function entryResult (participantId: string, competitionEvent: CompetitionEventDefinition, result: Record<string, number>): EntryResult {
  const meta: EntryMeta = {
    entryId: `${participantId}-${competitionEvent}`,
    participantId,
    competitionEvent,
  }
  return { meta, result, statuses: {} }
}

void test('svgf-rh.overall@2025', async t => {
  await t.test('resultTable', () => {
    const table = model.resultTable({}, {
      [srif]: { name: 'Single Rope Some Event' },
      [srss]: {},
    })
    assert.ok((table.groups ?? []).length > 0)
    assert.ok(table.headers.length > 0)
  })

  await t.test('rankOverall', async t => {
    await t.test('ranks by rank sum, tie broken by freestyle presentation sum', () => {
      const results = [
        entryResult('alice', srif, { R: 50, T: 1, P: 20 }),
        entryResult('alice', srss, { R: 20, S: 1 }),
        entryResult('dave', srif, { R: 40, T: 2, P: 15 }),
        entryResult('dave', srss, { R: 15, S: 2 }),
        entryResult('erin', srif, { R: 30, T: 3, P: 10 }),
        entryResult('erin', srss, { R: 10, S: 1 }),
      ]
      const ranked = model.rankOverall(results, {}, competitionEventOptions)
      assert.deepStrictEqual(
        ranked.map(r => ({ participantId: r.meta.participantId, T: r.result.T, PSum: r.result.PSum, S: r.result.S })),
        [
          { participantId: 'alice', T: 2, PSum: 20, S: 1 },
          { participantId: 'dave', T: 4, PSum: 15, S: 2 },
          { participantId: 'erin', T: 4, PSum: 10, S: 3 },
        ]
      )
    })

    await t.test('excludes participants who did not compete in every event', () => {
      const results = [
        entryResult('alice', srif, { R: 50, T: 2, P: 20 }),
        entryResult('alice', srss, { R: 20, S: 1 }),
        entryResult('grace', srif, { R: 60, T: 1, P: 25 }),
      ]
      const ranked = model.rankOverall(results, {}, competitionEventOptions)
      assert.deepStrictEqual(
        ranked.map(r => ({ participantId: r.meta.participantId, S: r.result.S })),
        [{ participantId: 'alice', S: 1 }]
      )
    })
  })
})
