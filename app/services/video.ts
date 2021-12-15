import { Service } from './core/service';
import { SettingsService } from './settings';
import * as obs from '../../obs-api';
import electron, { BrowserWindow } from 'electron';
import { Inject } from './core/injector';
import Utils from './utils';
import { WindowsService } from './windows';
import { ScalableRectangle } from '../util/ScalableRectangle';
import { Subscription } from 'rxjs';
import { SelectionService } from 'services/selection';
import { byOS, OS, getOS } from 'util/operating-systems';
import { onUnload } from 'util/unload';

// TODO: There are no typings for nwr
let nwr: any;

// NWR is used to handle display rendering via IOSurface on mac
if (getOS() === OS.Mac) {
  nwr = electron.remote.require('node-window-rendering');
}

const { remote } = electron;

const DISPLAY_ELEMENT_POLLING_INTERVAL = 500;

export interface IDisplayOptions {
  sourceId?: string;
  paddingSize?: number;
  electronWindowId?: number;
  slobsWindowId?: string;
  paddingColor?: IRGBColor;
  renderingMode?: number;
}

export class Display {
  @Inject() settingsService: SettingsService;
  @Inject() videoService: VideoService;
  @Inject() windowsService: WindowsService;
  @Inject() selectionService: SelectionService;

  outputRegionCallbacks: Function[];
  outputRegion: IRectangle;
  isDestroyed = false;

  trackingInterval: number;
  currentPosition: IRectangle = {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  };
  currentScale: number;

  electronWindowId: number;
  slobsWindowId: string;

  private readonly selectionSubscription: Subscription;

  sourceId: string;
  renderingMode: number;

  boundDestroy: any;
  boundClose: any;
  displayDestroyed: boolean;

  focusListener: () => void;
  unfocusListener: () => void;
  movedListener: () => void;
  movedTimeout: number;

  cancelUnload: () => void;

  constructor(public name: string, options: IDisplayOptions = {}) {
    this.sourceId = options.sourceId;
    this.electronWindowId = options.electronWindowId || remote.getCurrentWindow().id;
    this.slobsWindowId = options.slobsWindowId || Utils.getCurrentUrlParams().windowId;
    this.renderingMode = options.renderingMode
      ? options.renderingMode
      : obs.ERenderingMode.OBS_MAIN_RENDERING;

    const electronWindow = remote.BrowserWindow.fromId(this.electronWindowId);

    this.currentScale = this.windowsService.state[this.slobsWindowId].scaleFactor;

    this.videoService.actions.createOBSDisplay(
      this.electronWindowId,
      name,
      this.renderingMode,
      this.sourceId,
    );

    this.displayDestroyed = false;

    // grid lines are enabled by default
    // switch them off multiple items are selected
    if (this.selectionService.views.globalSelection.getSize() > 1) {
      this.switchGridlines(false);
    }

    // also sync girdlines when selection changes
    this.selectionSubscription = this.selectionService.updated.subscribe(state => {
      this.switchGridlines(state.selectedIds.length <= 1);
    });

    if (options.paddingColor) {
      this.videoService.actions.setOBSDisplayPaddingColor(
        name,
        options.paddingColor.r,
        options.paddingColor.g,
        options.paddingColor.b,
      );
    } else {
      this.videoService.actions.setOBSDisplayPaddingColor(name, 11, 22, 28);
    }

    if (options.paddingSize != null) {
      this.videoService.actions.setOBSDisplayPaddingSize(name, options.paddingSize);
    }

    this.outputRegionCallbacks = [];

    this.boundClose = this.remoteClose.bind(this);

    electronWindow.on('close', this.boundClose);

    this.cancelUnload = onUnload(() => this.boundClose());
  }

  trackingFun: () => void;

