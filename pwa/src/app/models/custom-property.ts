export interface CustomPropertyRestrictions {
  max: number;
  min: number;
}

export interface CustomProperty {
  id: number;
  name: string;
  type: string;
  uid: string;
  data?: {
    restrictions?: CustomPropertyRestrictions
  };
  values_type: string;
  multiline: boolean;
  multi_select: boolean;
  condition: string;
  values_creatable_by_users: boolean;
}

export interface CustomPropertySelectValue {
  id: number;
  custom_property_id: number;
  value: string;
  sort_order: number;
}

export interface CustomPropertyAndValues {
  property: CustomProperty;
  values?: CustomPropertySelectValue[];
}