import { Service } from './service';
import { SettingsService } from './settings';
import { nodeObs } from './obs-api';
import electron from 'electron';
import { Inject } from '../util/injector';
import Utils from './utils';
import { WindowsService } from './windows';
import { ScalableRectangle } from '../util/ScalableRectangle';
import { Subscription } from 'rxjs/Subscription';
import { SelectionService } from 'services/selection';

const { remote } = electron;

const DISPLAY_ELEMENT_POLLING_INTERVAL = 500;

export interface IDisplayOptions {
  sourceId?: string;
  paddingSize?: number;
}

export class Display {
  @Inject() settingsService: SettingsService;
  @Inject() videoService: VideoService;
  @Inject() windowsService: WindowsService;
  @Inject() selectionService: SelectionService;

  outputRegionCallbacks: Function[];
  outputRegion: IRectangle;

  trackingInterval: number;
  currentPosition: IRectangle = {
    x: 0,
    y: 0,
    width: 0,
    height: 0
  };

  windowId: string;

  private selectionSubscription: Subscription;

  sourceId: string;

  constructor(public name: string, options: IDisplayOptions = {}) {
    this.windowId = Utils.isChildWindow() ? 'child' : 'main';

    this.sourceId = options.sourceId;

    if (this.sourceId) {
      nodeObs.OBS_content_createSourcePreviewDisplay(
        remote.getCurrentWindow().getNativeWindowHandle(),
        this.sourceId,
        name
      );
    } else {
      nodeObs.OBS_content_createDisplay(
        remote.getCurrentWindow().getNativeWindowHandle(),
        name
      );
    }

    this.selectionSubscription = this.selectionService.updated.subscribe(() => {
      this.switchGridlines(this.selectionService.getSize() <= 1);
    });

    // 映像部分以外の色
    nodeObs.OBS_content_setPaddingColor(name, 31, 34, 45);

    // ソースの枠線の色
    nodeObs.OBS_content_setOutlineColor(name, 255, 105, 82);

    // ソースから十字に伸びる線の色
    nodeObs.OBS_content_setGuidelineColor(name, 255, 105, 82);

    if (options.paddingSize != null) {
      nodeObs.OBS_content_setPaddingSize(name, options.paddingSize);
    }

    this.outputRegionCallbacks = [];

    this.boundDestroy = this.destroy.bind(this);

    remote.getCurrentWindow().on('close', this.boundDestroy);
  }

  boundDestroy: any;

  /**
   * Will keep the display positioned on top of the passed HTML element
   * @param element the html element to host the display
   */
  trackElement(element: HTMLElement) {
    if (this.trackingInterval) clearInterval(this.trackingInterval);

    const trackingFun = () => {
      const rect = this.getScaledRectangle(element.getBoundingClientRect());

      if ((rect.x !== this.currentPosition.x) ||
        (rect.y !== this.currentPosition.y) ||
        (rect.width !== this.currentPosition.width) ||
        (rect.height !== this.currentPosition.height)) {

        this.move(rect.x, rect.y);
        this.resize(rect.width, rect.height);
      }
    };

    trackingFun();
    this.trackingInterval = window.setInterval(trackingFun, DISPLAY_ELEMENT_POLLING_INTERVAL);
  }

  getScaledRectangle(rect: ClientRect): IRectangle {
    const factor: number = this.windowsService.state[this.windowId].scaleFactor;

    return {
      x: rect.left * factor,
      y: rect.top * factor,
      width: rect.width * factor,
      height: rect.height * factor
    };
  }

  move(x: number, y: number) {
    this.currentPosition.x = x;
    this.currentPosition.y = y;
    nodeObs.OBS_content_moveDisplay(this.name, x, y);
  }

  resize(width: number, height: number) {
    this.currentPosition.width = width;
    this.currentPosition.height = height;
    nodeObs.OBS_content_resizeDisplay(this.name, width, height);
    if (this.outputRegionCallbacks.length) this.refreshOutputRegion();
  }

  destroy() {
    remote.getCurrentWindow().removeListener('close', this.boundDestroy);
    nodeObs.OBS_content_destroyDisplay(this.name);
    if (this.trackingInterval) clearInterval(this.trackingInterval);
    if (this.selectionSubscription) this.selectionSubscription.unsubscribe();
  }

  onOutputResize(cb: (region: IRectangle) => void) {
    this.outputRegionCallbacks.push(cb);
  }

  refreshOutputRegion() {
    const position = nodeObs.OBS_content_getDisplayPreviewOffset(this.name);
    const size = nodeObs.OBS_content_getDisplayPreviewSize(this.name);

    this.outputRegion = {
      ...position,
      ...size
    };

    this.outputRegionCallbacks.forEach(cb => {
      cb(this.outputRegion);
    });
  }

  setShoulddrawUI(drawUI: boolean) {
    nodeObs.OBS_content_setShouldDrawUI(this.name, drawUI);
  }

  switchGridlines(enabled: boolean) {
    nodeObs.OBS_content_setDrawGuideLines(this.name, enabled);
  }
}

export class VideoService extends Service {

  @Inject()
  settingsService: SettingsService;

  activeDisplays: Dictionary<Display> = {};

  init() {
    this.settingsService.loadSettingsIntoStore();

    // Watch for changes to the base resolution.
    // This seems super freaking hacky.
    this.settingsService.store.watch(state => {
      return state.SettingsService.Video.Base;
    }, () => {
      // This gives the setting time to propagate
      setTimeout(() => {
        Object.values(this.activeDisplays).forEach(display => {
          display.refreshOutputRegion();
        });
      }, 1000);
    });
  }

  // Generates a random string:
  // https://gist.github.com/6174/6062387
  getRandomDisplayId() {
    return Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);
  }

  getScreenRectangle() {
    return new ScalableRectangle({
      x: 0,
      y: 0,
      width: this.baseWidth,
      height: this.baseHeight
    });
  }

  get baseWidth() {
    return this.baseResolution.width;
  }

  get baseHeight() {
    return this.baseResolution.height;
  }

  get baseResolution() {
    const [widthStr, heightStr] = this.settingsService.state.Video.Base.split('x');
    const width = parseInt(widthStr, 10);
    const height = parseInt(heightStr, 10);

    return {
      width,
      height
    };
  }

}
