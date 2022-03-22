import { StatefulService, mutation } from './core/stateful-service';
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

export class AnnouncementsService extends StatefulService<IAnnouncementsInfo[]> {
  @Inject() private hostsService: HostsService;
  @Inject() private userService: UserService;
  @Inject() private appService: AppService;
  @Inject() private patchNotesService: PatchNotesService;
  @Inject() private i18nService: I18nService;
  @Inject() private customizationService: CustomizationService;
  @Inject() private notificationsService: NotificationsService;
  @Inject() private jsonrpcService: JsonrpcService;
  @Inject() private windowsService: WindowsService;

  static initialState: IAnnouncementsInfo[] = [];

  async updateBanner() {
    this.SET_BANNER(await this.fetchNews());
    if (this.bannerExists) {
      this.notificationsService.push({
        message: this.state[0].header,
        type: ENotificationType.SUCCESS,
        playSound: false,
        action: this.jsonrpcService.createRequest(Service.getResourceId(this), 'openNewsWindow'),
      });
    }
  }

  get bannerExists() {
    return this.state.length > 0;
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

  private async fetchNews() {
    const recentlyInstalled = await this.recentlyInstalled();

    if (
      !this.userService.isLoggedIn ||
      recentlyInstalled ||
      this.recentlyUpdatedTo017 ||
      !this.customizationService.state.enableAnnouncements
    ) {
      return this.state;
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

      return newState[0].id ? newState : this.state;
    } catch (e: unknown) {
      return this.state;
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
    this.state = banners;
  }

  @mutation()
  CLEAR_BANNER() {
    this.state = AnnouncementsService.initialState;
  }
}
