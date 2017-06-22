import Obs from '../api/Obs';
import { ScenesService } from './scenes';
import { Service } from './service';
import { throttle } from 'lodash-decorators';

/**
 * Singleton for loading and saving from a config file.
 * Currently only a single config file is supported.
 */
export class ConfigFileService extends Service {

  load() {
    Obs.loadConfig();
    ScenesService.instance.loadSceneConfig();
  }

  // Calling save is expensive, so only call it at most
  // every 5 seconds.
  @throttle(5000)
  save() {
    this.rawSave();
  }

  rawSave() {
    Obs.saveConfig();
  }
}
