import { mutation, InheritMutations } from '../core/stateful-service';
import {
  IPlatformService,
  TPlatformCapability,
  EPlatformCallResult,
  IPlatformRequest,
  IPlatformState,
} from '.';
import { Inject } from 'services/core/injector';
import { authorizedHeaders, handleResponse } from 'util/requests';
import { platformAuthorizedRequest } from './utils';
import { StreamSettingsService } from 'services/settings/streaming';
import { CustomizationService } from 'services/customization';
import { IGoLiveSettings } from 'services/streaming';
import { WindowsService } from 'services/windows';
import { $t } from 'services/i18n';
import { throwStreamError } from 'services/streaming/stream-error';
import { BasePlatformService } from './base-platform';
import { assertIsDefined } from 'util/properties-type-guards';
import electron from 'electron';
import { pickBy } from 'lodash';

interface IYoutubeServiceState extends IPlatformState {
  liveStreamingEnabled: boolean;
  streamId: string;
  channelId: string;
  lifecycleStep: TYoutubeLifecycleStep;
  settings: IYoutubeStartStreamOptions;
}

export interface IYoutubeStartStreamOptions {
  title: string;
  broadcastId?: string;
  description?: string;
}

export type TYoutubeLifecycleStep =
  | 'idle'
  | 'waitForStreamToBeActive'
  | 'transitionBroadcastToTesting'
  | 'waitForTesting'
  | 'transitionBroadcastToActive'
  | 'waitForBroadcastToBeLive'
  | 'live';

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
    lifeCycleStatus: TBroadcastLifecycleStatus;
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
  status: {
    streamStatus: TStreamStatus;
  };
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
export class YoutubeService extends BasePlatformService<IYoutubeServiceState>
  implements IPlatformService {
  @Inject() private customizationService: CustomizationService;
  @Inject() private streamSettingsService: StreamSettingsService;
  @Inject() private windowsService: WindowsService;

  readonly capabilities = new Set<TPlatformCapability>(['chat', 'description', 'stream-schedule']);

  static initialState: IYoutubeServiceState = {
    ...BasePlatformService.initialState,
    liveStreamingEnabled: true,
    streamId: '',
    channelId: '',
    lifecycleStep: 'idle',
    settings: {
      broadcastId: '',
      title: '',
      description: '',
    },
  };

  readonly platform = 'youtube';
  readonly displayName = 'YouTube';

  authWindowOptions: Electron.BrowserWindowConstructorOptions = {
    width: 1000,
    height: 600,
  };

  private apiBase = 'https://www.googleapis.com/youtube/v3';

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
  private async requestYoutube<T = unknown>(reqInfo: IPlatformRequest | string): Promise<T> {
    try {
      return await platformAuthorizedRequest<T>('youtube', reqInfo);
    } catch (e) {
      let details = e.result?.error?.message;
      if (!details) details = 'connection failed';
      const errorType =
        details === 'The user is not enabled for live streaming.'
          ? 'YOUTUBE_STREAMING_DISABLED'
          : 'PLATFORM_REQUEST_FAILED';
      throw throwStreamError(errorType, details, 'youtube');
    }
  }

  @mutation()
  private SET_ENABLED_STATUS(enabled: boolean) {
    this.state.liveStreamingEnabled = enabled;
  }

  @mutation()
  private SET_LIFECYCLE_STEP(step: TYoutubeLifecycleStep) {
    this.state.lifecycleStep = step;
  }

  async beforeGoLive(settings: IGoLiveSettings) {
    const {
      title,
      description,
      broadcastId,
    }: IYoutubeStartStreamOptions = settings.platforms.youtube;
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
    this.streamSettingsService.setSettings({
      platform: 'youtube',
      key: streamKey,
      streamType: 'rtmp_common',
    });
    this.SET_STREAM_KEY(streamKey);

    // update the local chanel info based on the selected broadcast and emit the "channelInfoChanged" event
    this.setActiveBroadcast(broadcast);
  }

  async publishBroadcast() {
    // we don't have broadcastId if user start stream with the 'just go live' button
    if (!this.state.settings.broadcastId) return;

    const streamId = this.state.streamId;
    const broadcastId = this.state.settings.broadcastId;

    try {
      // SLOBS started sending the video data to Youtube
      // wait YT for establish connection with SLOBS
      this.setLifecycleStep('waitForStreamToBeActive');
      await this.waitForStreamStatus(streamId, 'active');

      // the connection has been established
      // at this step you can see preview of the stream in the Youtube dashboard
      // but the stream still is not available for other viewers

      // we can't make it available for other user until we
      // didn't switch it to the 'testing' state
      this.setLifecycleStep('transitionBroadcastToTesting');
      await this.transitionBroadcastStatus(broadcastId, 'testing' as TBroadcastLifecycleStatus);

      // now we ready to publish the broadcast
      this.setLifecycleStep('waitForBroadcastToBeLive');
      await this.transitionBroadcastStatus(broadcastId, 'live');

      // we all set
      this.setLifecycleStep('live');
    } catch (e) {
      if (!this.userService.isLoggedIn || !this.userService.state.auth?.platforms?.youtube) {
        // user has logged out before the stream started
        // don't treat this as an error
        return;
      }

      if (this.state.lifecycleStep === 'idle') {
        // user stopped streaming before it started, so transitions for broadcast may not work
        // don't treat this as an error
        return;
      }

      // something is wrong in afterGoLive hook
      throw e;
    }
  }

  async afterStopStream() {
    // we don't have activeChannel if user start stream with the 'just go live' button
    if (!this.state.settings.broadcastId) return;

    // notify YT API that we've stopped the stream
    if (this.state.lifecycleStep !== 'idle') {
      try {
        await this.transitionBroadcastStatus(this.state.settings.broadcastId, 'complete');
      } catch (e) {
        // most likely we tried to switch status to complete when the broadcast is in ready or testing state
        // this happens when we stop stream before it becomes active
      }
    }
    this.SET_LIFECYCLE_STEP('idle');
  }

  private setLifecycleStep(step: TYoutubeLifecycleStep) {
    this.SET_LIFECYCLE_STEP(step);
  }

  /**
   * check that user has enabled live-streaming on their account
   */
  async validatePlatform(): Promise<EPlatformCallResult> {
    try {
      const endpoint = 'liveStreams?part=id,snippet&mine=true';
      const url = `${this.apiBase}/${endpoint}&access_token=${this.oauthToken}`;
      await platformAuthorizedRequest('youtube', url);
      this.SET_ENABLED_STATUS(true);
      return EPlatformCallResult.Success;
    } catch (resp) {
      if (resp.status !== 403) {
        console.error('Got 403 checking if YT is enabled for live streaming', resp);
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

  protected async fetchViewerCount(): Promise<number> {
    if (!this.state.settings.broadcastId) return 0; // activeChannel is not available when streaming to custom ingest
    const endpoint = 'videos?part=snippet,liveStreamingDetails';
    // eslint-disable-next-line prettier/prettier
    const url = `${this.apiBase}/${endpoint}&id=${this.state.settings.broadcastId}&access_token=${
      this.oauthToken
    }`;
    return this.requestYoutube<{
      items: { liveStreamingDetails: { concurrentViewers: string } }[];
    }>(url).then(
      json =>
        (json.items[0] && parseInt(json.items[0].liveStreamingDetails.concurrentViewers, 10)) || 0,
    );
  }

  /**
   * returns perilled data for the GoLive window
   */
  async prepopulateInfo(): Promise<IYoutubeStartStreamOptions> {
    // if streaming then return activeBroadcast description and title if exists
    if (this.streamingService.isStreaming) {
      return this.state.settings;
    }

    // otherwise return the last saved description and title for new the streaming session
    const settings = this.streamSettingsService.settings;
    const result = {
      title: settings.title,
      description: settings.description || (await this.fetchDefaultDescription()),
    };
    this.SET_PREPOPULATED(true);
    return result;
  }

  /**
   * Create a YT broadcast (event) for the future stream
   */
  scheduleStream(
    scheduledStartTime: string,
    { title, description }: { title: string; description: string },
  ): Promise<IYoutubeLiveBroadcast> {
    return this.createBroadcast({ title, description, scheduledStartTime });
  }

  async fetchNewToken(): Promise<void> {
    const host = this.hostsService.streamlabs;
    const url = `https://${host}/api/v5/slobs/youtube/token`;
    const headers = authorizedHeaders(this.userService.apiToken!);
    const request = new Request(url, { headers });

    return fetch(request)
      .then(handleResponse)
      .then(response => this.userService.updatePlatformToken('youtube', response.access_token));
  }

  /**
   * update data for the current active broadcast
   */
  async putChannelInfo(
    { title, description }: IYoutubeStartStreamOptions,
    scheduledStartTime?: string,
  ): Promise<boolean> {
    const broadcastId = this.state.settings.broadcastId;
    assertIsDefined(broadcastId);
    const broadcast = await this.updateBroadcast(broadcastId, {
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
    const patch = {
      streamId: broadcast.contentDetails?.boundStreamId,
      settings: {
        broadcastId: broadcast.id,
        title: broadcast.snippet.title,
        description: broadcast.snippet.description,
      },
    };
    // update non-empty fields
    this.PATCH_STATE(pickBy(patch, val => val));
  }

  @mutation()
  private PATCH_STATE(newState: Partial<IYoutubeServiceState>) {
    Object.assign(this.state, newState);
  }

  /**
   * create a new broadcast via API
   */
  private async createBroadcast(params: {
    title: string;
    description?: string;
    scheduledStartTime?: string;
  }): Promise<IYoutubeLiveBroadcast> {
    const fields = ['snippet', 'contentDetails', 'status'];
    const endpoint = `liveBroadcasts?part=${fields.join(',')}`;
    const data: Dictionary<any> = {
      snippet: {
        title: params.title,
        scheduledStartTime: params.scheduledStartTime || new Date().toISOString(),
        description: params.description,
        categoryId: 10,
      },
      status: { privacyStatus: 'public' },
    };

    return await this.requestYoutube<IYoutubeLiveBroadcast>({
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
    const fields = ['snippet'];
    const endpoint = `liveBroadcasts?part=${fields.join(',')}&id=${id}`;
    const snippet: Partial<IYoutubeLiveBroadcast['snippet']> = {};
    if (params.title !== void 0) {
      snippet.title = params.title;
    }
    if (params.description !== void 0) {
      snippet.description = params.description;
    }

    snippet.scheduledStartTime = new Date().toISOString();

    return await this.requestYoutube<IYoutubeLiveBroadcast>({
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
    const fields = ['snippet', 'contentDetails', 'status'];
    const endpoint = `/liveBroadcasts/bind?part=${fields.join(',')}`;
    return this.requestYoutube<IYoutubeLiveBroadcast>({
      method: 'POST',
      // es-lint-disable-next-line prettier/prettier
      url: `${this.apiBase}${endpoint}&id=${broadcastId}&streamId=${streamId}&access_token=${this.oauthToken}`,
    });
  }

  /**
   * create new LiveStream via API
   * this LiveStream must be bounded to the Youtube LiveBroadcast before going live
   */
  private async createLiveStream(title: string): Promise<IYoutubeLiveStream> {
    const endpoint = 'liveStreams?part=cdn,snippet,contentDetails';
    return platformAuthorizedRequest<IYoutubeLiveStream>('youtube', {
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

  /**
   * returns liveStream
   */
  private async fetchLiveStream(
    id: string,
    fields = ['cdn', 'snippet', 'contentDetails', 'status'],
  ): Promise<IYoutubeLiveStream> {
    const endpoint = `liveStreams?part=${fields.join(',')}&id=${id}`;
    const collection = await this.requestYoutube<IYoutubeCollection<IYoutubeLiveStream>>(
      `${this.apiBase}/${endpoint}&access_token=${this.oauthToken}`,
    );
    return collection.items[0];
  }

  /**
   * Poll youtube API for a limited period of time
   * Stop polling when cb returns 'true'
   * @param cb
   */
  private async pollAPI(cb: () => Promise<boolean>): Promise<void> {
    return new Promise(async (resolve, reject) => {
      // make sure we should not poll more than a minute
      const maxWaitTime = 60 * 1000;
      let canPoll = true;
      setTimeout(() => {
        canPoll = false;
        reject(new Error('timeout'));
      }, maxWaitTime);

      // poll each 2s
      while (canPoll) {
        let shouldStop = this.state.lifecycleStep === 'idle'; // if user has clicked stop streaming than cancel polling
        if (shouldStop) {
          reject(new Error('Stream stopped'));
        } else {
          try {
            shouldStop = await cb();
          } catch (e) {
            reject(e);
            return;
          }
        }

        if (shouldStop) {
          canPoll = false;
          resolve();
          return;
        }
        await new Promise(r => setTimeout(r, 2000));
      }
    });
  }

  /**
   * Poll Youtube API until liveStream has not changed the required status
   * This typically takes 5-10 seconds, but may take up to a minute
   */
  private async waitForStreamStatus(streamId: string, status: TStreamStatus) {
    try {
      await this.pollAPI(async () => {
        const stream = await this.fetchLiveStream(streamId, ['status']);
        return stream.status.streamStatus === status;
      });
    } catch (e) {
      throwStreamError(
        'YOUTUBE_PUBLISH_FAILED',
        `LiveBroadcast has not changed the status to ${status}: ${e.details || e.message}`,
      );
    }
  }

  /**
   * Change the broadcast status
   * The broadcast may switch between several statuses before get the required status
   * So we should poll the API until we get the required status
   */
  private async transitionBroadcastStatus(broadcastId: string, status: TBroadcastLifecycleStatus) {
    try {
      // ask Youtube to change the broadcast status
      const endpoint = `liveBroadcasts/transition?broadcastStatus=${status}&id=${broadcastId}&part=status`;
      await this.requestYoutube<IYoutubeLiveBroadcast>({
        method: 'POST',
        url: `${this.apiBase}/${endpoint}&access_token=${this.oauthToken}`,
      });

      // wait for Youtube to change the broadcast status
      await this.pollAPI(async () => {
        const broadcast = await this.fetchBroadcast(broadcastId, ['status']);
        return broadcast.status.lifeCycleStatus === status;
      });
    } catch (e) {
      if (e.message === 'Redundant transition') {
        // handle Redundant transition as a success
        return;
      }
      throwStreamError(
        'YOUTUBE_PUBLISH_FAILED',
        `LiveBroadcast has not changed the status to ${status}: ${e.details || e.message}`,
      );
    }
  }

  get liveDockEnabled(): boolean {
    return this.streamSettingsService.settings.protectedModeEnabled;
  }

  /**
   * Returns a description for a current lifecycle step
   */
  get progressInfo(): { msg: string; progress: number } {
    const dictionary: { [key in TYoutubeLifecycleStep]: { msg: string; progress: number } } = {
      idle: {
        msg: '',
        progress: 0,
      },
      waitForStreamToBeActive: {
        msg: $t('Waiting for YouTube to receive the video signal...'),
        progress: 0.1,
      },
      transitionBroadcastToTesting: {
        msg: $t('Testing your broadcast...'),
        progress: 0.3,
      },
      waitForTesting: {
        msg: $t('Finalizing broadcast testing...'),
        progress: 0.4,
      },
      transitionBroadcastToActive: {
        msg: $t('Publishing to your YouTube channel...'),
        progress: 0.5,
      },
      waitForBroadcastToBeLive: {
        msg: $t('Waiting for broadcast to be published...'),
        progress: 0.6,
      },
      live: {
        msg: $t("You're live!"),
        progress: 1,
      },
    };
    return dictionary[this.state.lifecycleStep];
  }

  /**
   * Fetch the list of upcoming broadcasts
   * If ids specified than return broadcast in any state
   */
  async fetchBroadcasts(
    ids?: string[],
    maxResults = 50,
    fields = ['snippet', 'contentDetails', 'status'],
  ): Promise<IYoutubeLiveBroadcast[]> {
    const filter = ids ? `&id=${ids.join(',')}` : '&broadcastStatus=upcoming';
    const query = `part=${fields.join(',')}${filter}&maxResults=${maxResults}&access_token=${
      this.oauthToken
    }`;
    const broadcastsCollection = await platformAuthorizedRequest<
      IYoutubeCollection<IYoutubeLiveBroadcast>
    >('youtube', `${this.apiBase}/liveBroadcasts?${query}`);

    // don't apply any filters if the ids filter specified
    if (ids) return broadcastsCollection.items;

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

  private async fetchBroadcast(
    id: string,
    fields = ['snippet', 'contentDetails', 'status'],
  ): Promise<IYoutubeLiveBroadcast> {
    return (await this.fetchBroadcasts([id], 1, fields))[0];
  }

  get chatUrl() {
    const broadcastId = this.state.settings.broadcastId;
    if (!broadcastId) return '';
    const mode = this.customizationService.isDarkTheme ? 'night' : 'day';
    const youtubeDomain = mode === 'day' ? 'https://youtube.com' : 'https://gaming.youtube.com';
    return `${youtubeDomain}/live_chat?v=${broadcastId}&is_popout=1`;
  }

  openYoutubeEnable() {
    electron.remote.shell.openExternal('https://youtube.com/live_dashboard_splash');
  }

  get dashboardUrl(): string {
    return `https://studio.youtube.com/channel/${this.state.channelId}/livestreaming/dashboard`;
  }

  get streamPageUrl() {
    const nightMode = this.customizationService.isDarkTheme ? 'night' : 'day';
    const youtubeDomain =
      nightMode === 'day' ? 'https://youtube.com' : 'https://gaming.youtube.com';
    return `${youtubeDomain}/watch?v=${this.state.settings.broadcastId}`;
  }
}
