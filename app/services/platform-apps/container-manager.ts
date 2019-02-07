import { ILoadedApp, EAppPageSlot } from '.';
import electron from 'electron';
import { trim, compact } from 'lodash';
import { Inject } from 'util/injector';
import { UserService } from 'services/user';
import url from 'url';
import path from 'path';
import { PlatformAppsApi } from './api';
import { lazyModule } from 'util/lazy-module';
import { GuestApiService } from 'services/guest-api';
import { BehaviorSubject } from 'rxjs';
import { IBrowserViewTransform } from './api/modules/module';

interface IContainerInfo {
  appId: string;
  slot: EAppPageSlot;
  persistent: boolean;
  container: electron.BrowserView;
  transform: BehaviorSubject<IBrowserViewTransform>;
}

/**
 * Manages the life cycle of application containers.  Application
 * containers are restricted/sandboxed pages that can be mounted
 * into any window.  These are implemented with electron BrowserViews.
 */
export class PlatformContainerManager {
  containers: IContainerInfo[] = [];

  @Inject() private userService: UserService;
  @Inject() private guestApiService: GuestApiService;

  @lazyModule(PlatformAppsApi) private apiManager: PlatformAppsApi;

  /**
   * Registers an app with the container service.
   * Any persistent pages will immediately be spun
   * up in the background.
   * @param app The app to register
   */
  registerApp(app: ILoadedApp) {
    app.manifest.pages.forEach(page => {
      if (page.persistent) {
        this.createContainer(app, page.slot, true);
      }
    });
  }

  /**
   * Unregisters an app with the container service.
   * Any running containers will be shut down.
   * @param app The app to unregister
   */
  unregisterApp(app: ILoadedApp) {
    this.containers.forEach(cont => {
      if (cont.appId === app.id) {
        this.destroyContainer(cont.container.id);
      }
    });
  }

  mountContainer(
    app: ILoadedApp,
    slot: EAppPageSlot,
    electronWindowId: number,
    slobsWindowId: string,
  ) {
    const containerInfo = this.getContainerInfoForSlot(app, slot);
    const win = electron.remote.BrowserWindow.fromId(electronWindowId);

    // TODO: Types for electron fork changes
    (win as any).addBrowserView(containerInfo.container);

    containerInfo.transform.next({
      ...containerInfo.transform.getValue(),
      electronWindowId,
      slobsWindowId,
      mounted: true,
    });

    return containerInfo.container.id;
  }

  setContainerBounds(containerId: number, pos: IVec2, size: IVec2) {
    const cont = this.containers.find(cont => cont.container.id === containerId);

    if (!cont) return;

    cont.container.setBounds({
      x: Math.round(pos.x),
      y: Math.round(pos.y),
      width: Math.round(size.x),
      height: Math.round(size.y),
    });

    cont.transform.next({
      ...cont.transform.getValue(),
      pos,
      size,
    });
  }

  unmountContainer(containerId: number, electronWindowId: number) {
    const cont = this.containers.find(cont => cont.container.id === containerId);

    if (!cont) return;

    const transform = cont.transform.getValue();

    const win = electron.remote.BrowserWindow.fromId(electronWindowId);
    // TODO: Fork typings
    (win as any).removeBrowserView(cont.container);

    // If these are different, it means that another window (likely the main)
    // already mounted this view first, so we don't need to do the following
    // teardown.
    if (transform.electronWindowId === electronWindowId) {
      cont.transform.next({
        ...transform,
        mounted: false,
        electronWindowId: null,
        slobsWindowId: null,
      });

      if (!cont.persistent) {
        this.destroyContainer(containerId);
      }
    }
  }

  /**
   * Refreshes all currently running containers for the provided app.
   * @param app The app to refresh
   */
  refreshContainers(app: ILoadedApp) {
    this.containers.forEach(cont => {
      if (cont.appId === app.id) cont.container.webContents.reload();
    });
  }

  private getContainerInfoForSlot(app: ILoadedApp, slot: EAppPageSlot): IContainerInfo {
    const existingContainer = this.containers.find(
      cont => cont.appId === app.id && cont.slot === slot,
    );

    if (existingContainer) {
      return existingContainer;
    }

    // TODO: Store container in this.containers?
    return this.createContainer(app, slot);
  }

