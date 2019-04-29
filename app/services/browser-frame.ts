import electron from 'electron';
import path from 'path';
import { Service } from './service';
import find from 'lodash/find';
import { IRequestHandler, GuestApiService } from './guest-api';
import { Inject } from 'util/injector';

// state
interface IBrowserFrameData {
  container: Electron.BrowserView;
  config: IBrowserFrameConfig;
}

interface IBrowserFrameConfig {
  partition?: string;
  preload?: string;
  affinity?: string;
  url: string;
  persistent: boolean;
  windowId: number;
  requestHandler: IRequestHandler;
  openRemote: boolean;
  onNewWindow: (event: Electron.Event, url: string) => void;
}

export class BrowserFrameService extends Service {
  @Inject() guestApiService: GuestApiService;

  private browserViews: IBrowserFrameData[] = [];

  getView(containerId: number, windowId: number) {
    const data = this.browserViews.find(
      value => value.config.windowId === windowId && value.container.id === containerId,
    );
    return data.container;
  }

  mountView(config: IBrowserFrameConfig) {
    if (config.preload) {
      config.preload = path.resolve(electron.remote.app.getAppPath(), config.preload);
    }

    let data = this.browserViews.find(value => value.config.url === config.url);

    if (!data) {
      data = {
        container: null,
        config: null,
      };

      data.container = new electron.remote.BrowserView({
        webPreferences: {
          partition: config.partition,
          nodeIntegration: false,
          preload: config.preload,
          affinity: config.affinity,
        },
      });

      data.config = config;

      this.setupListeners(data);

      data.container.webContents.loadURL(config.url);

      this.browserViews.push(data);
    }

    const win = electron.remote.BrowserWindow.fromId(config.windowId);

    // @ts-ignore: This method was added in our fork
    win.addBrowserView(data.container);

    return data.container.id;
  }

  unmountView(containerId: number, windowId: number) {
    const data = this.browserViews.find(value => value.container.id === containerId);

    if (data && data.container) {
      const win = electron.remote.BrowserWindow.fromId(data.config.windowId);

      // @ts-ignore: this method was added in our fork
      win.removeBrowserView(data.container);

      if (data.config.windowId === windowId) {
        /*data.transform.next({
          ...transform,
          mounted: false,
          electronWindowId: null,
          slobsWindowId: null,
        });*/

        if (!data.config.persistent) {
          this.destroyView(containerId);
        }
      }
    }
  }

  private setupListeners(data: IBrowserFrameData) {
    electron.ipcRenderer.send('webContents-preventPopup', data.container.webContents.id);

    if (data.config.onNewWindow) {
      data.container.webContents.on('new-window', data.config.onNewWindow);
    } else {
      data.container.webContents.on('new-window', this.onNewWindow.bind(this));
    }

    data.container.webContents.on('did-finish-load', this.onFinishLoad.bind(this));

    console.log(data.config.requestHandler);
  }

  private onNewWindow(event: Electron.Event, targetUrl: string) {
    const data = this.browserViews.find(
      value => value.container.id === electron.remote.BrowserView.fromWebContents(event.sender).id,
    );

    if (data.config.openRemote) {
      electron.remote.shell.openExternal(targetUrl);
    }
  }

  private onFinishLoad(event: Electron.Event) {
    const data = this.browserViews.find(
      value => value.container.id === electron.remote.BrowserView.fromWebContents(event.sender).id,
    );
    if (data.config.requestHandler) {
      this.guestApiService.exposeApi(data.container.webContents.id, data.config.requestHandler);
    }
  }

  private openRemotely(evt: Electron.Event, targetUrl: string) {}

  private destroyView(containerId: number) {
    const data = this.browserViews.find(cont => cont.container.id === containerId);

    if (!data) return;

    this.browserViews = this.browserViews.filter(c => c.container.id !== containerId);

    //  @ts-ignore: Method from our own branch
    data.container.destroy();
  }

  setViewBounds(containerId: number, pos: IVec2, size: IVec2) {
    const data = this.browserViews.find(value => value.container.id === containerId);

    if (!data) return;

    data.container.setBounds({
      x: Math.round(pos.x),
      y: Math.round(pos.y),
      width: Math.round(size.x),
      height: Math.round(size.y),
    });

    /*data.transform.next({
      ...info.transform.getValue(),
      pos,
      size,
    });*/
  }
}
