import { Service } from 'services/service';
import electron from 'electron';
import url from 'url';
import { Inject } from 'util/injector';
import { NavigationService } from 'services/navigation';
import { PlatformAppStoreService } from 'services/platform-app-store';

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
  @Inject() platformAppStoreService: PlatformAppStoreService;

  // Maps base URL components to handler function names
  private handlers: Dictionary<string>;

  start(argv: string[]) {
    // Check if this instance was started with a protocol link
    argv.forEach(arg => {
      if (arg.match(/^slobs:\/\//)) this.handleLink(arg);
    });

    // Other instances started with a protocol link will receive this message
    electron.ipcRenderer.on(
      'protocolLink',
      (event: Electron.Event, link: string) => this.handleLink(link)
    );
  }

  private handleLink(link: string) {
    const parsed = new url.URL(link);
    const info: IProtocolLinkInfo = {
      base: parsed.host,
      path: parsed.pathname,
      query: parsed.searchParams
    };

    if (this.handlers[info.base]) {
      this[this.handlers[info.base]](info);
    }
  }

  @protocolHandler('dashboard')
  private navigateDashboard(info: IProtocolLinkInfo) {
    const subPage = info.path.replace('/', '');
    this.navigationService.navigate('Dashboard', { subPage });
  }

  @protocolHandler('library')
  private navigateLibrary(info: IProtocolLinkInfo) {
    const parts = info.path.match(/^\/(.+)\/(.+)$/);
    if (parts) {
      this.navigationService.navigate('BrowseOverlays', {
        type: parts[1],
        id: parts[2]
      });
    }
  }

  @protocolHandler('paypalauth')
  private updateUserBillingInfo(info: IProtocolLinkInfo) {
    // 1. navigate to store tab
    // 2. trigger callback to store webview to continue checkout
    this.navigationService.navigate('PlatformAppStore');
    this.platformAppStoreService.paypalAuthSuccess();
  }
}
