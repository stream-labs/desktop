import { InheritMutations, Inject, mutation } from '../core';
import { BasePlatformService } from './base-platform';
import {
  EPlatformCallResult,
  IGame,
  IPlatformRequest,
  IPlatformService,
  IPlatformState,
  TPlatformCapability,
} from './index';
import { authorizedHeaders, jfetch } from '../../util/requests';
import { throwStreamError } from '../streaming/stream-error';
import { platformAuthorizedRequest } from './utils';
import { getOS } from 'util/operating-systems';
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
  TTikTokLiveScopeTypes,
  ITikTokGamesData,
} from './tiktok/api';
import { I18nService } from 'services/i18n';
import { getDefined } from 'util/properties-type-guards';
import * as remote from '@electron/remote';
import { WindowsService } from 'services/windows';
import Utils from 'services/utils';
import { UsageStatisticsService } from 'services/usage-statistics';

interface ITikTokServiceState extends IPlatformState {
  settings: ITikTokStartStreamSettings;
  broadcastId: string;
  username: string;
  error?: string | null;
}

interface ITikTokStartStreamSettings {
  serverUrl: string;
  streamKey: string;
  title: string;
  liveScope: TTikTokLiveScopeTypes;
  gameName: string;
  game: string;
  display: TDisplayType;
  video?: IVideo;
  mode?: TOutputOrientation;
}

