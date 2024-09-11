import { CardProperties } from './card-properties';
import { CustomProperty } from './custom-property';
import { Column } from './column';
import { Tag } from './tag';
import { User } from './user';
import { Board } from './board';
import { Card } from './card';
import { Lane } from './lane';
import { CheckList } from './check-list';
import { CheckListItem } from './check-list-item';
import { BlockBlocker } from './block-blocker.model';


export interface ActivityData {
  dump?: {
    block?: BlockBlocker,
    parent_card?: Card,
    child_card?: Card
  }
}

export interface CardActivity {
  type_id: number;
  id?: string,
  created: Date,
  action: string,
  block_id: number,
  card_id?: number,
  card_version?: number,
  card_type_id?: number,
  checklist_id: any,
  checklist_item_id: any,
  board_id?: number,
  column_id?: number,
  subcolumn_id?: number,
  lane_id?: number,
  comment_id?: number,
  external_link_id: any,
  file_id: any,
  invite_id: any,
  policy_id: any,
  policy_item_id: any,
  space_id: any,
  sprint_id: any,
  tag_id: any,
  user_id?: number,
  webhook_id: any,
  company_id: any,
  author_id?: number,
  card_time_log_id: any,
  role: any,
  tree_entity_role_ids: any,
  data?: ActivityData,
  board?: Board,
  card?: Card,
  lane?: Lane,
  author: User,
  column?: Column,
  user?: User,
  targetUser?: User,
  subcolumn?: Column,
  changed_field?: string,
  tag_ids?: number[],
  deleted_tags?: Tag[],
  added_tags?: Tag[],
  old_tag: any,
  new_tag?: Tag,
  old_description: any,
  description?: string,
  comment?: Comment,
  properties?: CustomProperty[],
  property_id?: string,
  property_name?: string,
  property_type?: string,
  property_vote_variant: any,
  property_data: any,
  property_multiline?: boolean,
  property_value?: CardProperties[],
  checklist: CheckList,
  listItem: CheckListItem
}