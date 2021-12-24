import { TObsFormData } from 'components/obs/inputs/ObsInput';
import { Observable } from 'rxjs';

export type TCompactModeTab = 'studio' | 'niconico';
export type TCompactModeStudioController = 'scenes' | 'mixer';

export interface ICustomizationServiceState {
  performanceMode: boolean;
  studioControlsOpened: boolean;
  optimizeForNiconico: boolean;
  showOptimizationDialogForNiconico: boolean;
  optimizeWithHardwareEncoder: boolean;
  pollingPerformanceStatistics: boolean;
  compactMode: boolean;
  compactModeTab: TCompactModeTab;
  compactModeStudioController: TCompactModeStudioController;
  compactModeNewComment: boolean;
  fullModeWidthOffset: number;
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
