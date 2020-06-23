import { Inject, mutation, StatefulService } from '../core';
import { IPlatformState, TPlatform } from './index';
import { StreamingService } from '../streaming';
import { authorizedHeaders, handleResponse } from '../../util/requests';
import { UserService } from '../user';
import { HostsService } from '../hosts';

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
    isPrepopulated: false,
  };

  @Inject() protected streamingService: StreamingService;
  @Inject() protected userService: UserService;
  @Inject() protected hostsService: HostsService;
  abstract readonly platform: TPlatform;
  protected abstract readonly unlinkUrl: string;

  protected fetchViewerCount(): Promise<number> {
    return Promise.reject('not implemented');
  }

  get mergeUrl() {
    const host = this.hostsService.streamlabs;
    const token = this.userService.apiToken;
    return `https://${host}/slobs/merge/${token}/${this.platform}_account`;
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

  @mutation()
  protected SET_PREPOPULATED(isPrepopulated: boolean) {
    this.state.isPrepopulated = isPrepopulated;
  }
}
