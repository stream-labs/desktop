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
import electron from 'electron';

interface IRestreamTarget {
  id: number;
  platform: TPlatform;
  streamKey: string;
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
  /**
   * Whether this user has restream enabled
   */
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
    return this.hostsService.streamlabs;
  }

  /**
   * This determines whether the user sees the restream toggle in settings
   * Requirements:
   * - Logged in with Twitch
   * - Rolled out to
   */
  get canEnableRestream() {
    return !!(
      this.userService.state.auth && this.userService.state.auth.primaryPlatform === 'twitch'
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

    if (!enabled) this.deinitChat();

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

    await this.createTargets(
      Object.keys(this.state.platforms).map(platform => {
        return {
          platform: platform as TPlatform,
          streamKey: this.state.platforms[platform].streamKey,
        };
      }),
    );
  }

  checkStatus(): Promise<boolean> {
    const url = `https://${this.host}/api/v1/rst/util/status`;
    const request = new Request(url);

    return fetch(request)
      .then(res => res.json())
      .then(
        j =>
          j.find((service: { name: string; enabled: boolean }) => service.name === 'restream')
            .status,
      );
  }

  createTargets(targets: { platform: TPlatform; streamKey: string }[]) {
    const headers = authorizedHeaders(
      this.userService.apiToken,
      new Headers({ 'Content-Type': 'application/json' }),
    );
    const url = `https://${this.host}/api/v1/rst/targets`;
    const body = JSON.stringify(
      targets.map(target => {
        return {
          platform: target.platform,
          streamKey: target.streamKey,
          enabled: true,
          dcProtection: false,
          idleTimeout: 30,
          label: `${target.platform} target`,
        };
      }),
    );
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

  /* Chat Handling
   * TODO: Lots of this is copy-pasted from the chat service
   * The chat service needs to be refactored\
   */
  private chatView: Electron.BrowserView;

  refreshChat() {
    this.chatView.webContents.loadURL(this.chatUrl);
  }

  mountChat(electronWindowId: number) {
    if (!this.chatView) this.initChat();

    const win = electron.remote.BrowserWindow.fromId(electronWindowId);

    // This method was added in our fork
    (win as any).addBrowserView(this.chatView);
  }

  setChatBounds(position: IVec2, size: IVec2) {
    if (!this.chatView) return;

    this.chatView.setBounds({
      x: Math.round(position.x),
      y: Math.round(position.y),
      width: Math.round(size.x),
      height: Math.round(size.y),
    });
  }

  unmountChat(electronWindowId: number) {
    if (!this.chatView) return;

    const win = electron.remote.BrowserWindow.fromId(electronWindowId);

    // @ts-ignore: this method was added in our fork
    win.removeBrowserView(this.chatView);
  }

  private initChat() {
    if (this.chatView) return;

    const partition = this.userService.state.auth.partition;

    this.chatView = new electron.remote.BrowserView({
      webPreferences: {
        partition,
        nodeIntegration: false,
      },
    });

    this.chatView.webContents.loadURL(this.chatUrl);

    electron.ipcRenderer.send('webContents-preventPopup', this.chatView.webContents.id);
  }

  private deinitChat() {
    if (!this.chatView) return;

    // @ts-ignore: typings are incorrect
    this.chatView.destroy();
    this.chatView = null;
  }
}
