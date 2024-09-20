import { Card } from '../models/card';

export function formatCardLinkForClipboard(baseUrl: string, card: Card, elementType?: string, elementId?: number): string {
  let slashIndex = baseUrl.lastIndexOf('/');
  if (slashIndex === -1) {
    slashIndex = baseUrl.length - 1;
  }

  let url = baseUrl.substring(0, slashIndex) + '/' + card.id.toString();
  if (elementType && elementId) {
    url += `#focus=${elementType}&focusId=${elementId}`;
  }

  return `[${card.id} - ${card.title}](${url})`;
}
