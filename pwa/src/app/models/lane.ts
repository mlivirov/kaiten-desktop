import { WipLimitType } from './wip-limit-type';

export interface Lane {
  id: number;
  title: string;
  sort_order: number;
  board_id: number;
  condition: number;
  external_id: null;
  default_card_type_id: null;
}

export interface LaneEx extends Lane {
  wip_limit_type?: WipLimitType;
  wip_limit?: number;
}