  /**
   * Will keep the display positioned on top of the passed HTML element
   * @param element the html element to host the display
   */
  trackElement(element: HTMLElement) {
    if (this.trackingInterval) clearInterval(this.trackingInterval);

    this.trackingFun = () => {
      const rect = this.getScaledRectangle(element.getBoundingClientRect());

      // On Mac, we need to perform a move/resize when the display scale changes,
      // even though from our perspective the size didn't change. We should eventually
      // fix this on the backend.
      const shouldMoveResize = byOS({
        [OS.Windows]: false,
        [OS.Mac]: () => {
          const scaleFactor = this.windowsService.state[this.slobsWindowId].scaleFactor;
          const ret = this.currentScale !== scaleFactor;

          this.currentScale = scaleFactor;

          return ret;
        },
      });

      if (
        rect.x !== this.currentPosition.x ||
        rect.y !== this.currentPosition.y ||
        rect.width !== this.currentPosition.width ||
        rect.height !== this.currentPosition.height ||
        shouldMoveResize
      ) {
        this.resize(rect.width, rect.height);
        this.move(rect.x, rect.y);
      }
    };

    this.trackingFun();
    this.trackingInterval = window.setInterval(this.trackingFun, DISPLAY_ELEMENT_POLLING_INTERVAL);
  }

  getScaledRectangle(rect: ClientRect): IRectangle {
    // On Mac we don't need to adjust for scaling factor
    const factor = byOS({
      [OS.Windows]: this.windowsService.state[this.slobsWindowId].scaleFactor,
      [OS.Mac]: 1,
    });

    // Windows: Top-left origin
    // Mac: Bottom-left origin
    const yCoord = byOS({ [OS.Windows]: rect.top, [OS.Mac]: window.innerHeight - rect.bottom });

    return {
      x: rect.left * factor,
      y: yCoord * factor,
      width: rect.width * factor,
      height: rect.height * factor,
    };
  }

  move(x: number, y: number) {
    this.currentPosition.x = x;
    this.currentPosition.y = y;

    byOS({
      [OS.Windows]: () => this.videoService.actions.moveOBSDisplay(this.name, x, y),
      [OS.Mac]: () => nwr.moveWindow(this.name, x, y),
    });
  }

  existingWindow = false;

  resize(width: number, height: number) {
    this.currentPosition.width = width;
    this.currentPosition.height = height;
    this.videoService.actions.resizeOBSDisplay(this.name, width, height);
    if (this.outputRegionCallbacks.length) this.refreshOutputRegion();

    // On mac, resizing the display is not enough, we also have to
    // recreate the window and IOSurface for the new size
    if (getOS() === OS.Mac) {
      if (this.existingWindow) {
        nwr.destroyWindow(this.name);
        nwr.destroyIOSurface(this.name);
      }

      const surface = this.videoService.createOBSIOSurface(this.name);
      nwr.createWindow(
        this.name,
        remote.BrowserWindow.fromId(this.electronWindowId).getNativeWindowHandle(),
      );
      nwr.connectIOSurface(this.name, surface);
      this.existingWindow = true;
    }
  }

  remoteClose() {
    this.outputRegionCallbacks = [];
    if (this.trackingInterval) clearInterval(this.trackingInterval);
    if (this.selectionSubscription) this.selectionSubscription.unsubscribe();
    if (!this.displayDestroyed) {
      this.videoService.actions.destroyOBSDisplay(this.name);

      // On mac, we also deinit NWR
      if (getOS() === OS.Mac) {
        nwr.destroyWindow(this.name);
        nwr.destroyIOSurface(this.name);
      }

      this.displayDestroyed = true;
    }
  }

  destroy() {
    const win = remote.BrowserWindow.fromId(this.electronWindowId);
    if (win) {
      win.removeListener('close', this.boundClose);
    }
    window.removeEventListener('beforeunload', this.boundClose);
    this.cancelUnload();
    this.remoteClose();
  }

  onOutputResize(cb: (region: IRectangle) => void) {
    this.outputRegionCallbacks.push(cb);
  }

