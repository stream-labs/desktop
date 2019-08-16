import { StatefulService, mutation } from '../core/stateful-service';
import {
  IPlatformService,
  IChannelInfo,
  TPlatformCapability,
  TPlatformCapabilityMap,
  EPlatformCallResult,
  IPlatformRequest,
} from '.';
import { HostsService } from '../hosts';
import { SettingsService } from '../settings';
import { Inject } from '../core/injector';
import { authorizedHeaders, handleResponse } from '../../util/requests';
import { UserService } from '../user';
import { $t } from 'services/i18n';
import { platformAuthorizedRequest, platformRequest } from './utils';

interface IYoutubeServiceState {
  liveStreamingEnabled: boolean;
  liveStreamId: string;
  scheduledStartTime: string;
  liveBroadcast: IYoutubeLiveBroadcast;
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
interface IYoutubeLiveBroadcast {
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
      backupIngestionAddress: string;
    };
    resolution: string;
    frameRate: string;
  };
}

export class YoutubeService extends StatefulService<IYoutubeServiceState>
  implements IPlatformService {
  @Inject() hostsService: HostsService;
  @Inject() settingsService: SettingsService;
  @Inject() userService: UserService;

  capabilities = new Set<TPlatformCapability>(['chat', 'stream-schedule']);

  static initialState: IYoutubeServiceState = {
    liveStreamingEnabled: true,
    liveStreamId: null,
    scheduledStartTime: null,
    liveBroadcast: null,
  };

  authWindowOptions: Electron.BrowserWindowConstructorOptions = {
    width: 1000,
    height: 600,
  };

  apiBase = 'https://www.googleapis.com/youtube/v3';

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

  get youtubeId() {
    return this.userService.platform.id;
  }

  @mutation()
  private SET_ENABLED_STATUS(enabled: boolean) {
    this.state.liveStreamingEnabled = enabled;
  }

  @mutation()
  private SET_STREAM_ID(id: string) {
    this.state.liveStreamId = id;
  }

  @mutation()
  private SET_SCHEDULED_START_TIME(time: string) {
    this.state.scheduledStartTime = time;
  }

  @mutation()
  private SET_CHANNEL_LIVE_BROADCAST(broadcast: IYoutubeLiveBroadcast) {
    this.state.liveBroadcast = broadcast;
  }

  setupStreamSettings() {
    return this.fetchStreamKey()
      .then(streamKey => {
        const settings = this.settingsService.getSettingsFormData('Stream');

        settings.forEach(subCategory => {
          subCategory.parameters.forEach(parameter => {
            if (parameter.name === 'service') {
              parameter.value = 'YouTube / YouTube Gaming';
            }
            if (parameter.name === 'key') {
              parameter.value = streamKey;
            }
          });
        });

        this.settingsService.setSettings('Stream', settings);
        return EPlatformCallResult.Success;
      })
      .catch(() => EPlatformCallResult.Error);
  }

  getHeaders(req: IPlatformRequest, authorized = false) {
    return {
      'Content-Type': 'application/json',
      ...(authorized ? { Authorization: `Bearer ${this.oauthToken}` } : {}),
    };
  }

  fetchDescription(): Promise<string> {
    return this.userService
      .getDonationSettings()
      .then(json =>
        json.settings.autopublish ? `Support the stream: ${json.donation_url} \n` : '',
      );
  }

  fetchUserInfo() {
    return Promise.resolve({});
  }

  async fetchStreamKey(): Promise<string> {
    const endpoint = `liveStreams?part=cdn,snippet&default=true`;
    return platformAuthorizedRequest<IYoutubeCollection<IYoutubeLiveStream>>(
      `${this.apiBase}/${endpoint}&access_token=${this.oauthToken}`,
    )
      .then(streams => streams.items[0].cdn.ingestionInfo.streamName)
      .catch(e => $t('Please enable account for streaming to recieve a stream key'));
  }

  fetchViewerCount(): Promise<number> {
    const endpoint = 'videos?part=snippet,liveStreamingDetails';
    const url = `${this.apiBase}/${endpoint}&id=${this.state.liveBroadcast.id}&access_token=${
      this.oauthToken
    }`;
    return platformRequest(url).then(
      json => (json.items[0] && json.items[0].liveStreamingDetails.concurrentViewers) || 0,
    );
  }

  prepopulateInfo() {
    const query = `part=snippet,contentDetails,status&default=true&access_token=${this.oauthToken}`;
    return platformAuthorizedRequest<IYoutubeCollection<IYoutubeLiveBroadcast>>(
      `${this.apiBase}/liveBroadcasts?${query}`,
    )
      .then(broadcasts => {
        const defaultBroadcast = broadcasts.items[0];
        this.SET_ENABLED_STATUS(true);
        this.SET_STREAM_ID(defaultBroadcast.contentDetails.boundStreamId);
        this.SET_SCHEDULED_START_TIME(defaultBroadcast.snippet.scheduledStartTime);
        this.SET_CHANNEL_LIVE_BROADCAST(defaultBroadcast);
        return {
          title: defaultBroadcast.snippet.title,
          description: defaultBroadcast.snippet.description,
        };
      })
      .catch(resp => {
        if (resp.status !== 403) throw new Error(resp);
        resp.json().then((json: any) => {
          if (
            json.error &&
            json.error.errors &&
            json.error.errors[0].reason === 'liveStreamingNotEnabled'
          ) {
            this.SET_ENABLED_STATUS(false);
          }
        });
        return null;
      });
  }

  scheduleStream(scheduledStartTime: string, { title, description }: IChannelInfo): Promise<any> {
    return this.putChannelInfo({ title, description }, scheduledStartTime);
  }

  fetchNewToken(): Promise<void> {
    const host = this.hostsService.streamlabs;
    const url = `https://${host}/api/v5/slobs/youtube/token`;
    const headers = authorizedHeaders(this.userService.apiToken);
    const request = new Request(url, { headers });

    return fetch(request)
      .then(handleResponse)
      .then(response => this.userService.updatePlatformToken(response.access_token));
  }

  putChannelInfo(
    { title, description }: IChannelInfo,
    scheduledStartTime?: string,
  ): Promise<boolean> {
    return this.fetchDescription().then(autopublishString => {
      const fullDescription = new RegExp(autopublishString).test(description)
        ? description
        : autopublishString.concat(description);
      const endpoint = 'liveBroadcasts?part=snippet,status&default=true';
      const data: Dictionary<any> = {
        id: this.state.liveBroadcast.id,
        snippet: {
          title,
          description: fullDescription,
        },
        status: { privacyStatus: 'public' },
      };
      if (scheduledStartTime) {
        data.snippet.scheduledStartTime = scheduledStartTime;
      }

      return platformRequest({
        body: JSON.stringify(data),
        method: 'PUT',
        url: `${this.apiBase}/${endpoint}&access_token=${this.oauthToken}`,
      }).then(() => true);
    });
  }

  searchGames(searchString: string) {
    return Promise.resolve(JSON.parse(''));
  }

  searchCommunities(searchString: string) {
    return Promise.resolve(JSON.parse(''));
  }

  getChatUrl(mode: string) {
    const youtubeDomain = mode === 'day' ? 'https://youtube.com' : 'https://gaming.youtube.com';
    return Promise.resolve(
      `${youtubeDomain}/live_chat?v=${this.state.liveBroadcast.id}&is_popout=1`,
    );
  }

  beforeGoLive() {
    return Promise.resolve();
  }

  // TODO: dedup
  supports<T extends TPlatformCapability>(
    capability: T,
  ): this is TPlatformCapabilityMap[T] & IPlatformService {
    return this.capabilities.has(capability);
  }
}
