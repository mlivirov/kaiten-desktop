export interface CheckListItem {
  updated: string;                   // Last update timestamp
  created: string;                   // Create date
  id: number;                        // Card checklist item id
  text: string;                      // Checklist item text
  sort_order: number;                // Position
  checked: boolean;                  // Flag indicating that checklist item is checked
  checker_id: number | null;         // User id who checked checklist item (nullable)
  user_id: number;                   // Current user id
  checked_at: string | null;        // Date of check (nullable)
  responsible_id: number | null;    // User id who is responsible for checklist item (nullable)
  deleted: boolean;                 // Flag indicating that checklist item is deleted
  due_date: string | null;
}