import { getDefined } from 'util/properties-type-guards';
import {
  IPlatformRequest,
  IPlatformService,
  IPlatformState,
  EPlatformCallResult,
  TStartStreamOptions,
  IGame,
  TPlatformCapability,
} from '.';
import { BasePlatformService } from './base-platform';
import { IGoLiveSettings } from 'services/streaming';
import { TDisplayType } from 'services/settings-v2';
import { InheritMutations } from 'services/core';
import { WidgetType } from 'services/widgets';

/**
 * Note: The implementation for this service is a light refactor of the Instagram service.
 */
interface IKickServiceState extends IPlatformState {
  settings: IKickStartStreamSettings;
}

interface IKickStartStreamSettings {
  title: string;
  streamUrl: string;
  streamKey: string;
}

export interface IKickStartStreamOptions {
  title: string;
  streamUrl: string;
  streamKey: string;
}

@InheritMutations()
export class KickService
  extends BasePlatformService<IKickServiceState>
  implements IPlatformService {
  static initialState: IKickServiceState = {
    ...BasePlatformService.initialState,
    settings: { title: '', streamUrl: '', streamKey: '' },
  };

  searchGames?: (searchString: string) => Promise<IGame[]>;
  scheduleStream?: (startTime: number, info: TStartStreamOptions) => Promise<any>;
  getHeaders: (req: IPlatformRequest, useToken?: string | boolean) => Dictionary<string>;
  streamPageUrl: string;
  widgetsWhitelist?: WidgetType[];

  readonly apiBase = '';
  readonly platform = 'kick';
  readonly displayName = 'Kick';
  readonly capabilities = new Set<TPlatformCapability>(['resolutionPreset']);

  readonly authWindowOptions = {};
  readonly authUrl = '';

  fetchNewToken() {
    return Promise.resolve();
  }

  protected init() {
    this.syncSettingsWithLocalStorage();

    this.userService.userLogout.subscribe(() => {
      this.updateSettings({ title: this.state.settings.title, streamUrl: '', streamKey: '' });
    });
  }

  async beforeGoLive(goLiveSettings: IGoLiveSettings, context?: TDisplayType) {
    const settings = getDefined(goLiveSettings.platforms.kick);

    if (!this.streamingService.views.isMultiplatformMode) {
      this.streamSettingsService.setSettings(
        {
          streamType: 'rtmp_custom',
          key: settings.streamKey,
          server: settings.streamUrl,
        },
        context,
      );
    }

    this.SET_STREAM_KEY(settings.streamKey);
    this.UPDATE_STREAM_SETTINGS(settings);
    this.setPlatformContext('kick');
  }
  /**
   * prepopulate channel info and save it to the store
   */
  async prepopulateInfo(): Promise<void> {
    this.SET_PREPOPULATED(true);
  }

  async validatePlatform() {
    /*
     * TODO: this validation isn't needed, but doesn't hurt to be safe, in case we decide to persist
     * stream URL as part of "linking". Maybe also validate stream keys, they seem to start with IG-*
     */
    if (!this.state.settings.streamKey.length || !this.state.settings.streamUrl.length) {
      return EPlatformCallResult.Error;
    }

    return EPlatformCallResult.Success;
  }

  async putChannelInfo(): Promise<void> {
    // N/A
  }

  updateSettings(settings: IKickStartStreamOptions) {
    this.UPDATE_STREAM_SETTINGS(settings);
  }

  unlink() {
    this.userService.UNLINK_PLATFORM('kick');
  }

  get liveDockEnabled(): boolean {
    return this.streamingService.views.isMultiplatformMode;
  }

  get chatUrl(): string {
    return 'https://dashboard.kick.com/stream';
  }
}
