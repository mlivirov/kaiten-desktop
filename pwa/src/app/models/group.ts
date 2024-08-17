export interface Group {
  created: Date;
  updated: Date;
  id: number;
  uid: string;
  name: string;
  company_id: number;
  permissions: number;
  add_to_cards_and_spaces_enabled: boolean;
  suggest_for_new_spaces_with_role: null;
  user_id: number;
  group_id: number;
}