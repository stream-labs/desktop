import { TObsFormData } from '../../components/shared/forms/ObsInput';

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
