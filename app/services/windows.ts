// This singleton class provides a renderer-space API
// for spawning various child windows.
import { cloneDeep } from 'lodash';

import Main from 'components/windows/Main.vue';
import Settings from 'components/windows/Settings.vue';
import SourcesShowcase from 'components/windows/SourcesShowcase.vue';
import SceneTransitions from 'components/windows/SceneTransitions.vue';
import AddSource from 'components/windows/AddSource.vue';
import NameSceneCollection from 'components/windows/NameSceneCollection.vue';
import NameSource from 'components/windows/NameSource.vue';
import NameScene from 'components/windows/NameScene.vue';
import NameFolder from 'components/windows/NameFolder.vue';
import SourceProperties from 'components/windows/SourceProperties.vue';
import SourceFilters from 'components/windows/SourceFilters.vue';
import AddSourceFilter from 'components/windows/AddSourceFilter.vue';
import EditStreamInfo from 'components/windows/EditStreamInfo.vue';
import AdvancedAudio from 'components/windows/AdvancedAudio.vue';
import Notifications from 'components/windows/Notifications.vue';
import Troubleshooter from 'components/windows/Troubleshooter.vue';
import Blank from 'components/windows/Blank.vue';
import ManageSceneCollections from 'components/windows/ManageSceneCollections.vue';
import RecentEvents from 'components/windows/RecentEvents.vue';
import Projector from 'components/windows/Projector.vue';
import MediaGallery from 'components/windows/MediaGallery.vue';
import { mutation, StatefulService } from 'services/stateful-service';
import electron from 'electron';
import Vue from 'vue';
import Util from 'services/utils';
import { Subject } from 'rxjs/Subject';

import BitGoal from 'components/widgets/goal/BitGoal.vue';
import DonationGoal from 'components/widgets/goal/DonationGoal.vue';
import ChatBox from 'components/widgets/ChatBox.vue';
import FollowerGoal from 'components/widgets/goal/FollowerGoal.vue';
import ViewerCount from 'components/widgets/ViewerCount.vue';
import StreamBoss from 'components/widgets/StreamBoss.vue';
import DonationTicker from 'components/widgets/DonationTicker.vue';
import Credits from 'components/widgets/Credits.vue';
import EventList from 'components/widgets/EventList.vue';

import ChatbotCommandWindow from 'components/page-components/Chatbot/windows/ChatbotCommandWindow.vue';
import ChatbotTimerWindow from 'components/page-components/Chatbot/windows/ChatbotTimerWindow.vue';
import ChatbotAlertsWindow from 'components/page-components/Chatbot/windows/ChatbotAlertsWindow.vue';
import ChatbotCapsProtectionWindow from 'components/page-components/Chatbot/windows/ChatbotCapsProtectionWindow.vue';

import TipJar from 'components/widgets/TipJar.vue';
import SponsorBanner from 'components/widgets/SponsorBanner.vue';

const { ipcRenderer, remote } = electron;
const BrowserWindow = remote.BrowserWindow;
const uuid = window['require']('uuid/v4');

// This is a list of components that are registered to be
// top level components in new child windows.
export function getComponents() {
  return {
    Main,
    Settings,
    SceneTransitions,
    SourcesShowcase,
    NameSource,
    AddSource,
    NameScene,
    NameSceneCollection,
    NameFolder,
    SourceProperties,
    SourceFilters,
    AddSourceFilter,
    Blank,
    EditStreamInfo,
    AdvancedAudio,
    Notifications,
    Troubleshooter,
    ManageSceneCollections,
    Projector,
    RecentEvents,
    MediaGallery,

    BitGoal,
    DonationGoal,
    FollowerGoal,
    ChatBox,
    ViewerCount,
    DonationTicker,
    Credits,
    EventList,
    TipJar,
    SponsorBanner,
    StreamBoss,

    ChatbotCommandWindow,
    ChatbotTimerWindow,
    ChatbotAlertsWindow,
    ChatbotCapsProtectionWindow,
  };
}


export interface IWindowOptions {
  componentName: string;
  queryParams?: Dictionary<any>;
  size?: {
    width: number;
    height: number;
  };
  scaleFactor: number;
  isShown: boolean;
  title?: string;
  center?: boolean;
  isPreserved?: boolean;
  preservePrevWindow?: boolean;
  prevWindowOptions? : IWindowOptions;
}

interface IWindowsState {
  [windowId: string]: IWindowOptions;
}

const DEFAULT_WINDOW_OPTIONS: IWindowOptions = {
  componentName: 'Blank',
  scaleFactor: 1,
  isShown: true
};

export class WindowsService extends StatefulService<IWindowsState> {

  /**
   * 'main' and 'child' are special window ids that always exist
   * and have special purposes.  All other windows ids are considered
   * 'one-off' windows and can be freely created and destroyed.
   */
  static initialState: IWindowsState = {
    main: {
      componentName: 'Main',
      scaleFactor: 1,
      isShown: true,
      title: `Streamlabs OBS - Version: ${remote.process.env.SLOBS_VERSION}`
    },
    child: {
      componentName: 'Blank',
      scaleFactor: 1,
      isShown: false
    }
  };

  // This is a list of components that are registered to be
  // top level components in new child windows.
  components = getComponents();

  windowUpdated = new Subject<{windowId: string, options:  Partial<IWindowOptions>}>();
  private windows: Dictionary<Electron.BrowserWindow> = {};


