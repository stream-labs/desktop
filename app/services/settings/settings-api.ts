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

export interface OptimizedSettings {
  optimizedVideoBitrate?: number;
  optimizedAudioBitrate?: string;
  optimizedQuality?: string;
  optimizedColorSpace?: string;
  optimizedFps?: string;
  optimizedOutputMode?: string;
  currentVideoBitrate?: number;
  currentAudioBitrate?: string;
  currentQuality?: string;
  currentColorSpace?: string;
  currentFps?: string;
  currentOutputMode?: string;
}