export interface ITikTokStartStreamOptions {
  title: string;
  serverUrl: string;
  streamKey: string;
  display: TDisplayType;
  gameName: string;
  game: string;
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
      streamKey: '',
      gameName: '',
      game: '',
      mode: 'portrait',
      serverUrl: '',
    },
    broadcastId: '',
    username: '',
  };

  @Inject() windowsService: WindowsService;
  @Inject() private usageStatisticsService: UsageStatisticsService;

  readonly apiBase = 'https://open.tiktokapis.com/v2';
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

  get scope(): TTikTokLiveScopeTypes {
    return this.state.settings?.liveScope;
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

    if (this.getHasScope('approved')) {
      // skip generate stream keys for tests
      if (Utils.isTestMode()) {
        await this.putChannelInfo(ttSettings);
        this.setPlatformContext('tiktok');
        return;
      }

      // update server url and stream key if handling streaming via API
      // streaming with server url and stream key is default
      let streamInfo = {} as ITikTokStartStreamResponse;

      try {
        streamInfo = await this.startStream(ttSettings);
        if (!streamInfo?.id) {
          await this.handleOpenLiveManager();
          throwStreamError('TIKTOK_GENERATE_CREDENTIALS_FAILED');
        }
      } catch (error: unknown) {
        this.SET_LIVE_SCOPE('denied');
        await this.handleOpenLiveManager();
        throwStreamError('TIKTOK_GENERATE_CREDENTIALS_FAILED', error as any);
      }

      ttSettings.serverUrl = streamInfo.rtmp;
      ttSettings.streamKey = streamInfo.key;

      this.SET_BROADCAST_ID(streamInfo.id);
    }

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

    await this.putChannelInfo(ttSettings);
    this.setPlatformContext('tiktok');
  }

  async afterGoLive(): Promise<void> {
    // open url if stream successfully started
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

  // Note, this needs to be here but should never be called, because we
  // currently don't make any calls directly to TikTok
  async fetchNewToken(): Promise<void> {
    const host = this.hostsService.streamlabs;
    const url = `https://${host}/api/v5/slobs/tiktok/refresh`;
    const headers = authorizedHeaders(this.userService.apiToken!);
    const request = new Request(url, { headers });

    return jfetch<{ access_token: string }>(request)
      .then(response => {
        return this.userService.updatePlatformToken('tiktok', response.access_token);
      })
      .catch(e => {
        console.error('Error fetching new token.');
        return Promise.reject(e);
      });
  }

  /**
   * Request TikTok API and wrap failed response to a unified error model
   */
  async requestTikTok<T = unknown>(reqInfo: IPlatformRequest | string): Promise<T> {
    try {
      return await platformAuthorizedRequest<T>('tiktok', reqInfo);
    } catch (e: unknown) {
      const code = (e as any).result?.error?.code;

      if (
        (e as any)?.status === 405 ||
        (e as any)?.status === 401 ||
        !code ||
        code === ETikTokErrorTypes.ACCESS_TOKEN_INVALID
      ) {
        console.error('Token invalid or missing. Unable to process request.');

        // refresh token and attempt again
        return await this.fetchNewToken().then(() => {
          if (typeof reqInfo !== 'string') {
            const req = reqInfo as IPlatformRequest;
            // updated token on request body
            const reqInfoBody = req.body as string;
            const body = JSON.parse(reqInfoBody);

            const updatedReqInfo = {
              ...req,
              body: { ...body, access_token: this.oauthToken },
            };

            return this.requestTikTok(updatedReqInfo);
          } else {
            console.error('Failed platform request', reqInfo);
            return Promise.reject(e);
          }
        });
      }

      const notApproved = [
        ETikTokErrorTypes.SCOPE_NOT_AUTHORIZED,
        ETikTokErrorTypes.SCOPE_PERMISSION_MISSED,
        ETikTokErrorTypes.USER_HAS_NO_LIVE_AUTH,
      ].includes(code);
      const hasStream = code === ETikTokErrorTypes.TIKTOK_ALREADY_LIVE;

      const message = notApproved
        ? 'The user is not enabled for live streaming'
        : 'Connection error with TikTok';

      console.warn(
        this.getErrorMessage({
          message,
        }),
      );

      const details = (e as any).result?.error
        ? `${(e as any).result.error.type} ${(e as any).result.error.message}`
        : 'Connection failed';

      if (notApproved) {
        this.SET_LIVE_SCOPE('denied');
      } else if (hasStream) {
        // show error stream exists
        throwStreamError('TIKTOK_STREAM_ACTIVE', e as any, details);
      }

      return Promise.reject(e);
    }
  }

  /**
   * Starts the stream
   * @remark If a user is live and attempts to go live via another
   * another streaming method such as TikTok's app, this stream will continue
   * and the other stream will be prevented from going live. If another instance
   * of Streamlabs attempts to go live to TikTok, the first stream will be ended
   * and Desktop will enter a reconnecting state, which eventually times out.
   */
  async startStream(opts: ITikTokStartStreamOptions) {
    const host = this.hostsService.streamlabs;
    const url = `https://${host}/api/v5/slobs/tiktok/stream/start`;
    const headers = authorizedHeaders(this.userService.apiToken!);
    const body = new FormData();
    body.append('title', opts.title);
    body.append('device_platform', getOS());
    body.append('game_mask_id', opts.game);
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

      if (status?.user) {
        const scope = this.convertScope(status.reason);
        this.SET_USERNAME(status.user.username);
        this.SET_LIVE_SCOPE(scope);

        // Note on the 'denied' response: A user who needs to reauthenticate with TikTok
        // due a change in the scope for our api, needs to be told to unlink and remerge their account.
        if (scope === 'denied') {
          return EPlatformCallResult.TikTokScopeOutdated;
        }
      } else if (
        status?.info &&
        (!status?.reason || status?.reason !== ETikTokLiveScopeReason.DENIED)
      ) {
        this.SET_LIVE_SCOPE('denied');
        return EPlatformCallResult.TikTokScopeOutdated;
      } else {
        this.SET_LIVE_SCOPE('not-approved');
        return EPlatformCallResult.TikTokStreamScopeMissing;
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
      this.SET_LIVE_SCOPE('denied');
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
    return jfetch<ITikTokLiveScopeResponse | ITikTokError>(request)
      .then(async res => {
        // prevent error from unresolved promises in array
        const scopeData = res as ITikTokLiveScopeResponse;
        if (scopeData?.info) {
          const info = await Promise.all(scopeData?.info.map((category: any) => category));
          return {
            ...scopeData,
            info,
          };
        }
        return res;
      })
      .catch(() => {
        console.warn('Error fetching TikTok Live Access status.');
      });
  }

  /**
   * Search for games
   * @remark While this is the same endpoint for if a user can go live,
   * the category parameter will only show category results, and will not
   * show live approval status.
   */
  async searchGames(searchString: string): Promise<IGame[]> {
    const host = this.hostsService.streamlabs;
    const url = `https://${host}/api/v5/slobs/tiktok/info?category=${searchString}`;
    const headers = authorizedHeaders(this.userService.apiToken);
    const request = new Request(url, { headers });

    return jfetch<ITikTokGamesData>(request)
      .then(async res => {
        return await Promise.all(
          res.categories.map(g => ({ id: g.game_mask_id, name: g.full_name })),
        );
      })
      .catch(e => {
        console.error('Error fetching TikTok games: ', e);
        return [];
      });
  }

  /**
   * prepopulate channel info and save it to the store
   */
  async prepopulateInfo(): Promise<void> {
    // skip validation call when running tests
    if (Utils.isTestMode()) {
      this.SET_PREPOPULATED(true);
      return;
    }

    // fetch user live access status
    const status = await this.validatePlatform();
    this.usageStatisticsService.recordAnalyticsEvent('TikTokLiveAccess', {
      status: this.scope,
    });

    console.debug('TikTok stream status: ', status);

    if (status === EPlatformCallResult.TikTokScopeOutdated) {
      throwStreamError('TIKTOK_SCOPE_OUTDATED');
    }

    this.SET_PREPOPULATED(true);
  }

  async putChannelInfo(settings: ITikTokStartStreamOptions): Promise<void> {
    this.SET_STREAM_SETTINGS(settings);
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

  // url for the live monitor
  get dashboardUrl(): string {
    return `https://livecenter.tiktok.com/live_monitor?lang=${this.locale}`;
  }

  // url for the producer for legacy users with approval for stream keys and server urls
  get legacyDashboardUrl(): string {
    return `https://livecenter.tiktok.com/producer?lang=${this.locale}`;
  }

  get infoUrl(): string {
    return 'https://streamlabs.com/content-hub/post/how-to-go-live-on-tiktok';
  }

  get applicationUrl(): string {
    return `https://www.tiktok.com/falcon/live_g/live_access_pc_apply/intro/index.html?id=${this.id}&lang=${this.locale}`;
  }

  get mergeUrl(): string {
    return 'https://streamlabs.com/dashboard#/settings/account-settings/platforms';
  }

  get locale(): string {
    return I18nService.instance.state.locale;
  }

  // this is Streamlabs' app id
  get id(): string {
    return 'GL6399433079641606942';
  }

  convertScope(scope: number) {
    switch (scope) {
      case ETikTokLiveScopeReason.APPROVED: {
        return 'approved';
      }
      case ETikTokLiveScopeReason.NOT_APPROVED: {
        return 'not-approved';
      }
      case ETikTokLiveScopeReason.APPROVED_OBS: {
        return 'legacy';
      }
      default:
        return 'denied';
    }
  }

  async handleOpenLiveManager(visible?: true): Promise<void | boolean> {
    // no need to open window for tests
    // but confirm the function has run
    if (Utils.isTestMode()) return true;

    if (visible) {
      await remote.shell.openExternal(this.dashboardUrl);
      return;
    }

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

  setLiveScope(scope: TTikTokLiveScopeTypes) {
    this.SET_LIVE_SCOPE(scope);
  }

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
