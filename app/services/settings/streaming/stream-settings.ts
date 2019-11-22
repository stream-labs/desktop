import { ISettingsSubCategory, SettingsService } from 'services/settings';
import { Inject } from 'services/core/injector';
import { InitAfter, mutation, PersistentStatefulService } from '../../core';
import { UserService } from 'services/user';
import { TPlatform, getPlatformService } from 'services/platforms';
import { invert } from 'lodash';
import { MixerService, TwitchService } from '../../../app-services';
import { PlatformAppsService } from 'services/platform-apps';

/**
 * settings that we keep in the localStorage
 */
interface IStreamSettingsState {
  /**
   * In protected mode we fetch and update stream key before each stream start
   */
  protectedModeEnabled: boolean;

  /**
   * true if user has not been migrated to the protected mode
   */
  protectedModeMigrationRequired: boolean;

  /**
   * stream title from last streaming session
   */
  title: string;

  /**
   * description from last streaming session
   */
  description: string;

  /**
   * show warning if no sources exists before going live
   */
  warnNoVideoSources: boolean;
}

/**
 * unified settings object
 */
interface IStreamSettings extends IStreamSettingsState {
  platform: TPlatform;
  key: string;
  server: string;
  streamType: 'rtmp_common' | 'rtmp_custom';
  warnBeforeStartingStream: boolean;
  recordWhenStreaming: boolean;
  replayBufferWhileStreaming: boolean;
  warnBeforeStoppingStream: boolean;
  keepRecordingWhenStreamStops: boolean;
  keepReplayBufferStreamStops: boolean;
  delayEnable: boolean;
  delaySec: number;
}

const platformToServiceNameMap: { [key in TPlatform]: string } = {
  twitch: 'Twitch',
  youtube: 'YouTube / YouTube Gaming',
  mixer: 'Mixer.com - FTL',
  facebook: 'Facebook Live',
};

/**
 * This service aggregates managing all streaming setting in the app
 */
@InitAfter('UserService')
export class StreamSettingsService extends PersistentStatefulService<IStreamSettingsState> {
  @Inject() private settingsService: SettingsService;
  @Inject() private userService: UserService;
  @Inject() private platformAppsService: PlatformAppsService;
  @Inject() private streamSettingsService: StreamSettingsService;

  static defaultState: IStreamSettingsState = {
    protectedModeEnabled: true,
    protectedModeMigrationRequired: true,
    title: '',
    description: '',
    warnNoVideoSources: true,
  };

  init() {
    super.init();
    this.userService.userLogin.subscribe(async _ => {
      await this.migrateOffProtectedModeIfRequired();
    });
    this.userService.userLogout.subscribe(async _ => {
      this.resetStreamSettings();
    });
  }

  /**
   * setup all stream-settings via single object
   */
  setSettings(patch: Partial<IStreamSettings>) {
    // save settings to localStorage
    Object.keys(this.state).forEach(prop => {
      if (prop in patch) {
        this.SET_LOCAL_STORAGE_SETTINGS({ [prop]: patch[prop] } as Partial<IStreamSettingsState>);
      }
    });

    // save settings related to "Settings->Stream" window
    let streamFormData = this.getObsStreamSettings();

    streamFormData.forEach(subCategory => {
      subCategory.parameters.forEach(parameter => {
        if (parameter.name === 'streamType' && patch.streamType !== void 0) {
          parameter.value = patch.streamType;
          // we should immediately save the streamType in OBS if it's changed
          // otherwise OBS will not save 'key' and 'server' values
          this.settingsService.setSettings('Stream', streamFormData);
        }
      });
    });

    // We need to refresh the data in case there are additional fields
    streamFormData = this.getObsStreamSettings();

    streamFormData.forEach(subCategory => {
      subCategory.parameters.forEach(parameter => {
        if (parameter.name === 'service' && patch.platform !== void 0) {
          parameter.value = platformToServiceNameMap[patch.platform];
        }

        if (parameter.name === 'key' && patch.key !== void 0) {
          parameter.value = patch.key;
        }

        if (parameter.name === 'server' && patch.server !== void 0) {
          parameter.value = patch.server;
        }
      });
    });
    this.settingsService.setSettings('Stream', streamFormData);
  }

