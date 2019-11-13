import { ISettingsSubCategory, SettingsService } from 'services/settings';
import { Inject } from 'services/core/injector';
import { InitAfter, mutation, PersistentStatefulService } from '../../core';
import { UserService } from 'services/user';
import { TPlatform } from 'services/platforms';
import { invert } from 'lodash';
import { MixerService, TwitchService } from '../../../app-services';

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

  static defaultState: IStreamSettingsState = {
    protectedModeEnabled: true,
    protectedModeMigrationRequired: true,
    title: '',
    description: '',
    warnNoVideoSources: true,
  };

  init() {
    this.userService.userLogin.subscribe(async _ => {
      const protectedModeHasBeenDisabled = await this.migrateToProtectedModeIfRequired();
      if (!protectedModeHasBeenDisabled) this.resetStreamSettings();
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
    const streamFormData = this.getObsStreamSettings();
    streamFormData.forEach(subCategory => {
      subCategory.parameters.forEach(parameter => {
        if (parameter.name === 'service' && patch.platform !== void 0) {
          parameter.value = platformToServiceNameMap[patch.platform];
        }

        if (parameter.name === 'key' && patch.key !== void 0) {
          parameter.value = patch.key;
        }

        if (parameter.name === 'streamType' && patch.streamType !== void 0) {
          parameter.value = patch.streamType;
          // we should immediately save the streamType in OBS if it's changed
          // otherwise OBS will not save 'key' and 'server' values
          this.settingsService.setSettings('Stream', streamFormData);
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
      streamType: obsStreamSettings.streamType as IStreamSettings['streamType'],
      server: obsStreamSettings.server,
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
   * reset streaming settings to defaults
   */
  resetStreamSettings() {
    // protected mode is enabled by default
    this.setSettings({
      protectedModeEnabled: true,
      key: '',
      streamType: 'rtmp_common',
    });
  }

  /**
   * Protected mode is enabled by default but we should disable it for some users
   * returns true if protected mode has been disabled
   */
  private async migrateToProtectedModeIfRequired(): Promise<boolean> {
    const currentStreamSettings = this.settings;
    if (!currentStreamSettings.protectedModeMigrationRequired) return false;

    this.setSettings({ protectedModeMigrationRequired: false });

    // only Twitch and Mixer require migration
    if (!['twitch', 'mixer'].includes(this.userService.platform.type)) {
      return false;
    }

    // disable protectedMode for users who have manually changed their server
    if (currentStreamSettings.server !== 'auto') {
      this.setSettings({ protectedModeEnabled: false });
      return true;
    }

    // there is no need to migrate users with no streamKey set
    if (!currentStreamSettings.key) return false;

    // disable protected mod if fetched streamkey doesn't match streamkey in settings
    const platform = (this.userService.getPlatformService() as unknown) as
      | TwitchService
      | MixerService;
    if ((await platform.fetchStreamKey()) !== currentStreamSettings.key) {
      this.setSettings({ protectedModeEnabled: false });
      return true;
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
