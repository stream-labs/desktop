import { Service } from 'services/core/service';
import electron from 'electron';
import url from 'url';
import { Inject } from 'services/core/injector';
import { NavigationService } from 'services/navigation';
import { PlatformAppsService } from 'services/platform-apps';
import { PlatformAppStoreService } from 'services/platform-app-store';
import { UserService } from 'services/user';
import { SettingsService } from './settings';
import { byOS, OS } from 'util/operating-systems';

function protocolHandler(base: string) {
  return (target: any, methodName: string, descriptor: PropertyDescriptor) => {
    target.handlers = target.handlers || {};
    target.handlers[base] = methodName;
    return descriptor;
  };
}

/**
 * Describes a protocol link that was clicked
 */
interface IProtocolLinkInfo {
  base: string;
  path: string;
  query: URLSearchParams;
}

export class ProtocolLinksService extends Service {
  @Inject() navigationService: NavigationService;
  @Inject() platformAppsService: PlatformAppsService;
  @Inject() platformAppStoreService: PlatformAppStoreService;
  @Inject() userService: UserService;
  @Inject() settingsService: SettingsService;

  // Maps base URL components to handler function names
  private handlers: Dictionary<string>;

  start(argv: string[]) {
    // Other instances started with a protocol link will receive this message
    electron.ipcRenderer.on('protocolLink', (event: Electron.Event, link: string) => {
      this.handleLink(link);
    });

    // Check if this instance was started with a protocol link
    byOS({
      [OS.Windows]: () => {
        argv.forEach(arg => {
          if (arg.match(/^slobs:\/\//)) this.handleLink(arg);
        });
      },
      [OS.Mac]: () => {
        electron.ipcRenderer.send('protocolLinkReady');
      },
    });
  }

  private handleLink(link: string) {
    const parsed = new url.URL(link);
    const info: IProtocolLinkInfo = {
      base: parsed.host,
      path: parsed.pathname,
      query: parsed.searchParams,
    };

    if (this.handlers[info.base]) {
      this[this.handlers[info.base]](info);
    }
  }

  @protocolHandler('library')
  private navigateLibrary(info: IProtocolLinkInfo) {
    if (!this.userService.isLoggedIn) return;

    const parts = info.path.match(/^\/(.+)\/(.+)$/);
    if (parts) {
      this.navigationService.navigate('BrowseOverlays', {
        type: parts[1],
        id: parts[2],
      });
    }
  }

  @protocolHandler('alertbox-library')
  private navigateAlertboxLibrary(info: IProtocolLinkInfo) {
    if (!this.userService.isLoggedIn) return;

    const match = info.path.match(/^\/?([0-9]+)?\/?$/);

    if (match) {
      this.navigationService.navigate('AlertboxLibrary', { id: match[1] });
    }
  }

  @protocolHandler('paypalauth')
  private updateUserBillingInfo(info: IProtocolLinkInfo) {
    if (!this.userService.isLoggedIn) return;

    this.platformAppStoreService.paypalAuthSuccess();
  }

  @protocolHandler('app')
  private navigateApp(info: IProtocolLinkInfo) {
    if (!this.userService.isLoggedIn) return;

    const appId = info.path.replace('/', '');

    if (this.platformAppsService.views.getApp(appId)) {
      this.navigationService.navigate('PlatformAppMainPage', { appId });
    } else {
      this.navigationService.navigate('PlatformAppStore', { appId });
    }
  }

  @protocolHandler('settings')
  private openSettings(info: IProtocolLinkInfo) {
    const category = info.path.replace('/', '');

    this.settingsService.showSettings(category);
  }
}
