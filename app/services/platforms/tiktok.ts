import { InheritMutations, Inject, mutation } from '../core';
import { BasePlatformService } from './base-platform';
import {
  EPlatformCallResult,
  IPlatformRequest,
  IPlatformService,
  IPlatformState,
  TPlatformCapability,
  TStartStreamOptions,
} from './index';
import { authorizedHeaders, jfetch } from '../../util/requests';
import { throwStreamError } from '../streaming/stream-error';
import { platformAuthorizedRequest } from './utils';
import { IGoLiveSettings } from '../streaming';
import { TOutputOrientation } from 'services/restream';
import { IVideo } from 'obs-studio-node';
import { TDisplayType } from 'services/settings-v2';
import {
  ETikTokErrorTypes,
  ETikTokLiveScopeReason,
  ITikTokEndStreamResponse,
  ITikTokError,
  ITikTokLiveScopeResponse,
  ITikTokStartStreamResponse,
  ITikTokUserInfoResponse,
  TTikTokLiveScopeTypes,
} from './tiktok/api';
import { I18nService } from 'services/i18n';
import { getDefined } from 'util/properties-type-guards';
import * as remote from '@electron/remote';
import { WindowsService } from 'services/windows';
import Utils from 'services/utils';

interface ITikTokServiceState extends IPlatformState {
  settings: ITikTokStartStreamSettings;
  broadcastId: string;
  username: string;
}

interface ITikTokStartStreamSettings {
  serverUrl: string;
  streamKey: string;
  title: string;
  liveScope: TTikTokLiveScopeTypes;
  display: TDisplayType;
  video?: IVideo;
  mode?: TOutputOrientation;
}

export interface ITikTokStartStreamOptions {
  title: string;
  serverUrl: string;
  streamKey: string;
  display: TDisplayType;
}
interface ITikTokRequestHeaders extends Dictionary<string> {
  Accept: string;
  'Content-Type': string;
  Authorization: string;
}

