import { Lane } from './lane';
import { Column } from './column';
import { Card } from './card';

export interface BoardBase {
  id:                                number;
  uid:                               string;
  title:                             string;
}

export interface Board extends BoardBase {
  created:                           Date;
  updated:                           Date;
  cell_wip_limits:                   null;
  default_card_type_id:              number;
  description:                       null;
  external_id:                       null;
  email_key:                         string;
  move_parents_to_done:              boolean;
  backward_moves_enabled:            boolean;
  default_tags:                      null;
  first_image_is_cover:              boolean;
  reset_lane_spent_time:             boolean;
  automove_cards:                    boolean;
  hide_done_policies:                boolean;
  hide_done_policies_in_done_column: boolean;
  auto_assign_enabled:               boolean;
  card_properties:                   null;
  import_uid:                        null;
  columns:                           Column[];
  lanes:                             Lane[];
  cards:                             Card[];
  space_id:                          number;
  board_id:                          number;
  top:                               number;
  left:                              number;
  sort_order:                        number;
}
