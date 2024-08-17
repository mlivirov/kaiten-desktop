import { Space } from './space';
import { Board } from './board';
import { Lane } from './lane';
import { Column } from './column';

export interface PathData {
  space: Space;
  board: Board;
  lane: Lane;
  column: Column;
  subcolumn: Column | null;
}