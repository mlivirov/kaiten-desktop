import { Name } from './name';
import { TypeProperties } from './type-properties';

export interface CardType {
  id: number;
  name: Name;
  color: number;
  letter: string;
  company_id: number;
  archived: boolean;
  properties: TypeProperties;
}