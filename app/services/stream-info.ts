import { StatefulService, mutation } from 'services/core/stateful-service';
import { getPlatformService, Tag, TChannelInfo } from 'services/platforms';
import { UserService } from './user';
import { Inject } from 'services/core/injector';
import { StreamingService } from './streaming';
import { HostsService } from 'services/hosts';
import { authorizedHeaders } from 'util/requests';
import { Subject, Subscription } from 'rxjs';
import { ITwitchChannelInfo, TwitchService } from './platforms/twitch';
import { FacebookService, IFacebookChanelInfo } from './platforms/facebook';
import { InitAfter } from './core';
import { IYoutubeChannelInfo } from './platforms/youtube';
import { IMixerChannelInfo } from './platforms/mixer';
import { reduce, isEqual, pick } from 'lodash';

export type TCombinedChannelInfo = IFacebookChanelInfo &
  ITwitchChannelInfo &
  IYoutubeChannelInfo &
  IMixerChannelInfo;

type TStreamInfoServiceState = {
  fetching: boolean;
  error: boolean;
  viewerCount: number;
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
    if (this.userService.isLoggedIn()) this.onLoginHandler();

    // update viewers count
    this.viewerCountInterval = window.setInterval(() => {
      if (!this.userService.isLoggedIn()) return;

      if (this.streamingService.isStreaming) {
        const platform = getPlatformService(this.userService.platform.type);

        platform.fetchViewerCount().then(viewers => {
          this.onStreamInfoChangedHandler({ viewerCount: viewers });
        });
      }
    }, VIEWER_COUNT_UPDATE_INTERVAL);
  }

  private channelInfoSubsc: Subscription = null;

  private onLoginHandler() {
    const platform = getPlatformService(this.userService.platform.type);
    this.channelInfoSubsc = platform.channelInfoChanged.subscribe(channelInfo =>
      this.onStreamInfoChangedHandler(channelInfo),
    );
  }

  private onLogoutHandler() {
    if (this.channelInfoSubsc) this.channelInfoSubsc.unsubscribe();
    this.RESET();
  }

  private onStreamInfoChangedHandler(streamInfoPatch: Partial<TStreamInfoServiceState>) {
    const newStreamInfo = {
      ...this.state,
      ...streamInfoPatch,
    };
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

  async refreshStreamInfo(): Promise<void> {
    // this.SET_ERROR(false);
    // this.SET_FETCHING(true);
    //
    // if (!this.userService.isLoggedIn()) {o
    //   this.SET_FETCHING(false);
    //   return;
    // }
    //
    // const platform = getPlatformService(this.userService.platform.type);
    // try {
    //   const info = await platform.prepopulateInfo();
    //   if (info) this.SET_CHANNEL_INFO(info);
    //
    //   if (this.userService.platform.type === 'twitch') {
    //     this.SET_HAS_UPDATE_TAGS_PERM(await this.twitchService.hasScope('user:edit:broadcast'));
    //   }
    //
    //   if (this.userService.platform.type === 'facebook') {
    //     this.SET_FACEBOOK_PAGE(this.facebookService.state.facebookPages.page_id);
    //   }
    //
    //   this.streamInfoChanged.next();
    // } catch (e) {
    //   console.error('Unable to refresh stream info', e);
    //   this.SET_ERROR(true);
    // }
    // this.SET_FETCHING(false);
  }

  /**
   * set channel info that will be used when stream starts
   * if the stream is currently active that sync this changes immediately
   * @param info
   */
  async setChannelInfo(info: TCombinedChannelInfo): Promise<boolean> {
    const platform = getPlatformService(this.userService.platform.type);
    if (this.userService.platform.type === 'facebook' && info.game === '') {
      return Promise.reject('You must select a game.');
    }

    this.SET_CHANNEL_INFO(info);

    try {
      if (this.streamingService.isStreaming) {
        await platform.putChannelInfo(info);
      }
      this.createGameAssociation(info.game);
      return true;
    } catch (e) {
      console.error('Unable to set stream info: ', e);
    }
    return false;
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
  SET_FETCHING(fetching: boolean) {
    this.state.fetching = fetching;
  }

  @mutation()
  SET_ERROR(error: boolean) {
    this.state.error = error;
  }

  @mutation()
  SET_CHANNEL_INFO(info: TChannelInfo) {
    this.state = {
      ...this.state,
      ...info,
    };
  }

  @mutation()
  SET_HAS_UPDATE_TAGS_PERM(perm: boolean) {
    this.state.hasUpdateTagsPermission = perm;
  }

  @mutation()
  SET_VIEWER_COUNT(viewers: number) {
    this.state.viewerCount = viewers;
  }

  @mutation()
  SET_FACEBOOK_PAGE(pageId: string) {
    this.state.facebookPageId = pageId;
  }

  @mutation()
  RESET() {
    this.state = {
      fetching: false,
      error: false,
      viewerCount: 0,
      title: '',
      game: '',
      description: '',
      tags: [],
      availableTags: [],
      hasUpdateTagsPermission: false,
      facebookPageId: '',
      broadcastId: '',
      channelId: '',
      chatUrl: '',
      streamUrl: '',
    };
  }
}
