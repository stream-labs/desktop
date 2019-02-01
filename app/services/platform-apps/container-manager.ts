import { ILoadedApp, EAppPageSlot } from '.';
import electron, { BrowserView } from 'electron';
import { trim, compact } from 'lodash';

interface IPersistentContainer {
  appId: string;
  slot: EAppPageSlot;
  container: electron.BrowserView;
}

/**
 * Manages the life cycle of application containers.  Application
 * containers are restricted/sandboxed pages that can be mounted
 * into any window.  These are implemented with electron BrowserViews.
 */
export class PlatformContainerManager {
  containers: IPersistentContainer[] = [];

  /**
   * Registers an app with the container service.
   * Any persistent pages will immediately be spun
   * up in the background.
   * @param app The app to register
   */
  registerApp(app: ILoadedApp) {
    app.manifest.pages.forEach(page => {
      if (page.persistent) {
        const container = this.createContainer(app, page.slot);
        this.containers.push({
          container,
          appId: app.id,
          slot: page.slot,
        });
      }
    });
  }

  /**
   * Unregisters an app with the container service.
   * Any running containers will be shut down.
   * @param app The app to unregister
   */
  unregisterApp(app: ILoadedApp) {}

  /**
   * Get the container id (Electron BrowserView id) for
   * the requested app and slot.  If the slot is persistent,
   * the running container id will be returned.  If the slot
   * is not persistent, a new container will be spun up and
   * the id will be returned.
   * @param app The app
   * @param slot The page slot
   */
  getContainerId(app: ILoadedApp, slot: EAppPageSlot) {
    const existingContainer = this.containers.find(
      cont => cont.appId === app.id && cont.slot === slot,
    );

    if (existingContainer) {
      return existingContainer.container.id;
    }

    return this.createContainer(app, slot).id;
  }

  private createContainer(app: ILoadedApp, slot: EAppPageSlot) {
    const view = new BrowserView();

    // TODO: Preload
    // TODO: Parition etc

    view.webContents.loadURL(this.getPageUrlForSlot(app, slot));

    return view;
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
}
