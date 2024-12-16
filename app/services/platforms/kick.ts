import { InheritMutations, Inject, mutation } from '../core';
import { BasePlatformService } from './base-platform';
import { IPlatformRequest, IPlatformService, IPlatformState, TPlatformCapability } from './index';
import { authorizedHeaders, jfetch } from '../../util/requests';
import { throwStreamError } from '../streaming/stream-error';
import { platformAuthorizedRequest } from './utils';
import { IGoLiveSettings } from '../streaming';
import { TOutputOrientation } from 'services/restream';
import { IVideo } from 'obs-studio-node';
import { TDisplayType } from 'services/settings-v2';
import { I18nService } from 'services/i18n';
import { getDefined } from 'util/properties-type-guards';
import { WindowsService } from 'services/windows';
import { DiagnosticsService } from 'services/diagnostics';

interface IKickStartStreamResponse {
  id?: string;
  key: string;
  rtmp: string;
  chat_url: string;
  broadcast_id?: string;
  channel_name: string;
  platform_id: string;
  region?: string;
  chat_id?: string;
}
interface IKickEndStreamResponse {
  id: string;
}

interface IKickError {
  success: boolean;
  error: boolean;
  message: string;
  data: any[];
}
interface IKickServiceState extends IPlatformState {
  settings: IKickStartStreamSettings;
  broadcastId: string;
  ingest: string;
  chatUrl: string;
  channelName: string;
  platformId?: string;
}

interface IKickStartStreamSettings {
  title: string;
  display: TDisplayType;
  video?: IVideo;
  mode?: TOutputOrientation;
}

export interface IKickStartStreamOptions {
  title: string;
}

interface IKickRequestHeaders extends Dictionary<string> {
  Accept: string;
  'Content-Type': string;
  Authorization: string;
}

