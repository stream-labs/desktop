import { EPlatformCallResult, IPlatformRequest, IPlatformService } from '.';
import { InheritMutations } from '../core';
import { BasePlatformService } from './base-platform';
import { IPlatformState, TPlatformCapability } from './index';
import { IGoLiveSettings } from '../streaming';
import { platformAuthorizedRequest } from './utils';
import electron from 'electron';

export interface IFlextvStartStreamOptions {
  title: string;
  theme?: string;
  resolution?: string;
  useMinFanLevel?: boolean;
}

export interface IFlexTvCommonResponse {
  success: boolean;
  error?: {
    message?: string;
    code: string;
  };
}

interface IFlexTvServiceState extends IPlatformState {
  settings: IFlextvStartStreamOptions;
}

@InheritMutations()
export class FlexTvService
  extends BasePlatformService<IFlexTvServiceState>
  implements IPlatformService {
  static initialState: IFlexTvServiceState = {
    ...BasePlatformService.initialState,
    settings: { title: '' },
  };

  readonly baseUrl = 'https://www.hotaetv.com';
  readonly apiBase = 'https://www.hotaetv.com';
  readonly platform = 'flextv';
  readonly displayName = 'FlexTV';
  readonly capabilities = new Set<TPlatformCapability>(['resolutionPreset']);

  readonly inputResolution = '720x1280';
  readonly outputResolution = '720x1280';

  authWindowOptions: Electron.BrowserWindowConstructorOptions = {
    width: 600,
    height: 800,
  };

  get authUrl() {
    return `${this.apiBase}/login`;
  }

  get streamPageUrl() {
    return `${this.apiBase}/channels/${this.channelId}/live`;
  }

  private get apiToken() {
    return this.userService.views.state.auth?.platforms?.flextv?.token;
  }

  private get channelId() {
    return this.userService.views.state.auth?.platforms?.flextv?.channelId;
  }

  async beforeGoLive(goLiveSettings?: IGoLiveSettings) {
    if (
      this.streamSettingsService.protectedModeEnabled &&
      this.streamSettingsService.isSafeToModifyStreamKey()
    ) {
      const data = await this.fetchStreamPair();
      this.SET_STREAM_KEY(data.streamKey);
      if (!this.streamingService.views.isMultiplatformMode) {
        this.streamSettingsService.setSettings({
          key: data.streamKey,
          platform: 'flextv',
          streamType: 'rtmp_common',
          server: data.url,
        });
      }
    }
    if (goLiveSettings) {
      const streamConfigs = goLiveSettings?.platforms.flextv;
      if (!streamConfigs) return;
      const { title, theme, resolution } = streamConfigs;

      await platformAuthorizedRequest<{ url: string; streamKey: string }>('flextv', {
        url: `${this.apiBase}/api/m/channel/config`,
        method: 'PUT',
        body: JSON.stringify({
          title,
          theme,
          resolution,
        }),
      });
      this.state.settings = {
        title,
        theme,
        resolution,
      };
    }
  }

  async afterGoLive() {
    if (!this.state.settings) {
      electron.remote.dialog.showMessageBox({
        type: 'error',
        message: '방송 설정이 없습니다.',
        title: '송출 오류',
      });
      return;
    }
    const { title, theme, resolution } = this.state.settings;
    await platformAuthorizedRequest<{ url: string; streamKey: string }>('flextv', {
      url: `${this.apiBase}/api/my/channel/start-stream`,
      method: 'POST',
      body: JSON.stringify({
        title,
        theme,
        resolution,
      }),
    });
  }

  async afterStopStream() {
    await platformAuthorizedRequest<{ url: string; streamKey: string }>('flextv', {
      url: `${this.apiBase}/api/my/channel/stop-stream`,
      method: 'POST',
    });
  }

  async fetchNewToken(): Promise<void> {
  }

  fetchStreamPair(): Promise<{ url: string; streamKey: string }> {
    return platformAuthorizedRequest<{ url: string; streamKey: string }>(
      'flextv',
      `${this.apiBase}/api/my/channel/stream-key`,
    );
  }

  getHeaders(req: IPlatformRequest, useToken: boolean | string) {
    const token = typeof useToken === 'string' ? useToken : useToken && this.apiToken;
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  async validatePlatform() {
    return EPlatformCallResult.Success;
  }

  /**
   * prepopulate channel info and save it to the store
   */
  async prepopulateInfo(): Promise<void> {
    const config = await platformAuthorizedRequest<{
      data: {
        channelId: number;
        themeId: number;
        title: string;
        resolution: number;
        isForAdult: number;
        password: string;
        minRatingLevel: 2;
        maxViewerCount: number;
      };
    }>('flextv', `${this.apiBase}/api/m/channel/config`);
    this.SET_PREPOPULATED(true);
    this.SET_STREAM_SETTINGS({ ...config.data });
  }

  async fetchUserInfo(): Promise<any> {
    const userInfo = await platformAuthorizedRequest<{
      profile: {
        nickname: string;
      };
    }>('flextv', `${this.apiBase}/api/my/profile`).catch(() => null);
    if (!userInfo) return null;

    return {
      username: userInfo.profile.nickname,
    };
  }

  async putChannelInfo(): Promise<void> {
    // no API
  }

  get chatUrl(): string {
    return `${this.apiBase}/redirects/signin?token=${this.apiToken}&redirectTo=/popup/chat/${this.channelId}?darkTheme=true`;
  }

  get liveDockEnabled(): boolean {
    return false;
  }

  async checkReadyToStream(): Promise<IFlexTvCommonResponse> {
    const resp = await platformAuthorizedRequest<any>(
      'flextv',
      `${this.apiBase}/api/my/chennel-register`,
    ).catch(error => {
      console.log('error', error);
      return null;
    });
    if (!resp) {
      return {
        success: false,
        error: {
          code: 'NO_AUTH',
        },
      };
    }
    return {
      success: true,
    };
  }

  async fetchHelperToken(): Promise<string> {
    return platformAuthorizedRequest<string>(
      'flextv',
      `${this.apiBase}/api/my/channel/hp/access-key`,
    ).catch(() => '');
  }
}
