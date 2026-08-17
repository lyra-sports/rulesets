import assert from 'node:assert'
import test from 'node:test'
import model from './svgf-vh.overall@2023.js'
import { type EntryResult, type EntryMeta } from '../types.js'
import { type CompetitionEventDefinition } from '../../preconfigured/types.js'

const srif: CompetitionEventDefinition = 'e.svgf.fs.sr.srif-vh.1.75@2023'
const srss: CompetitionEventDefinition = 'e.svgf.sp.sr.srss.1.30@2023'

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

void test('svgf-vh.overall@2023', async t => {
  await t.test('rankOverall', async t => {
    await t.test('ranks by rank sum, sharing tied ranks', () => {
      const results = [
        entryResult('alice', srif, { R: 50, S: 1 }),
        entryResult('alice', srss, { R: 20, S: 1 }),
        entryResult('bob', srif, { R: 40, S: 2 }),
        entryResult('bob', srss, { R: 15, S: 2 }),
        entryResult('carol', srif, { R: 30, S: 3 }),
        entryResult('carol', srss, { R: 10, S: 1 }),
      ]
      const ranked = model.rankOverall(results, {}, competitionEventOptions)
      assert.deepStrictEqual(
        ranked.map(r => ({ participantId: r.meta.participantId, T: r.result.T, S: r.result.S })),
        [
          { participantId: 'alice', T: 2, S: 1 },
          { participantId: 'bob', T: 4, S: 2 },
          { participantId: 'carol', T: 4, S: 2 },
        ]
      )
    })

    await t.test('excludes participants who did not compete in every event', () => {
      const results = [
        entryResult('alice', srif, { R: 50, S: 2 }),
        entryResult('alice', srss, { R: 20, S: 1 }),
        entryResult('grace', srif, { R: 60, S: 1 }),
      ]
      const ranked = model.rankOverall(results, {}, competitionEventOptions)
      assert.deepStrictEqual(
        ranked.map(r => ({ participantId: r.meta.participantId, S: r.result.S })),
        [{ participantId: 'alice', S: 1 }]
      )
    })
  })
})
