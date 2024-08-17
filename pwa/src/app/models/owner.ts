import { User } from './user';
import { MemberType } from './member-type';

export interface Owner extends User {
  card_id?: number;
  user_id?: number;
  type?: MemberType;
}