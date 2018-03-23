import { Observable } from 'rxjs/Observable';
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
  enableBTTVEmotes: boolean;
  enableFFZEmotes: boolean;
  experimental: any;
}

export interface ICustomizationSettings extends ICustomizationServiceState {}

export interface ICustomizationServiceApi {
  settingsChanged: Observable<Partial<ICustomizationSettings>>;
  setSettings(settingsPatch: Partial<ICustomizationSettings>): void;
  getSettings(): ICustomizationSettings;
  getSettingsFormData(): TFormData;
  getExperimentalSettingsFormData(): TFormData;
  restoreDefaults(): void;
}
