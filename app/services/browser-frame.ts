import electron from 'electron';
import path from 'path';
import { Service } from './service';
import find from 'lodash/find';

// state
interface IBrowserFrameData {
  container: Electron.BrowserView;
  config: IBrowserFrameConfig;
}
interface IBrowserFrame {
  [id: string]: IBrowserFrameData;
}

interface IBrowserFrameConfig {
  partition?: string;
  preload?: string;
  affinity?: string;
  url: string;
  persistent: boolean;
  windowId: number;
}

export class BrowserFrameService extends Service {
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

      data.container.webContents.loadURL(config.url);

      this.browserViews.push({
        config,
        container: data.container,
      });
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
