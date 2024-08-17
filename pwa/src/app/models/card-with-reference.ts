import { Card } from './card';

export interface CardWithReference extends Card {
  card_id: number;
  depends_on_card_id: number;
}