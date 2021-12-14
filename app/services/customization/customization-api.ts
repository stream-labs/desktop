import { Observable } from 'rxjs';
import { TObsFormData } from 'components/obs/inputs/ObsInput';

export interface ICustomizationServiceState {
  compactMode: boolean;
  compactModeTab: 'studio' | 'niconico';
  compactModeStudioController: 'scenes' | 'mixer';

  performanceMode: boolean;
  studioControlsOpened: boolean;
  optimizeForNiconico: boolean;
  showOptimizationDialogForNiconico: boolean;
  optimizeWithHardwareEncoder: boolean;
  pollingPerformanceStatistics: boolean;
  experimental: any;
}

// eslint-disable-next-line prettier/prettier
export interface ICustomizationSettings extends ICustomizationServiceState { }

export interface ICustomizationServiceApi {
  settingsChanged: Observable<Partial<ICustomizationSettings>>;
  setSettings(settingsPatch: Partial<ICustomizationSettings>): void;
  getSettings(): ICustomizationSettings;
  getSettingsFormData(): TObsFormData;
  getExperimentalSettingsFormData(): TObsFormData;
  restoreDefaults(): void;
}
