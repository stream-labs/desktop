import { StatefulService, mutation } from '../core/stateful-service';
import {
  IPlatformService,
  TPlatformCapability,
  TPlatformCapabilityMap,
  EPlatformCallResult,
  IPlatformRequest,
} from '.';
import { HostsService } from '../hosts';
import { Inject } from 'services/core/injector';
import { authorizedHeaders, handleResponse } from '../../util/requests';
import { UserService } from '../user';
import { platformAuthorizedRequest } from './utils';
import { StreamSettingsService } from 'services/settings/streaming';
import { Subject } from 'rxjs';
import { CustomizationService } from 'services/customization';
import { StreamingService } from 'services/streaming';

interface IYoutubeServiceState {
  liveStreamingEnabled: boolean;
}

export interface IYoutubeStartStreamOptions {
  title: string;
  broadcastId?: string;
  description?: string;
}

export interface IYoutubeChannelInfo extends IYoutubeStartStreamOptions {
  broadcastId: string;
  chatUrl: string;
  streamUrl: string;
}

/**
 * Represents an API response with a paginated collection
 */
interface IYoutubeCollection<T> {
  items: T[];
  pageInfo: { totalResults: number; resultsPerPage: number };
}

/**
 * A liveBroadcast resource represents an event that will be streamed, via live video, on YouTube.
 * For the full set of available fields:
 * @see https://google-developers.appspot.com/youtube/v3/live/docs/liveBroadcasts
 */
export interface IYoutubeLiveBroadcast {
  id: string;
  contentDetails: {
    boundStreamId: string;
    enableAutoStart: boolean;
  };
  snippet: {
    title: string;
    description: string;
    scheduledStartTime: string;
    isDefaultBroadcast: boolean;
    liveChatId: string;
    thumbnails: {
      default: {
        url: string;
        width: 120;
        height: 90;
      };
    };
  };
  status: {
    lifeCycleStatus:
      | 'complete'
      | 'created'
      | 'live'
      | 'liveStarting'
      | 'ready'
      | 'revoked'
      | 'testStarting'
      | 'testing';
    privacyStatus: 'private' | 'public' | 'unlisted';
    recordingStatus: 'notRecording' | 'recorded' | 'recording';
  };
}

/**
 * A liveStream resource contains information about the video stream that you are transmitting to YouTube.
 * The stream provides the content that will be broadcast to YouTube users. Once created,
 * a liveStream resource can be bound to one or more liveBroadcast resources.
 * @see https://google-developers.appspot.com/youtube/v3/live/docs/liveStreams
 */
interface IYoutubeLiveStream {
  id: string;
  snippet: {
    isDefaultStream: boolean;
  };
  cdn: {
    ingestionInfo: {
      /**
       * streamName is actually a secret stream key
       */
      streamName: string;
      ingestionAddress: string;
    };
    resolution: string;
    frameRate: string;
  };
}

