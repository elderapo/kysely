import { QueryBuilder } from '../query-builder'
import { InsertResultTypeTag } from './insert-values-method'
import { SelectResultType } from './select-method'

/**
 * `returning` method output query builder type
 */
export type ReturningQueryBuilder<DB, TB extends keyof DB, O, S> = QueryBuilder<
  DB,
  TB,
  O extends InsertResultTypeTag
    ? SelectResultType<DB, TB, S>
    : O & SelectResultType<DB, TB, S>
>
