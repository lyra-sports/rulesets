import type { MarkReducerReturn } from '../helpers/helpers.js'
import { isObject } from '../helpers/helpers.js'
import { type CompetitionEventDefinition } from '../preconfigured/types.js'

export interface JudgeType<MarkSchema extends string, TallySchema extends string = MarkSchema, Status extends string = string> {
  /**
   * This should be unique for the model, but may be the same as a judge used
   * in another model. For example it could be D for a Difficulty judge.
   */
  id: string
  /**
   * This is the human readable name for the judge type,
   * such as Athlete Presentation
   */
  name: string
  /**
   * These are the mark types available for the judge type providing the valid
   * mark schemas for this judge type
   */
  markDefinitions: Readonly<Array<JudgeMarkDefinition<MarkSchema>>>
  /**
   * These are the tally fields the marks will get converted into when calling
   * calculateTally, and some validation parameters for them. These can be used
   * to generate tabulator interfaces.
   */
  tallyDefinitions: Readonly<Array<JudgeTallyFieldDefinition<TallySchema>>>
  /**
   * Definitions of the values in the statuses object of the judge result, and
   * how to format the value when displaying it to a user.
   */
  statusDefinitions: Readonly<Array<ModelStatus<Status>>>
  /**
   * This returns what we call a mark reducer, an addMark function which you can
   * pass marks to one at a time, likely live as the marks get made by the
   * judges, and the current tally.
   */
  createMarkReducer: () => MarkReducerReturn<MarkSchema, TallySchema>
  /**
   * This takes a mark scoresheet and calculates an intermediate tally which is
   * the "human readable" format that can be viewed and edited in a tabulator
   * view, or submitted on physical scoresheets.
   *
   * This is usually just a wrapper for createMarkReducer that is easier to work
   * with when you have a complete scoresheet and locked markstream and don't
   * want to call addMark one by one. However, when finalising scores this
   * function should be used as it may sometimes do slightly more sophisticated
   * checks on the scores.
   */
  calculateTally: (scoresheet: MarkScoresheet<MarkSchema>) => TallyScoresheet<TallySchema>
  /**
   * This takes a tally scoresheet, and summarises it into a judge score. If the
   * judge has submitted a mark scoresheet it should first be processed with
   * calculateTally
   */
  calculateJudgeResult: (scoresheet: TallyScoresheet<TallySchema>) => JudgeResult
}

export type JudgeTypeGetter<Option extends string = string, MarkSchema extends string = string, TallySchema extends string = string, Status extends string = string> = (options: Options<Option>) => Readonly<JudgeType<MarkSchema, TallySchema, Status>>

export interface JudgeMarkDefinition<Schema extends string> {
  /**
   * an unique identifier for this field to identify it's marks or tally.
   * Multiple judge types can however be using this field with the same schema,
   * if they all judge the same thing.
   */
  schema: Schema
  /**
   * The human readable name of the field, such as "Level 8"
   */
  name: string
}

export interface JudgeTallyFieldDefinition<Schema extends string> extends JudgeMarkDefinition<Schema> {
  /** the minimum value for this field, if not set the value is not capped */
  min?: number
  /** the maximum value for this field, if not set the value is not capped */
  max?: number
  /**
   * the allowed step increment for this field, for example if this is set to
   * 0.5 only values with a 0.5 increment is allowed (such as 0, 0.5, 1, 1.5...)
   * whereas setting it to 1 would only allow steps of 1 (0, 1, 2...)
   */
  step?: number
  /**
   * The default tally value for this field
   * @default 0
   */
  default?: number
}

export type ScoreTally<Schema extends string = string> = Partial<Record<Schema, number>>

export interface MarkBase<Schema extends string> {
  /**
   * Unix epoch timestamp in milliseconds when this mark was recorded
   */
  readonly timestamp: number
  /**
   * Each new mark that's made increments this by one, the first mark should
   * have sequence 1 - it is used to identify missing marks (holey mark streams)
   * or to target a specific mark with an undo mark.
   */
  readonly sequence: number
  /**
   * This identifies the type of mark and generally matches up with the schema
   * of a JudgeFieldDefinition. However a mark stream/array can contain
   * additional marks with schemas that are unknown to the scoring model, if so
   * these will be ignored.
   */
  readonly schema: Schema
}

export interface GenericMark<Schema extends string> extends MarkBase<Schema> {
  /**
   * An optional numeric value for this field, usage is model dependent but in
   * general leaving this undefined will use a value of 1.
   */
  readonly value?: number
}
export function isGenericMark (x: unknown): x is GenericMark<string> { return isObject(x) && typeof x.timestamp === 'number' && typeof x.sequence === 'number' && typeof x.schema === 'string' }

/**
 * A clear mark tells the model to ignore any previous marks.
 */
export interface ClearMark extends MarkBase<string> {
  readonly schema: 'clear'
}
export function isClearMark (x: unknown): x is ClearMark { return isObject(x) && x.schema === 'clear' }

/**
 * A mark that targets a previous marks and undoes it. Cannot target a 'clear'
 * mark or other 'undo' mark.
 */
export interface UndoMark extends MarkBase<string> {
  readonly schema: 'undo'
  /** The sequence of the marks that this undoes */
  readonly target: number
}
export function isUndoMark (x: unknown): x is UndoMark { return isObject(x) && x.schema === 'undo' }

export type Mark<Schema extends string> = GenericMark<Schema> | UndoMark | ClearMark

export interface MarkScoresheet<Schema extends string> {
  meta: JudgeMeta
  marks: Readonly<Array<Mark<Schema>>>
}

export interface TallyScoresheet<Schema extends string> {
  meta: JudgeMeta
  tally: Readonly<ScoreTally<Schema>>
}

