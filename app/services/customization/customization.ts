import { Subject } from 'rxjs';
import { PersistentStatefulService } from '../persistent-stateful-service';
import { mutation } from '../stateful-service';
import {
  ICustomizationServiceApi,
  ICustomizationServiceState,
  ICustomizationSettings,
} from './customization-api';
import {
  IObsInput,
  IObsListInput,
  IObsNumberInputValue,
  TObsFormData,
} from 'components/obs/inputs/ObsInput';
import Utils from 'services/utils';
import { $t } from 'services/i18n';

const LIVEDOCK_MIN_SIZE = 0.15;
const LIVEDOCK_MAX_SIZE = 0.5;

/**
 * This class is used to store general UI behavior flags
 * that are sticky across application runtimes.
 */
export class CustomizationService extends PersistentStatefulService<ICustomizationServiceState>
  implements ICustomizationServiceApi {
  static defaultState: ICustomizationServiceState = {
    nightMode: true,
    updateStreamInfoOnLive: true,
    livePreviewEnabled: true,
    leftDock: false,
    hideViewerCount: false,
    livedockCollapsed: true,
    previewSize: 300,
    livedockSize: 0,
    bottomdockSize: 240,
    performanceMode: false,
    previewEnabled: true,
    chatZoomFactor: 1,
    enableBTTVEmotes: false,
    enableFFZEmotes: false,
    mediaBackupOptOut: false,
    folderSelection: false,
    navigateToLiveOnStreamStart: true,
    experimental: {
      // put experimental features here
    },
  };

  settingsChanged = new Subject<Partial<ICustomizationSettings>>();

  init() {
    super.init();
    this.setLiveDockCollapsed(true); // livedock is always collapsed on app start
    this.setSettings({ previewEnabled: true }); // preview is always enabled on app start
  }

  setSettings(settingsPatch: Partial<ICustomizationSettings>) {
    // tslint:disable-next-line:no-parameter-reassignment TODO
    settingsPatch = Utils.getChangedParams(this.state, settingsPatch);
    this.SET_SETTINGS(settingsPatch);
    this.settingsChanged.next(settingsPatch);
  }

  getSettings(): ICustomizationSettings {
    return this.state;
  }

  set nightMode(val: boolean) {
    this.setSettings({ nightMode: val });
  }

  get nightMode() {
    return this.state.nightMode;
  }

  get previewEnabled(): boolean {
    return !this.state.performanceMode && this.state.previewEnabled;
  }

  setNightMode(val: boolean) {
    this.nightMode = val;
  }

  setUpdateStreamInfoOnLive(update: boolean) {
    this.setSettings({ updateStreamInfoOnLive: update });
  }

  setLivePreviewEnabled(enabled: boolean) {
    this.setSettings({ livePreviewEnabled: enabled });
  }

  setLeftDock(enabled: boolean) {
    this.setSettings({ leftDock: enabled });
  }

  setLiveDockCollapsed(collapsed: boolean) {
    this.setSettings({ livedockCollapsed: collapsed });
  }

  setHiddenViewerCount(hidden: boolean) {
    this.setSettings({ hideViewerCount: hidden });
  }

  setMediaBackupOptOut(optOut: boolean) {
    this.setSettings({ mediaBackupOptOut: optOut });
  }

  setNavigateToLive(enabled: boolean) {
    this.setSettings({ navigateToLiveOnStreamStart: enabled });
  }

  getSettingsFormData(): TObsFormData {
    const settings = this.getSettings();

    return [
      <IObsInput<boolean>>{
        value: settings.nightMode,
        name: 'nightMode',
        description: $t('Night mode'),
        type: 'OBS_PROPERTY_BOOL',
        visible: true,
        enabled: true,
      },

      <IObsListInput<boolean>>{
        value: settings.folderSelection,
        name: 'folderSelection',
        description: $t('Scene item selection mode'),
        type: 'OBS_PROPERTY_LIST',
        options: [
          { value: true, description: $t('Single click selects group. Double click selects item') },
          {
            value: false,
            description: $t('Double click selects group. Single click selects item'),
          },
        ],
        visible: true,
        enabled: true,
      },

      <IObsInput<boolean>>{
        value: settings.leftDock,
        name: 'leftDock',
        description: $t('Show the live dock (chat) on the left side'),
        type: 'OBS_PROPERTY_BOOL',
        visible: true,
        enabled: true,
      },

      <IObsNumberInputValue>{
        value: settings.chatZoomFactor,
        name: 'chatZoomFactor',
        description: $t('Chat Text Size'),
        type: 'OBS_PROPERTY_SLIDER',
        minVal: 0.25,
        maxVal: 2,
        stepVal: 0.25,
        visible: true,
        enabled: true,
        usePercentages: true,
      },

      <IObsInput<boolean>>{
        value: settings.enableBTTVEmotes,
        name: 'enableBTTVEmotes',
        description: $t('Enable BetterTTV emotes for Twitch'),
        type: 'OBS_PROPERTY_BOOL',
        visible: true,
        enabled: true,
      },

      <IObsInput<boolean>>{
        value: settings.enableFFZEmotes,
        name: 'enableFFZEmotes',
        description: $t('Enable FrankerFaceZ emotes for Twitch'),
        type: 'OBS_PROPERTY_BOOL',
        visible: true,
        enabled: true,
      },
    ];
  }

  getExperimentalSettingsFormData(): TObsFormData {
    return [];
  }

  restoreDefaults() {
    this.setSettings(CustomizationService.defaultState);
  }

  @mutation()
  private SET_SETTINGS(settingsPatch: Partial<ICustomizationSettings>) {
    Object.assign(this.state, settingsPatch);
  }
}
