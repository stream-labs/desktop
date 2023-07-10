import { PersistentStatefulService, mutation, InitAfter, ViewHandler } from 'services/core/index';
import { UserService } from './user';
import { HostsService } from './hosts';
import { Inject, Service } from 'services';
import { AppService } from 'services/app';
import { authorizedHeaders, jfetch } from '../util/requests';
import path from 'path';
import fs from 'fs';
import { I18nService, $t } from 'services/i18n';
import {
  NotificationsService,
  ENotificationType,
  ENotificationSubType,
} from 'services/notifications';
import { CustomizationService } from './customization';
import { JsonrpcService } from 'services/api/jsonrpc/jsonrpc';
import { WindowsService } from 'services/windows';

export interface IAnnouncementsInfo {
  id: number;
  header: string;
  subHeader: string;
  linkTitle: string;
  thumbnail: string;
  link: string;
  linkTarget: 'external' | 'slobs';
  type: 0 | 1;
  params?: { [key: string]: string };
  closeOnLink?: boolean;
}

interface IAnnouncementsServiceState {
  news: IAnnouncementsInfo[];
  banner: IAnnouncementsInfo;
  lastReadId: number;
}

class AnnouncementsServiceViews extends ViewHandler<IAnnouncementsServiceState> {
  get banner() {
    return this.state.banner;
  }
}

@InitAfter('UserService')
export class AnnouncementsService extends PersistentStatefulService<IAnnouncementsServiceState> {
  @Inject() private hostsService: HostsService;
  @Inject() private userService: UserService;
  @Inject() private appService: AppService;
  @Inject() private i18nService: I18nService;
  @Inject() private customizationService: CustomizationService;
  @Inject() private notificationsService: NotificationsService;
  @Inject() private jsonrpcService: JsonrpcService;
  @Inject() private windowsService: WindowsService;

  static defaultState: IAnnouncementsServiceState = {
    news: [],
    lastReadId: 145,
    banner: null,
  };

  static filter(state: IAnnouncementsServiceState) {
    return { ...state, news: [] as IAnnouncementsInfo[], banner: null as IAnnouncementsInfo };
  }

  init() {
    super.init();
    this.userService.userLogin.subscribe(() => {
      this.fetchLatestNews();
      this.getBanner();
    });
  }

  get views() {
    return new AnnouncementsServiceViews(this.state);
  }

  get newsExist() {
    return this.state.news.length > 0;
  }

  async getNews() {
    if (this.newsExist) return;
    this.SET_NEWS(await this.fetchNews());
  }

  async getBanner() {
    this.SET_BANNER(await this.fetchBanner());
  }

  seenNews() {
    if (!this.newsExist) return;
    this.SET_LATEST_READ(this.state.news[0].id);
  }

  private get installDateProxyFilePath() {
    return path.join(this.appService.appDataDirectory, 'app.log');
  }

  private async fileExists(path: string): Promise<boolean> {
    return new Promise<boolean>(resolve => {
      fs.exists(path, exists => {
        resolve(exists);
      });
    });
  }

  private async getInstallDateTimestamp(): Promise<number> {
    const exists = await this.fileExists(this.installDateProxyFilePath);

    if (!exists) {
      return Promise.resolve(Date.now());
    }

    return new Promise<number>(resolve => {
      fs.stat(this.installDateProxyFilePath, (err, stats) => {
        if (err) {
          resolve(Date.now());
        }

        resolve(stats.birthtimeMs);
      });
    });
  }

  private async recentlyInstalled() {
    const installationTimestamp = await this.getInstallDateTimestamp();
    return Date.now() - installationTimestamp < 1000 * 60 * 60 * 24 * 7;
  }

  private async fetchLatestNews() {
    const recentlyInstalled = await this.recentlyInstalled();

    if (recentlyInstalled || !this.customizationService.state.enableAnnouncements) {
      return;
    }

    const req = this.formRequest(
      `api/v5/slobs/announcements/status?clientId=${this.userService.getLocalUserId()}&lastAnnouncementId=${
        this.state.lastReadId
      }`,
    );
    const resp = await jfetch<{
      newUnreadAnnouncements: boolean;
      newUnreadAnnouncement?: IAnnouncementsInfo;
    }>(req);

    if (resp.newUnreadAnnouncements) {
      this.notificationsService.push({
        message: resp.newUnreadAnnouncement.header,
        type: ENotificationType.SUCCESS,
        subType: ENotificationSubType.NEWS,
        playSound: false,
        lifeTime: -1,
        action: this.jsonrpcService.createRequest(Service.getResourceId(this), 'openNewsWindow'),
      });
    }
  }

  private async fetchNews() {
    const endpoint = `api/v5/slobs/announcements/get?clientId=${this.userService.getLocalUserId()}&locale=${
      this.i18nService.state.locale
    }`;
    const req = this.formRequest(endpoint);
    try {
      const newState = await jfetch<IAnnouncementsInfo[]>(req);

      // splits out params for local links eg PlatformAppStore?appId=<app-id>
      newState.forEach(item => {
        const queryString = item.link.split('?')[1];
        if (item.linkTarget === 'slobs' && queryString) {
          item.link = item.link.split('?')[0];
          item.params = {};
          queryString.split(',').forEach((query: string) => {
            const [key, value] = query.split('=');
            item.params[key] = value;
          });
        }
      });

      return newState[0].id ? newState : this.state.news;
    } catch (e: unknown) {
      return this.state.news;
    }
  }

  private async fetchBanner() {
    const recentlyInstalled = await this.recentlyInstalled();

    if (recentlyInstalled || !this.customizationService.state.enableAnnouncements) {
      return null;
    }

    const endpoint = `api/v5/slobs/announcement/get?clientId=${this.userService.getLocalUserId()}&locale=${
      this.i18nService.state.locale
    }`;
    const req = this.formRequest(endpoint);

    try {
      const newState = await jfetch<IAnnouncementsInfo>(req);
      return newState.id ? newState : null;
    } catch (e: unknown) {
      return null;
    }
  }

  async closeBanner(clickType: 'action' | 'dismissal') {
    const endpoint = 'api/v5/slobs/announcement/close';
    const req = this.formRequest(endpoint, {
      method: 'POST',
      headers: new Headers({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        clientId: this.userService.getLocalUserId(),
        announcementId: this.state.banner.id,
        clickType,
      }),
    });

    try {
      await jfetch(req);
    } finally {
      this.SET_BANNER(null);
    }
  }

  private formRequest(endpoint: string, options: any = {}) {
    const host = this.hostsService.streamlabs;
    const headers = authorizedHeaders(this.userService.apiToken, options.headers);
    const url = `https://${host}/${endpoint}`;
    return new Request(url, { ...options, headers });
  }

  openNewsWindow() {
    this.windowsService.showWindow({
      componentName: 'NotificationsAndNews',
      title: $t('Notifications & News'),
      size: {
        width: 500,
        height: 600,
      },
    });
  }

  @mutation()
  SET_NEWS(news: IAnnouncementsInfo[]) {
    this.state.news = news;
  }

  @mutation()
  CLEAR_NEWS() {
    this.state = AnnouncementsService.defaultState;
  }

  @mutation()
  SET_BANNER(banner: IAnnouncementsInfo | null) {
    this.state.banner = banner;
  }

  @mutation()
  SET_LATEST_READ(id: number) {
    this.state.lastReadId = id;
  }
}
