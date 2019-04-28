import { PersistentStatefulService } from './persistent-stateful-service';
import { mutation } from './stateful-service';
import electron from 'electron';

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

interface IBrowserFrameServiceState {
  browserViews: IBrowserFrame;
}

export class BrowserFrameService extends PersistentStatefulService<IBrowserFrameServiceState> {
  static defaultState: IBrowserFrameServiceState = {
    browserViews: {},
  };

  init() {
    this.RESET();
  }

  getView(name: string) {
    return this.state.browserViews[name];
  }

  addView(name: string, config: IBrowserFrameConfig) {
    this.ADD(name, config);
    return this.state.browserViews[name].view;
  }

  hideView(name: string) {
    const data = this.state.browserViews[name];

    if (data) {
      const win = electron.remote.BrowserWindow.fromId(data.windowId);
      // @ts-ignore: this method was added in our fork
      win.removeBrowserView(data.view);
    }
  }

  showView(name: string) {
    const data = this.state.browserViews[name];

    if (data) {
      const win = electron.remote.BrowserWindow.fromId(data.windowId);

      // @ts-ignore: this method was added in our fork
      win.addBrowserView(data.view);
    }
  }

  removeView(name: string) {
    this.REMOVE(name);
  }

  //
  // Mutations
  //
  @mutation()
  private RESET() {
    this.state.browserViews = {};
  }

  @mutation()
  private ADD(name: string, config: IBrowserFrameConfig) {
    const inuse = this.state.browserViews[name];

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

      this.state.browserViews[name] = data;

      return data.view;
    }

    return inuse.view;
  }

  @mutation()
  private REMOVE(name: string) {
    const data = this.state.browserViews[name];

    if (data) {
      const win = electron.remote.BrowserWindow.fromId(data.windowId);

      // @ts-ignore: this method was added in our fork
      win.removeBrowserView(data.view);

      // @ts-ignore: This method was added in our fork
      data.view.destroy();
      delete this.state.browserViews[name];
    }
  }
}
