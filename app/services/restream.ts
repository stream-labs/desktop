import { StatefulService } from 'services';
import { Inject, mutation, InitAfter } from 'services/core';
import { HostsService } from 'services/hosts';
import { getPlatformService, TPlatform, TStartStreamOptions } from 'services/platforms';
import { ITwitchStartStreamOptions } from 'services/platforms/twitch';
import { StreamSettingsService } from 'services/settings/streaming';
import { UserService } from 'services/user';
import { authorizedHeaders } from 'util/requests';
import Vue from 'vue';
import { IFacebookStartStreamOptions } from './platforms/facebook';
import { IncrementalRolloutService, EAvailableFeatures } from './incremental-rollout';
import Utils from './utils';

interface IRestreamTarget {
  id: number;
  platform: TPlatform;
  streamKey: string;
}

interface IRestreamPlatformInfo {
  enabled: boolean;
}

interface IRestreamState {
  enabled: boolean;

  /**
   * Only twitch and facebook are currently supported
   */
  platforms: {
    twitch?: {
      options: ITwitchStartStreamOptions;
      streamKey: string;
    };
    facebook?: {
      options: IFacebookStartStreamOptions;
      streamKey: string;
    };
  };
}

interface IUserSettingsResponse {
  // Not sure what effect this has
  enabled: boolean;

  streamKey: string;
}

@InitAfter('UserService')
export class RestreamService extends StatefulService<IRestreamState> {
  @Inject() hostsService: HostsService;
  @Inject() userService: UserService;
  @Inject() streamSettingsService: StreamSettingsService;
  @Inject() incrementalRolloutService: IncrementalRolloutService;

  settings: IUserSettingsResponse;

  static initialState: IRestreamState = {
    enabled: true,
    platforms: {},
  };

  @mutation()
  private SET_ENABLED(enabled: boolean) {
    this.state.enabled = enabled;
  }

  @mutation()
  private UNSTAGE_PLATFORMS() {
    this.state.platforms = {};
  }

  @mutation()
  private STAGE_PLATFORM(platform: TPlatform, options: TStartStreamOptions, streamKey: string) {
    Vue.set(this.state.platforms, platform, { options, streamKey });
  }

  init() {
    this.userService.userLogin.subscribe(() => this.loadUserSettings());
    this.userService.userLogout.subscribe(() => {
      this.settings = null;
      this.SET_ENABLED(false);
    });
  }

  async loadUserSettings() {
    this.settings = await this.fetchUserSettings();
    this.SET_ENABLED(this.settings.enabled && this.canEnableRestream);
  }

  get host() {
    // return this.hostsService.streamlabs;
    return 'beta.streamlabs.com';
  }

  /**
   * This determines whether the user sees the restream toggle in settings
   * Requirements:
   * - Logged in with Twitch
   * - Rolled out to
   */
  get canEnableRestream() {
    return !!(
      this.userService.state.auth &&
      this.userService.state.auth.primaryPlatform === 'twitch' &&
      (this.incrementalRolloutService.featureIsEnabled(EAvailableFeatures.restream) ||
        Utils.isDevMode() ||
        Utils.isPreview())
    );
  }

  get chatUrl() {
    return `https://streamlabs.com/embed/chat?oauth_token=${this.userService.apiToken}`;
  }

  /**
   * Go live requirements for now:
   * - Restream is enabled
   * - Protected mode is enabled
   * - Logged in via twitch
   * - Facebook is linked
   * For now, restream will only work if you are logged into Twitch and
   * restreaming to Facebook. We are starting with a simple case with broad
   * appeal, but will be expanding to all platforms very soon.
   */
  get shouldGoLiveWithRestream() {
    return (
      this.userService.state.auth &&
      this.userService.state.auth.primaryPlatform === 'twitch' &&
      this.userService.state.auth.platforms.facebook &&
      this.state.enabled &&
      this.streamSettingsService.protectedModeEnabled
    );
  }

  fetchUserSettings() {
    const headers = authorizedHeaders(this.userService.apiToken);
    const url = `https://${this.host}/api/v1/rst/user/settings`;
    const request = new Request(url, { headers });

    return fetch(request).then(res => res.json());
  }

  fetchTargets(): Promise<IRestreamTarget[]> {
    const headers = authorizedHeaders(this.userService.apiToken);
    const url = `https://${this.host}/api/v1/rst/targets`;
    const request = new Request(url, { headers });

    return fetch(request).then(res => res.json());
  }

