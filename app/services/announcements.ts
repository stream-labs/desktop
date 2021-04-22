import { StatefulService, mutation } from './core/stateful-service';
import { UserService } from './user';
import { HostsService } from './hosts';
import { AppService } from 'services/app';
import { Inject } from './core/injector';
import { authorizedHeaders, jfetch } from '../util/requests';
import path from 'path';
import fs from 'fs';
import { PatchNotesService } from 'services/patch-notes';
import { I18nService } from 'services/i18n';

interface IAnnouncementsInfo {
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

export class AnnouncementsService extends StatefulService<IAnnouncementsInfo> {
  @Inject() private hostsService: HostsService;
  @Inject() private userService: UserService;
  @Inject() private appService: AppService;
  @Inject() private patchNotesService: PatchNotesService;
  @Inject() private i18nService: I18nService;

  static initialState: IAnnouncementsInfo = {
    id: null,
    header: '',
    subHeader: null,
    link: null,
    linkTitle: null,
    thumbnail: null,
    linkTarget: null,
    params: null,
    closeOnLink: false,
  };

  async updateBanner() {
    const newBanner = await this.fetchBanner();
    this.SET_BANNER(newBanner);
  }

  get bannerExists() {
    return this.state.id !== null;
  }

  async closeBanner(clickType: 'action' | 'dismissal') {
    await this.postBannerClose(clickType);
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

  private async fetchBanner() {
    const recentlyInstalled = await this.recentlyInstalled();

    if (!this.userService.isLoggedIn || recentlyInstalled || this.recentlyUpdatedTo017) {
      return this.state;
    }
    const endpoint = `api/v5/slobs/announcement/get?clientId=${this.userService.getLocalUserId()}&locale=${
      this.i18nService.state.locale
    }`;
    const req = this.formRequest(endpoint);
    try {
      const newState = await jfetch<IAnnouncementsInfo>(req);

      // splits out params for local links eg PlatformAppStore?appId=<app-id>
      const queryString = newState.link.split('?')[1];
      if (newState.linkTarget === 'slobs' && queryString) {
        newState.link = newState.link.split('?')[0];
        newState.params = {};
        queryString.split(',').forEach((query: string) => {
          const [key, value] = query.split('=');
          newState.params[key] = value;
        });
      }

      return newState.id ? newState : this.state;
    } catch (e: unknown) {
      return this.state;
    }
  }

  private async postBannerClose(clickType: 'action' | 'dismissal') {
    const endpoint = 'api/v5/slobs/announcement/close';
    const postData = {
      method: 'POST',
      body: JSON.stringify({
        clickType,
        clientId: this.userService.getLocalUserId(),
        announcementId: this.state.id,
      }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    };
    const req = this.formRequest(endpoint, postData);
    try {
      await fetch(req);
      this.CLEAR_BANNER();
    } catch (e: unknown) {}
  }

  private formRequest(endpoint: string, options: any = {}) {
    const host = this.hostsService.streamlabs;
    const headers = authorizedHeaders(this.userService.apiToken, options.headers);
    const url = `https://${host}/${endpoint}`;
    return new Request(url, { ...options, headers });
  }

  @mutation()
  SET_BANNER(banner: IAnnouncementsInfo) {
    this.state = banner;
  }

  @mutation()
  CLEAR_BANNER() {
    this.state = AnnouncementsService.initialState;
  }
}
