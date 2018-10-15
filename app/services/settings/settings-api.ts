import { TFormData } from '../../components/shared/forms/Input';

export interface ISettingsSubCategory {
  nameSubCategory: string;
  codeSubCategory?: string;
  parameters: TFormData;
}

export interface ISettingsServiceApi {
  getCategories(): string[];
  getSettingsFormData(categoryName: string): ISettingsSubCategory[];
  setSettings(categoryName: string, settingsData: ISettingsSubCategory[]): void;
  showSettings(categoryName?: string): void;
}