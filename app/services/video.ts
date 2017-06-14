import { Service, Inject } from './service';
import { SettingsService } from './settings';
import Obs from '../api/Obs';
import electron from '../vendor/electron';

const nodeObs = Obs.nodeObs as Dictionary<Function>;
const { remote } = electron;

export interface IOutputRegion {
  width: number;
  height: number;
  x: number;
  y: number;
}

export class Display {

  outputRegionCallbacks: Function[];
  outputRegion: IOutputRegion;

  constructor(public name: string) {
    this.name = name;
    nodeObs.OBS_content_createDisplay(
      remote.getCurrentWindow().getNativeWindowHandle(),
      name
    );
    this.outputRegionCallbacks = [];

    // Watch for changes to the base resolution.
    // This seems super freaking hacky.
    SettingsService.instance.store.watch((state: any) => {
      return state.SettingsService.Video.Base;
    }, () => {
      // This gives the setting time to propagate
      setTimeout(() => {
        this.refreshOutputRegion();
      }, 1000);
    });
  }

  move(x: number, y: number) {
    nodeObs.OBS_content_moveDisplay(this.name, x, y);
  }

  resize(width: number, height: number) {
    nodeObs.OBS_content_resizeDisplay(this.name, width, height);
    this.refreshOutputRegion();
  }

  destroy() {
    nodeObs.OBS_content_destroyDisplay(this.name);
  }

  onOutputResize(cb: Function) {
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
