import { Service } from './core/service';
import Util from 'services/utils';

// Hands out hostnames to the rest of the app. Eventually
// we should allow overriding this value. But for now we
// are just keeping the value in one place.
export class HostsService extends Service {
  useDevServer: boolean = !!process.env.DEV_SERVER;
  replaceHost(url: string) {
    if (this.useDevServer) {
      if (url.startsWith(this.niconicoAccount)) {
        return url.replace(this.niconicoAccount, 'http://localhost:8080/account');
      }
      if (url.startsWith(this.niconicoOAuth)) {
        return url.replace(this.niconicoOAuth, 'http://localhost:8080/oauth');
      }
      return url;
    } else {
      return url;
    }
  }
  get niconicoAccount() {
    return 'https://account.nicovideo.jp';
  }
  get niconicoOAuth() {
    return 'https://oauth.nicovideo.jp';
  }
  get niconicoFlapi() {
    return 'http://flapi.nicovideo.jp/api';
  }
  get niconicolive() {
    return 'http://live.nicovideo.jp';
  }
  get nAirLogin() {
    if (process.env.NAIR_LOGIN_URL) {
      return process.env.NAIR_LOGIN_URL;
    }

    const scopes = ['openid', 'profile', 'user.premium'];

    const url = new URL('https://n-air-app.nicovideo.jp/authorize');
    url.searchParams.set('scope', scopes.join(' '));
    return url.toString();
  }
  get niconicoNAirInformationsFeed() {
    return 'https://blog.nicovideo.jp/niconews/category/se_n-air/feed/index.xml';
  }
}
