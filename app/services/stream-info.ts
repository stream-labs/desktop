import { StatefulService, mutation } from './stateful-service';
import { IChannelInfo, getPlatformService, Community } from './platforms';
import { UserService } from './user';
import { Inject } from '../util/injector';
import StreamingService from '../services/streaming';


interface IStreamInfoServiceState {
  fetching: boolean;
  error: boolean;
  viewerCount: number;
  channelInfo: IChannelInfo;
  communities: Community[]; // Twitch only
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

  static initialState: IStreamInfoServiceState = {
    fetching: false,
    error: false,
    viewerCount: 0, // TODO: Implement this
    channelInfo: null,
    communities: []
  };


  viewerCountInterval: number;


  init() {
    this.refreshStreamInfo();

    this.viewerCountInterval = window.setInterval(() => {
      if (this.streamingService.isStreaming) {
        const platform = getPlatformService(this.userService.platform.type);

        platform.fetchLiveStreamInfo(this.userService.platformId, this.userService.platform.token).then(info => {
          this.SET_VIEWER_COUNT(info.viewers);
        });
      }
    }, VIEWER_COUNT_UPDATE_INTERVAL);
  }


  refreshStreamInfo() {
    if (!this.userService.isLoggedIn()) return;

    this.SET_ERROR(false);
    this.SET_FETCHING(true);

    const promises: Promise<any>[] = [];

    const platform = getPlatformService(this.userService.platform.type);
    promises.push(platform.fetchChannelInfo(this.userService.platform.token).then(info => {
      this.SET_CHANNEL_INFO(info);
    }));

    if (this.userService.platform.type === 'twitch') {
      promises.push(platform.getStreamCommunities(this.userService.platformId).then(communities => {
        this.SET_COMMUNITIES(communities.map(community => {
          return { name: community.name, objectID: community._id };
        }));
      }));
    }

    return Promise.all(promises).then(() => {
      this.SET_FETCHING(false);
    }).catch(() => {
      this.SET_FETCHING(false);
      this.SET_ERROR(true);
    });
  }


  setStreamInfo(title: string, game: string): Promise<boolean> {
    const platform = getPlatformService(this.userService.platform.type);

    return platform.putStreamInfo(
      title,
      game,
      this.userService.platformId,
      this.userService.platform.token
    ).then(success => {
      this.refreshStreamInfo();
      return success;
    }).catch(() => {
      this.refreshStreamInfo();
      return false;
    });
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
  SET_COMMUNITIES(communities: Community[]) {
    this.state.communities = communities;
  }

  @mutation()
  SET_VIEWER_COUNT(viewers: number) {
    this.state.viewerCount = viewers;
  }

}
