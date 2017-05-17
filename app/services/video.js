import { Service } from './service';
import SettingsService from './settings';
import Obs from '../api/Obs';

const nodeObs = Obs.nodeObs;
const { remote } = window.require('electron');

class Display {

  constructor(name) {
    this.name = name;
    nodeObs.OBS_content_createDisplay(
      remote.getCurrentWindow().getNativeWindowHandle(),
      name
    );
    this.outputRegionCallbacks = [];

    // Watch for changes to the base resolution.
    // This seems super freaking hacky.
    SettingsService.instance.store.watch((state) => {
      return state.SettingsService.Video.Base;
    }, () => {
      // This gives the setting time to propagate
      setTimeout(() => {
        this.refreshOutputRegion();
      }, 1000);
    });
  }

  move(x, y) {
    nodeObs.OBS_content_moveDisplay(this.name, x, y);
  }

  resize(width, height) {
    nodeObs.OBS_content_resizeDisplay(this.name, width, height);
    this.refreshOutputRegion();
  }

  destroy() {
    nodeObs.OBS_content_destroyDisplay(this.name);
  }

  onOutputResize(cb) {
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

export default class VideoService extends Service {

  init() {
    SettingsService.instance.loadSettingsIntoStore();
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
    console.log("BASE WIDTH");
    return this.baseResolution.width;
  }

  get baseHeight() {
    return this.baseResolution.height;
  }

  get baseResolution() {
    const [widthStr, heightStr] = SettingsService.instance.state.Video.Base.split('x');
    const width = parseInt(widthStr);
    const height = parseInt(heightStr);

    return {
      width,
      height
    };
  }

}
