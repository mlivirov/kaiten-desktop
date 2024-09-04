import { CheckListItem } from './check-list-item';

export interface CheckList {
  updated: string;                 // Last update timestamp
  created: string;                 // Create date
  id: number;                      // Card checklist id
  name: string;                    // Checklist name
  policy_id: number | null;        // Template checklist id (nullable)
  items: CheckListItem[];          // Checklist items
  sort_order: number;
}