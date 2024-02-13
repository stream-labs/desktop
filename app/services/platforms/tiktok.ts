// tiktok.ts

import { InheritMutations, ViewHandler, mutation } from '../core';
import { BasePlatformService } from './base-platform';
import {
  EPlatformCallResult,
  IPlatformRequest,
  IPlatformService,
  IPlatformState,
  TPlatformCapability,
} from './index';
import { authorizedHeaders, jfetch } from '../../util/requests';
import { throwStreamError } from '../streaming/stream-error';
import { platformAuthorizedRequest } from './utils';
import { IGoLiveSettings } from '../streaming';
import { TOutputOrientation } from 'services/restream';
import { IVideo } from 'obs-studio-node';
import { TDisplayType } from 'services/settings-v2';
import { ITikTokError, ITikTokLiveScopeResponse } from './tiktok/api';
import { I18nService } from 'services/i18n';
import { getDefined } from 'util/properties-type-guards';
import * as remote from '@electron/remote';

interface ITikTokServiceState extends IPlatformState {
  settings: ITikTokStartStreamSettings;
  broadcastId: string;
}

interface ITikTokStartStreamSettings {
  serverUrl: string;
  streamKey: string;
  title: string;
  liveStreamingEnabled: boolean;
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

interface ITikTokStartStreamResponse {
  name: string;
  push_key: string;
  push_url: string;
  id: string;
}

interface ITikTokEndStreamResponse {
  success: boolean;
}

// interface ITikTokServiceState extends IPlatformState {
//   settings: ITikTokStartStreamOptions;
//   broadcastId: string;
//   ingest: string;
// }

// export enum ETikTokChatType {
//   Off = 1,
//   Everyone = 2,
//   VerifiedOnly = 3,
//   FollowedOnly = 4,
//   SubscribersOnly = 5,
// }

// export interface ITikTokStartStreamOptions {
//   title: string;
//   chatType: ETikTokChatType;
// }

// interface ITikTokStartStreamResponse {
//   id: string;
//   key: string;
//   rtmp: string;
// }

@InheritMutations()
export class TikTokService
  extends BasePlatformService<ITikTokServiceState>
  implements IPlatformService {
  static initialState: ITikTokServiceState = {
    ...BasePlatformService.initialState,
    settings: {
      title: '',
      display: 'vertical',
      liveStreamingEnabled: false,
      mode: 'portrait',
      serverUrl: '',
      streamKey: '',
    },
    broadcastId: '',
  };

  readonly apiBase = 'https://open.tiktokapis.com';
  readonly platform = 'tiktok';
  readonly displayName = 'TikTok';
  readonly capabilities = new Set<TPlatformCapability>(['title', 'viewerCount']);

  authWindowOptions: Electron.BrowserWindowConstructorOptions = {
    width: 600,
    height: 800,
  };

  get views() {
    return new TikTokView(this.state);
  }

  get authUrl() {
    const host = this.hostsService.streamlabs;
    const query = `_=${Date.now()}&skip_splash=true&external=electron&tiktok&force_verify&origin=slobs`;
    return `https://${host}/slobs/login?${query}`;
  }

  get username(): string {
    return this.userService.state.auth?.platforms?.tiktok?.username || '';
  }

  /**
   * TikTok's API currently does not provide viewer count.
   * To prevent errors, return 0 for now;
   */
  get viewersCount(): number {
    return 0;
  }

  getLiveStreamEnabled(): boolean {
    return this.state.settings?.liveStreamingEnabled === true;
  }

  async beforeGoLive(goLiveSettings: IGoLiveSettings, display?: TDisplayType) {
    const ttSettings = getDefined(goLiveSettings.platforms.tiktok);

    let streamInfo = {} as ITikTokStartStreamResponse;

    streamInfo = await this.startStream(ttSettings);

    if (streamInfo?.id) {
      // open urls if stream successfully started
      remote.shell.openExternal(this.streamPageUrl);
      remote.shell.openExternal(this.dashboardUrl);
    } else {
      this.SET_ENABLED_STATUS(false);
      throw throwStreamError('TIKTOK_START_STREAM_FAILED');
    }

    const context = display ?? ttSettings?.display;

    const updatedTTSettings = {
      ...ttSettings,
      serverUrl: streamInfo.push_url,
      streamKey: streamInfo.push_key,
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

  async afterStopStream(): Promise<void> {
    if (this.state.broadcastId) {
      await this.endStream(this.state.broadcastId);
    }
  }

  // Note, this needs to be here but should never be called, because we
  // currently don't make any calls directly to TikTok
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
      let details = (e as any).message;
      if (!details) details = 'connection failed';
      throwStreamError('PLATFORM_REQUEST_FAILED', e as any, details);
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
      if (response) {
        const status = response as ITikTokLiveScopeResponse;
        console.log('status ', JSON.stringify(status, null, 2));
        this.SET_ENABLED_STATUS(status?.can_be_live);
        return EPlatformCallResult.Success;
      } else {
        this.SET_ENABLED_STATUS(false);
        return EPlatformCallResult.TikTokStreamScopeMissing;
      }
    } catch (e: unknown) {
      console.warn(this.getErrorMessage(e));
      this.SET_ENABLED_STATUS(false);
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
  /**
   * prepopulate channel info and save it to the store
   */
  async prepopulateInfo(): Promise<void> {
    // Currently not enabled in API
    this.SET_PREPOPULATED(true);
  }

  async putChannelInfo(settings: ITikTokStartStreamOptions): Promise<void> {
    this.UPDATE_STREAM_SETTINGS(settings);
  }

  getHeaders() {
    return {};
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
    console.log(`https://www.tiktok.com/@${this.username}/live`);
    return `https://www.tiktok.com/@${this.username}/live`;
  }

  get chatUrl(): string {
    return '';
  }

  get dashboardUrl(): string {
    console.log(`https://livecenter.tiktok.com/live_monitor?lang=${this.locale}`);
    return `https://livecenter.tiktok.com/live_monitor?lang=${this.locale}`;
  }

  get locale(): string {
    return I18nService.instance.state.locale;
  }

  // TODO: replace temporary string with id
  get id(): string {
    return 'GL6399433079641606942';
  }

  @mutation()
  protected SET_BROADCAST_ID(id: string) {
    console.log('id ', id);
    this.state.broadcastId = id;
  }

  @mutation()
  SET_ENABLED_STATUS(status: boolean) {
    console.log('status ', status);
    const updatedSettings = { ...this.state.settings, liveStreamingEnabled: status };
    this.state.settings = updatedSettings;
  }
}

export class TikTokView extends ViewHandler<ITikTokServiceState> {
  get liveStreamingEnabled() {
    return this.state.settings?.liveStreamingEnabled;
  }
}
