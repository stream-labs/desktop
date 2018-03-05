import { StatefulService, mutation } from './stateful-service';
import { IChannelInfo, getPlatformService } from './platforms';
import { UserService } from './user';
import { Inject } from '../util/injector';
import { StreamingService } from '../services/streaming';
import { TwitchService } from 'services/platforms/twitch';
import { YoutubeService } from 'services/platforms/youtube';


interface IStreamInfoServiceState {
  fetching: boolean;
  error: boolean;
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

  static initialState: IStreamInfoServiceState = {
    fetching: false,
    error: false,
    viewerCount: 0,
    channelInfo: null
  };


  viewerCountInterval: number;


  init() {
    this.refreshStreamInfo();

    this.viewerCountInterval = window.setInterval(() => {
      if (this.streamingService.isStreaming) {
        const platform = getPlatformService(this.userService.platform.type);

        platform.fetchViewerCount().then(viewers => {
          this.SET_VIEWER_COUNT(viewers);
        });
      }
    }, VIEWER_COUNT_UPDATE_INTERVAL);
  }


  refreshStreamInfo(): Promise<void> {
    if (!this.userService.isLoggedIn()) return Promise.reject(null);

    this.SET_ERROR(false);
    this.SET_FETCHING(true);

    const platform = getPlatformService(this.userService.platform.type);
    return platform.fetchChannelInfo().then(info => {
      this.SET_CHANNEL_INFO(info);
      this.SET_FETCHING(false);
    }).catch(() => {
      this.SET_FETCHING(false);
      this.SET_ERROR(true);
    });
  }


  setStreamInfo(title: string, description: string, game: string): Promise<boolean> {
    const platform = getPlatformService(this.userService.platform.type);

    if (platform instanceof TwitchService) {
      return platform.putChannelInfo(title, game).then(success => {
        this.refreshStreamInfo();
        return success;
      }).catch(() => {
        this.refreshStreamInfo();
        return false;
      });
    }

    if (platform instanceof YoutubeService) {
      return platform.putChannelInfo(title, description).then(success => {
        this.refreshStreamInfo();
        return success;
      }).catch(() => {
        this.refreshStreamInfo();
        return false;
      });
    }
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