@InheritMutations()
export class KickService
  extends BasePlatformService<IKickServiceState>
  implements IPlatformService {
  static initialState: IKickServiceState = {
    ...BasePlatformService.initialState,
    settings: {
      title: '',
      display: 'horizontal',
      mode: 'landscape',
    },
    broadcastId: '',
    ingest: '',
    chatUrl: '',
    channelName: '',
  };

  @Inject() windowsService: WindowsService;
  @Inject() diagnosticsService: DiagnosticsService;

  readonly apiBase = '';
  readonly domain = 'https://kick.com';
  readonly platform = 'kick';
  readonly displayName = 'Kick';
  readonly capabilities = new Set<TPlatformCapability>(['title', 'viewerCount']);

  authWindowOptions: Electron.BrowserWindowConstructorOptions = {
    width: 600,
    height: 800,
  };

  private get oauthToken() {
    return this.userService.views.state.auth?.platforms?.kick?.token;
  }

  /**
   * Kick's API currently does not provide viewer count.
   * To prevent errors, return 0 for now;
   */
  get viewersCount(): number {
    return 0;
  }

  async beforeGoLive(goLiveSettings: IGoLiveSettings, display?: TDisplayType) {
    const kickSettings = getDefined(goLiveSettings.platforms.kick);
    const context = display ?? kickSettings?.display;

    try {
      const streamInfo = await this.startStream(
        goLiveSettings.platforms.kick ?? this.state.settings,
      );

      if (!streamInfo.broadcast_id) {
        throwStreamError('PLATFORM_REQUEST_FAILED', {
          status: 403,
          statusText: 'Kick Error: no broadcast ID returned, unable to start stream.',
        });
      }

      this.SET_BROADCAST_ID(streamInfo.broadcast_id);
      this.SET_INGEST(streamInfo.rtmp);
      this.SET_STREAM_KEY(streamInfo.key);
      this.SET_CHAT_URL(streamInfo.chat_url);
      this.SET_PLATFORM_ID(streamInfo.platform_id);

      if (!this.streamingService.views.isMultiplatformMode) {
        this.streamSettingsService.setSettings(
          {
            streamType: 'rtmp_custom',
            key: streamInfo.key,
            server: streamInfo.rtmp,
          },
          context,
        );
      }

      await this.putChannelInfo(kickSettings);
      this.setPlatformContext('kick');
    } catch (e: unknown) {
      console.error('Error starting stream: ', e);
      throwStreamError('PLATFORM_REQUEST_FAILED', e as any);
    }
  }

  async afterStopStream(): Promise<void> {
    if (this.state.broadcastId) {
      await this.endStream(this.state.broadcastId);
    }

    // clear server url and stream key
    this.SET_INGEST('');
    this.SET_STREAM_KEY('');
  }

  // Note, this needs to be here but should never be called, because we
  // currently don't make any calls directly to Kick
  async fetchNewToken(): Promise<void> {
    const host = this.hostsService.streamlabs;
    const url = `https://${host}/api/v5/slobs/kick/refresh`;
    const headers = authorizedHeaders(this.userService.apiToken!);
    const request = new Request(url, { headers });

    return jfetch<{ access_token: string }>(request)
      .then(response => {
        return this.userService.updatePlatformToken('kick', response.access_token);
      })
      .catch(e => {
        console.error('Error fetching new token.');
        return Promise.reject(e);
      });
  }

  /**
   * Request Kick API and wrap failed response to a unified error model
   */
  async requestKick<T = unknown>(reqInfo: IPlatformRequest | string): Promise<T> {
    try {
      return await platformAuthorizedRequest<T>('kick', reqInfo);
    } catch (e: unknown) {
      const code = (e as any).result?.error?.code;

      const details = (e as any).result?.error
        ? `${(e as any).result.error.type} ${(e as any).result.error.message}`
        : 'Connection failed';

      console.error('Error fetching Kick API: ', details, code);

      return Promise.reject(e);
    }
  }

  /**
   * Starts the stream
   * @remark If a user is live and attempts to go live via another
   * another streaming method such as Kick's app, this stream will continue
   * and the other stream will be prevented from going live. If another instance
   * of Streamlabs attempts to go live to Kick, the first stream will be ended
   * and Desktop will enter a reconnecting state, which eventually times out.
   */
  async startStream(opts: IKickStartStreamOptions): Promise<IKickStartStreamResponse> {
    const host = this.hostsService.streamlabs;
    const url = `https://${host}/api/v5/slobs/kick/stream/start`;
    const headers = authorizedHeaders(this.userService.apiToken!);

    const body = new FormData();
    body.append('title', opts.title);

    const request = new Request(url, { headers, method: 'POST', body });

    return jfetch<IKickStartStreamResponse>(request).catch((e: IKickError | unknown) => {
      console.error('Error starting Kick stream: ', e);

      const defaultError = {
        status: 403,
        statusText: 'Unable to start Kick stream.',
      };

      if (!e) throwStreamError('PLATFORM_REQUEST_FAILED', defaultError);

      // check if the error is an IKickError
      if (typeof e === 'object' && e.hasOwnProperty('success')) {
        const error = e as IKickError;
        throwStreamError(
          'PLATFORM_REQUEST_FAILED',
          {
            ...error,
            status: 403,
            statusText: error.message,
          },
          defaultError.statusText,
        );
      }

      throwStreamError('PLATFORM_REQUEST_FAILED', e as any, defaultError.statusText);
    });
  }

  async endStream(id: string) {
    const host = this.hostsService.streamlabs;
    const url = `https://${host}/api/v5/slobs/kick/stream/${id}/end`;
    const headers = authorizedHeaders(this.userService.apiToken!);
    const request = new Request(url, { headers, method: 'POST' });

    return jfetch<IKickEndStreamResponse>(request);
  }

  async fetchViewerCount(): Promise<number> {
    return 0;
  }

  /**
   * prepopulate channel info and save it to the store
   */
  async prepopulateInfo(): Promise<void> {
    this.SET_PREPOPULATED(true);
  }

  async putChannelInfo(settings: IKickStartStreamOptions): Promise<void> {
    this.SET_STREAM_SETTINGS(settings);
  }

  getHeaders(req: IPlatformRequest, useToken?: string | boolean): IKickRequestHeaders {
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
        return 'Error processing Kick request.';
    }
  }

  get authUrl() {
    const host = this.hostsService.streamlabs;
    const query = `_=${Date.now()}&skip_splash=true&external=electron&kick&force_verify&origin=slobs`;
    return `https://${host}/slobs/login?${query}`;
  }

  get mergeUrl(): string {
    const host = this.hostsService.streamlabs;
    return `https://${host}/dashboard#/settings/account-settings/platforms`;
  }

  get liveDockEnabled(): boolean {
    return true;
  }

  get chatUrl(): string {
    return this.state.chatUrl;
  }

  get streamPageUrl(): string {
    const username = this.userService.state.auth?.platforms?.kick?.username;
    if (!username) return '';

    return `${this.domain}/${username}`;
  }

  get locale(): string {
    return I18nService.instance.state.locale;
  }

  @mutation()
  SET_BROADCAST_ID(broadcastId?: string) {
    if (!broadcastId) return;
    this.state.broadcastId = broadcastId;
  }

  @mutation()
  SET_INGEST(ingest: string) {
    this.state.ingest = ingest;
  }

  @mutation()
  SET_CHAT_URL(chatUrl: string) {
    this.state.chatUrl = chatUrl;
  }

  @mutation()
  SET_PLATFORM_ID(platformId: string) {
    this.state.platformId = platformId;
  }
}