  fetchIngest(): Promise<{ server: string }> {
    const headers = authorizedHeaders(this.userService.apiToken);
    const url = `https://${this.host}/api/v1/rst/ingest`;
    const request = new Request(url, { headers });

    return fetch(request).then(res => res.json());
  }

  setEnabled(enabled: boolean) {
    this.SET_ENABLED(enabled);

    const headers = authorizedHeaders(
      this.userService.apiToken,
      new Headers({ 'Content-Type': 'application/json' }),
    );
    const url = `https://${this.host}/api/v1/rst/user/settings`;
    const body = JSON.stringify({
      enabled,
      dcProtection: false,
      idleTimeout: 30,
    });
    const request = new Request(url, { headers, body, method: 'PUT' });

    return fetch(request).then(res => res.json());
  }

  // TODO: This will eventually be based on preferences
  get platforms(): TPlatform[] {
    return ['twitch', 'facebook'];
  }

  /**
   * Stages a platform for restreaming, which means it will have a target
   * created when `setupRestreamTargets` is called.
   * @param platform The platform to stage
   * @param options The go-live info/options
   */
  async stagePlatform(platform: TPlatform, options: TStartStreamOptions) {
    const service = getPlatformService(platform);
    const streamKey = await service.beforeGoLive(options);

    this.STAGE_PLATFORM(platform, options, streamKey);
  }

  unstageAllPlatforms() {
    this.UNSTAGE_PLATFORMS();
  }

  async beforeGoLive() {
    await Promise.all([this.setupIngest(), this.setupTargets()]);
  }

  async setupIngest() {
    const ingest = (await this.fetchIngest()).server;

    // We need to move OBS to custom ingest mode before we can set the server
    this.streamSettingsService.setSettings({
      streamType: 'rtmp_custom',
    });

    this.streamSettingsService.setSettings({
      key: this.settings.streamKey,
      server: ingest,
    });
  }

  async setupTargets() {
    const targets = await this.fetchTargets();
    const promises = targets.map(t => this.deleteTarget(t.id));

    await Promise.all(promises);

    console.log(JSON.stringify(this.state.platforms));

    const promises2 = Object.keys(this.state.platforms).map(platform => {
      return this.createTarget(platform as TPlatform, this.state.platforms[platform].streamKey);
    });

    await Promise.all(promises2);
  }

  // TODO: This function has no error handling
  // async setupRestreamTargets(info: IStartRestreamInfo) {
  //   const clonedInfo = cloneDeep(info);
  //   const targets = await this.fetchTargets();

  //   // Update/delete existing targets
  //   for (const target of targets) {
  //     if (clonedInfo[target.platform]) {
  //       // Target already exists for this platform, update it
  //       const service = getPlatformService(target.platform);
  //       const streamKey = await service.beforeGoLive(clonedInfo[target.platform]);

  //       await this.updateTarget(target.id, streamKey);
  //       delete clonedInfo[target.platform];
  //     } else {
  //       // Remove the target
  //       await this.deleteTarget(target.id);
  //     }
  //   }

  //   // Create any new targets that may need to be created
  //   for (const platform in clonedInfo) {
  //     const service = getPlatformService(platform as TPlatform);
  //     const streamKey = await service.beforeGoLive(clonedInfo[platform]);

  //     await this.createTarget(platform as TPlatform, streamKey);
  //   }
  // }

  createTarget(platform: TPlatform, streamKey: string) {
    const headers = authorizedHeaders(
      this.userService.apiToken,
      new Headers({ 'Content-Type': 'application/json' }),
    );
    const url = `https://${this.host}/api/v1/rst/targets`;
    const body = JSON.stringify([
      {
        platform,
        streamKey,
        enabled: true,
        dcProtection: false,
        idleTimeout: 30,
        label: `${platform} target`,
      },
    ]);
    const request = new Request(url, { headers, body, method: 'POST' });

    return fetch(request).then(res => res.json());
  }

  deleteTarget(id: number) {
    const headers = authorizedHeaders(this.userService.apiToken);
    const url = `https://${this.host}/api/v1/rst/targets/${id}`;
    const request = new Request(url, { headers, method: 'DELETE' });

    return fetch(request);
  }

  updateTarget(id: number, streamKey: string) {
    const headers = authorizedHeaders(
      this.userService.apiToken,
      new Headers({ 'Content-Type': 'application/json' }),
    );
    const url = `https://${this.host}/api/v1/rst/targets`;
    const body = JSON.stringify([
      {
        id,
        streamKey,
      },
    ]);
    const request = new Request(url, { headers, body, method: 'PUT' });

    return fetch(request).then(res => res.json());
  }
}
