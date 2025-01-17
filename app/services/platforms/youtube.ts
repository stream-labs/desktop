import { mutation, InheritMutations } from '../core/stateful-service';
import {
  IPlatformService,
  TPlatformCapability,
  EPlatformCallResult,
  IPlatformRequest,
  IPlatformState,
} from '.';
import { Inject } from 'services/core/injector';
import { authorizedHeaders, jfetch } from 'util/requests';
import { platformAuthorizedRequest } from './utils';
import { CustomizationService } from 'services/customization';
import { IGoLiveSettings } from 'services/streaming';
import { I18nService } from 'services/i18n';
import { throwStreamError } from 'services/streaming/stream-error';
import { BasePlatformService } from './base-platform';
import { TDisplayType } from 'services/settings-v2/video';
import { assertIsDefined, getDefined } from 'util/properties-type-guards';
import Utils from '../utils';
import { YoutubeUploader } from './youtube/uploader';
import { lazyModule } from 'util/lazy-module';
import * as remote from '@electron/remote';
import { IVideo } from 'obs-studio-node';
import pick from 'lodash/pick';
import { TOutputOrientation } from 'services/restream';
import { Subject } from 'rxjs';
import { ICustomStreamDestination } from 'services/settings/streaming';

interface IYoutubeServiceState extends IPlatformState {
  liveStreamingEnabled: boolean;
  streamId: string;
  verticalStreamKey: string;
  verticalBroadcast: IYoutubeLiveBroadcast;
  broadcastStatus: TBroadcastLifecycleStatus | '';
  settings: IYoutubeStartStreamOptions;
  categories: IYoutubeCategory[];
}

