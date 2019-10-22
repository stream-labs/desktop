import { ISettingsSubCategory, SettingsService } from 'services/settings';
import { Inject } from 'services/core/injector';
import { mutation, PersistentStatefulService } from '../../core';
import { UserService } from 'services/user';
import { TPlatform } from 'services/platforms';

/**
 * settings that we keep in the localStorage
 */
interface IStreamSettingsState {
  /**
   * In protected mode we fetch and update stream key before each stream start
   */
  protectedModeEnabled: boolean;
}

/**
 * unified settings object
 */
interface IStreamSettings extends IStreamSettingsState {
  platform: TPlatform;
  key: string;
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
export class StreamSettingsService extends PersistentStatefulService<IStreamSettingsState> {
  @Inject() private settingsService: SettingsService;
  @Inject() private userService: UserService;

  static defaultState: IStreamSettingsState = {
    protectedModeEnabled: true,
  };

  /**
   * setup all stream-settings via single object
   */
  setSettings(patch: Partial<IStreamSettings>) {
    // we store protectedModeEnabled in the localStorage
    if (patch.protectedModeEnabled !== void 0) {
      this.SET_PROTECTED_MODE(patch.protectedModeEnabled);
    }

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
      platform: obsStreamSettings.service as TPlatform,
      key: obsStreamSettings.key,
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
   * reset streaming settings to defaults
   */
  async resetStreamSettings() {
    // protected mode is enabled by default
    this.setSettings({
      protectedModeEnabled: true,
      key: '',
      streamType: 'rtmp_common',
    });
    // setup current platform-related settings
    if (this.userService.isLoggedIn()) {
      await this.userService.getPlatformService().setupStreamSettings();
    }
  }

  @mutation()
  private SET_PROTECTED_MODE(enabled: boolean) {
    this.state.protectedModeEnabled = enabled;
  }
}
