import { CardState } from '../models/card-state';
import { Column } from '../models/column';
import { CardEx } from '../models/card-ex';
import { getTextOrDefault } from './get-text-or-default';

export function getCardColumnTitle(card: CardEx): string {
  const column = card.column.parent ? card.column.parent : card.column;
  const subcolumn = card.column.parent ? card.column : null;

  let title = `${getTextOrDefault(column.title)}`
  if (subcolumn) {
    title += ` / ${getTextOrDefault(subcolumn.title)}`
  }

  return title;
}