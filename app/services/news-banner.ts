import { StatefulService, mutation } from './stateful-service';
import { UserService } from './user';
import { HostsService } from './hosts';
import { Inject } from '../util/injector';
import { authorizedHeaders } from '../util/requests';

interface INewsBannerInfo {
  id: number;
  header: string;
  sub_header: string;
  link: string;
  link_title: string;
  thumbnail: string;
}

export class NewsBannerService extends StatefulService<INewsBannerInfo> {
  @Inject() private hostsService: HostsService;
  @Inject() private userService: UserService;

  static initialState: INewsBannerInfo = {
    id: null,
    header: null,
    sub_header: null,
    link: null,
    link_title: null,
    thumbnail: null
  };

  async updateBanner() {
    const newBanner = await this.fetchBanner();
    this.SET_BANNER(newBanner);
  }

  bannerExists() {
    return this.state.id !== null;
  }

  closeBanner() {
    this.postBannerClose();
  }

  private async fetchBanner() {
    const endpoint = `api/slobs/announcements/get?=clientId=${this.userService.getLocalUserId()}`
    const req = this.formRequest(endpoint);
    try {
      return await fetch(req).then((rawResp) => rawResp.json());
    } catch (e) {
      return this.state;
    }
  }

  private async postBannerClose() {
    const endpoint = 'api/v5/slobs/announcement/close';
    const postData = { body: { clientId: this.userService.getLocalUserId(), announcementId: this.state.id } }
    const req = this.formRequest(endpoint, postData);
    try {
      await fetch(req);
      this.CLEAR_BANNER();
    } catch (e) {

    }
  }

  private formRequest(endpoint: string, options?: any) {
    const host = this.hostsService.streamlabs;
    const headers = authorizedHeaders(this.userService.apiToken);
    const url = `https://${host}/${endpoint}`;
    return new Request(url, { ...options, headers });
  }

  @mutation()
  SET_BANNER(banner: INewsBannerInfo) {
    this.state = banner;
  }

  @mutation()
  CLEAR_BANNER() {
    this.state = NewsBannerService.initialState;
  }
}
