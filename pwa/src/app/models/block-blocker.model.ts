import { Card } from './card';

export interface BlockBlocker {
  created: Date;
  updated: Date;
  id: number;
  uid: string;
  reason: null | string;
  card_id: number;
  blocker_id: number;
  blocker_card_id: number | null;
  blocker_card_title: null;
  released: boolean;
  released_by_id: null;
  card?: Card;
  blocked_card?: Card;
}