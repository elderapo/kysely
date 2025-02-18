import { ColumnNode } from '../operation-node/column-node.js'
import { PrimitiveValueListNode } from '../operation-node/primitive-value-list-node.js'
import { ValueListNode } from '../operation-node/value-list-node.js'
import { freeze } from '../util/object-utils.js'
import { parseValueExpression, ValueExpression } from './value-parser.js'
import { ValuesNode } from '../operation-node/values-node.js'
import {
  NonNullableInsertKeys,
  NullableInsertKeys,
  InsertType,
} from '../util/column-type.js'
import { isComplexExpression } from './complex-expression-parser.js'

export type InsertObject<DB, TB extends keyof DB> = {
  [C in NonNullableInsertKeys<DB[TB]>]: ValueExpression<
    DB,
    TB,
    InsertType<DB[TB][C]>
  >
} & {
  [C in NullableInsertKeys<DB[TB]>]?: ValueExpression<
    DB,
    TB,
    InsertType<DB[TB][C]>
  >
}

export type InsertObjectOrList<DB, TB extends keyof DB> =
  | InsertObject<DB, TB>
  | ReadonlyArray<InsertObject<DB, TB>>

export function parseInsertObjectOrList(
  args: InsertObjectOrList<any, any>
): [ReadonlyArray<ColumnNode>, ValuesNode] {
  return parseInsertColumnsAndValues(Array.isArray(args) ? args : [args])
}

function parseInsertColumnsAndValues(
  rows: InsertObject<any, any>[]
): [ReadonlyArray<ColumnNode>, ValuesNode] {
  const columns = parseColumnNamesAndIndexes(rows)

  return [
    freeze([...columns.keys()].map(ColumnNode.create)),
    ValuesNode.create(rows.map((row) => parseRowValues(row, columns))),
  ]
}

function parseColumnNamesAndIndexes(
  rows: InsertObject<any, any>[]
): Map<string, number> {
  const columns = new Map<string, number>()

  for (const row of rows) {
    const cols = Object.keys(row)

    for (const col of cols) {
      if (!columns.has(col) && row[col] !== undefined) {
        columns.set(col, columns.size)
      }
    }
  }

  return columns
}

function parseRowValues(
  row: InsertObject<any, any>,
  columns: Map<string, number>
): PrimitiveValueListNode | ValueListNode {
  const rowColumns = Object.keys(row)

  const rowValues: ValueExpression<any, any, unknown>[] = new Array(
    columns.size
  ).fill(null)

  for (const col of rowColumns) {
    const columnIdx = columns.get(col)
    const value = row[col]

    if (columnIdx !== undefined) {
      rowValues[columnIdx] = value
    }
  }

  if (rowValues.some(isComplexExpression)) {
    return ValueListNode.create(rowValues.map((it) => parseValueExpression(it)))
  }

  return PrimitiveValueListNode.create(rowValues)
}
