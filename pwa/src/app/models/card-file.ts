export interface CardFile {
  id: number;
  url: string;
  name: string;
  type: number;
  size: number;
  mime_type: null;
  deleted: boolean;
  card_id: number;
  external: boolean;
  author_id: number;
  comment_id: number | null;
  sort_order: number;
  card_cover: boolean;
  created: Date;
  updated: Date;
  uid: string;
  custom_property_id: null;
}