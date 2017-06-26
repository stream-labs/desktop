import Vue from 'vue';
import URI from 'urijs';
import { PersistentStatefulService } from './persistent-stateful-service';
import { Inject } from './service';
import { mutation } from './stateful-service';
import electron from '../vendor/electron';
import { HostsService } from './hosts';

// Eventually we will support authing multiple platforms at once
interface IUserServiceState {
  auth?: IPlatformAuth;
}

interface IPlatformAuth {
  widgetToken: string;
  platform: {
    type: TPlatform;
    username: string;
    token: string;
    id: string;
  };
}

export type TPlatform = 'twitch' | 'youtube';

export class UserService extends PersistentStatefulService<IUserServiceState> {

  @Inject()
  hostsService: HostsService;

  @mutation
  LOGIN(auth: IPlatformAuth) {
    Vue.set(this.state, 'auth', auth);
  }


  @mutation
  LOGOUT() {
    Vue.delete(this.state, 'auth');
  }


  init() {
    super.init();

    // TODO: Verify that the user is still logged in (token is still valid)
  }


  isLoggedIn() {
    return !!(this.state.auth && this.state.auth.widgetToken);
  }


  get widgetToken() {
    if (this.isLoggedIn()) {
      return this.state.auth.widgetToken;
    }
  }


  get platform() {
    if (this.isLoggedIn()) {
      return this.state.auth.platform;
    }
  }


  get username() {
    if (this.isLoggedIn()) {
      return this.state.auth.platform.username;
    }
  }


  logOut() {
    this.LOGOUT();
  }


  // Starts the authentication process.  Returns a promise
  // that is resolved when the window was successfully popped
  // up.  Note that the promise is not resolved when the auth
  // is actually successful.
  startAuth(platform: TPlatform) {
    return new Promise((resolve, reject) => {
      const authWindow = new electron.remote.BrowserWindow({
        ...this.windowSizeForPlatform(platform),
        alwaysOnTop: true,
        show: false,
        webPreferences: {
          nodeIntegration: false
        }
      });

      authWindow.webContents.on('did-navigate', (e, url) => {
        const parsed = this.parseAuthFromUrl(url);

        if (parsed) {
          authWindow.close();
          this.LOGIN(parsed);
        }
      });

      authWindow.once('ready-to-show', () => {
        authWindow.show();
        resolve();
      });

      authWindow.setMenu(null);
      authWindow.loadURL(this.authUrl(platform));
    });
  }


  private windowSizeForPlatform(platform: TPlatform) {
    return {
      twitch: {
        width: 600,
        height: 800
      },
      youtube: {
        width: 1000,
        height: 600
      }
    }[platform];
  }


  private authUrl(platform: TPlatform) {
    const host = this.hostsService.streamlabs;
    return `https://${host}/login?_=${Date.now()}&skip_splash=true&external=electron&${platform}&force_verify`;
  }


  // Parses tokens out of the auth URL
  private parseAuthFromUrl(url: string) {
    const query = URI.parseQuery(URI.parse(url).query);

    if (query.token && query.platform_username && query.platform_token && query.platform_id) {
      return {
        widgetToken: query.token,
        platform: {
          type: query.platform,
          username: query.platform_username,
          token: query.platform_token,
          id: query.platform_id
        }
      } as IPlatformAuth;
    }

    return false;
  }

}

// You can use this decorator to ensure the user is logged in
// before proceeding
export function requiresLogin() {
  return (target: any, methodName: string, descriptor: PropertyDescriptor) => {
    const original = descriptor.value;

    return {
      ...descriptor,
      value(...args: any[]) {
        // TODO: Redirect to login if not logged in?
        if (UserService.instance.isLoggedIn()) return original.apply(target, args);
      }
    };
  };
}
