import { Module, EApiPermissions, apiMethod, IApiContext } from './module';
import electron, { BrowserWindow, app } from 'electron';
import url from 'url';
import uuid from 'uuid/v4';

enum EAuthWindowEventType {
  AuthRedirect = 'auth_redirect',
  Show = 'show',
  Close = 'close'
}

interface IAuthWindowEvent {
  type: EAuthWindowEventType;
  url?: string;
}

interface IAuthWIndowOptions {
  width: number;
  height: number;
  title: string;
}

type TEventHandler = (event: IAuthWindowEvent) => void;

export class AuthorizationModule extends Module {

  moduleName = 'Authorization';
  permissions = [EApiPermissions.Authorization]

  windowHandles: Dictionary<BrowserWindow> = {};

  @apiMethod()
  showAuthorizationWindow(
    ctx: IApiContext,
    authUrl: string,
    options: IAuthWIndowOptions,
    eventHandler: TEventHandler
  ) {
    if (this.windowHandles[ctx.app.id]) {
      throw new Error('This application already has an open authorization window!');
    }

    // First, make sure they are requesting a whitelisted URL
    const parsed = url.parse(authUrl);
    const valid = !!(ctx.app.manifest.authorizationUrls || []).find(whitelistUrl => {
      const whitelistParsed = url.parse(whitelistUrl);
      return (whitelistParsed.host === parsed.host) &&
        (whitelistParsed.pathname === parsed.pathname);
    });

    if (!valid) {
      throw new Error('Authorization URL is not whitelisted in the application manifest!');
    }

    const win = new electron.remote.BrowserWindow({
      width: options.width || 600,
      height: options.height || 600,
      title: options.title,
      show: false,
      webPreferences: {
        nodeIntegration: false,
        sandbox: true,
        partition: uuid()
      }
    });

    win.webContents.session.protocol.registerFileProtocol('slobs-oauth', (req) => {
      eventHandler({ type: EAuthWindowEventType.AuthRedirect, url: req.url });
      win.close();
    });

    win.on('closed', () => {
      delete this.windowHandles[ctx.app.id];
      eventHandler({ type: EAuthWindowEventType.Close });
    });

    win.on('ready-to-show', () => {
      win.show();
      eventHandler({ type: EAuthWindowEventType.Show });
    });

    win.setMenu(null);
    win.loadURL(authUrl);

    this.windowHandles[ctx.app.id] = win;
  }

  @apiMethod()
  closeAuthorizationWindow(ctx: IApiContext) {
    if (this.windowHandles[ctx.app.id]) {
      this.windowHandles[ctx.app.id].close();
    }
  }

}
