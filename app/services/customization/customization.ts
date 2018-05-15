import { Subject } from 'rxjs/Subject';
import { PersistentStatefulService } from '../persistent-stateful-service';
import { mutation } from '../stateful-service';
import {
  ICustomizationServiceApi,
  ICustomizationServiceState,
  ICustomizationSettings
} from './customization-api';
import { IFormInput, INumberInputValue, TFormData } from '../../components/shared/forms/Input';
import Utils from 'services/utils';

const LIVEDOCK_MIN_SIZE = 0.15;
const LIVEDOCK_MAX_SIZE = 0.5;

/**
 * This class is used to store general UI behavior flags
 * that are sticky across application runtimes.
 */
export class CustomizationService
  extends PersistentStatefulService<ICustomizationServiceState>
  implements ICustomizationServiceApi
{

  static defaultState: ICustomizationServiceState = {
    nightMode: true,
    updateStreamInfoOnLive: true,
    livePreviewEnabled: true,
    leftDock: false,
    hideViewerCount: false,
    livedockCollapsed: true,
    previewSize: 300,
    livedockSize: 0.28,
    performanceMode: false,
    chatZoomFactor: 1,
    enableBTTVEmotes: false,
    enableFFZEmotes: false,
    mediaBackupOptOut: false,
    experimental: {
      // put experimental features here
    }
  };

  settingsChanged = new Subject<Partial<ICustomizationSettings>>();

  init() {
    super.init();
    this.setLiveDockCollapsed(true);// livedock is always collapsed on app start

    // migrate livedockSize from % to float number
    const livedockSize = this.state.livedockSize;
    if (livedockSize > LIVEDOCK_MAX_SIZE) {
      this.setSettings({
        livedockSize: CustomizationService.defaultState.livedockSize
      });
    }
  }

  setSettings(settingsPatch: Partial<ICustomizationSettings>) {
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

  getSettingsFormData(): TFormData {
    const settings = this.getSettings();

    return [
      <IFormInput<boolean>> {
        value: settings.nightMode,
        name: 'nightMode',
        description: 'Night mode',
        type: 'OBS_PROPERTY_BOOL',
        visible: true,
        enabled: true,
      },

      <IFormInput<boolean>>{
        value: settings.leftDock,
        name: 'leftDock',
        description: 'Show the live dock (chat) on the left side',
        type: 'OBS_PROPERTY_BOOL',
        visible: true,
        enabled: true,
      },

      <INumberInputValue> {
        value: settings.chatZoomFactor,
        name: 'chatZoomFactor',
        description: 'Chat Text Size',
        type: 'OBS_PROPERTY_SLIDER',
        minVal: 0.25,
        maxVal: 2,
        stepVal: 0.25,
        visible: true,
        enabled: true,
        usePercentages: true,
      },

      <INumberInputValue> {
        value: settings.livedockSize,
        name: 'livedockSize',
        description: 'Chat Width',
        type: 'OBS_PROPERTY_SLIDER',
        minVal: LIVEDOCK_MIN_SIZE,
        maxVal: LIVEDOCK_MAX_SIZE,
        stepVal: 0.01,
        visible: true,
        enabled: true,
        usePercentages: true,
      },

      <IFormInput<boolean>>  {
        value: settings.enableBTTVEmotes,
        name: 'enableBTTVEmotes',
        description: 'Enable BetterTTV emotes for Twitch',
        type: 'OBS_PROPERTY_BOOL',
        visible: true,
        enabled: true,
      },

      <IFormInput<boolean>>  {
        value: settings.enableFFZEmotes,
        name: 'enableFFZEmotes',
        description: 'Enable FrankerFaceZ emotes for Twitch',
        type: 'OBS_PROPERTY_BOOL',
        visible: true,
        enabled: true,
      }

    ];
  }

  getExperimentalSettingsFormData(): TFormData {
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
