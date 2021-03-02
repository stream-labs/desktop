import URI from 'urijs';
import { PersistentStatefulService } from 'services/core/persistent-stateful-service';
import { Inject } from 'services/core/injector';
import { handleResponse, authorizedHeaders, jfetch } from 'util/requests';
import { mutation } from 'services/core/stateful-service';
import { Service } from 'services/core';
import electron from 'electron';
import { HostsService } from 'services/hosts';
import Util from 'services/utils';
import { UserService } from 'services/user';
import { $t, I18nService } from 'services/i18n';
import uuid from 'uuid/v4';
import { createStreamError, throwStreamError } from '../streaming/stream-error';

interface ITwitterServiceState {
  linked: boolean;
  prime: boolean;
  creatorSiteOnboardingComplete: boolean;
  creatorSiteUrl: string;
  screenName: string;
  tweetWhenGoingLive: boolean;
}

interface ITwitterStatusResponse {
  linked: boolean;
  prime: boolean;
  cs_onboarding_complete: boolean;
  cs_url: string;
  screen_name: string;
}

export class TwitterService extends PersistentStatefulService<ITwitterServiceState> {
  @Inject() private hostsService: HostsService;
  @Inject() private userService: UserService;
  @Inject() i18nService: I18nService;

  authWindowOpen = false;

  static defaultState: ITwitterServiceState = {
    linked: false,
    prime: false,
    creatorSiteOnboardingComplete: false,
    creatorSiteUrl: '',
    screenName: '',
    tweetWhenGoingLive: true,
  };

  init() {
    super.init();
    this.userService.userLogout.subscribe(() => this.RESET_TWITTER_STATUS());
  }

  @mutation()
  SET_TWITTER_STATUS(status: ITwitterStatusResponse) {
    this.state.linked = status.linked;
    this.state.prime = status.prime;
    this.state.creatorSiteOnboardingComplete = status.cs_onboarding_complete;
    this.state.creatorSiteUrl = status.cs_url;
    this.state.screenName = status.screen_name;
  }

  @mutation()
  SET_TWEET_PREFERENCE(preference: boolean) {
    this.state.tweetWhenGoingLive = preference;
  }

  @mutation()
  RESET_TWITTER_STATUS() {
    this.state.linked = false;
    this.state.prime = false;
    this.state.creatorSiteOnboardingComplete = false;
    this.state.creatorSiteUrl = '';
    this.state.screenName = '';
    this.state.tweetWhenGoingLive = true;
  }

  setTweetPreference(preference: boolean) {
    this.SET_TWEET_PREFERENCE(preference);
  }

  private linkTwitterUrl() {
    const token = this.userService.apiToken;
    const locale = this.i18nService.state.locale;

    return `https://${this.hostsService.streamlabs}/slobs/twitter/link?oauth_token=${token}&l=${locale}`;
  }

  async getTwitterStatus() {
    const response = await this.fetchTwitterStatus();
    if (response) this.SET_TWITTER_STATUS(response);
  }

  async unlinkTwitter() {
    const host = this.hostsService.streamlabs;
    const url = `https://${host}/api/v5/slobs/twitter/unlink`;
    const headers = authorizedHeaders(this.userService.apiToken);
    const request = new Request(url, { headers });
    return jfetch(request).catch(() => {
      console.warn('Error unlinking Twitter');
    });
  }

  async fetchTwitterStatus() {
    const host = this.hostsService.streamlabs;
    const url = `https://${host}/api/v5/slobs/twitter/status`;
    const headers = authorizedHeaders(this.userService.apiToken);
    const request = new Request(url, { headers });
    return jfetch<ITwitterStatusResponse>(request).catch(() => {
      console.warn('Error fetching Twitter status');
    });
  }

  async postTweet(tweet: string) {
    const host = this.hostsService.streamlabs;
    const url = `https://${host}/api/v5/slobs/twitter/tweet`;
    const headers = authorizedHeaders(this.userService.apiToken);
    headers.append('Content-Type', 'application/json');
    const request = new Request(url, {
      headers,
      method: 'POST',
      body: JSON.stringify({ tweet }),
    });
    return jfetch(request).catch(e =>
      throwStreamError('TWEET_FAILED', e.error || $t('Could not connect to Twitter')),
    );
  }

  openLinkTwitterDialog() {
    if (this.authWindowOpen) return;

    this.authWindowOpen = true;
    const partition = `persist:${uuid()}`;

    const twitterWindow = new electron.remote.BrowserWindow({
      width: 600,
      height: 800,
      alwaysOnTop: false,
      show: false,
      webPreferences: {
        partition,
        nodeIntegration: false,
        nativeWindowOpen: true,
        sandbox: true,
      },
    });

    twitterWindow.once('ready-to-show', () => {
      twitterWindow.show();
    });

    twitterWindow.once('close', () => {
      this.authWindowOpen = false;
    });

    twitterWindow.webContents.on('did-navigate', async (e, url) => {
      const parsed = this.parseTwitterResultFromUrl(url);

      if (parsed) {
        twitterWindow.close();
        this.getTwitterStatus();
      }
    });

    twitterWindow.setMenu(null);
    twitterWindow.loadURL(this.linkTwitterUrl());
  }

  /**
   * Parses tokens out of the twitter URL
   */
  private parseTwitterResultFromUrl(url: string) {
    const query = URI.parseQuery(URI.parse(url).query) as Dictionary<string>;
    if (query.twitter) {
      return { success: !!query.success };
    }

    return false;
  }
}