  init() {
    const windows = BrowserWindow.getAllWindows();

    this.windows.main = windows[0];
    this.windows.child = windows[1];

    this.updateScaleFactor('main');
    this.updateScaleFactor('child');
    this.windows.main.on('move', () => this.updateScaleFactor('main'));
    this.windows.child.on('move', () => this.updateScaleFactor('child'));
  }

  private updateScaleFactor(windowId: string) {
    const window = this.windows[windowId];
    const bounds = window.getBounds();
    const currentDisplay = electron.screen.getDisplayMatching(bounds);
    this.UPDATE_SCALE_FACTOR(windowId, currentDisplay.scaleFactor);
  }

  showWindow(options: Partial<IWindowOptions>) {
    // Don't center the window if it's the same component
    // This prevents "snapping" behavior when navigating settings
    if (options.componentName !== this.state.child.componentName) options.center = true;

    ipcRenderer.send('window-showChildWindow', options);
  }

  closeChildWindow() {
    const windowOptions = this.state.child;

    // show previous window if `preservePrevWindow` flag is true
    if (windowOptions.preservePrevWindow && windowOptions.prevWindowOptions) {
      ipcRenderer.send('window-showChildWindow', {
        ...windowOptions.prevWindowOptions,
        isPreserved: true
      });
      return;
    }


    ipcRenderer.send('window-closeChildWindow');

    // This prevents you from seeing the previous contents
    // of the window for a split second after it is shown.
    this.updateChildWindowOptions({ componentName: 'Blank', isShown: false });

    // Refocus the main window
    ipcRenderer.send('window-focusMain');
  }

  closeMainWindow() {
    remote.getCurrentWindow().close();
  }


  /**
   * Creates a one-off window that will not impact or close
   * any existing windows, and will cease to exist when closed.
   * @param options window options
   * @param windowId A unique window id.  If a window with that id
   * already exists, this function will focus the existing window instead.
   * @return the window id of the created window
   */
  createOneOffWindow(options: Partial<IWindowOptions>, windowId?: string): string {
    windowId = windowId || uuid();

    if (this.windows[windowId]) {
      this.windows[windowId].restore();
      this.windows[windowId].focus();
      return windowId;
    }

    this.CREATE_ONE_OFF_WINDOW(windowId, options);

    const newWindow = this.windows[windowId] = new BrowserWindow({
      frame: false,
      width: (options.size && options.size.width) || 400,
      height: (options.size && options.size.height) || 400,
      title: options.title || 'New Window'
    });

    newWindow.setMenu(null);
    newWindow.on('closed', () => {
      delete this.windows[windowId];
      this.DELETE_ONE_OFF_WINDOW(windowId);
    });

    if (Util.isDevMode()) {
      newWindow.webContents.openDevTools({ mode: 'detach' });
    }

    const indexUrl = remote.getGlobal('indexUrl');
    newWindow.loadURL(`${indexUrl}?windowId=${windowId}`);

    return windowId;
  }

  /**
   * Closes all one-off windows
   */
  closeAllOneOffs() {
    Object.keys(this.windows).forEach(windowId => {
      if (windowId === 'main') return;
      if (windowId === 'child') return;
      if (this.windows[windowId]) {
        if (!this.windows[windowId].isDestroyed()) {
          this.windows[windowId].destroy();
        }
      }
    });
  }


  getChildWindowOptions(): IWindowOptions {
    return this.state.child;
  }

  getChildWindowQueryParams(): Dictionary<string> {
    return this.getChildWindowOptions().queryParams || {};
  }

  getWindowOptions(windowId: string) {
    return this.state[windowId].queryParams || {};
  }


  updateChildWindowOptions(optionsPatch: Partial<IWindowOptions>) {
    const newOptions: IWindowOptions = { ...DEFAULT_WINDOW_OPTIONS, ...optionsPatch };
    if (newOptions.preservePrevWindow) {
      const currentOptions = cloneDeep(this.state.child);

      if (currentOptions.preservePrevWindow) {
        throw new Error('You can\'t use preservePrevWindow option for more that 1 window in the row');
      }

      newOptions.prevWindowOptions = currentOptions;

      // restrict saving history only for 1 window before
      delete newOptions.prevWindowOptions.prevWindowOptions;
    }

    this.SET_CHILD_WINDOW_OPTIONS(newOptions);
    this.windowUpdated.next({ windowId: 'child', options: newOptions });
  }

  updateMainWindowOptions(options: Partial<IWindowOptions>) {
    this.UPDATE_MAIN_WINDOW_OPTIONS(options);
  }

  @mutation()
  private SET_CHILD_WINDOW_OPTIONS(options: IWindowOptions) {
    options.queryParams = options.queryParams || {};
    this.state.child = options;
  }

  @mutation()
  private UPDATE_MAIN_WINDOW_OPTIONS(options: Partial<IWindowOptions>) {
    this.state.main = { ...this.state.main, ...options };
  }

  @mutation()
  private UPDATE_SCALE_FACTOR(windowId: string, scaleFactor: number) {
    this.state[windowId].scaleFactor = scaleFactor;
  }

  @mutation()
  private CREATE_ONE_OFF_WINDOW(windowId: string, options: Partial<IWindowOptions>) {
    const opts = {
      componentName: 'Blank',
      scaleFactor: 1,
      ...options
    };

    Vue.set(this.state, windowId, opts);
  }

  @mutation()
  private DELETE_ONE_OFF_WINDOW(windowId: string) {
    Vue.delete(this.state, windowId);
  }
}
