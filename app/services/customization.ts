import { PersistentStatefulService } from './persistent-stateful-service';
import { mutation } from './stateful-service';

interface ICustomizationServiceState {
  nightMode: boolean;
  updateStreamInfoOnLive: boolean;
  livePreviewEnabled: boolean;
  leftDock: boolean;
  hideViewerCount: boolean;
  lifedockCollapsed: boolean;
}

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
    lifedockCollapsed: true
  };

  init() {
    super.init();
    this.setLifeDockCollapsed(true);// lifedock is always collapsed on app start
  }

  @mutation()
  SET_NIGHT_MODE(nightMode: boolean) {
    this.state.nightMode = nightMode;
  }

  @mutation()
  SET_UPDATE_STREAM_INFO_ON_LIVE(update: boolean) {
    this.state.updateStreamInfoOnLive = update;
  }

  @mutation()
  SET_LIVE_PREVIEW_ENABLED(enabled: boolean) {
    this.state.livePreviewEnabled = enabled;
  }

  @mutation()
  SET_LEFT_DOCK(enabled: boolean) {
    this.state.leftDock = enabled;
  }

  @mutation()
  SET_LIFEDOCK_COLLAPSED(collapsed: boolean) {
    this.state.lifedockCollapsed = collapsed;
  }

  @mutation()
  SET_HIDDEN_VIEWER_COUNT(hidden: boolean) {
    this.state.hideViewerCount = hidden;
  }

  set nightMode(val: boolean) {
    this.SET_NIGHT_MODE(val);
  }

  get nightMode() {
    return this.state.nightMode;
  }

  setNightMode(val: boolean) {
    this.nightMode = val;
  }

  setUpdateStreamInfoOnLive(update: boolean) {
    this.SET_UPDATE_STREAM_INFO_ON_LIVE(update);
  }

  setLivePreviewEnabled(enabled: boolean) {
    this.SET_LIVE_PREVIEW_ENABLED(enabled);
  }

  setLeftDock(enabled: boolean) {
    this.SET_LEFT_DOCK(enabled);
  }

  setLifeDockCollapsed(collapsed: boolean) {
    this.SET_LIFEDOCK_COLLAPSED(collapsed);
  }

  setHiddenViewerCount(hidden: boolean) {
    this.SET_HIDDEN_VIEWER_COUNT(hidden);
  }

}