  /**
   * obtain stream settings in a single object
   */
  get settings(): IStreamSettings {
    const obsStreamSettings = this.settingsService.state.Stream;
    const obsGeneralSettings = this.settingsService.state.General;
    const obsAdvancedSettings = this.settingsService.state.Advanced;

    return {
      protectedModeEnabled: this.state.protectedModeEnabled,
      title: this.state.title,
      description: this.state.description,
      warnNoVideoSources: this.state.warnNoVideoSources,
      protectedModeMigrationRequired: this.state.protectedModeMigrationRequired,
      platform: invert(platformToServiceNameMap)[obsStreamSettings.service] as TPlatform,
      key: obsStreamSettings.key,
      server: obsStreamSettings.server,
      streamType: obsStreamSettings.streamType as IStreamSettings['streamType'],
      warnBeforeStartingStream: obsGeneralSettings.WarnBeforeStartingStream,
      recordWhenStreaming: obsGeneralSettings.RecordWhenStreaming,
      replayBufferWhileStreaming: obsGeneralSettings.ReplayBufferWhileStreaming,
      warnBeforeStoppingStream: obsGeneralSettings.WarnBeforeStoppingStream,
      keepRecordingWhenStreamStops: obsGeneralSettings.KeepRecordingWhenStreamStops,
      keepReplayBufferStreamStops: obsGeneralSettings.KeepReplayBufferStreamStops,
      delayEnable: obsAdvancedSettings.DelayEnable,
      delaySec: obsAdvancedSettings.DelaySec,
    };
  }

  getObsStreamSettings(): ISettingsSubCategory[] {
    return this.settingsService.getSettingsFormData('Stream');
  }

  setObsStreamSettings(formData: ISettingsSubCategory[]) {
    this.settingsService.setSettings('Stream', formData);
  }

  get protectedModeEnabled(): boolean {
    return this.userService.isLoggedIn() && this.state.protectedModeEnabled;
  }

  /**
   * This is a workaround to support legacy apps that modify the stream key.
   * This is only Mobcrush at the moment.
   */
  isSafeToModifyStreamKey() {
    // Mobcrush production app id
    if (
      this.platformAppsService.state.loadedApps.find(app => app.id === '3ed9cf0dd4' && app.enabled)
    ) {
      if (
        this.streamSettingsService.settings.streamType === 'rtmp_custom' &&
        this.streamSettingsService.settings.server === 'rtmp://live.mobcrush.net/slobs'
      ) {
        return false;
      }
    }

    return true;
  }

  /**
   * reset streaming settings to defaults
   */
  resetStreamSettings() {
    // protected mode is enabled by default
    this.setSettings({
      protectedModeEnabled: true,
      protectedModeMigrationRequired: false,
      key: '',
      streamType: 'rtmp_common',
    });
  }

  /**
   * Protected mode is enabled by default but we should disable it for some users
   * returns true if protected mode has been disabled
   */
  private async migrateOffProtectedModeIfRequired() {
    const currentStreamSettings = this.settings;

    // We already migrated, so don't touch settings
    if (!currentStreamSettings.protectedModeMigrationRequired) return;

    this.setSettings({ protectedModeMigrationRequired: false });

    if (this.userService.platformType === 'youtube') {
      if (currentStreamSettings.platform !== 'youtube') {
        this.setSettings({ protectedModeEnabled: false });
      }

      return;
    }

    if (this.userService.platformType === 'facebook') {
      if (currentStreamSettings.platform !== 'facebook') {
        this.setSettings({ protectedModeEnabled: false });
      }

      return;
    }

    // User is Twitch or Mixer

    // disable protectedMode for users who have manually changed their server
    if (currentStreamSettings.server !== 'auto') {
      this.setSettings({ protectedModeEnabled: false });
      return;
    }

    // there is no need to migrate users with no streamKey set
    if (!currentStreamSettings.key) return;

    // disable protected mod if fetched streamkey doesn't match streamkey in settings
    const platform = (getPlatformService(this.userService.platformType) as unknown) as
      | TwitchService
      | MixerService;
    if ((await platform.fetchStreamKey()) !== currentStreamSettings.key) {
      this.setSettings({ protectedModeEnabled: false });
      return;
    }

    return false;
  }

  @mutation()
  private SET_LOCAL_STORAGE_SETTINGS(settings: Partial<IStreamSettingsState>) {
    Object.keys(settings).forEach(prop => {
      this.state[prop] = settings[prop];
    });
  }
}
