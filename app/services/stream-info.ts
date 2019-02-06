import { StatefulService, mutation } from 'services/stateful-service';
import { IChannelInfo, getPlatformService, Tag } from 'services/platforms';
import { UserService } from './user';
import { Inject } from 'util/injector';
import { StreamingService } from './streaming';
import { HostsService } from 'services/hosts';
import { authorizedHeaders } from 'util/requests';
import { BehaviorSubject, Subject } from 'rxjs';

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

  static initialState: IStreamInfoServiceState = {
    fetching: false,
    error: false,
    viewerCount: 0,
    channelInfo: null,
  };

  viewerCountInterval: number;

  streamInfoChanged = new BehaviorSubject<IStreamInfo>(StreamInfoService.initialState);

  init() {
    this.refreshStreamInfo();

    this.viewerCountInterval = window.setInterval(() => {
      if (!this.userService.isLoggedIn()) return;

      if (this.streamingService.isStreaming) {
        const platform = getPlatformService(this.userService.platform.type);

        platform.fetchViewerCount().then(viewers => {
          this.SET_VIEWER_COUNT(viewers);
          this.streamInfoChanged.next({
            viewerCount: this.state.viewerCount,
            channelInfo: this.state.channelInfo,
          });
        });
      }
    }, VIEWER_COUNT_UPDATE_INTERVAL);
  }

  refreshStreamInfo(): Promise<void> {
    if (!this.userService.isLoggedIn()) return Promise.reject(null);

    this.SET_ERROR(false);
    this.SET_FETCHING(true);

    const platform = getPlatformService(this.userService.platform.type);
    return platform
      .fetchChannelInfo()
      .then(info => {
        this.SET_CHANNEL_INFO(info);
        this.streamInfoChanged.next({
          viewerCount: this.state.viewerCount,
          channelInfo: this.state.channelInfo,
        });
        this.SET_FETCHING(false);
      })
      .catch(() => {
        this.SET_FETCHING(false);
        this.SET_ERROR(true);
      });
  }

  setStreamInfo(title: string, description: string, game: string, tags?: Tag[]): Promise<boolean> {
    const platform = getPlatformService(this.userService.platform.type);
    if (this.userService.platform.type === 'facebook' && game === '') {
      return Promise.reject('You must select a game.');
    }

    return platform
      .putChannelInfo({ title, game, description, tags })
      .then(success => {
        this.refreshStreamInfo();
        this.createGameAssociation(game);
        return success;
      })
      .catch(() => {
        this.refreshStreamInfo();
        return false;
      });
  }

  /**
   * Used to track in aggregate which overlays streamers are using
   * most often for which games, in order to offer a better search
   * experience in the overlay library.
   * @param game the name of the game
   */
  createGameAssociation(game: string) {
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
  SET_VIEWER_COUNT(viewers: number) {
    this.state.viewerCount = viewers;
  }
}