  private createContainer(app: ILoadedApp, slot: EAppPageSlot, persistent = false): IContainerInfo {
    const view = new electron.remote.BrowserView({
      webPreferences: {
        nodeIntegration: false,
        partition: this.getAppPartition(app),
        preload: path.resolve(electron.remote.app.getAppPath(), 'bundles', 'guest-api'),
      },
    });

    const info: IContainerInfo = {
      slot,
      persistent,
      container: view,
      appId: app.id,
      transform: new BehaviorSubject<IBrowserViewTransform>({
        pos: { x: 0, y: 0 },
        size: { x: 0, y: 0 },
        mounted: false,
        electronWindowId: null,
        slobsWindowId: null,
      }),
    };

    if (app.unpacked) view.webContents.openDevTools();

    view.webContents.on('did-finish-load', () => {
      this.exposeApi(app, view.webContents.id, info.transform);
    });

    /**
     * This has to be done from the main process to work properly
     * @see https://github.com/electron/electron/issues/1378
     */
    electron.ipcRenderer.send('webContents-preventNavigation', view.webContents.id);

    // We allow opening dev tools for beta apps only
    if (app.beta) {
      view.webContents.on('before-input-event', (e, input) => {
        if (input.type === 'keyDown' && input.code === 'KeyI' && input.control && input.shift) {
          view.webContents.openDevTools();
        }
      });
    }

    view.webContents.loadURL(this.getPageUrlForSlot(app, slot));

    this.containers.push(info);

    return info;
  }

  private destroyContainer(containerId: number) {
    const cont = this.containers.find(cont => cont.container.id === containerId);
    this.containers = this.containers.filter(c => c.container.id !== containerId);

    // TODO: This just seems to be an error in the types provided,
    // this isn't a new method added by our fork.
    (cont.container as any).destroy();
  }

  private getPageUrlForSlot(app: ILoadedApp, slot: EAppPageSlot) {
    const page = app.manifest.pages.find(page => page.slot === slot);
    if (!page) return null;

    return this.getPageUrl(app, page.file);
  }

  /**
   * Page URLs are just asset URLs that additionally
   * have an `app_token` in the query params that can
   * be parsed by our SDK.
   * @param app The app
   * @param page The page filename
   */
  getPageUrl(app: ILoadedApp, page: string) {
    const url = this.getAssetUrl(app, page);
    return `${url}?app_token=${app.appToken}`;
  }

  /**
   * Return the URL to an asset inside an app
   * @param app The app
   * @param asset The asset
   */
  getAssetUrl(app: ILoadedApp, asset: string) {
    let url: string;

    if (app.unpacked) {
      const trimmed = trim(app.manifest.buildPath, '/ ');
      url = compact([`http://localhost:${app.devPort}`, trimmed, asset]).join('/');
    } else {
      url = compact([app.appUrl, asset]).join('/');
    }

    return url;
  }

  sessionsInitialized: Dictionary<boolean> = {};

  /**
   * Returns a session partition id for the app id.
   * These are non-persistent for now
   */
  private getAppPartition(app: ILoadedApp) {
    const userId = this.userService.platformId;
    const partition = `platformApp-${app.id}-${userId}`;

    if (!this.sessionsInitialized[partition]) {
      const session = electron.remote.session.fromPartition(partition);
      const frameUrls: string[] = [];
      let mainFrame = '';

      session.webRequest.onBeforeRequest((details, cb) => {
        const parsed = url.parse(details.url);

        if (details.resourceType === 'mainFrame') mainFrame = url.parse(details.url).hostname;

        if (parsed.hostname === 'cvp.twitch.tv' && (details.resourceType = 'script')) {
          cb({});
          return;
        }

        if (details.resourceType === 'subFrame') {
          // Subframes from other origins are allowed to load scripts.  The same origin
          // policy will prevent them from accessing the parent window.
          if (parsed.hostname !== mainFrame) {
            frameUrls.push(details.url);
            cb({});
            return;
          }
        }

        if (details['referrer'] && frameUrls.includes(details['referrer'])) {
          cb({});
          return;
        }

        if (details.resourceType === 'script') {
          const scriptWhitelist = [
            'https://cdn.streamlabs.com/slobs-platform/lib/streamlabs-platform.js',
            'https://cdn.streamlabs.com/slobs-platform/lib/streamlabs-platform.min.js',
          ];

          const scriptDomainWhitelist = [
            'www.googletagmanager.com',
            'www.google-analytics.com',
            'widget.intercom.io',
            'js.intercomcdn.com',
          ];

          const parsed = url.parse(details.url);

          if (scriptWhitelist.includes(details.url)) {
            cb({});
            return;
          }

          if (scriptDomainWhitelist.includes(parsed.hostname)) {
            cb({});
            return;
          }

          if (details.url.startsWith(app.appUrl)) {
            cb({});
            return;
          }

          if (parsed.host === `localhost:${app.devPort}`) {
            cb({});
            return;
          }

          // Let through all chrome dev tools requests
          if (parsed.protocol === 'chrome-devtools:') {
            cb({});
            return;
          }

          // Cancel all other script requests.
          cb({ cancel: true });
          return;
        }

        // Let through all other requests (XHR, assets, etc)
        cb({});
      });

      this.sessionsInitialized[partition] = true;
    }

    return partition;
  }

  private exposeApi(
    app: ILoadedApp,
    webContentsId: number,
    transform: BehaviorSubject<IBrowserViewTransform>,
  ) {
    const api = this.apiManager.getApi(app, webContentsId, transform);

    // Namespace under v1 for now.  Eventually we may want to add
    // a v2 API.
    this.guestApiService.exposeApi(webContentsId, { v1: api });
  }
}
