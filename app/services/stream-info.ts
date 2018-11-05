import { StatefulService, mutation } from 'services/stateful-service';
import { getPlatformService } from 'services/platforms';
import { UserService } from './user';
import { Inject } from 'util/injector';
import { StreamingService } from '../services/streaming';
import { HostsService } from 'services/hosts';
import { NiconicoService } from './platforms/niconico';


interface IStreamInfoServiceState {
  viewerCount: number;
  commentCount: number;
}

const PLATFORM_STATUS_UPDATE_INTERVAL = 60 * 1000;
const SENTRY_REPORTING_RATIO = 0.10;

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
    viewerCount: 0,
    commentCount: 0,
  };

  platformStatusInterval: number;


  init() {
    this.platformStatusInterval = window.setInterval(() => {
      if (this.streamingService.isStreaming && this.userService.isLoggedIn()) {
        const platform = getPlatformService(this.userService.platform.type);

        platform.fetchViewerCount().then(viewers => {
          this.SET_VIEWER_COUNT(viewers);
        }, e => {
          // Sentryに送信する量を間引く
          if (Math.random() < SENTRY_REPORTING_RATIO) {
            console.error(e);
          }
        });

        if (platform instanceof NiconicoService) {
          platform.fetchCommentCount().then(comments => {
            this.SET_COMMENT_COUNT(comments);
          }, e => {
            // Sentryに送信する量を間引く
            if (Math.random() < SENTRY_REPORTING_RATIO) {
              console.error(e);
            }
          });
        }
      }
    }, PLATFORM_STATUS_UPDATE_INTERVAL);
  }

  @mutation()
  SET_VIEWER_COUNT(viewers: number) {
    this.state.viewerCount = viewers;
  }

  @mutation()
  SET_COMMENT_COUNT(comments: number) {
    this.state.commentCount = comments;
  }
}
