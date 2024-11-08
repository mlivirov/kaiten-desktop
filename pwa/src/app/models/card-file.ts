export enum CardFileType {
  Attachment = 1,
  GoogleDrive = 2,
  DropBox = 3,
  Box = 4,
  OneDrive = 5,
  YandexDisc = 6,
  CommentEmail = 7,
  CommentAttachment = 8
}

export interface CardFile {
  id: number;
  url: string;
  name: string;
  type: CardFileType;
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