@InheritMutations()
export class TikTokService
  extends BasePlatformService<ITikTokServiceState>
  implements IPlatformService {
  static initialState: ITikTokServiceState = {
    ...BasePlatformService.initialState,
    settings: {
      title: '',
      display: 'vertical',
      liveScope: 'denied',
      mode: 'portrait',
      serverUrl: '',
      streamKey: '',
    },
    broadcastId: '',
    username: '',
  };

  @Inject() windowsService: WindowsService;

  readonly apiBase = 'https://open-api.tiktok.com';
  readonly platform = 'tiktok';
  readonly displayName = 'TikTok';
  readonly capabilities = new Set<TPlatformCapability>(['title', 'viewerCount']);

  authWindowOptions: Electron.BrowserWindowConstructorOptions = {
    width: 600,
    height: 800,
  };

  get authUrl() {
    const host = this.hostsService.streamlabs;
    const query = `_=${Date.now()}&skip_splash=true&external=electron&tiktok&force_verify&origin=slobs`;
    return `https://${host}/slobs/login?${query}`;
  }

  private get oauthToken() {
    return this.userService.views.state.auth?.platforms?.tiktok?.token;
  }

  get username(): string {
    return this.state.username;
  }

  get liveStreamingEnabled(): boolean {
    const scope = this.state.settings?.liveScope ?? 'denied';
    return ['approved', 'legacy'].includes(scope);
  }

  /**
   * Whether the user is approved to generate a server url & stream key outside of Live Access
   * @remark Before the implementation of TikTok's Live Access API, users approved for live streaming
   * generated server urls and stream keys that they added in the Go Live window. Until
   */
  getHasScope(type: TTikTokLiveScopeTypes): boolean {
    return this.state.settings?.liveScope === type;
  }

  /**
   * TikTok's API currently does not provide viewer count.
   * To prevent errors, return 0 for now;
   */
  get viewersCount(): number {
    return 0;
  }

  async beforeGoLive(goLiveSettings: IGoLiveSettings, display?: TDisplayType) {
    const ttSettings = getDefined(goLiveSettings.platforms.tiktok);
    const context = display ?? ttSettings?.display;

    if (!this.liveStreamingEnabled) {
      throwStreamError('TIKTOK_STREAM_SCOPE_MISSING');
    }

    if (this.getHasScope('legacy')) {
      // handle streaming with server url and stream key input
      if (!this.streamingService.views.isMultiplatformMode) {
        this.streamSettingsService.setSettings(
          {
            streamType: 'rtmp_custom',
            key: ttSettings.streamKey,
            server: ttSettings.serverUrl,
          },
          context,
        );
      }
      this.SET_STREAM_SETTINGS(ttSettings);
      this.setPlatformContext('tiktok');
    } else {
      // handle streaming via API
      let streamInfo = {} as ITikTokStartStreamResponse;

      try {
        streamInfo = await this.startStream(ttSettings);
        if (!streamInfo?.id) {
          throwStreamError('TIKTOK_GENERATE_CREDENTIALS_FAILED');
        }
      } catch (error: unknown) {
        this.SET_LIVE_SCOPE('denied');
        await this.handleOpenLiveManager();
        throwStreamError('TIKTOK_GENERATE_CREDENTIALS_FAILED', error as any);
      }

      const updatedTTSettings = {
        ...ttSettings,
        serverUrl: streamInfo.rtmp,
        streamKey: streamInfo.key,
      };

      if (!this.streamingService.views.isMultiplatformMode) {
        this.streamSettingsService.setSettings(
          {
            streamType: 'rtmp_custom',
            key: updatedTTSettings.streamKey,
            server: updatedTTSettings.serverUrl,
          },
          context,
        );
      }

      await this.putChannelInfo(updatedTTSettings);

      this.SET_STREAM_KEY(updatedTTSettings.streamKey);
      this.SET_BROADCAST_ID(streamInfo.id);

      this.setPlatformContext('tiktok');
    }
  }

  async afterGoLive(): Promise<void> {
    // open url if stream successfully started

    // keep main window on top to prevent flicker when opening url
    await this.handleOpenLiveManager();
  }

  async afterStopStream(): Promise<void> {
    if (this.state.broadcastId) {
      await this.endStream(this.state.broadcastId);
    }

    // clear server url and stream key
    await this.putChannelInfo({
      ...this.state.settings,
      serverUrl: '',
      streamKey: '',
    });
  }

  fetchNewToken(): Promise<void> {
    const host = this.hostsService.streamlabs;
    const url = `https://${host}/api/v5/slobs/tiktok/refresh`;
    const headers = authorizedHeaders(this.userService.apiToken!);
    const request = new Request(url, { headers });

    return jfetch<{ access_token: string }>(request).then(response =>
      this.userService.updatePlatformToken('tiktok', response.access_token),
    );
  }

  /**
   * Request TikTok API and wrap failed response to a unified error model
   */
  async requestTikTok<T = unknown>(reqInfo: IPlatformRequest | string): Promise<T> {
    try {
      return await platformAuthorizedRequest<T>('tiktok', reqInfo);
    } catch (e: unknown) {
      const code = (e as any).result?.error?.code;
      const notApproved = [
        ETikTokErrorTypes.SCOPE_NOT_AUTHORIZED,
        ETikTokErrorTypes.SCOPE_PERMISSION_MISSED,
        ETikTokErrorTypes.USER_HAS_NO_LIVE_AUTH,
      ].includes(code);

      const message = notApproved
        ? 'The user is not enabled for live streaming'
        : 'Connection error with TikTok';

      console.warn(
        this.getErrorMessage({
          message,
        }),
      );

      if (notApproved) {
        this.SET_LIVE_SCOPE('denied');
      } else {
        const details = (e as any).result?.error
          ? `${(e as any).result.error.type} ${(e as any).result.error.message}`
          : 'Connection failed';
        this.SET_LIVE_SCOPE('denied');
        throwStreamError('TIKTOK_OAUTH_EXPIRED', e as any, details);
      }
    }
  }

  async startStream(opts: ITikTokStartStreamOptions) {
    const host = this.hostsService.streamlabs;
    const url = `https://${host}/api/v5/slobs/tiktok/stream/start`;
    const headers = authorizedHeaders(this.userService.apiToken!);
    const body = new FormData();
    body.append('title', opts.title);
    const request = new Request(url, { headers, method: 'POST', body });

    return jfetch<ITikTokStartStreamResponse>(request);
  }

  async endStream(id: string) {
    const host = this.hostsService.streamlabs;
    const url = `https://${host}/api/v5/slobs/tiktok/stream/${id}/end`;
    const headers = authorizedHeaders(this.userService.apiToken!);
    const request = new Request(url, { headers, method: 'POST' });

    return jfetch<ITikTokEndStreamResponse>(request);
  }

  async fetchViewerCount(): Promise<number> {
    return 0;
  }

  /**
   * Confirm user is approved to stream to TikTok
   */
  async validatePlatform(): Promise<EPlatformCallResult> {
    try {
      const response = await this.fetchLiveAccessStatus();
      const status = response as ITikTokLiveScopeResponse;

      if (status?.reason) {
        const scope = this.convertScope(status.reason);
        this.SET_LIVE_SCOPE(scope);
      } else {
        this.SET_LIVE_SCOPE('denied');
      }

      // clear any leftover server url or stream key
      if (this.state.settings?.serverUrl || this.state.settings?.streamKey) {
        await this.putChannelInfo({
          ...this.state.settings,
          serverUrl: '',
          streamKey: '',
        });
      }

      return this.liveStreamingEnabled
        ? EPlatformCallResult.Success
        : EPlatformCallResult.TikTokStreamScopeMissing;
    } catch (e: unknown) {
      console.warn(this.getErrorMessage(e));
      return EPlatformCallResult.TikTokStreamScopeMissing;
    }
  }

  /**
   * Get if user is approved by TikTok to stream to TikTok
   * @remark Only users approved by TikTok are allowed to generate
   * stream keys. It is possible that users have received approval
   * since the last time that they logged in using TikTok, so get this
   * status every time the user sets the go live settings.
   */
  async fetchLiveAccessStatus(): Promise<void | ITikTokLiveScopeResponse | ITikTokError> {
    const host = this.hostsService.streamlabs;
    const url = `https://${host}/api/v5/slobs/tiktok/info`;
    const headers = authorizedHeaders(this.userService.apiToken);
    const request = new Request(url, { headers });
    return jfetch<ITikTokError>(request).catch(() => {
      console.warn('Error fetching TikTok Live Access status.');
    });
  }

  async fetchUsername(): Promise<string> {
    const url = `${this.apiBase}/user/info/`;
    const headers = this.getHeaders({ url });

    return this.requestTikTok<ITikTokUserInfoResponse>({
      headers,
      url,
      method: 'POST',
      body: JSON.stringify({
        access_token: this.oauthToken,
        fields: ['username'],
      }),
    }).then(json => {
      return json.data.user.username;
    });
  }

  /**
   * prepopulate channel info and save it to the store
   */
  async prepopulateInfo(): Promise<void> {
    // fetch user live access status
    await this.validatePlatform();

    // fetch username for stream page url
    const username = await this.fetchUsername();
    this.SET_USERNAME(username);

    this.SET_PREPOPULATED(true);
  }

  async putChannelInfo(settings: ITikTokStartStreamOptions): Promise<void> {
    this.UPDATE_STREAM_SETTINGS(settings);
  }

  getHeaders(req: IPlatformRequest, useToken?: string | boolean): ITikTokRequestHeaders {
    return {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.oauthToken}`,
    };
  }

  getErrorMessage(error?: any) {
    switch (error) {
      case error?.message:
        return error?.message;
      case error?.error_description:
        return error?.error_description;
      case error?.http_status_code:
        return error?.http_status_code;
      default:
        return 'Error processing TikTok request.';
    }
  }

  get liveDockEnabled(): boolean {
    return true;
  }

  get streamPageUrl(): string {
    return `https://www.tiktok.com/@${this.state.username}/live`;
  }

  get chatUrl(): string {
    return '';
  }

  get dashboardUrl(): string {
    return `https://livecenter.tiktok.com/live_monitor?lang=${this.locale}`;
  }

  get infoUrl(): string {
    return `https://streamlabs.com/content-hub/post/how-to-livestream-from-your-tiktok-account-using-streamlabs-from-web?lang=${this.locale}`;
  }

  get applicationUrl(): string {
    return `https://www.tiktok.com/falcon/live_g/live_access_pc_apply/intro/index.html?id=${this.id}&lang=${this.locale}`;
  }

  get locale(): string {
    return I18nService.instance.state.locale;
  }

  // TODO: replace temporary string with `official activity ID`
  get id(): string {
    return 'GL6399433079641606942';
  }

  convertScope(scope: number) {
    switch (scope) {
      case ETikTokLiveScopeReason.APPROVED: {
        return 'approved';
      }
      case ETikTokLiveScopeReason.APPROVED_OBS: {
        return 'legacy';
      }
      default:
        return 'denied';
    }
  }

  async handleOpenLiveManager(): Promise<void> {
    // keep main window on top to prevent flicker when opening url
    const win = Utils.getMainWindow();
    win.setAlwaysOnTop(true);

    // open url
    await remote.shell.openExternal(this.dashboardUrl, { activate: false });

    // give the browser a second to open before shifting focus back to the main window
    setTimeout(async () => {
      win.show();
      win.focus();
      win.setAlwaysOnTop(false);
      return Promise.resolve();
    }, 1000);
  }

  @mutation()
  protected UPDATE_STREAM_SETTINGS(settingsPatch: Partial<TStartStreamOptions>): void {}

  @mutation()
  SET_LIVE_SCOPE(scope: TTikTokLiveScopeTypes) {
    this.state.settings.liveScope = scope;
  }

  @mutation()
  protected SET_BROADCAST_ID(id: string) {
    this.state.broadcastId = id;
  }

  @mutation()
  protected SET_USERNAME(username: string) {
    this.state.username = username;
  }
}
