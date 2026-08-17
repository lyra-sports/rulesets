export class RSRError extends Error {}

export class RSRWrongJudgeTypeError extends RSRError {
  constructor (actual: string, expected: string) {
    super(`Scoresheet for JudgeType ${actual} provided to calculation function for JudgeType ${expected}`)
  }
}

export class RSRMissingJudgeResultError extends RSRError {
  constructor (judgeTypeId: string) {
    super(`Missing judge result for judge type ${judgeTypeId}`)
  }
}

export class RSUnsupported extends RSRError {
  constructor (type: `${'competition-event' | 'overall'}-${'model' | 'preconfigured'}` | 'ruleset', id: string) {
    super(`Unsupported ${type}: ${id}`)
  }
}
