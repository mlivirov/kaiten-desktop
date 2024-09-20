import { Board } from './board';
import { BlockBlocker } from './block-blocker.model';
import { Column } from './column';
import { Lane } from './lane';
import { PathData } from './path-data';
import { CardFile } from './card-file';
import { CardWithReference } from './card-with-reference';
import { Card } from './card';
import { CheckList } from './check-list';

export interface CardEx extends Card {
  board:                          Board;
  column:                         Column;
  lane:                           Lane;
  children?:                      CardWithReference[];
  parents?:                       CardWithReference[];
  path_data:                      PathData;
  files?:                         CardFile[];
  blockers?:                      BlockBlocker[];
  blocked_at?:                    Date;
  blocker_id?:                    number;
  block_reason?:                  string;
  blocking_blockers?:             BlockBlocker[];
  checklists?:                    CheckList[];
}
