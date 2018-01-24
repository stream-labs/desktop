import { TFormData } from '../../components/shared/forms/Input';

export interface ICustomizationServiceState {
  nightMode: boolean;
  updateStreamInfoOnLive: boolean;
  livePreviewEnabled: boolean;
  leftDock: boolean;
  hideViewerCount: boolean;
  livedockCollapsed: boolean;
  previewSize: number;
  livedockSize: number;
  performanceMode: boolean;
  chatZoomFactor: number;
}

export interface ICustomizationSettings extends ICustomizationServiceState {}

export interface ICustomizationServiceApi {
  setSettings(settingsPatch: Partial<ICustomizationSettings>): void;
  getSettings(): ICustomizationSettings;
  getSettingsFormData(): TFormData;
  restoreDefaults(): void;
}
