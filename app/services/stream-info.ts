import { StatefulService, mutation } from 'services/core/stateful-service';
import { IChannelInfo, getPlatformService, Tag } from 'services/platforms';
import { UserService } from './user';
import { Inject } from 'services/core/injector';
import { StreamingService } from './streaming';
import { HostsService } from 'services/hosts';
import { authorizedHeaders } from 'util/requests';
import { Subject } from 'rxjs';
import { TwitchService } from './platforms/twitch';

interface IStreamInfoServiceState {
  fetching: boolean;
  error: boolean;
  viewerCount: number;
  channelInfo: IChannelInfo;
}

interface IStreamInfo {
  viewerCount: number;
  channelInfo: IChannelInfo;
}

const VIEWER_COUNT_UPDATE_INTERVAL = 60 * 1000;

/**
 * The stream info service is responsible for keeping
 * reliable, up-to-date information about the user's
 * channel and current stream in the Vuex store for
 * components to make use of.
 */
export class StreamInfoService extends StatefulService<IStreamInfoServiceState> {
  @Inject() userService: UserService;
  @Inject() streamingService: StreamingService;
  @Inject() hostsService: HostsService;
  @Inject() twitchService: TwitchService;

  static initialState: IStreamInfoServiceState = {
    fetching: false,
    error: false,
    viewerCount: 0,
    channelInfo: {
      title: '',
      game: '',
      description: '',
      tags: [],
      availableTags: [],
      hasUpdateTagsPermission: false,
    },
  };

  viewerCountInterval: number;

  streamInfoChanged = new Subject();

  init() {
    this.refreshStreamInfo().catch(e => null);

    this.viewerCountInterval = window.setInterval(() => {
      if (!this.userService.isLoggedIn()) return;

      if (this.streamingService.isStreaming) {
        const platform = getPlatformService(this.userService.platform.type);

        platform.fetchViewerCount().then(viewers => {
          this.SET_VIEWER_COUNT(viewers);
          this.streamInfoChanged.next();
        });
      }
    }, VIEWER_COUNT_UPDATE_INTERVAL);
  }

  async refreshStreamInfo(): Promise<void> {
    this.SET_ERROR(false);
    this.SET_FETCHING(true);

    if (!this.userService.isLoggedIn()) {
      this.SET_FETCHING(false);
      return;
    }

    const platform = getPlatformService(this.userService.platform.type);
    try {
      // let info = await platform.prepopulateInfo();
      // if (info) await this.setChannelInfo(info);
      const info = await platform.fetchChannelInfo();

      this.SET_CHANNEL_INFO(info);
      if (this.userService.platform.type === 'twitch') {
        this.SET_HAS_UPDATE_TAGS_PERM(await this.twitchService.hasScope('user:edit:broadcast'));
      }
      this.streamInfoChanged.next();
    } catch (e) {
      console.warn('Unable to refresh stream info', e);
      this.SET_ERROR(true);
    }
    this.SET_FETCHING(false);
  }

  async setChannelInfo(info: IChannelInfo): Promise<boolean> {
    const platform = getPlatformService(this.userService.platform.type);
    if (this.userService.platform.type === 'facebook' && info.game === '') {
      return Promise.reject('You must select a game.');
    }

    try {
      await platform.putChannelInfo(info);
      this.createGameAssociation(info.game);
      await this.refreshStreamInfo();
      return true;
    } catch (e) {
      console.warn('Unable to set stream info: ', e);
    }
    return false;
  }

  /**
   * Used to track in aggregate which overlays streamers are using
   * most often for which games, in order to offer a better search
   * experience in the overlay library.
   * @param game the name of the game
   */
  private createGameAssociation(game: string) {
    const url = `https://${this.hostsService.overlays}/api/overlay-games-association`;

    const headers = authorizedHeaders(this.userService.apiToken);
    headers.append('Content-Type', 'application/x-www-form-urlencoded');

    const body = `game=${encodeURIComponent(game)}`;
    const request = new Request(url, { headers, body, method: 'POST' });

    // This is best effort data gathering, don't explicitly handle errors
    return fetch(request);
  }

  @mutation()
  SET_FETCHING(fetching: boolean) {
    this.state.fetching = fetching;
  }

  @mutation()
  SET_ERROR(error: boolean) {
    this.state.error = error;
  }

  @mutation()
  SET_CHANNEL_INFO(info: IChannelInfo) {
    this.state.channelInfo = info;
  }

  @mutation()
  SET_HAS_UPDATE_TAGS_PERM(perm: boolean) {
    this.state.channelInfo.hasUpdateTagsPermission = perm;
  }

  @mutation()
  SET_VIEWER_COUNT(viewers: number) {
    this.state.viewerCount = viewers;
  }
}
