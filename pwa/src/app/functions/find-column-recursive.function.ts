import { Column } from '../models/column';
import { ColumnEx } from '../models/column-ex';

export function FindColumnRecursiveFunction(columns: ColumnEx[], id: number): ColumnEx {
  for (const column of columns) {
    if (column.id === id) {
      return column;
    }

    if (column.subcolumns?.length > 0) {
      for (const subcolumn of column.subcolumns) {
        if (subcolumn.id === id) {
          return subcolumn;
        }
      }
    }
  }

  return null;
}