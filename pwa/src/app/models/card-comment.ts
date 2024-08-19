import { Owner } from './owner';

export enum CardCommentType {
  Markdown = 1,
  Html = 2,
}

export interface CardComment {
  updated: string;
  created: string;
  id: number;
  text: string;
  type: CardCommentType;
  edited: boolean;
  card_id: number;
  author_id: number;
  author: Owner;
}