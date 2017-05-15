export declare type TObsType = string[] |
  'OBS_PROPERTY_BOOL' |
  'OBS_PROPERTY_INT' |
  'OBS_PROPERTY_LIST' |
  'OBS_PROPERTY_PATH' |
  'OBS_PROPERTY_EDIT_TEXT' |
  'OBS_PROPERTY_UINT' |
  'OBS_PROPERTY_COLOR'

export interface IInputValue<TValueType> {
  currentValue: TValueType;
  description: string;
  type: TObsType;
  masked: boolean;
}

export interface IListInputValue<TValueType> extends IInputValue<TValueType> {
  values: { description: string, value: TValueType }[]
}


export function getListItemDescription(possibleValue: Object) {
  return Object.keys(possibleValue)[0];
}


export function getListItemName (possibleValue: Object) {
  return possibleValue[Object.keys(possibleValue)[0]];
}