export type Scoresheet<Schema extends string> = MarkScoresheet<Schema> | TallyScoresheet<Schema>
export type Meta = JudgeMeta | EntryMeta | OverallMeta

// TODO: it might be possible to type the values
export type Options<Option extends string> = Partial<Record<Option, unknown>>
export type CompetitionEventsOptions <Option extends string> = Record<CompetitionEventDefinition, Partial<Record<Option, unknown>>>

export interface JudgeMeta extends EntryMeta {
  judgeId: string | number
  judgeTypeId: string
}

export interface JudgeResult {
  meta: JudgeMeta
  result: Record<string, number>
  statuses: Record<string, unknown>
}

export interface EntryMeta extends OverallMeta {
  entryId: string | number
  competitionEvent: CompetitionEventDefinition
}

export interface EntryResult {
  meta: EntryMeta
  result: Record<string, number>
  statuses: Record<string, unknown>
}

export interface OverallMeta {
  participantId: string | number
  [prop: string]: unknown
}

export interface OverallResult {
  meta: OverallMeta
  result: Record<string, number>
  componentResults: Record<CompetitionEventDefinition, EntryResult>
  statuses: Record<string, unknown>
}

export interface ModelOptionBase<Option extends string> {
  id: Option
  name: string
  type: string
}
export interface ModelOptionBoolean<Option extends string> extends ModelOptionBase<Option> {
  type: 'boolean'
}
export interface ModelOptionString<Option extends string> extends ModelOptionBase<Option> {
  type: 'string'
}
export interface ModelOptionEnum<Option extends string> extends ModelOptionBase<Option> {
  type: 'enum'
  enum: unknown[]
}
export interface ModelOptionNumber<Option extends string> extends ModelOptionBase<Option> {
  type: 'number'
  min?: number
  max?: number
  step?: number
}

export type ModelOption<Option extends string> = ModelOptionBoolean<Option> | ModelOptionEnum<Option> | ModelOptionNumber<Option> | ModelOptionString<Option>

export type ModelStatusSeverity = 'success' | 'error' | 'warning' | 'neutral'

export interface ModelStatusFormatted {
  text: string
  severity: ModelStatusSeverity
}

export interface ModelStatus<Status extends string> {
  id: Status
  name: string
  formatter: (value: unknown) => ModelStatusFormatted
}

export interface BaseModel<Option extends string, Status extends string> {
  /**
   * Takes the form <rulebook-identifer>.<model-name>@<version>
   */
  id: `${string}.${string}@${string}`
  name: string
  options: Readonly<Array<ModelOption<Option>>>
  /**
   * Definitions of the values in the statuses object of the entry or overall
   * result, and how to format the value when displaying it to a user.
   */
  statusDefinitions: Readonly<Array<ModelStatus<Status>>>
}

// TODO: optional panel configuration to be used for checks that all judges have scored
export interface CompetitionEventModel<Option extends string = string, Status extends string = string, MarkSchema extends string = string, TallySchema extends string = string, JudgeStatus extends string = string> extends BaseModel<Option, Status> {
  judges: Array<JudgeTypeGetter<Option, MarkSchema, TallySchema, JudgeStatus>>

  previewTable: TableDefinitionGetter<Option>
  resultTable: TableDefinitionGetter<Option>

  calculateEntry: (meta: Readonly<EntryMeta>, judgeResults: Readonly<Array<Readonly<JudgeResult>>>, options: Options<Option>) => EntryResult | undefined
  /**
   * Note that this generally adds some property to the result indicating the
   * rank, the index/order of the array should not be used to show the rank.
   * The array should however be sorted so that you can simply loop over it and
   * get them sorted by rank for displaying.
   * @param results the return values of multiple calculateEntry calls
   * @returns
   */
  rankEntries: (results: Readonly<Array<Readonly<EntryResult>>>, options: Options<Option>) => EntryResult[]
}

export interface OverallModel<Option extends string = string, CompetitionEventOption extends string = string, Status extends string = string> extends BaseModel<Option, Status> {
  competitionEventOptions: Readonly<Array<ModelOption<CompetitionEventOption>>>
  resultTable: TableDefinitionGetter<Option, CompetitionEventOption>
  rankOverall: (results: Readonly<Array<Readonly<EntryResult>>>, options: Options<Option>, competitionEventOptions: CompetitionEventsOptions<CompetitionEventOption>) => OverallResult[]
}

export type TableDefinitionGetter<Option extends string, CompetitionEventOption extends string = never> = (options: Options<Option>, competitionEventOptions?: CompetitionEventsOptions<CompetitionEventOption>) => TableDefinition

export interface TableDefinition {
  groups?: TableHeaderGroup[][]
  headers: TableHeader[]
}

export type TableHeader = TableHeaderScore | TableHeaderStatus

export interface TableHeaderScore {
  text: string
  key: string
  status?: false
  /**
   * Columns marked as primary may be displayed with extra prominence in
   * renders. A column can be further categories as primary score or primary
   * rank by providing a string rather than a boolean, to provide extra hints
   * to the renderer. It's allowed to have multiple primary scores or multiple
   * primary ranks, or multiple primary columns in general.
   */
  primary?: 'score' | 'rank' | boolean
  formatter?: (n: number) => string
  color?: 'red' | 'green' | 'gray' | 'blue'
  component?: CompetitionEventDefinition
}

export interface TableHeaderStatus {
  text: string
  key: string
  status: true
  formatter?: (n: unknown) => string
  color?: 'red' | 'green' | 'gray' | 'blue'
}

export interface TableHeaderGroup {
  text: string
  key: string
  color?: 'red' | 'green' | 'gray' | 'blue'
  rowspan?: number
  colspan?: number
}
