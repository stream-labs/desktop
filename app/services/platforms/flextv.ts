import { EPlatformCallResult, IPlatformRequest } from '.';
import { InheritMutations } from '../core';
import { BasePlatformService } from './base-platform';
import { IPlatformCapabilityResolutionPreset, IPlatformState, TPlatformCapability } from './index';
import { IGoLiveSettings } from '../streaming';
import { platformAuthorizedRequest, platformRequest } from './utils';
import { WidgetType } from '../widgets';
import { getDefined } from '../../util/properties-type-guards';

export interface IFlextvStartStreamOptions {
  serverUrl: string;
  streamKey: string;
}

interface IFlextvServiceState extends IPlatformState {
  settings: IFlextvStartStreamOptions;
}

@InheritMutations()
export class FlextvService
  extends BasePlatformService<IFlextvServiceState>
  implements IPlatformCapabilityResolutionPreset {
  readonly apiBase = '';
  readonly platform = 'flextv';
  readonly displayName = 'FlexTV';
  readonly capabilities = new Set<TPlatformCapability>(['resolutionPreset']);

  // support only donation widgets for now
  readonly widgetsWhitelist = [
    WidgetType.AlertBox,
    WidgetType.DonationGoal,
    WidgetType.DonationTicker,
    WidgetType.TipJar,
  ];

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
      const channelInfo = goLiveSettings?.platforms.flextv;
      // if (channelInfo) await this.putChannelInfo(channelInfo);
    }
  }

  async afterGoLive() {
    await platformAuthorizedRequest<{ url: string, streamKey: string }>('flextv',
      `https://www.hotaetv.com/api/my/channel/start-stream`,
    );
  }

  fetchStreamPair(): Promise<{ url: string, streamKey: string }> {
    return platformAuthorizedRequest<{ url: string, streamKey: string }>('flextv',
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
    this.SET_PREPOPULATED(true);
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
