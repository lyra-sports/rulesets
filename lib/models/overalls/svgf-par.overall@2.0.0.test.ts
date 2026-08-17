import assert from 'node:assert'
import test from 'node:test'
import model from './svgf-par.overall@2.0.0.js'
import { type EntryResult, type EntryMeta } from '../types.js'
import { type CompetitionEventDefinition } from '../../preconfigured/types.js'

const srpf: CompetitionEventDefinition = 'e.ijru.fs.sr.srpf.2.75@2.0.0'
const srdr: CompetitionEventDefinition = 'e.ijru.sp.sr.srdr.2.2x30@1.0.0'

const competitionEventOptions = {
  [srpf]: {},
  [srdr]: {},
}

function entryResult (participantId: string, competitionEvent: CompetitionEventDefinition, { R, S, N }: { R: number, S: number, N: number }): EntryResult {
  const meta: EntryMeta = {
    entryId: `${participantId}-${competitionEvent}`,
    participantId,
    competitionEvent,
  }
  return { meta, result: { R, S, N }, statuses: {} }
}

void test('svgf-par.overall@2.0.0', async t => {
  await t.test('rankOverall', async t => {
    await t.test('ranks by rank sum, tie broken by normalised score', () => {
      const results = [
        entryResult('alice', srpf, { R: 50, S: 1, N: 100 }),
        entryResult('alice', srdr, { R: 20, S: 1, N: 100 }),
        entryResult('bob', srpf, { R: 40, S: 2, N: 100 }),
        entryResult('bob', srdr, { R: 10, S: 3, N: 100 }),
        entryResult('carol', srpf, { R: 30, S: 3, N: 50 }),
        entryResult('carol', srdr, { R: 15, S: 2, N: 50 }),
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
        entryResult('dave', srpf, { R: 50, S: 1, N: 100 }),
        entryResult('dave', srdr, { R: 10, S: 2, N: 90 }),
        entryResult('erin', srpf, { R: 40, S: 2, N: 90 }),
        entryResult('erin', srdr, { R: 20, S: 1, N: 100 }),
        entryResult('frank', srpf, { R: 30, S: 3, N: 50 }),
        entryResult('frank', srdr, { R: 5, S: 3, N: 50 }),
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
  })
})
