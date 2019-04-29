import { PersistentStatefulService } from './persistent-stateful-service';
import { mutation } from './stateful-service';
import merge from 'lodash/merge';
import electron from 'electron';
import path from 'path';
import { Service } from './service';
// state
interface IBrowserFrameData {
  view: Electron.BrowserView;
  windowId: number;
}
interface IBrowserFrame {
  [id: string]: IBrowserFrameData;
}

interface IBrowserFrameConfig {
  partition?: string;
  preload?: string;
  affinity?: string;
  url: string;
  windowId: number;
}

export class BrowserFrameService extends Service {
  private browserViews: IBrowserFrame = {};

  getView(name: string) {
    return this.browserViews[name];
  }

  addView(name: string, config: IBrowserFrameConfig) {
    if (config.preload) {
      config.preload = path.resolve(electron.remote.app.getAppPath(), config.preload);
    }

    const inuse = this.browserViews[name];

    if (!inuse) {
      const view = new electron.remote.BrowserView({
        webPreferences: {
          partition: config.partition,
          nodeIntegration: false,
          preload: config.preload,
          affinity: config.affinity,
        },
      });

      view.webContents.loadURL(config.url);
      const win = electron.remote.BrowserWindow.fromId(config.windowId);

      // @ts-ignore: This method was added in our fork
      win.addBrowserView(view);

      const data: IBrowserFrameData = {
        view,
        windowId: config.windowId,
      };

      this.browserViews[name] = data;

      return data.view;
    }

    return inuse.view;
  }

  hideView(name: string) {
    const data = this.browserViews[name];

    if (data) {
      const win = electron.remote.BrowserWindow.fromId(data.windowId);
      // @ts-ignore: this method was added in our fork
      win.removeBrowserView(data.view);
    }
  }

  showView(name: string) {
    const data = this.browserViews[name];

    if (data) {
      const win = electron.remote.BrowserWindow.fromId(data.windowId);

      // @ts-ignore: this method was added in our fork
      win.addBrowserView(data.view);
    }
  }

  removeView(name: string) {
    const data = this.browserViews[name];

    if (data && data.view) {
      const win = electron.remote.BrowserWindow.fromId(data.windowId);

      // @ts-ignore: this method was added in our fork
      win.removeBrowserView(data.view);

      // @ts-ignore: This method was added in our fork
      data.view.destroy();
      delete this.browserViews[name];
    }
  }
}
