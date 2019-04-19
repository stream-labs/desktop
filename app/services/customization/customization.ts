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

// Maps to --background
const THEME_BACKGROUNDS = {
  'night-theme': { r: 9, g: 22, b: 29 },
  'day-theme': { r: 247, g: 249, b: 249 },
};

// Maps to --section
const DISPLAY_BACKGROUNDS = {
  'night-theme': { r: 11, g: 22, b: 28 },
  'day-theme': { r: 245, g: 248, b: 250 },
};

/**
 * This class is used to store general UI behavior flags
 * that are sticky across application runtimes.
 */
export class CustomizationService extends PersistentStatefulService<ICustomizationServiceState>
  implements ICustomizationServiceApi {
  static defaultState: ICustomizationServiceState = {
    theme: 'night-theme',
    updateStreamInfoOnLive: true,
    livePreviewEnabled: true,
    leftDock: false,
    hideViewerCount: false,
    livedockCollapsed: true,
    livedockSize: 0,
    bottomdockSize: 240,
    performanceMode: false,
    chatZoomFactor: 1,
    enableBTTVEmotes: false,
    enableFFZEmotes: false,
    mediaBackupOptOut: false,
    folderSelection: false,
    navigateToLiveOnStreamStart: true,
    experimental: {
      // put experimental features here
    },
    hideStyleBlockingElements: true,
  };

  settingsChanged = new Subject<Partial<ICustomizationSettings>>();

  init() {
    super.init();
    this.setLiveDockCollapsed(true); // livedock is always collapsed on app start

    // Hide these elements until the app is finished loading
    this.setSettings({ hideStyleBlockingElements: true });

    if (this.state.nightMode != null) {
      const theme = this.state.nightMode ? 'night-theme' : 'day-theme';
      this.setSettings({ theme, nightMode: null });
    }
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

  get currentTheme() {
    return this.state.theme;
  }

  setTheme(theme: string) {
    return this.setSettings({ theme });
  }

  get themeBackground() {
    return THEME_BACKGROUNDS[this.currentTheme];
  }

  get displayBackground() {
    return DISPLAY_BACKGROUNDS[this.currentTheme];
  }

  get isDarkTheme() {
    return ['night-theme'].includes(this.currentTheme);
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
      <IObsListInput<string>>{
        value: settings.theme,
        name: 'theme',
        description: $t('Theme'),
        type: 'OBS_PROPERTY_LIST',
        options: [
          { value: 'night-theme', description: $t('Night (Classic)') },
          { value: 'day-theme', description: $t('Day (Classic)') },
        ],
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
