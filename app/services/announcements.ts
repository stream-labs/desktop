import { PersistentStatefulService, mutation, InitAfter } from 'services/core/index';
import { UserService } from './user';
import { HostsService } from './hosts';
import { Inject, Service } from 'services';
import { AppService } from 'services/app';
import { authorizedHeaders, jfetch } from '../util/requests';
import path from 'path';
import fs from 'fs';
import { PatchNotesService } from 'services/patch-notes';
import { I18nService, $t } from 'services/i18n';
import { NotificationsService, ENotificationType } from 'services/notifications';
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
  params?: { [key: string]: string };
  closeOnLink?: boolean;
}

@InitAfter('UserService')
export class AnnouncementsService extends PersistentStatefulService<{
  news: IAnnouncementsInfo[];
  lastReadId: number;
}> {
  @Inject() private hostsService: HostsService;
  @Inject() private userService: UserService;
  @Inject() private appService: AppService;
  @Inject() private patchNotesService: PatchNotesService;
  @Inject() private i18nService: I18nService;
  @Inject() private customizationService: CustomizationService;
  @Inject() private notificationsService: NotificationsService;
  @Inject() private jsonrpcService: JsonrpcService;
  @Inject() private windowsService: WindowsService;

  static defaultState: { news: IAnnouncementsInfo[]; lastReadId: number } = {
    news: [],
    lastReadId: 145,
  };

  static filter(state: { news: IAnnouncementsInfo[]; lastReadId: number }) {
    return { ...state, news: [] as IAnnouncementsInfo[] };
  }

  init() {
    super.init();
    this.userService.userLogin.subscribe(() => this.fetchLatestNews());
  }

  get bannersExist() {
    return this.state.news.length > 0;
  }

  async getNews() {
    if (this.bannersExist) return;
    this.SET_BANNER(await this.fetchNews());
  }

  seenNews() {
    if (!this.bannersExist) return;
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

  private get recentlyUpdatedTo017() {
    const lastUpdatedVersion = this.patchNotesService.state.lastVersionSeen;

    if (!lastUpdatedVersion) return false;

    const minorVersionRegex = /^(\d+\.\d+)\.\d+$/;
    const minorVersion = lastUpdatedVersion.match(minorVersionRegex);

    if (!minorVersion || !minorVersion[1]) return false;
    if (minorVersion[1] !== '0.17') return false;
    if (!this.patchNotesService.state.updateTimestamp) return false;

    const twoDaysAgo = Date.now() - 2 * 24 * 60 * 60 * 1000;

    return Date.parse(this.patchNotesService.state.updateTimestamp) > twoDaysAgo;
  }

  private async fetchLatestNews() {
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
        playSound: false,
        lifeTime: -1,
        action: this.jsonrpcService.createRequest(Service.getResourceId(this), 'openNewsWindow'),
      });
    }
  }

  private async fetchNews() {
    const recentlyInstalled = await this.recentlyInstalled();

    if (
      !this.userService.isLoggedIn ||
      recentlyInstalled ||
      this.recentlyUpdatedTo017 ||
      !this.customizationService.state.enableAnnouncements
    ) {
      return this.state.news;
    }
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

  private formRequest(endpoint: string, options: any = {}) {
    const host = this.hostsService.streamlabs;
    const headers = authorizedHeaders(this.userService.apiToken, options.headers);
    const url = `https://${host}/${endpoint}`;
    return new Request(url, { ...options, headers });
  }

  openNewsWindow() {
    this.windowsService.showWindow({
      componentName: 'News',
      title: $t('News'),
      size: {
        width: 500,
        height: 600,
      },
    });
  }

  @mutation()
  SET_BANNER(banners: IAnnouncementsInfo[]) {
    this.state.news = banners;
  }

  @mutation()
  CLEAR_BANNER() {
    this.state = AnnouncementsService.initialState;
  }

  @mutation()
  SET_LATEST_READ(id: number) {
    this.state.lastReadId = id;
  }
}
