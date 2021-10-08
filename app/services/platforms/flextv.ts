import { EPlatformCallResult, IPlatformRequest } from '.';
import { InheritMutations } from '../core';
import { BasePlatformService } from './base-platform';
import { IPlatformCapabilityResolutionPreset, IPlatformState, TPlatformCapability } from './index';
import { IGoLiveSettings } from '../streaming';
import { platformAuthorizedRequest } from './utils';
import { WidgetType } from '../widgets';
import electron from 'electron';

export interface IFlextvStartStreamOptions {
  title: string;
  theme?: string;
  resolution?: string;
  useMinFanLevel?: boolean;
}

interface IFlextvServiceState extends IPlatformState {
  settings: IFlextvStartStreamOptions;
}

@InheritMutations()
export class FlextvService
  extends BasePlatformService<IFlextvServiceState>
  implements IPlatformCapabilityResolutionPreset {
  static initialState: IFlextvServiceState = {
    ...BasePlatformService.initialState,
    settings: { title: '' },
  };

  readonly apiBase = '';
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
    const host = this.hostsService.streamlabs;
    const query = `_=${Date.now()}&skip_splash=true&external=electron&flextv&force_verify&origin=slobs`;
    return `https://${host}/slobs/login?${query}`;
  }

  private get apiToken() {
    return this.userService.views.state.auth?.platforms?.flextv?.token;
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
        url: 'https://www.hotaetv.com/api/m/channel/config',
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
      url: 'https://www.hotaetv.com/api/my/channel/start-stream',
      method: 'POST',
      body: JSON.stringify({
        title,
        theme,
        resolution,
      }),
    });
  }

  async afterStopStream() {
    return platformAuthorizedRequest<{ url: string; streamKey: string }>('flextv', {
      url: 'https://www.hotaetv.com/api/my/channel/stop-stream',
      method: 'POST',
    });
  }

  fetchStreamPair(): Promise<{ url: string; streamKey: string }> {
    return platformAuthorizedRequest<{ url: string; streamKey: string }>(
      'flextv',
      `https://www.hotaetv.com/api/my/channel/stream-key`,
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
    }>('flextv', 'https://www.hotaetv.com/api/m/channel/config');
    this.SET_PREPOPULATED(true);
    this.SET_STREAM_SETTINGS({ ...config.data });
  }

  async putChannelInfo(): Promise<void> {
    // no API
  }

  get chatUrl(): string {
    // no API
    return '';
  }

  get liveDockEnabled(): boolean {
    return false;
  }
}
