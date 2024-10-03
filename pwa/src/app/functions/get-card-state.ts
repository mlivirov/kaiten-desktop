import { CardState } from '../models/card-state';
import { Column } from '../models/column';
import { CardEx } from '../models/card-ex';

export function getCardState(column: Column, subcolumn?: Column): CardState {
  return subcolumn?.type === CardState.Done && column.type === CardState.InProgress
    ? CardState.Queued
    : Math.min(subcolumn?.type ?? CardState.Done, column.type);
}

export function getCardStateByCard(card: CardEx): CardState {
  if (card.state === CardState.Draft) {
    return CardState.Draft;
  }

  const parent = card.column.parent;

  if (parent) {
    return getCardState(parent, card.column);
  } else {
    return getCardState(card.column);
  }
}