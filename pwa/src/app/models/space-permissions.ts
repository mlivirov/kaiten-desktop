import { SpaceAddonsPermissions } from './space-addons-permissions';
import { SpaceAutomationPermissions } from './space-automation-permissions';
import { SpaceCardPermissions } from './space-card-permissions';

export interface SpacePermissions {
  card: SpaceCardPermissions;
  read: boolean;
  board: SpaceAutomationPermissions;
  addons: SpaceAddonsPermissions;
  create: boolean;
  delete: boolean;
  update: boolean;
  webhook: SpaceAutomationPermissions;
  automation: SpaceAutomationPermissions;
  i_calendar: SpaceAutomationPermissions;
  move_within: boolean;
  restriction: SpaceAutomationPermissions;
  move_outside: boolean;
  access_control: boolean;
  external_webhook: SpaceAutomationPermissions;
}