import { calculateTallyFactory, clampNumber, filterMarkStream, formatFactor, isObject, parseCompetitionEventDefinition, roundTo, roundToCurry, roundToMultiple, simpleReducer } from './helpers.js'
import type { GenericMark, JudgeMeta, JudgeTallyFieldDefinition, Mark } from '../models/types.js'
import assert from 'node:assert'
import test from 'node:test'

export function markGeneratorFactory () {
  let sequence = 0
  return function markGenerator (schema: string, extra: Record<string, any> = {}) {
    return {
      sequence: sequence++,
      timestamp: 1000 + sequence,
      schema,
      ...extra,
    }
  }
}

void test('helpers', async t => {
  await t.test('isObject', async t => {
    assert.strictEqual(isObject(5), false)
    assert.strictEqual(isObject(''), false)
    assert.strictEqual(isObject('hi'), false)
    assert.strictEqual(isObject(false), false)
    assert.strictEqual(isObject(true), false)
    assert.strictEqual(isObject(null), false)
    assert.strictEqual(isObject(undefined), false)
    assert.strictEqual(isObject([]), false)
    assert.strictEqual(isObject({}), true)
  })

  await t.test('roundToMultiple', async t => {
    await t.test('rounds to multiple of 0.5', () => {
      assert.strictEqual(roundToMultiple(5.4, 0.5), 5.5)
    })
    await t.test('rounds to whole number', () => {
      assert.strictEqual(roundToMultiple(5.4, 1), 5)
      assert.strictEqual(roundToMultiple(5.5, 1), 6)
      assert.strictEqual(roundToMultiple(5.6, 1), 6)
    })
    await t.test('rounds negative values away from zero on ties', () => {
      assert.strictEqual(roundToMultiple(-5.4, 1), -5)
      assert.strictEqual(roundToMultiple(-5.5, 1), -6)
      assert.strictEqual(roundToMultiple(-5.6, 1), -6)
      assert.strictEqual(roundToMultiple(-1.25, 0.5), -1.5)
    })
    await t.test('returns exact values for decimal multiples', () => {
      assert.strictEqual(roundToMultiple(0.3, 0.1), 0.3)
      assert.strictEqual(roundToMultiple(2.7, 0.1), 2.7)
    })
  })

  await t.test('roundTo', async t => {
    assert.strictEqual(roundTo(5.555, 2), 5.56)
    assert.strictEqual(roundTo(5.555, 0), 6)
  })

  await t.test('roundToCurry', async t => {
    assert.strictEqual(roundToCurry(2)(5.555), '5.56')
    assert.strictEqual(roundToCurry(0)(5.555), '6')
  })

  await t.test('clampNumber', async t => {
    await t.test('min', () => {
      assert.strictEqual(clampNumber(5, { min: 6 }), 6)
      assert.strictEqual(clampNumber(6, { min: 6 }), 6)
      assert.strictEqual(clampNumber(7, { min: 6 }), 7)
    })
    await t.test('max', () => {
      assert.strictEqual(clampNumber(5, { max: 6 }), 5)
      assert.strictEqual(clampNumber(6, { max: 6 }), 6)
      assert.strictEqual(clampNumber(7, { max: 6 }), 6)
    })
    await t.test('step', () => {
      assert.strictEqual(clampNumber(5.4, { step: 1 }), 5)
      assert.strictEqual(clampNumber(5.5, { step: 1 }), 6)
      assert.strictEqual(clampNumber(5.6, { step: 1 }), 6)
    })
    await t.test('step interacting with min/max', () => {
      assert.strictEqual(clampNumber(5.4, { min: 6, step: 1 }), 6)
      assert.strictEqual(clampNumber(5.4, { min: 5, step: 1 }), 5)
      assert.strictEqual(clampNumber(5.4, { min: 5, step: 0.5 }), 5.5)

      assert.strictEqual(clampNumber(5.6, { max: 5, step: 1 }), 5)
      assert.strictEqual(clampNumber(5.6, { max: 6, step: 1 }), 6)
      assert.strictEqual(clampNumber(5.6, { max: 6, step: 0.5 }), 5.5)
    })
  })

  await t.test('formatFactor', async t => {
    assert.strictEqual(formatFactor(1), '±0 %')
    assert.strictEqual(formatFactor(0.9), '-10 %')
    assert.strictEqual(formatFactor(1.1), '+10 %')
  })

  await t.test('filterMarkStream', async t => {
    const tests: Array<[name: string, input: Array<Mark<string>>, output: Array<GenericMark<string>>]> = [
      [
        'No special marks',
        [{ sequence: 1, timestamp: 1, schema: 'a' }, { sequence: 2, timestamp: 2, schema: 'a' }],
        [{ sequence: 1, timestamp: 1, schema: 'a' }, { sequence: 2, timestamp: 2, schema: 'a' }],
      ],
      [
        'Start at clear mark',
        [{ sequence: 1, timestamp: 1, schema: 'a' }, { sequence: 2, timestamp: 2, schema: 'a' }, { sequence: 3, timestamp: 3, schema: 'clear' }, { sequence: 4, timestamp: 4, schema: 'b' }, { sequence: 5, timestamp: 5, schema: 'b' }],
        [{ sequence: 4, timestamp: 4, schema: 'b' }, { sequence: 5, timestamp: 5, schema: 'b' }],
      ],
      [
        'Handle single undo',
        [{ sequence: 1, timestamp: 1, schema: 'a' }, { sequence: 2, timestamp: 2, schema: 'a' }, { sequence: 3, timestamp: 3, schema: 'undo', target: 2 }, { sequence: 4, timestamp: 4, schema: 'b' }, { sequence: 5, timestamp: 5, schema: 'b' }],
        [{ sequence: 1, timestamp: 1, schema: 'a' }, { sequence: 4, timestamp: 4, schema: 'b' }, { sequence: 5, timestamp: 5, schema: 'b' }],
      ],
      [
        'Handle two undos right after each other',
        [{ sequence: 1, timestamp: 1, schema: 'a' }, { sequence: 2, timestamp: 2, schema: 'a' }, { sequence: 3, timestamp: 3, schema: 'b' }, { sequence: 4, timestamp: 4, schema: 'undo', target: 2 }, { sequence: 5, timestamp: 5, schema: 'undo', target: 3 }, { sequence: 6, timestamp: 6, schema: 'b' }],
        [{ sequence: 1, timestamp: 1, schema: 'a' }, { sequence: 6, timestamp: 6, schema: 'b' }],
      ],
      [
        'Cannot undo an undo - silent ignore',
        [{ sequence: 1, timestamp: 1, schema: 'a' }, { sequence: 2, timestamp: 2, schema: 'a' }, { sequence: 3, timestamp: 3, schema: 'b' }, { sequence: 4, timestamp: 4, schema: 'undo', target: 2 }, { sequence: 5, timestamp: 5, schema: 'undo', target: 4 }, { sequence: 6, timestamp: 6, schema: 'b' }],
        [{ sequence: 1, timestamp: 1, schema: 'a' }, { sequence: 3, timestamp: 3, schema: 'b' }, { sequence: 6, timestamp: 6, schema: 'b' }],
      ],
      [
        'Cannot undo a clear mark - silent ignore',
        [{ sequence: 1, timestamp: 1, schema: 'a' }, { sequence: 2, timestamp: 2, schema: 'a' }, { sequence: 3, timestamp: 3, schema: 'b' }, { sequence: 4, timestamp: 4, schema: 'clear' }, { sequence: 5, timestamp: 5, schema: 'undo', target: 4 }, { sequence: 6, timestamp: 6, schema: 'b' }],
        [{ sequence: 6, timestamp: 6, schema: 'b' }],
      ],
      [
        'Cannot undo before a clear mark - silent ignore',
        [{ sequence: 1, timestamp: 1, schema: 'a' }, { sequence: 2, timestamp: 2, schema: 'a' }, { sequence: 3, timestamp: 3, schema: 'b' }, { sequence: 4, timestamp: 4, schema: 'clear' }, { sequence: 5, timestamp: 5, schema: 'undo', target: 2 }, { sequence: 6, timestamp: 6, schema: 'b' }],
        [{ sequence: 6, timestamp: 6, schema: 'b' }],
      ],
    ]
    for (const [title, input, output] of tests) {
      await t.test(title, () => {
        assert.deepStrictEqual(filterMarkStream(input), output)
      })
    }
  })

  await t.test('calculateTallyFactory', async t => {
    const meta: JudgeMeta = {
      judgeId: '1',
      judgeTypeId: 'S',
      entryId: '1',
      participantId: '1',
      competitionEvent: 'e.ijru.sp.sr.srss.1.30@1.0.0',
    }

    const tallyDefinitions: Array<JudgeTallyFieldDefinition<string>> = [
      { schema: 'formPlus', name: 'Form +' },
      { schema: 'formCheck', name: 'Form c' },
      { schema: 'formMinus', name: 'Form -' },
    ]

    await t.test('Should return tally for MarkScoresheet', () => {
      const marks: Array<Mark<string>> = [
        { sequence: 0, schema: 'formPlus', timestamp: 1 },
        { sequence: 1, schema: 'formCheck', timestamp: 15 },
        { sequence: 2, schema: 'formPlus', timestamp: 30 },
      ]
      const tally = {
        formPlus: 2,
        formCheck: 1,
        formMinus: 0,
      }
      assert.deepStrictEqual(calculateTallyFactory(meta.judgeTypeId, simpleReducer, tallyDefinitions)({ meta, marks }), { meta, tally })
    })

    await t.test('Should return tally for MarkScoresheet with undo of last mark', () => {
      const m = markGeneratorFactory()
      const marks: Array<Mark<string>> = [
        m('formPlus'),
        m('formCheck'),
        m('formPlus'),
        m('undo', { target: 2 }),
      ]
      const tally = {
        formPlus: 1,
        formCheck: 1,
        formMinus: 0,
      }
      assert.deepStrictEqual(calculateTallyFactory(meta.judgeTypeId, simpleReducer, tallyDefinitions)({ meta, marks }), { meta, tally })
    })

    await t.test('Should return tally for MarkScoresheet with undo of first mark', () => {
      const m = markGeneratorFactory()
      const marks: Array<Mark<string>> = [
        m('formPlus'),
        m('formCheck'),
        m('formPlus'),
        m('undo', { target: 0 }),
      ]
      const tally = {
        formPlus: 1,
        formCheck: 1,
        formMinus: 0,
      }
      assert.deepStrictEqual(calculateTallyFactory(meta.judgeTypeId, simpleReducer, tallyDefinitions)({ meta, marks }), { meta, tally })
    })

    await t.test('Should return tally for MarkScoresheet with undo of early mark', () => {
      const m = markGeneratorFactory()
      const marks: Array<Mark<string>> = [
        m('formPlus'),
        m('formCheck'),
        m('formPlus'),
        m('undo', { target: 1 }),
      ]
      const tally = {
        formPlus: 2,
        formCheck: 0,
        formMinus: 0,
      }
      assert.deepStrictEqual(calculateTallyFactory(meta.judgeTypeId, simpleReducer, tallyDefinitions)({ meta, marks }), { meta, tally })
    })

    await t.test('Should return tally for MarkScoresheet with clear mark', () => {
      const m = markGeneratorFactory()
      const marks: Array<Mark<string>> = [
        m('formPlus'),
        m('formCheck'),
        m('formPlus'),
        m('clear'),
        m('formPlus'),
        m('formPlus'),
        m('formPlus'),
      ]
      const tally = {
        formPlus: 3,
        formCheck: 0,
        formMinus: 0,
      }
      assert.deepStrictEqual(calculateTallyFactory(meta.judgeTypeId, simpleReducer, tallyDefinitions)({ meta, marks }), { meta, tally })
    })

    await t.test('Should return tally for MarkScoresheet with clear mark and undo targetting before clear', () => {
      const m = markGeneratorFactory()
      const marks: Array<Mark<string>> = [
        m('formPlus'),
        m('formCheck'),
        m('formPlus'),
        m('clear'),
        m('formPlus'),
        m('formPlus'),
        m('formPlus'),
        m('undo', { target: 1 }),
      ]
      const tally = {
        formPlus: 3,
        formCheck: 0,
        formMinus: 0,
      }
      assert.deepStrictEqual(calculateTallyFactory(meta.judgeTypeId, simpleReducer, tallyDefinitions)({ meta, marks }), { meta, tally })
    })
  })

  await t.test('parseCompetitionEventDefinition', async t => {
    await t.test('Should throw on invalid input', () => {
      const invalid = [
        1,
        null,
        false,
        undefined,
        '',
        'e',
        'e.ijru',
        'e.ijru.sp',
        'e.ijru.sp.sr',
        'e.ijru.sp.sr.srss',
        'e.ijru.sp.sr.srss.4',
        'e.ijru.sp.sr.srss.4.',
        'e.ijru.sp.sr.srss.4.a',
        'e.ijru.sp.sr.srss.a.3',
        'e.ijru.sp.aa.srss.4.3',
        'e.ijru.aa.sr.srss.4.3',
        'o.ijru.sp.sr.srss.4.3',
        'o.ijru.sp.sr.sr.ss.4.3',
        'o.ijru.sp.sr.srss.4.3@@',
        'o.ijru.sp.sr.srss.4.3@å',
      ]
      for (const cEvt of invalid) {
        assert.throws(
          () => parseCompetitionEventDefinition(cEvt as string),
          new TypeError(`Not a valid competition event, got ${cEvt}`)
        )
      }
    })

    await t.test('Should parse without version', () => {
      assert.deepStrictEqual(parseCompetitionEventDefinition('e.ijru.sp.sr.srss.1.30'), {
        org: 'ijru',
        type: 'sp',
        discipline: 'sr',
        eventAbbr: 'srss',
        numParticipants: 1,
        timing: '30',
        version: null,
      })
    })

    await t.test('Should parse with version', () => {
      assert.deepStrictEqual(parseCompetitionEventDefinition('e.svgf.oa.xd.tcaa.4.0@3.0.0'), {
        org: 'svgf',
        type: 'oa',
        discipline: 'xd',
        eventAbbr: 'tcaa',
        numParticipants: 4,
        timing: '0',
        version: '3.0.0',
      })
    })
  })
})
