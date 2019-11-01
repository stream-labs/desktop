import { mutation, StatefulService } from 'services/core/stateful-service';
import { getPlatformService } from 'services/platforms';
import { UserService } from './user';
import { Inject } from 'services/core/injector';
import { StreamingService } from './streaming';
import { HostsService } from 'services/hosts';
import { authorizedHeaders } from 'util/requests';
import { Subject, Subscription } from 'rxjs';
import { ITwitchChannelInfo, TwitchService } from './platforms/twitch';
import { FacebookService, IFacebookChanelInfo } from './platforms/facebook';
import { InitAfter } from './core';
import { IYoutubeChannelInfo, TYoutubeLifecycleStep } from './platforms/youtube';
import { IMixerChannelInfo } from './platforms/mixer';
import { isEqual, pick, reduce } from 'lodash';

export type TCombinedChannelInfo = IFacebookChanelInfo &
  ITwitchChannelInfo &
  IYoutubeChannelInfo &
  IMixerChannelInfo;

type TStreamInfoServiceState = {
  fetching: boolean;
  error: string;
  viewerCount: number;
  lifecycleStep: TYoutubeLifecycleStep;
} & TCombinedChannelInfo;

const VIEWER_COUNT_UPDATE_INTERVAL = 60 * 1000;

/**
 * The stream info service is responsible for keeping
 * reliable, up-to-date information about the user's
 * channel and current stream in the Vuex store for
 * components to make use of.
 */
@InitAfter('UserService')
export class StreamInfoService extends StatefulService<TStreamInfoServiceState> {
  @Inject() userService: UserService;
  @Inject() streamingService: StreamingService;
  @Inject() hostsService: HostsService;
  @Inject() twitchService: TwitchService;
  @Inject() facebookService: FacebookService;

  static initialState: TStreamInfoServiceState = null;

  viewerCountInterval: number;

  streamInfoChanged = new Subject<Partial<TStreamInfoServiceState>>();

  init() {
    // handle log-in and log-out to subscribe/re-subscribe on channelInfo event from
    // the active platform service
    this.RESET();
    this.userService.userLogin.subscribe(_ => this.onLoginHandler());
    this.userService.userLogout.subscribe(_ => this.onLogoutHandler());

    // update viewers count
    this.viewerCountInterval = window.setInterval(() => {
      if (!this.userService.isLoggedIn()) return;

      if (this.streamingService.isStreaming) {
        const platform = getPlatformService(this.userService.platform.type);

        platform.fetchViewerCount().then(viewers => {
          this.updateInfo({ viewerCount: viewers });
        });
      }
    }, VIEWER_COUNT_UPDATE_INTERVAL);
  }

  private channelInfoSubsc: Subscription = null;

  private onLoginHandler() {
    const platform = getPlatformService(this.userService.platform.type);
    this.channelInfoSubsc = platform.channelInfoChanged.subscribe(channelInfo =>
      this.updateInfo(channelInfo),
    );
  }

  private onLogoutHandler() {
    if (this.channelInfoSubsc) this.channelInfoSubsc.unsubscribe();
    this.RESET();
    this.streamInfoChanged.next(this.state);
  }

  private updateInfo(streamInfoPatch: Partial<TStreamInfoServiceState>) {
    const newStreamInfo = {
      ...this.state,
      ...streamInfoPatch,
    };

    // emit the "streamInfoChanged" only with updated values
    const changedProps = reduce(
      this.state,
      (result, value, key) => {
        return isEqual(value, newStreamInfo[key]) ? result : result.concat(key);
      },
      [],
    );
    const changedData = pick(newStreamInfo, changedProps);
    this.UPDATE_STREAM_INFO(changedData);
    this.streamInfoChanged.next(changedData);
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
  UPDATE_STREAM_INFO(info: Partial<TStreamInfoServiceState>) {
    Object.keys(info).forEach(prop => (this.state[prop] = info[prop]));
  }

  @mutation()
  SET_VIEWER_COUNT(viewers: number) {
    this.state.viewerCount = viewers;
  }

  @mutation()
  RESET() {
    this.state = {
      fetching: false,
      error: '',
      viewerCount: 0,
      title: '',
      game: '',
      description: '',
      tags: [],
      availableTags: [],
      hasUpdateTagsPermission: false,
      facebookPageId: '',
      broadcastId: '',
      streamId: '',
      channelId: '',
      chatUrl: '',
      streamUrl: '',
      dashboardUrl: '',
      lifecycleStep: 'idle',
    };
  }
}
