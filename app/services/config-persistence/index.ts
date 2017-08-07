import { Service } from '../service';
import { RootNode } from './nodes/root';
import { SourcesNode } from './nodes/sources';
import { ScenesNode } from './nodes/scenes';
import { SceneItemsNode } from './nodes/scene-items';
import { TransitionNode } from './nodes/transition';
import { FiltersNode } from './nodes/filters';
import electron from '../../vendor/electron';
import { ScenesService } from '../scenes';
import { SourcesService } from '../sources';
import { throttle } from 'lodash-decorators';

const NODE_TYPES = {
  RootNode,
  SourcesNode,
  ScenesNode,
  SceneItemsNode,
  TransitionNode,
  FiltersNode
};

const fs = window['require']('fs');
const path = window['require']('path');

// This class exposes the public API for saving and loading
// the scene configuration.  This service and its supporting
// code is responsible for mainting a strict versioned schema
// for the config files, and handling any data migrations from
// one version to another.

export class ConfigPersistenceService extends Service {

  scenesService: ScenesService = ScenesService.instance;
  sourcesService: SourcesService = SourcesService.instance;

  @throttle(5000)
  save() {
    this.rawSave();
  }


  rawSave() {
    const root = new RootNode();
    root.save();
    this.ensureDirectory();
    fs.writeFileSync(this.configFilePath, JSON.stringify(root, null, 2));
  }


  load(config: string) {
    if (fs.existsSync(this.configFilePath)) {
      const data = fs.readFileSync(this.configFilePath);
      const root = this.parse(data);
      root.load();
    } else {
      this.setUpDefaults();
      this.save();
    }
  }


  parse(config: string) {
    return JSON.parse(config, (key, value) => {
      if ((typeof value === 'object') && (value !== null) && value.nodeType) {
        const instance = new NODE_TYPES[value.nodeType]();

        instance.fromJSON(value);

        return instance;
      } else {
        return value;
      }
    });
  }


  // Rather than having a default config file that would require
  // updating every time we change the schema, we simply put the
  // application into the desired state and save.
  setUpDefaults() {
    this.scenesService.createScene('Scene', { makeActive: true });
    this.sourcesService.createSource('DefaultAudioInput', 'wasapi_input_capture', { isGlobal: true });
    this.sourcesService.createSource('DefaultAudioOutput', 'wasapi_output_capture', { isGlobal: true });
  }


  ensureDirectory() {
    if (!fs.existsSync(this.configFileDirectory)) {
      fs.mkdirSync(this.configFileDirectory);
    }
  }


  get configFileDirectory() {
    return path.join(electron.remote.app.getPath('userData'), 'SceneConfigs');
  }


  get configFilePath() {
    // Eventually this will be changeable by the user
    return path.join(this.configFileDirectory, 'default.json');
  }

}
