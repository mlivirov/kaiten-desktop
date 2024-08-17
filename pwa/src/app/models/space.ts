import { SpaceBoardPermissions } from './space-board-permissions';
import { RolePermissions } from './role-permissions';

export interface Space {
  archived: boolean;
  uid: string;
  access: string;
  for_everyone_access_role_id: string;
  entity_type: string;
  path: string;
  sort_order: number;
  parent_entity_uid: null | string;
  created: Date;
  updated: Date;
  company_id: number;
  id: number;
  title: string;
  allowed_card_type_ids: any[] | null;
  external_id: null;
  settings: null;
  role_permissions: RolePermissions;
  role: number;
  access_mod: string;
  notifications_enabled: boolean;
  boards: SpaceBoardPermissions[];
}