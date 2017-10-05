import { Service } from './service';
import { SettingsService } from './settings';
import { nodeObs } from './obs-api';
import electron from 'electron';
import { Inject } from '../util/injector';

const { remote } = electron;

const DISPLAY_ELEMENT_POLLING_INTERVAL = 500;

export class Display {

  @Inject()
  settingsService: SettingsService;

  outputRegionCallbacks: Function[];
  outputRegion: IRectangle;

  trackingInterval: number;
  currentPosition: IRectangle = {
    x: 0,
    y: 0,
    width: 0,
    height: 0
  };

  constructor(public name: string) {
    nodeObs.OBS_content_createDisplay(
      remote.getCurrentWindow().getNativeWindowHandle(),
      name
    );
    this.outputRegionCallbacks = [];

    // Watch for changes to the base resolution.
    // This seems super freaking hacky.
    this.settingsService.store.watch(state => {
      return state.SettingsService.Video.Base;
    }, () => {
      // This gives the setting time to propagate
      setTimeout(() => {
        this.refreshOutputRegion();
      }, 1000);
    });

    nodeObs.OBS_content_setPaddingColor(name, 11, 22, 28);
  }

  /**
   * Will keep the display positioned on top of the passed HTML element
   * @param element the html element to host the display
   */
  trackElement(element: HTMLElement) {
    if (this.trackingInterval) clearInterval(this.trackingInterval);

    const trackingFun = () => {
      const rect = element.getBoundingClientRect();

      if ((rect.left !== this.currentPosition.x) ||
        (rect.top !== this.currentPosition.y) ||
        (rect.width !== this.currentPosition.width) ||
        (rect.height !== this.currentPosition.height)) {

        this.move(rect.left, rect.top);
        this.resize(rect.width, rect.height);
      }
    };

    trackingFun();
    this.trackingInterval = window.setInterval(trackingFun, DISPLAY_ELEMENT_POLLING_INTERVAL);
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
    this.refreshOutputRegion();
  }

  destroy() {
    nodeObs.OBS_content_destroyDisplay(this.name);
    if (this.trackingInterval) clearInterval(this.trackingInterval);
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

}

export class VideoService extends Service {

  @Inject()
  settingsService: SettingsService;

  init() {
    this.settingsService.loadSettingsIntoStore();
  }

  createDisplay() {
    return new Display(this.getRandomDisplayId());
  }

  // Generates a random string:
  // https://gist.github.com/6174/6062387
  getRandomDisplayId() {
    return Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);
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
