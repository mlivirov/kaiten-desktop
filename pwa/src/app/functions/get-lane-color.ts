import { Lane } from '../models/lane';
import { getPastelColor } from './pastel-color';

export function getLaneColor(lane: Lane): string {
  if (!lane.title?.length
    || lane.title.toLowerCase() === 'default'
    || lane.title.toLowerCase() === 'normal'
  ) {
    return '';
  } else {
    return `background-color: ${getPastelColor(lane.title)} !important; color: black !important;`;
  }
}
