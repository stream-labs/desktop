import { Observable } from 'rxjs';
import { TObsFormData } from 'components/obs/inputs/ObsInput';
import { overArgs } from 'lodash-decorators';
import Display from 'components/shared/Display.vue';

export interface ICustomizationServiceState {
  theme: string;
  updateStreamInfoOnLive: boolean;
  livePreviewEnabled: boolean;
  leftDock: boolean;
  hideViewerCount: boolean;
  folderSelection: boolean;
  livedockCollapsed: boolean;
  livedockSize: number;
  bottomdockSize: number;
  performanceMode: boolean;
  chatZoomFactor: number;
  enableBTTVEmotes: boolean;
  enableFFZEmotes: boolean;
  mediaBackupOptOut: boolean;
  navigateToLiveOnStreamStart: boolean;
  experimental: any;

  // Will be true when the UI is performing animations, transitions, or property changes that affect
  // the display of elements we cannot draw over. During this time such elements, for example
  // BrowserViews and the OBS Display, will be hidden until the operation is complete.
  hideStyleBlockingElements: boolean;
}

export interface ICustomizationSettings extends ICustomizationServiceState {}

export interface ICustomizationServiceApi {
  settingsChanged: Observable<Partial<ICustomizationSettings>>;
  setSettings(settingsPatch: Partial<ICustomizationSettings>): void;
  getSettings(): ICustomizationSettings;
  getSettingsFormData(): TObsFormData;
  getExperimentalSettingsFormData(): TObsFormData;
  restoreDefaults(): void;
}
