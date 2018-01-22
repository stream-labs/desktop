import { PersistentStatefulService } from './persistent-stateful-service';
import { mutation } from './stateful-service';

interface ICustomizationServiceState {
  nightMode: boolean;
  updateStreamInfoOnLive: boolean;
  livePreviewEnabled: boolean;
  leftDock: boolean;
  hideViewerCount: boolean;
  livedockCollapsed: boolean;
  previewSize: number;
  livedockSize: number;
}

export interface ICustomizationSettings extends ICustomizationServiceState {}

/**
 * This class is used to store general UI behavior flags
 * that are sticky across application runtimes.
 */
export class CustomizationService extends PersistentStatefulService<ICustomizationServiceState> {

  static defaultState: ICustomizationServiceState = {
    nightMode: true,
    updateStreamInfoOnLive: true,
    livePreviewEnabled: true,
    leftDock: false,
    hideViewerCount: false,
    livedockCollapsed: true,
    previewSize: 300,
    livedockSize: 28
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

  @mutation()
  private SET_SETTINGS(settingsPatch: Partial<ICustomizationSettings>) {
    Object.assign(this.state, settingsPatch);
  }

}
