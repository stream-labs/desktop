import { PersistentStatefulService } from '../persistent-stateful-service';
import { mutation } from '../stateful-service';
import {
  ICustomizationServiceApi,
  ICustomizationServiceState,
  ICustomizationSettings
} from './customization-api';
import { IFormInput, INumberInputValue, TFormData } from '../../components/shared/forms/Input';

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
    livedockSize: 28,
    performanceMode: false,
    chatZoomFactor: 1
  };

  init() {
    super.init();
    this.setLiveDockCollapsed(true);// livedock is always collapsed on app start
  }

  setSettings(settingsPatch: Partial<ICustomizationSettings>) {
    this.SET_SETTINGS(settingsPatch);
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

      <IFormInput<boolean>> {
        value: settings.updateStreamInfoOnLive,
        name: 'updateStreamInfoOnLive',
        description: 'Confirm stream title and game before going live',
        type: 'OBS_PROPERTY_BOOL',
        visible: true,
        enabled: true,
      },

      <IFormInput<boolean>> {
        value: settings.performanceMode,
        name: 'performanceMode',
        description: 'Enable performance mode',
        type: 'OBS_PROPERTY_BOOL',
        visible: true,
        enabled: true,
      },

      <INumberInputValue> {
        value: settings.chatZoomFactor,
        name: 'chatZoomFactor',
        description: 'Chat text size',
        type: 'OBS_PROPERTY_SLIDER',
        minVal: 0,
        maxVal: 2,
        stepVal: 0.25,
        visible: true,
        enabled: true,
        usePercentages: true,
      }

    ];
  }

  restoreDefaults() {
    this.setSettings(CustomizationService.defaultState);
  }

  @mutation()
  private SET_SETTINGS(settingsPatch: Partial<ICustomizationSettings>) {
    Object.assign(this.state, settingsPatch);
  }

}
