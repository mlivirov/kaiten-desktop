export interface ColumnBase {
  id: number;
  uid: string;
  title: string;
  sort_order: number;
  col_count: number;
  type: number;
  board_id: number;
  column_id: number | null;
  external_id: null;
  rules: number;
  pause_sla: boolean;
}

export interface Column<TColumn = ColumnBase> extends ColumnBase {
  subcolumns?: TColumn[];
  parent?:     TColumn;
}