  async refreshOutputRegion() {
    const position = await this.videoService.actions.return.getOBSDisplayPreviewOffset(this.name);

    // This can happen while we were async fetching the offset
    if (this.displayDestroyed) return;

    const size = await this.videoService.actions.return.getOBSDisplayPreviewSize(this.name);

    this.outputRegion = {
      ...position,
      ...size,
    };

    this.outputRegionCallbacks.forEach(cb => {
      cb(this.outputRegion);
    });
  }

  drawingUI = true;

  setShoulddrawUI(drawUI: boolean) {
    this.drawingUI = drawUI;
    this.videoService.actions.setOBSDisplayShouldDrawUI(this.name, drawUI);
  }

  switchGridlines(enabled: boolean) {
    // This function does nothing if we aren't drawing the UI
    if (!this.drawingUI) return;
    this.videoService.actions.setOBSDisplayDrawGuideLines(this.name, enabled);
  }
}

export class VideoService extends Service {
  @Inject() settingsService: SettingsService;

  init() {
    this.settingsService.loadSettingsIntoStore();
  }

  getScreenRectangle() {
    return new ScalableRectangle({
      x: 0,
      y: 0,
      width: this.baseWidth,
      height: this.baseHeight,
    });
  }

  get baseWidth() {
    return this.baseResolution.width;
  }

  get baseHeight() {
    return this.baseResolution.height;
  }

  get baseResolution() {
    const [widthStr, heightStr] = this.settingsService.views.values.Video.Base.split('x');
    const width = parseInt(widthStr, 10);
    const height = parseInt(heightStr, 10);

    return {
      width,
      height,
    };
  }

  setBaseResolution(resolution: { width: number; height: number }) {
    this.settingsService.setSettingValue(
      'Video',
      'Base',
      `${resolution.width}x${resolution.height}`,
    );
  }

  /**
   * @warning DO NOT USE THIS METHOD. Use the Display class instead
   */
  createOBSDisplay(
    electronWindowId: number,
    name: string,
    remderingMode: number,
    sourceId?: string,
  ) {
    const electronWindow = remote.BrowserWindow.fromId(electronWindowId);

    if (sourceId) {
      obs.NodeObs.OBS_content_createSourcePreviewDisplay(
        electronWindow.getNativeWindowHandle(),
        sourceId,
        name,
      );
    } else {
      obs.NodeObs.OBS_content_createDisplay(
        electronWindow.getNativeWindowHandle(),
        name,
        remderingMode,
      );
    }
  }

  setOBSDisplayPaddingColor(name: string, r: number, g: number, b: number) {
    obs.NodeObs.OBS_content_setPaddingColor(name, r, g, b);
  }

  setOBSDisplayPaddingSize(name: string, size: number) {
    obs.NodeObs.OBS_content_setPaddingSize(name, size);
  }

  moveOBSDisplay(name: string, x: number, y: number) {
    obs.NodeObs.OBS_content_moveDisplay(name, x, y);
  }

  resizeOBSDisplay(name: string, width: number, height: number) {
    obs.NodeObs.OBS_content_resizeDisplay(name, width, height);
  }

  destroyOBSDisplay(name: string) {
    obs.NodeObs.OBS_content_destroyDisplay(name);
  }

  getOBSDisplayPreviewOffset(name: string): IVec2 {
    return obs.NodeObs.OBS_content_getDisplayPreviewOffset(name);
  }

  getOBSDisplayPreviewSize(name: string): { width: number; height: number } {
    return obs.NodeObs.OBS_content_getDisplayPreviewSize(name);
  }

  setOBSDisplayShouldDrawUI(name: string, drawUI: boolean) {
    obs.NodeObs.OBS_content_setShouldDrawUI(name, drawUI);
  }

  setOBSDisplayDrawGuideLines(name: string, drawGuideLines: boolean) {
    obs.NodeObs.OBS_content_setDrawGuideLines(name, drawGuideLines);
  }

  /**
   * Creates a shared IOSurface for a display that can be passed to
   * node-window-rendering for embedded in electron. (Mac Only)
   * @param name The name of the display
   */
  createOBSIOSurface(name: string) {
    return obs.NodeObs.OBS_content_createIOSurface(name);
  }
}
