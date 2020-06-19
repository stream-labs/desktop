import { Inject, mutation, StatefulService } from '../core';
import {
  IPlatformService,
  IPlatformState,
  TPlatformCapability,
  TPlatformCapabilityMap,
} from './index';
import { StreamingService } from '../streaming';
import { authorizedHeaders, handleResponse } from '../../util/requests';
import { UserService } from '../user';

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
  @Inject() protected userService: UserService;

  protected abstract readonly capabilities: Set<TPlatformCapability>;
  protected abstract readonly unlinkUrl: string;

  protected fetchViewerCount(): Promise<number> {
    return Promise.reject('not implemented');
  }

  supports<T extends TPlatformCapability>(
    capability: T,
  ): this is TPlatformCapabilityMap[T] & IPlatformService {
    return this.capabilities.has(capability);
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

  /**
   * unlink platform and reload auth state
   */
  unlink() {
    const headers = authorizedHeaders(this.userService.apiToken!);
    const request = new Request(this.unlinkUrl, { headers });
    return fetch(request)
      .then(handleResponse)
      .then(_ => this.userService.updateLinkedPlatforms());
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