export class YoutubeService extends StatefulService<IYoutubeServiceState>
  implements IPlatformService {
  @Inject() private hostsService: HostsService;
  @Inject() private streamSettingsService: StreamSettingsService;
  @Inject() private userService: UserService;
  @Inject() private customizationService: CustomizationService;
  @Inject() private streamingService: StreamingService;

  channelInfoChanged = new Subject<IYoutubeChannelInfo>();
  private activeChannel: IYoutubeChannelInfo = null;

  capabilities = new Set<TPlatformCapability>(['chat', 'stream-schedule']);

  static initialState: IYoutubeServiceState = {
    liveStreamingEnabled: true,
  };

  authWindowOptions: Electron.BrowserWindowConstructorOptions = {
    width: 1000,
    height: 600,
  };

  apiBase = 'https://www.googleapis.com/youtube/v3';

  init() {
    this.customizationService.settingsChanged.subscribe(updatedSettings => {
      // trigger `channelInfoChanged` event with a new chat url based on the changed theme
      if (updatedSettings.theme) this.updateActiveChannel({});
    });
  }

  get authUrl() {
    const host = this.hostsService.streamlabs;
    return (
      `https://${host}/slobs/login?_=${Date.now()}` +
      '&skip_splash=true&external=electron&youtube&force_verify&origin=slobs'
    );
  }

  get oauthToken() {
    return this.userService.platform.token;
  }

  @mutation()
  private SET_ENABLED_STATUS(enabled: boolean) {
    this.state.liveStreamingEnabled = enabled;
  }

  async beforeGoLive({ title, description, broadcastId }: IYoutubeStartStreamOptions) {
    // update selected LiveBroadcast with new title and description
    // or create a new LiveBroadcast if there are no broadcasts selected
    let broadcast = broadcastId
      ? await this.updateBroadcast(broadcastId, { title, description })
      : await this.createBroadcast({ title, description });

    // create a LiveStream object and bind it with current LiveBroadcast
    const stream = await this.createLiveStream(title);
    broadcast = await this.bindStreamToBroadcast(broadcast.id, stream.id);

    // setup key and platform type in the OBS settings
    const streamKey = stream.cdn.ingestionInfo.streamName;
    this.streamSettingsService.setSettings({ platform: 'youtube', key: streamKey });

    // update the local chanel info based on the selected broadcast and emit the "channelInfoChanged" event
    this.setActiveBroadcast(broadcast);
  }

  /**
   * check that user has enabled live-streaming on their account
   */
  async validatePlatform(): Promise<EPlatformCallResult> {
    try {
      const endpoint = 'liveStreams?part=id,snippet&mine=true';
      const url = `${this.apiBase}/${endpoint}&access_token=${this.oauthToken}`;
      await platformAuthorizedRequest(url);
      this.SET_ENABLED_STATUS(true);
      return EPlatformCallResult.Success;
    } catch (resp) {
      if (resp.status !== 403) {
        console.error(resp);
        return EPlatformCallResult.Error;
      }
      const json = resp.result;
      if (
        json.error &&
        json.error.errors &&
        json.error.errors[0].reason === 'liveStreamingNotEnabled'
      ) {
        this.SET_ENABLED_STATUS(false);
      }
      return EPlatformCallResult.YoutubeStreamingDisabled;
    }
  }

  getHeaders(req: IPlatformRequest, authorized = false) {
    return {
      'Content-Type': 'application/json',
      ...(authorized ? { Authorization: `Bearer ${this.oauthToken}` } : {}),
    };
  }

  fetchDefaultDescription(): Promise<string> {
    return this.userService
      .getDonationSettings()
      .then(json =>
        json.settings.autopublish ? `Support the stream: ${json.donation_url} \n` : '',
      );
  }

  fetchUserInfo() {
    return Promise.resolve({});
  }

  async fetchViewerCount(): Promise<number> {
    const endpoint = 'videos?part=snippet,liveStreamingDetails';
    const url = `${this.apiBase}/${endpoint}&id=${this.state.activeBroadcast.id}&access_token=${
      this.oauthToken
    }`;
    return platformAuthorizedRequest(url).then(
      json => (json.items[0] && json.items[0].liveStreamingDetails.concurrentViewers) || 0,
    );
  }

  /**
   * returns perilled data for the EditStreamInfo window
   */
  async prepopulateInfo(): Promise<IYoutubeStartStreamOptions> {
    // if streaming then return activeBroadcast description and title if exists
    if (this.streamingService.isStreaming) {
      return this.activeChannel;
    }

    // otherwise return the last saved description and title for new the streaming session
    const settings = this.streamSettingsService.settings;
    return {
      title: settings.title,
      description: settings.description || (await this.fetchDefaultDescription()),
    };
  }

  scheduleStream(
    scheduledStartTime: string,
    { title, description }: IYoutubeChannelInfo,
  ): Promise<IYoutubeLiveBroadcast> {
    return this.createBroadcast({ title, description, scheduledStartTime });
  }

  async fetchNewToken(): Promise<void> {
    const host = this.hostsService.streamlabs;
    const url = `https://${host}/api/v5/slobs/youtube/token`;
    const headers = authorizedHeaders(this.userService.apiToken);
    const request = new Request(url, { headers });

    return fetch(request)
      .then(handleResponse)
      .then(response => this.userService.updatePlatformToken(response.access_token));
  }

  /**
   * update data for the current active broadcast
   */
  async putChannelInfo(
    { title, description }: IYoutubeStartStreamOptions,
    scheduledStartTime?: string,
  ): Promise<boolean> {
    const broadcast = await this.updateBroadcast(this.activeChannel.broadcastId, {
      title,
      description,
    });
    this.setActiveBroadcast(broadcast);
    return true;
  }

  /**
   * update the chanel info based on the selected broadcast
   */
  private setActiveBroadcast(broadcast: IYoutubeLiveBroadcast) {
    this.updateActiveChannel({
      broadcastId: broadcast.id,
      title: broadcast.snippet.title,
      description: broadcast.snippet.description,
    });
  }

  /**
   * update the local info for current channel and emit the "channelInfoChanged" event
   */
  private updateActiveChannel(info: Partial<IYoutubeChannelInfo>) {
    this.activeChannel = this.activeChannel || ({} as IYoutubeChannelInfo);
    const broadCastId = info.broadcastId || this.activeChannel.broadcastId;

    // update settings and calculate new chatUrl and streamUrl
    this.activeChannel = {
      ...this.activeChannel,
      ...info,
      chatUrl: this.getChatUrl(broadCastId),
      streamUrl: this.getSteamUrl(broadCastId),
    };

    // save title and description to use them as pre-filled data for the next stream
    this.streamSettingsService.setSettings({
      title: this.activeChannel.title,
      description: this.activeChannel.description,
    });

    // emit the updated channelInfo
    this.channelInfoChanged.next(this.activeChannel);
  }

  /**
   * create a new broadcast via API
   */
  private async createBroadcast(params: {
    title: string;
    description: string;
    scheduledStartTime?: string;
  }): Promise<IYoutubeLiveBroadcast> {
    const endpoint = 'liveBroadcasts?part=snippet,status,contentDetails';
    const data: Dictionary<any> = {
      snippet: {
        title: params.title,
        scheduledStartTime: params.scheduledStartTime || new Date().toISOString(),
        description: params.description,
      },
      status: { privacyStatus: 'public' },
    };

    return await platformAuthorizedRequest<IYoutubeLiveBroadcast>({
      body: JSON.stringify(data),
      method: 'POST',
      url: `${this.apiBase}/${endpoint}&access_token=${this.oauthToken}`,
    });
  }

  /**
   * update the broadcast via API
   */
  private async updateBroadcast(
    id: string,
    params: {
      title?: string;
      description?: string;
      boundStreamId?: string;
    },
  ): Promise<IYoutubeLiveBroadcast> {
    const endpoint = `liveBroadcasts?part=snippet&id=${id}`;
    const snippet: Partial<IYoutubeLiveBroadcast['snippet']> = {};
    if (params.title !== void 0) {
      snippet.title = params.title;
    }
    if (params.description !== void 0) {
      snippet.description = params.description;
    }

    snippet.scheduledStartTime =
      this.state.activeBroadcast && id === this.state.activeBroadcast.id
        ? this.state.activeBroadcast.snippet.scheduledStartTime
        : new Date().toISOString();

    return await platformAuthorizedRequest<IYoutubeLiveBroadcast>({
      body: JSON.stringify({ id, snippet }),
      method: 'PUT',
      url: `${this.apiBase}/${endpoint}&access_token=${this.oauthToken}`,
    });
  }

  /**
   * The liveStream must be bounded to the Youtube LiveBroadcast before going live
   */
  private bindStreamToBroadcast(
    broadcastId: string,
    streamId: string,
  ): Promise<IYoutubeLiveBroadcast> {
    const endpoint = '/liveBroadcasts/bind?part=contentDetails,snippet,status';
    return platformAuthorizedRequest<IYoutubeLiveBroadcast>({
      method: 'POST',
      url: `${this.apiBase}${endpoint}&id=${broadcastId}&streamId=${streamId}&access_token=${
        this.oauthToken
      }`,
    });
  }

  /**
   * create new LiveStream via API
   * this LiveStream must be bounded to the Youtube LiveBroadcast before going live
   */
  private async createLiveStream(title: string): Promise<IYoutubeLiveStream> {
    const endpoint = `liveStreams?part=cdn,snippet,contentDetails`;
    return platformAuthorizedRequest<IYoutubeLiveStream>({
      url: `${this.apiBase}/${endpoint}&access_token=${this.oauthToken}`,
      method: 'POST',
      body: JSON.stringify({
        snippet: { title },
        cdn: {
          frameRate: 'variable',
          ingestionType: 'rtmp',
          resolution: 'variable',
        },
        contentDetails: { isReusable: false },
      }),
    });
  }

  searchGames(searchString: string) {
    return Promise.resolve(JSON.parse(''));
  }

  liveDockEnabled(): boolean {
    return this.streamSettingsService.settings.protectedModeEnabled;
  }

  // TODO: dedup
  supports<T extends TPlatformCapability>(
    capability: T,
  ): this is TPlatformCapabilityMap[T] & IPlatformService {
    return this.capabilities.has(capability);
  }

  /**
   * Fetch the list of active and upcoming broadcasts
   */
  async fetchBroadcasts(ids?: string[]): Promise<IYoutubeLiveBroadcast[]> {
    const idsFilter = ids ? `&id=${ids.join(',')}` : '';
    const query = `part=snippet,contentDetails,status&mine=true&status=upcoming,active&maxResults=50${idsFilter}&access_token=${
      this.oauthToken
    }`;
    const broadcastsCollection = await platformAuthorizedRequest<
      IYoutubeCollection<IYoutubeLiveBroadcast>
    >(`${this.apiBase}/liveBroadcasts?${query}`);

    // cap broadcasts list depending on the current date
    // unfortunately YT API doesn't provide a way to filter broadcasts by date
    return broadcastsCollection.items.filter(broadcast => {
      const timeRange = 1000 * 60 * 60 * 24;
      const maxDate = Date.now() + timeRange;
      const minDate = Date.now() - timeRange;
      const broadcastDate = new Date(broadcast.snippet.scheduledStartTime).valueOf();
      return broadcastDate > minDate && broadcastDate < maxDate;
    });
  }

  private getChatUrl(broadcastId: string) {
    const mode = this.customizationService.isDarkTheme ? 'night' : 'day';
    const youtubeDomain = mode === 'day' ? 'https://youtube.com' : 'https://gaming.youtube.com';
    return `${youtubeDomain}/live_chat?v=${broadcastId}&is_popout=1`;
  }

  private getSteamUrl(broadcastId: string) {
    const nightMode = this.customizationService.isDarkTheme ? 'night' : 'day';
    const youtubeDomain =
      nightMode === 'day' ? 'https://youtube.com' : 'https://gaming.youtube.com';

    return `${youtubeDomain}/watch?v=${broadcastId}`;
  }
}
