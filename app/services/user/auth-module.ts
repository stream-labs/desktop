import { TPlatform, EPlatformCallResult, getPlatformService, IUserAuth } from 'services/platforms';
import uuid from 'uuid/v4';
import electron from 'electron';
import defer from 'lodash/defer';
import URI from 'urijs';
import http from 'http';
import Utils from 'services/utils';

/**
 * Responsible for secure handling of platform OAuth flows.
 * Supports 2 different modes:
 * - Internal Auth: Login happens in an electron window.
 * - External Auth: Login happens in the user's default web browser.
 */
export class AuthModule {
  /**
   * Starts the authentication process in an electron window.
   */
  startInternalAuth(
    authUrl: string,
    windowOptions: electron.BrowserWindowConstructorOptions,
    onWindowShow: () => void,
    merge = false,
  ): Promise<IUserAuth> {
    return new Promise<IUserAuth>(resolve => {
      const partition = `persist:${uuid()}`;
      const authWindow = new electron.remote.BrowserWindow({
        ...windowOptions,
        alwaysOnTop: false,
        show: false,
        webPreferences: {
          partition,
          nodeIntegration: false,
          nativeWindowOpen: true,
        },
      });

      authWindow.webContents.on('did-navigate', async (e, url) => {
        const parsed = this.parseAuthFromUrl(url, merge);

        if (parsed) {
          parsed.partition = partition;
          authWindow.close();
          resolve(parsed);
        }
      });

      authWindow.once('ready-to-show', () => {
        authWindow.show();
        defer(onWindowShow);
      });

      authWindow.removeMenu();
      authWindow.loadURL(authUrl);
    });
  }

  private authServer: http.Server;

  /**
   * Starts the authentication process in the OS default browser
   */
  startExternalAuth(authUrl: string, onWindowShow: () => void, merge = false) {
    return new Promise<IUserAuth>(resolve => {
      if (this.authServer) {
        this.authServer.close();
        this.authServer.unref();
      }

      this.authServer = http.createServer((request, response) => {
        const parsed = this.parseAuthFromUrl(request.url, merge);

        if (parsed) {
          response.writeHead(302, {
            Location: 'https://streamlabs.com/streamlabs-obs/login-success',
          });
          response.end();

          this.authServer.close();
          this.authServer.unref();
          this.authServer = null;

          const win = Utils.getMainWindow();

          // A little hack to bring the window back to the front
          win.setAlwaysOnTop(true);
          win.show();
          win.focus();
          win.setAlwaysOnTop(false);

          // We didn't use a partition for login, but we should still
          // create a new persistent partition for everything else.
          parsed.partition = `persist:${uuid()}`;

          resolve(parsed);
        } else {
          // All other requests we respond with a generic 200
          response.writeHead(200);
          response.write('Success');
          response.end();
        }
      });

      this.authServer.on('listening', () => {
        const address = this.authServer.address();

        if (address && typeof address !== 'string') {
          const paramSeparator = merge ? '?' : '&';
          const url = `${authUrl}${paramSeparator}port=${address.port}`;

          electron.shell.openExternal(url);
          onWindowShow();
        }
      });

      // Specifying port 0 lets the OS know we want a free port assigned
      this.authServer.listen(0, '127.0.0.1');
    });
  }

  /**
   * Parses tokens out of the auth URL
   */
  private parseAuthFromUrl(url: string, merge: boolean): IUserAuth {
    const query = URI.parseQuery(URI.parse(url).query) as Dictionary<string>;
    const requiredFields = ['platform', 'platform_username', 'platform_token', 'platform_id'];

    if (!merge) requiredFields.push('token', 'oauth_token');

    if (requiredFields.every(field => !!query[field])) {
      return {
        widgetToken: query.token,
        apiToken: query.oauth_token,
        primaryPlatform: query.platform as TPlatform,
        platforms: {
          [query.platform]: {
            type: query.platform,
            username: query.platform_username,
            token: query.platform_token,
            id: query.platform_id,
          },
        },
        hasRelogged: true,
      };
    }
  }
}