export interface IYoutubeStartStreamOptions extends IExtraBroadcastSettings {
  title: string;
  thumbnail?: string | 'default';
  categoryId?: string;
  broadcastId?: string;
  description: string;
  privacyStatus?: 'private' | 'public' | 'unlisted';
  scheduledStartTime?: number;
  mode?: TOutputOrientation;
  /** Use extra output to stream a vertical context to a separate broadcast */
  hasExtraOutputs?: boolean;
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
  contentDetails: { boundStreamId: string } & IExtraBroadcastSettings & {
      recordFromStart: boolean;
      enableContentEncryption: boolean;
      startWithSlate: boolean;
      monitorStream: { enableMonitorStream: boolean; broadcastStreamDelayMs: boolean };
      enableEmbed: boolean;
    };
  snippet: {
    channelId: string;
    title: string;
    description: string;
    scheduledStartTime: string;
    actualStartTime: string;
    isDefaultBroadcast: boolean;
    defaultAudioLanguage: string;
    liveChatId: string;
    thumbnails: {
      default: {
        url: string;
        width: 120;
        height: 90;
      };
      high: {
        url: string;
        width: 480;
        height: 360;
      };
    };
  };
  status: {
    lifeCycleStatus: TBroadcastLifecycleStatus;
    privacyStatus: 'private' | 'public' | 'unlisted';
    recordingStatus: 'notRecording' | 'recorded' | 'recording';
    madeForKids: boolean;
    selfDeclaredMadeForKids: boolean;
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
  status: {
    streamStatus: TStreamStatus;
  };
}

export interface IYoutubeCategory {
  id: string;
  snippet: {
    title: string;
    assignable: boolean;
  };
}

export interface IYoutubeVideo {
  id: string;
  snippet: {
    title: string;
    description: string;
    categoryId: string;
    tags: string[];
    defaultAudioLanguage: string;
    scheduledStartTime: string;
  };
}

interface IExtraBroadcastSettings {
  enableAutoStart?: boolean;
  enableAutoStop?: boolean;
  enableDvr?: boolean;
  projection?: 'rectangular' | '360';
  latencyPreference?: 'normal' | 'low' | 'ultraLow';
  selfDeclaredMadeForKids?: boolean;
  video?: IVideo;
}

type TStreamStatus = 'active' | 'created' | 'error' | 'inactive' | 'ready';
type TBroadcastLifecycleStatus =
  | 'complete'
  | 'created'
  | 'live'
  | 'liveStarting'
  | 'ready'
  | 'revoked'
  | 'testStarting'
  | 'testing';

@InheritMutations()
export class YoutubeService
  extends BasePlatformService<IYoutubeServiceState>
  implements IPlatformService {
  @Inject() private customizationService: CustomizationService;
  @Inject() private i18nService: I18nService;

  @lazyModule(YoutubeUploader) uploader: YoutubeUploader;

  private horizontalStreamStarted = new Subject<boolean>();

  readonly capabilities = new Set<TPlatformCapability>([
    'title',
    'description',
    'chat',
    'stream-schedule',
    'streamlabels',
    'themes',
    'viewerCount',
  ]);

  static initialState: IYoutubeServiceState = {
    ...BasePlatformService.initialState,
    liveStreamingEnabled: true,
    streamId: '',
    verticalStreamKey: '',
    verticalBroadcast: {} as IYoutubeLiveBroadcast,
    broadcastStatus: '',
    categories: [],
    settings: {
      broadcastId: '',
      title: '',
      description: '',
      categoryId: '20', // Set Gaming as a default category
      enableAutoStart: true,
      enableAutoStop: true,
      enableDvr: true,
      projection: 'rectangular',
      latencyPreference: 'normal',
      privacyStatus: 'public',
      selfDeclaredMadeForKids: false,
      thumbnail: '',
      video: undefined,
      mode: undefined,
    },
  };

  readonly platform = 'youtube';
  readonly displayName = 'YouTube';

  /**
   * The list of fields we can update in the mid stream mode
   */
  readonly updatableSettings: (keyof IYoutubeStartStreamOptions)[] = [
    'title',
    'description',
    'enableAutoStop',
    'privacyStatus',
    'enableDvr',
  ];

  authWindowOptions: Electron.BrowserWindowConstructorOptions = {
    width: 1000,
    height: 600,
  };

  readonly apiBase = 'https://www.googleapis.com/youtube/v3';

  protected init() {
    this.syncSettingsWithLocalStorage();
  }

  get authUrl() {
    const host = this.hostsService.streamlabs;
    return (
      `https://${host}/slobs/login?_=${Date.now()}` +
      '&skip_splash=true&external=electron&youtube&force_verify&origin=slobs'
    );
  }

  get oauthToken() {
    return this.userService.state.auth?.platforms?.youtube?.token;
  }

  /**
   * Request Youtube API and handle error response
   */
  private async requestYoutube<T = unknown>(
    reqInfo: IPlatformRequest | string,
    repeatRequestIfRateLimitExceed = true,
  ): Promise<T> {
    try {
      return await platformAuthorizedRequest<T>('youtube', reqInfo);
    } catch (e: unknown) {
      let details = (e as any).result?.error?.message;
      if (!details) details = 'connection failed';

      // if the rate limit exceeded then repeat request after 3s delay
      if (details === 'User requests exceed the rate limit.' && repeatRequestIfRateLimitExceed) {
        await Utils.sleep(3000);
        return await this.requestYoutube(reqInfo, false);
      }

      const errorType =
        details === 'The user is not enabled for live streaming.'
          ? 'YOUTUBE_STREAMING_DISABLED'
          : 'PLATFORM_REQUEST_FAILED';
      throw throwStreamError(errorType, e as any, details);
    }
  }

  @mutation()
  private SET_ENABLED_STATUS(enabled: boolean) {
    this.state.liveStreamingEnabled = enabled;
  }

  async createVertical(settings: IGoLiveSettings): Promise<ICustomStreamDestination> {
    // {
    //   id: string;
    //   snippet: {
    //     isDefaultStream: boolean;
    //   };
    //   cdn: {
    //     ingestionInfo: {
    //       /**
    //        * streamName is actually a secret stream key
    //        */
    //       streamName: string;
    //       ingestionAddress: string;
    //     };
    //     resolution: string;
    //     frameRate: string;
    //   };
    //   status: {
    //     streamStatus: TStreamStatus;
    //   };
    // }

    const ytSettings = getDefined(settings.platforms.youtube);
    const title = `${ytSettings.title}-vert`;

    // OG:
    // if (!streamToScheduledBroadcast) {
    //   broadcast = await this.createBroadcast(ytSettings);
    // } else {
    //   assertIsDefined(ytSettings.broadcastId);
    //   await this.updateBroadcast(ytSettings.broadcastId, ytSettings);
    //   broadcast = await this.fetchBroadcast(ytSettings.broadcastId);
    // }
    // NOW:
    const verticalBroadcast = await this.createBroadcast({ ...ytSettings, title });
    //console.log('verticalBroadcast', JSON.stringify(verticalBroadcast, null, 2));

    // OG:
    // let stream: IYoutubeLiveStream;
    // if (!broadcast.contentDetails.boundStreamId) {
    //   stream = await this.createLiveStream(broadcast.snippet.title);
    //   await this.bindStreamToBroadcast(broadcast.id, stream.id);
    // } else {
    //   stream = await this.fetchLiveStream(broadcast.contentDetails.boundStreamId);
    // }
    // NOW:
    const verticalStream = await this.createLiveStream(verticalBroadcast.snippet.title);
    const verticalBoundBroadcast = await this.bindStreamToBroadcast(
      verticalBroadcast.id,
      verticalStream.id,
    );
    //console.log('verticalStream', JSON.stringify(verticalStream, null, 2));
    //console.log('verticalBoundBroadcast', JSON.stringify(verticalBoundBroadcast, null, 2));

    await this.updateCategory(verticalBroadcast.id, ytSettings.categoryId!);

    const verticalStreamKey = verticalStream.cdn.ingestionInfo.streamName;
    this.SET_VERTICAL_STREAM_KEY(verticalStreamKey);
    this.SET_VERTICAL_BROADCAST(verticalBoundBroadcast);
    //console.log('createVertical this.state.verticalStreamKey', this.state.verticalStreamKey);
    //console.log('createVertical verticalBroadcast', verticalBoundBroadcast);

    // JUST TO CHECK:
    const liveBroadcast = await this.fetchLiveStream(
      this.state.verticalBroadcast.contentDetails.boundStreamId,
    );
    // console.log('fetched vertical', JSON.stringify(liveBroadcast, null, 2));

    return {
      name: title,
      streamKey: verticalStreamKey,
      url: 'rtmps://a.rtmps.youtube.com/live2',
      enabled: true,
      display: 'vertical' as TDisplayType,
      mode: 'portrait' as TOutputOrientation,
    };
  }

  async beforeGoLive(settings: IGoLiveSettings, context?: TDisplayType) {
    const ytSettings = getDefined(settings.platforms.youtube);

    const streamToScheduledBroadcast = !!ytSettings.broadcastId;
    // update selected LiveBroadcast with new title and description
    // or create a new LiveBroadcast if there are no broadcasts selected
    let broadcast: IYoutubeLiveBroadcast;
    if (!streamToScheduledBroadcast) {
      broadcast = await this.createBroadcast(ytSettings);
      //console.log('horizontal broadcast', JSON.stringify(broadcast, null, 2));
    } else {
      assertIsDefined(ytSettings.broadcastId);
      await this.updateBroadcast(ytSettings.broadcastId, ytSettings);
      broadcast = await this.fetchBroadcast(ytSettings.broadcastId);
    }

    // create a LiveStream object and bind it with current LiveBroadcast
    let stream: IYoutubeLiveStream;
    if (!broadcast.contentDetails.boundStreamId) {
      stream = await this.createLiveStream(broadcast.snippet.title);
      const b = await this.bindStreamToBroadcast(broadcast.id, stream.id);
      //console.log('b', JSON.stringify(b, null, 2));
    } else {
      stream = await this.fetchLiveStream(broadcast.contentDetails.boundStreamId);
    }

    //console.log('horizontal stream', JSON.stringify(stream, null, 2));

    // set the category
    await this.updateCategory(broadcast.id, ytSettings.categoryId!);

    // setup key and platform type in the OBS settings
    const streamKey = stream.cdn.ingestionInfo.streamName;

    if (!this.streamingService.views.isMultiplatformMode) {
      this.streamSettingsService.setSettings(
        {
          platform: 'youtube',
          key: streamKey,
          streamType: 'rtmp_custom',
          server: 'rtmp://a.rtmp.youtube.com/live2',
        },
        context,
      );

      // console.log('creating vertical');

      // // create vertical
      // const verticalBroadcast = await this.createBroadcast(ytSettings);
      // const verticalStream = await this.createLiveStream(verticalBroadcast.snippet.title);
      // await this.updateCategory(verticalBroadcast.id, ytSettings.categoryId!);

      // const verticalStreamKey = verticalStream.cdn.ingestionInfo.streamName;

      // const destinations = this.streamingService.views.customDestinations;

      // const dest = {
      //   name: `${ytSettings.title}-vert`,
      //   streamKey: verticalStreamKey,
      //   url: 'rtmp://a.rtmp.youtube.com/live2',
      //   enabled: true,
      //   display: 'vertical' as TDisplayType,
      //   mode: 'portrait' as TOutputOrientation,
      // };

      // destinations.push(dest);

      // this.SET_VERTICAL_STREAM_KEY(verticalStreamKey);
      // this.streamSettingsService.setGoLiveSettings({ customDestinations: destinations });

      // console.log('beforeGoLive this.state.verticalStreamKey', this.state.verticalStreamKey);
      // this.horizontalStreamStarted.next();
    }

    this.UPDATE_STREAM_SETTINGS({ ...ytSettings, broadcastId: broadcast.id });
    this.SET_STREAM_ID(stream.id);
    this.SET_STREAM_KEY(streamKey);

    this.setPlatformContext('youtube');
  }

  async afterStopStream() {
    const destinations = this.streamingService.views.customDestinations.filter(
      dest => dest.streamKey !== this.state.verticalStreamKey,
    );

    this.SET_VERTICAL_BROADCAST({} as IYoutubeLiveBroadcast);
    this.SET_VERTICAL_STREAM_KEY('');
    this.streamSettingsService.setGoLiveSettings({ customDestinations: destinations });
    //console.log('afterStopStream this.state.verticalStreamKey', this.state.verticalStreamKey);
  }

  /**
   * check that user has enabled live-streaming on their account
   */
  async validatePlatform(): Promise<EPlatformCallResult> {
    try {
      const endpoint = 'liveStreams?part=id,snippet&mine=true';
      const url = `${this.apiBase}/${endpoint}`;
      await platformAuthorizedRequest('youtube', url);
      this.SET_ENABLED_STATUS(true);
      return EPlatformCallResult.Success;
    } catch (resp: unknown) {
      if ((resp as any).status !== 403) {
        console.error('Got 403 checking if YT is enabled for live streaming', resp);
        return EPlatformCallResult.Error;
      }
      const json = (resp as any).result;
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

  protected async fetchViewerCount(): Promise<number> {
    if (!this.state.settings.broadcastId) return 0; // activeChannel is not available when streaming to custom ingest
    const endpoint = 'videos?part=snippet,liveStreamingDetails';
    // eslint-disable-next-line prettier/prettier
    const url = `${this.apiBase}/${endpoint}&id=${this.state.settings.broadcastId}`;
    return this.requestYoutube<{
      items: { liveStreamingDetails: { concurrentViewers: string } }[];
    }>(url).then(
      json =>
        (json.items[0] && parseInt(json.items[0].liveStreamingDetails.concurrentViewers, 10)) || 0,
    );
  }

  private async fetchCategories(): Promise<IYoutubeCategory[]> {
    // region should be in "ISO 3166 alpha 2" format
    const locale = this.i18nService.state.locale;
    const region = locale.split('-')[1];
    const endpoint = `${this.apiBase}/videoCategories?part=snippet&regionCode=${region}&locale=${locale}`;
    const collection = await this.requestYoutube<IYoutubeCollection<IYoutubeCategory>>(endpoint);
    return collection.items.filter(category => category.snippet.assignable);
  }

  private async updateCategory(broadcastId: string, categoryId: string) {
    const video = await this.fetchVideo(broadcastId);
    const endpoint = 'videos?part=snippet';

    // we need to re-send snippet data when updating the `video` endpoint
    // otherwise YT will reset all fields in the `snippet` section
    const snippet: Partial<IYoutubeLiveBroadcast['snippet']> = pick(video.snippet, [
      'title',
      'description',
      'tags',
      'defaultAudioLanguage',
      'scheduledStartTime',
    ]);

    // `zxx` is a `Not applicable` language code
    // YouTube API doesn't allow us to set this code
    if (snippet.defaultAudioLanguage === 'zxx') delete snippet.defaultAudioLanguage;

    await this.requestYoutube({
      body: JSON.stringify({
        id: broadcastId,
        snippet: { ...snippet, categoryId },
      }),
      method: 'PUT',
      url: `${this.apiBase}/${endpoint}`,
    });
  }

  async fetchVideo(id: string): Promise<IYoutubeVideo> {
    const endpoint = `videos?id=${id}&part=snippet`;
    const videoCollection = await this.requestYoutube<IYoutubeCollection<IYoutubeVideo>>(
      `${this.apiBase}/${endpoint}`,
    );
    return videoCollection.items[0];
  }

  /**
   * returns perilled data for the GoLive window
   */
  async prepopulateInfo(): Promise<void> {
    if (!this.state.liveStreamingEnabled) {
      throw throwStreamError('YOUTUBE_STREAMING_DISABLED');
    }
    const settings = this.state.settings;
    this.UPDATE_STREAM_SETTINGS({
      description: settings.description || (await this.fetchDefaultDescription()),
    });
    if (!this.state.categories.length) this.SET_CATEGORIES(await this.fetchCategories());
    this.SET_PREPOPULATED(true);
  }

  /**
   * Create a YT broadcast (event) for the future stream
   */
  async scheduleStream(
    scheduledStartTime: number,
    options: IYoutubeStartStreamOptions,
  ): Promise<IYoutubeLiveBroadcast> {
    let broadcast: IYoutubeLiveBroadcast;
    if (!options.broadcastId) {
      // create an new event
      broadcast = await this.createBroadcast({ ...options, scheduledStartTime });
    } else {
      // update an existing event
      broadcast = await this.updateBroadcast(options.broadcastId, {
        ...options,
        scheduledStartTime,
      });
    }
    return broadcast;
  }

  async fetchNewToken(): Promise<void> {
    const host = this.hostsService.streamlabs;
    const url = `https://${host}/api/v5/slobs/youtube/token`;
    const headers = authorizedHeaders(this.userService.apiToken!);
    const request = new Request(url, { headers });

    return jfetch<{ access_token: string }>(request).then(response =>
      this.userService.updatePlatformToken('youtube', response.access_token),
    );
  }

  /**
   * update data for the current active broadcast
   */
  async putChannelInfo(options: IYoutubeStartStreamOptions): Promise<void> {
    const broadcastId = this.state.settings.broadcastId;
    assertIsDefined(broadcastId);

    if (this.state.settings.categoryId !== options.categoryId) {
      assertIsDefined(options.categoryId);
      await this.updateCategory(broadcastId, options.categoryId);
    }

    await this.updateBroadcast(broadcastId, options, true);
    this.UPDATE_STREAM_SETTINGS({ ...options, broadcastId });
  }

  /**
   * create a new broadcast via API
   */
  private async createBroadcast(
    params: IYoutubeStartStreamOptions & { scheduledStartTime?: number },
  ): Promise<IYoutubeLiveBroadcast> {
    const fields = ['snippet', 'contentDetails', 'status'];
    const endpoint = `liveBroadcasts?part=${fields.join(',')}`;
    const scheduledStartTime = params.scheduledStartTime
      ? new Date(params.scheduledStartTime)
      : new Date();
    const data: Dictionary<any> = {
      snippet: {
        title: params.title,
        scheduledStartTime: scheduledStartTime.toISOString(),
        description: params.description,
      },
      contentDetails: {
        enableAutoStart: params.enableAutoStart,
        enableAutoStop: params.enableAutoStop,
        enableDvr: params.enableDvr,
        projection: params.projection,
        latencyPreference: params.latencyPreference,
      },
      status: {
        privacyStatus: params.privacyStatus,
        selfDeclaredMadeForKids: params.selfDeclaredMadeForKids,
      },
    };

    const broadcast = await this.requestYoutube<IYoutubeLiveBroadcast>({
      body: JSON.stringify(data),
      method: 'POST',
      url: `${this.apiBase}/${endpoint}`,
    });

    // upload thumbnail
    if (params.thumbnail && params.thumbnail !== 'default') {
      await this.uploadThumbnail(params.thumbnail, broadcast.id);
    }

    return broadcast;
  }

  /**
   * update the broadcast via API
   */
  async updateBroadcast(
    id: string,
    params: Partial<IYoutubeStartStreamOptions>,
    isMidStreamMode = false,
  ): Promise<IYoutubeLiveBroadcast> {
    let broadcast = await this.fetchBroadcast(id);

    const scheduledStartTime = params.scheduledStartTime
      ? new Date(params.scheduledStartTime)
      : new Date();
    const snippet: Partial<IYoutubeLiveBroadcast['snippet']> = {
      title: params.title,
      description: params.description,
      scheduledStartTime: scheduledStartTime.toISOString(),
    };

    const contentDetails: Dictionary<any> = {
      enableAutoStart: isMidStreamMode
        ? broadcast.contentDetails.enableAutoStart
        : params.enableAutoStart,
      enableAutoStop: params.enableAutoStop,
      enableDvr: params.enableDvr,
      enableEmbed: broadcast.contentDetails.enableEmbed,
      projection: isMidStreamMode ? broadcast.contentDetails.projection : params.projection,
      latencyPreference: isMidStreamMode
        ? broadcast.contentDetails.latencyPreference
        : params.latencyPreference,

      // YT requires to setup these options on broadcast update if contentDetails provided
      recordFromStart: broadcast.contentDetails.recordFromStart,
      enableContentEncryption: broadcast.contentDetails.enableContentEncryption,
      startWithSlate: broadcast.contentDetails.startWithSlate,
      monitorStream: {
        enableMonitorStream: broadcast.contentDetails.monitorStream.enableMonitorStream,
        broadcastStreamDelayMs: broadcast.contentDetails.monitorStream.broadcastStreamDelayMs,
      },
    };

    const status: Partial<IYoutubeLiveBroadcast['status']> = {
      ...broadcast.status,
      selfDeclaredMadeForKids: params.selfDeclaredMadeForKids,
      privacyStatus: params.privacyStatus,
    };

    const fields = ['snippet', 'status', 'contentDetails'];
    const endpoint = `liveBroadcasts?part=${fields.join(',')}&id=${id}`;
    const body: Dictionary<any> = { id, snippet, contentDetails, status };

    broadcast = await this.requestYoutube<IYoutubeLiveBroadcast>({
      body: JSON.stringify(body),
      method: 'PUT',
      url: `${this.apiBase}/${endpoint}`,
    });

    if (!isMidStreamMode) {
      await this.updateCategory(broadcast.id, params.categoryId!);
    }

    // upload thumbnail
    if (params.thumbnail) await this.uploadThumbnail(params.thumbnail, broadcast.id);
    return broadcast;
  }

  async removeBroadcast(id: string) {
    const endpoint = `liveBroadcasts?&id=${id}`;
    await this.requestYoutube<IYoutubeLiveBroadcast>({
      method: 'DELETE',
      url: `${this.apiBase}/${endpoint}`,
    });
  }

  /**
   * The liveStream must be bounded to the Youtube LiveBroadcast before going live
   */
  private bindStreamToBroadcast(
    broadcastId: string,
    streamId: string,
  ): Promise<IYoutubeLiveBroadcast> {
    const fields = ['snippet', 'contentDetails', 'status'];
    const endpoint = `/liveBroadcasts/bind?part=${fields.join(',')}`;
    return this.requestYoutube<IYoutubeLiveBroadcast>({
      method: 'POST',
      // es-lint-disable-next-line prettier/prettier
      url: `${this.apiBase}${endpoint}&id=${broadcastId}&streamId=${streamId}`,
    });
  }

  /**
   * create new LiveStream via API
   * this LiveStream must be bounded to the Youtube LiveBroadcast before going live
   */
  private async createLiveStream(title: string): Promise<IYoutubeLiveStream> {
    const endpoint = 'liveStreams?part=cdn,snippet,contentDetails';
    return platformAuthorizedRequest<IYoutubeLiveStream>('youtube', {
      url: `${this.apiBase}/${endpoint}`,
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

  get liveDockEnabled(): boolean {
    return this.streamSettingsService.settings.protectedModeEnabled;
  }

  /**
   * Fetch the list of upcoming and active broadcasts
   */
  async fetchEligibleBroadcasts(apply24hFilter = true): Promise<IYoutubeLiveBroadcast[]> {
    const fields = ['snippet', 'contentDetails', 'status'];
    const query = `part=${fields.join(',')}&maxResults=50`;

    // fetch active and upcoming broadcasts simultaneously
    let [activeBroadcasts, upcomingBroadcasts] = await Promise.all([
      (
        await platformAuthorizedRequest<IYoutubeCollection<IYoutubeLiveBroadcast>>(
          'youtube',
          `${this.apiBase}/liveBroadcasts?${query}&broadcastStatus=active`,
        )
      ).items,
      (
        await platformAuthorizedRequest<IYoutubeCollection<IYoutubeLiveBroadcast>>(
          'youtube',
          `${this.apiBase}/liveBroadcasts?${query}&broadcastStatus=upcoming`,
        )
      ).items,
    ]);

    // show active broadcasts only with enableAutoStop=false
    // otherwise it's possible to start streaming to a broadcast when it's transitioning the state to completed
    activeBroadcasts = activeBroadcasts.filter(
      broadcast => !broadcast.contentDetails.enableAutoStop,
    );

    // cap the upcoming broadcasts list depending on the current date
    // unfortunately YT API doesn't provide a way to filter broadcasts by date
    if (apply24hFilter) {
      upcomingBroadcasts = upcomingBroadcasts.filter(broadcast => {
        const timeRange = 1000 * 60 * 60 * 24;
        const maxDate = Date.now() + timeRange;
        const minDate = Date.now() - timeRange;
        const broadcastDate = new Date(broadcast.snippet.scheduledStartTime).valueOf();
        return broadcastDate > minDate && broadcastDate < maxDate;
      });
    }

    return [...activeBroadcasts, ...upcomingBroadcasts];
  }

  /**
   * Fetch the list of all broadcasts
   */
  async fetchBroadcasts(): Promise<IYoutubeLiveBroadcast[]> {
    const fields = ['snippet', 'contentDetails', 'status'];
    const query = `part=${fields.join(',')}&broadcastType=all&mine=true&maxResults=100`;
    const broadcasts = (
      await platformAuthorizedRequest<IYoutubeCollection<IYoutubeLiveBroadcast>>(
        'youtube',
        `${this.apiBase}/liveBroadcasts?${query}`,
      )
    ).items;
    return broadcasts;
  }

  private async fetchLiveStream(id: string): Promise<IYoutubeLiveStream> {
    const url = `${this.apiBase}/liveStreams?part=cdn,snippet,contentDetails&id=${id}`;
    return (await platformAuthorizedRequest<{ items: IYoutubeLiveStream[] }>('youtube', url))
      .items[0];
  }

  async fetchBroadcast(
    id: string,
    fields = ['snippet', 'contentDetails', 'status'],
  ): Promise<IYoutubeLiveBroadcast> {
    const filter = `&id=${id}`;
    const query = `part=${fields.join(',')}${filter}&maxResults=1`;
    return (
      await platformAuthorizedRequest<IYoutubeCollection<IYoutubeLiveBroadcast>>(
        'youtube',
        `${this.apiBase}/liveBroadcasts?${query}`,
      )
    ).items[0];
  }

  get chatUrl() {
    const broadcastId = this.state.settings.broadcastId;
    if (!broadcastId) return '';
    const mode = this.customizationService.isDarkTheme ? 'night' : 'day';
    const youtubeDomain = mode === 'day' ? 'https://youtube.com' : 'https://gaming.youtube.com';
    return `${youtubeDomain}/live_chat?v=${broadcastId}&is_popout=1`;
  }

  /**
   * Returns an IYoutubeStartStreamOptions object for a given broadcastId
   */
  async fetchStartStreamOptionsForBroadcast(
    broadcastId: string,
  ): Promise<IYoutubeStartStreamOptions> {
    const [broadcast, video] = await Promise.all([
      this.fetchBroadcast(broadcastId),
      this.fetchVideo(broadcastId),
    ]);
    const { title, description } = broadcast.snippet;
    const { privacyStatus, selfDeclaredMadeForKids } = broadcast.status;
    const { enableDvr, projection, latencyPreference } = broadcast.contentDetails;
    return {
      broadcastId: broadcast.id,
      title,
      description,
      privacyStatus,
      selfDeclaredMadeForKids,
      enableDvr,
      projection,
      latencyPreference,
      categoryId: video.snippet.categoryId,
      thumbnail: broadcast.snippet.thumbnails.default.url,
    };
  }

  openYoutubeEnable() {
    remote.shell.openExternal('https://youtube.com/live_dashboard_splash');
  }

  openDashboard() {
    remote.shell.openExternal(this.dashboardUrl);
  }

  get dashboardUrl(): string {
    return `https://studio.youtube.com/video/${this.state.settings.broadcastId}/livestreaming`;
  }

  get streamPageUrl() {
    const nightMode = this.customizationService.isDarkTheme ? 'night' : 'day';
    const youtubeDomain =
      nightMode === 'day' ? 'https://youtube.com' : 'https://gaming.youtube.com';
    return `${youtubeDomain}/watch?v=${this.state.settings.broadcastId}`;
  }

  async uploadThumbnail(base64url: string | 'default', videoId: string) {
    // if `default` passed as url then upload default url
    // otherwise convert the passed base64url to blob
    const url =
      base64url !== 'default' ? base64url : `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

    if (base64url.startsWith('http')) {
      // if non-base64 url passed then image is already uploaded
      // skip uploading
      return;
    }

    const body = await fetch(url).then(res => res.blob());

    try {
      await jfetch(
        `https://www.googleapis.com/upload/youtube/v3/thumbnails/set?videoId=${videoId}`,
        { method: 'POST', body, headers: { Authorization: `Bearer ${this.oauthToken}` } },
      );
    } catch (e: unknown) {
      const error = await (e as any).json();
      let details = error.result?.error?.message;
      if (!details) details = 'connection failed';
      const errorType = 'YOUTUBE_THUMBNAIL_UPLOAD_FAILED';
      throw throwStreamError(errorType, e as any, details);
    }
  }

  fetchFollowers() {
    return platformAuthorizedRequest<{ items: { statistics: { subscriberCount: number } }[] }>(
      'youtube',
      `${this.apiBase}/channels?part=statistics&mine=true`,
    )
      .then(json => Number(json.items[0].statistics.subscriberCount))
      .catch(() => 0);
  }

  @mutation()
  private SET_STREAM_ID(streamId: string) {
    this.state.streamId = streamId;
  }

  @mutation()
  private SET_VERTICAL_STREAM_KEY(verticalStreamKey: string) {
    this.state.verticalStreamKey = verticalStreamKey;
  }

  @mutation()
  private SET_VERTICAL_BROADCAST(broadcast: IYoutubeLiveBroadcast) {
    this.state.verticalBroadcast = broadcast;
  }

  @mutation()
  private SET_CATEGORIES(categories: IYoutubeCategory[]) {
    this.state.categories = categories;
  }
}
