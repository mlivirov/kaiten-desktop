import { ColumnBase } from '../models/column';
import { ColumnEx } from '../models/column-ex';

export function FlattenColumnsFunction(columns: ColumnEx[]): ColumnBase[] {
  return columns.reduce((agg, col) => [...agg, col, ...(col.subcolumns ?? [])], []);
}