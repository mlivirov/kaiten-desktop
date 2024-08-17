import { Column } from './column';
import { WipLimitType } from './wip-limit-type';

export interface ColumnEx extends Column<ColumnEx> {
  wip_limit?: number,
  wip_limit_type?: WipLimitType,
}