import { Inject, mutation, StatefulService } from '../core';
import { IPlatformState } from './index';
import { StreamingService } from '../streaming';

const VIEWER_COUNT_UPDATE_INTERVAL = 60 * 1000;

/**
 * Base class for platforms
 * Keeps shared code for all platforms
 */
export abstract class BasePlatformService<T extends IPlatformState> extends StatefulService<T> {
  static initialState: IPlatformState = {
    streamKey: '',
    streamPageUrl: '',
    viewersCount: 0,
    chatUrl: '',
    settings: null,
  };

  @Inject() protected streamingService: StreamingService;

  protected fetchViewerCount(): Promise<number> {
    return Promise.reject('not implemented');
  }

  async afterGoLive(): Promise<void> {
    // update viewers count
    const runInterval = async () => {
      this.SET_VIEWERS_COUNT(await this.fetchViewerCount());
      // stop updating if streaming has stopped
      if (this.streamingService.views.isMidStreamMode) {
        setTimeout(runInterval, VIEWER_COUNT_UPDATE_INTERVAL);
      }
    };
    await runInterval();
  }

  @mutation()
  protected SET_VIEWERS_COUNT(viewers: number) {
    this.state.viewersCount = viewers;
  }

  @mutation()
  protected SET_STREAM_KEY(key: string) {
    this.state.streamKey = key;
  }

  @mutation()
  protected SET_STREAM_PAGE_URL(url: string) {
    this.state.streamPageUrl = url;
  }

  @mutation()
  protected SET_CHAT_URL(url: string) {
    this.state.chatUrl = url;
  }
}
