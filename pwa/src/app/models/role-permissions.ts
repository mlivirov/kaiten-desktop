import { SpaceDocumentPermissions } from './space-document-permissions';
import { SpaceRootPermissions } from './space-root-permissions';
import { SpacePermissions } from './space-permissions';

export interface RolePermissions {
  root: SpaceRootPermissions;
  space: SpacePermissions;
  document: SpaceDocumentPermissions;
  story_map: SpaceDocumentPermissions;
  document_group: SpaceDocumentPermissions;
}