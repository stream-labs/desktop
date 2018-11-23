import { StatefulService, mutation } from './stateful-service';
import { UserService } from './user';
import { HostsService } from './hosts';
import { Inject } from '../util/injector';
import { authorizedHeaders } from '../util/requests';
import { TAppPage } from './navigation';

interface IAnnouncementsInfo {
  id: number;
  header: string;
  subHeader: string;
  linkTitle: string;
  thumbnail: string;
  link: string;
  link_target: 'external' | 'slobs';
}

export class AnnouncementsService extends StatefulService<IAnnouncementsInfo> {
  @Inject() private hostsService: HostsService;
  @Inject() private userService: UserService;

  static initialState: IAnnouncementsInfo = {
    id: null,
    header: '',
    subHeader: null,
    link: null,
    linkTitle: null,
    thumbnail: null,
    link_target: null,
  };

  async updateBanner() {
    const newBanner = await this.fetchBanner();
    this.SET_BANNER(newBanner);
  }

  bannerExists() {
    return this.state.id !== null;
  }

  async closeBanner() {
    await this.postBannerClose();
  }

  private async fetchBanner() {
    const endpoint = `api/v5/slobs/announcement/get?clientId=${this.userService.getLocalUserId()}`;
    const req = this.formRequest(endpoint);
    try {
      const newState = await fetch(req).then(rawResp => rawResp.json());
      return newState.id ? newState : this.state;
    } catch (e) {
      return this.state;
    }
  }

  private async postBannerClose() {
    const endpoint = 'api/v5/slobs/announcement/close';
    const postData = {
      method: 'POST',
      body: JSON.stringify({
        clientId: this.userService.getLocalUserId(),
        announcementId: this.state.id,
      }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    };
    const req = this.formRequest(endpoint, postData);
    try {
      await fetch(req);
      this.CLEAR_BANNER();
    } catch (e) {}
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
