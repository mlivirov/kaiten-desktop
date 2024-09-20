import { Card } from '../models/card';

export function formatCardLinkForClipboard(baseUrl: string, card: Card): string {
  let slashIndex = baseUrl.lastIndexOf('/');
  if (slashIndex === -1) {
    slashIndex = baseUrl.length - 1;
  }

  return `[${card.id} - ${card.title}](${baseUrl.substring(0, slashIndex) + '/' + card.id.toString()})`;
}