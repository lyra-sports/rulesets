import assert from 'node:assert'
import test from 'node:test'
import model from './ijru.overall@1.0.0.js'
import { type EntryResult, type EntryMeta } from '../types.js'
import { type CompetitionEventDefinition } from '../../preconfigured/types.js'

const srif: CompetitionEventDefinition = 'e.ijru.fs.sr.srif.1.75@4.0.0'
const srss: CompetitionEventDefinition = 'e.ijru.sp.sr.srss.1.30@1.0.0'

const competitionEventOptions = {
  [srif]: {},
  [srss]: {},
}

function entryResult (participantId: string, competitionEvent: CompetitionEventDefinition, { R, S, N }: { R: number, S: number, N: number }): EntryResult {
  const meta: EntryMeta = {
    entryId: `${participantId}-${competitionEvent}`,
    participantId,
    competitionEvent,
  }
  return { meta, result: { R, S, N }, statuses: {} }
}

void test('ijru.overall@1.0.0', async t => {
  await t.test('rankOverall', async t => {
    await t.test('ranks by rank sum, tie broken by normalised score', () => {
      const results = [
        entryResult('alice', srif, { R: 50, S: 1, N: 100 }),
        entryResult('alice', srss, { R: 20, S: 1, N: 100 }),
        entryResult('bob', srif, { R: 40, S: 2, N: 100 }),
        entryResult('bob', srss, { R: 10, S: 3, N: 100 }),
        entryResult('carol', srif, { R: 30, S: 3, N: 50 }),
        entryResult('carol', srss, { R: 15, S: 2, N: 50 }),
      ]
      const ranked = model.rankOverall(results, {}, competitionEventOptions)
      assert.deepStrictEqual(
        ranked.map(r => ({ participantId: r.meta.participantId, T: r.result.T, B: r.result.B, S: r.result.S })),
        [
          { participantId: 'alice', T: 2, B: 200, S: 1 },
          { participantId: 'bob', T: 5, B: 200, S: 2 },
          { participantId: 'carol', T: 5, B: 100, S: 3 },
        ]
      )
    })

    await t.test('shares a rank only when both rank sum and normalised score tie', () => {
      const results = [
        entryResult('dave', srif, { R: 50, S: 1, N: 100 }),
        entryResult('dave', srss, { R: 10, S: 2, N: 90 }),
        entryResult('erin', srif, { R: 40, S: 2, N: 90 }),
        entryResult('erin', srss, { R: 20, S: 1, N: 100 }),
        entryResult('frank', srif, { R: 30, S: 3, N: 50 }),
        entryResult('frank', srss, { R: 5, S: 3, N: 50 }),
      ]
      const ranked = model.rankOverall(results, {}, competitionEventOptions)
      assert.deepStrictEqual(
        ranked.map(r => ({ participantId: r.meta.participantId, T: r.result.T, B: r.result.B, S: r.result.S })),
        [
          { participantId: 'dave', T: 3, B: 190, S: 1 },
          { participantId: 'erin', T: 3, B: 190, S: 1 },
          { participantId: 'frank', T: 6, B: 100, S: 3 },
        ]
      )
    })

    await t.test('applies multipliers', () => {
      const results = [
        entryResult('alice', srif, { R: 50, S: 1, N: 100 }),
        entryResult('alice', srss, { R: 20, S: 2, N: 90 }),
        entryResult('bob', srif, { R: 40, S: 2, N: 90 }),
        entryResult('bob', srss, { R: 25, S: 1, N: 100 }),
      ]
      const ranked = model.rankOverall(results, {}, {
        [srif]: { rankMultiplier: 3, resultMultiplier: 2, normalisationMultiplier: 2 },
        [srss]: {},
      })
      assert.deepStrictEqual(
        ranked.map(r => ({ participantId: r.meta.participantId, R: r.result.R, T: r.result.T, B: r.result.B, S: r.result.S })),
        [
          { participantId: 'alice', R: 120, T: 5, B: 290, S: 1 },
          { participantId: 'bob', R: 105, T: 7, B: 280, S: 2 },
        ]
      )
    })
  })
})
