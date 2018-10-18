import { TObsFormData } from 'components/obs/inputs/ObsInput';

export interface ISettingsSubCategory {
  nameSubCategory: string;
  codeSubCategory?: string;
  parameters: TObsFormData;
}

export interface ISettingsServiceApi {
  getCategories(): string[];
  getSettingsFormData(categoryName: string): ISettingsSubCategory[];
  setSettings(categoryName: string, settingsData: ISettingsSubCategory[]): void;
  showSettings(categoryName?: string): void;
}
