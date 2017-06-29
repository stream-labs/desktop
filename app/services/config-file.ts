import { nodeObs } from './obs-api';
import { ScenesService } from './scenes';
import { Service } from './service';
import { throttle } from 'lodash-decorators';

const CONFIG_SAVE_INTERVAL = 60 * 1000;

/**
 * Singleton for loading and saving from a config file.
 * Currently only a single config file is supported.
 */
export class ConfigFileService extends Service {

  private scenesService: ScenesService = ScenesService.instance;


  init() {
    setInterval(() => this.save(), CONFIG_SAVE_INTERVAL);
  }


  load() {
    nodeObs.OBS_content_loadConfigFile();
    this.scenesService.loadSceneConfig();
  }

  // Calling save is expensive, so only call it at most
  // every 5 seconds.
  @throttle(5000)
  save() {
    this.rawSave();
  }

  rawSave() {
    nodeObs.OBS_content_saveIntoConfigFile();
  }
}
