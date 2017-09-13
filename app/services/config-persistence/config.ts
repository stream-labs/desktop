import { Service } from '../service';
import { RootNode } from './nodes/root';
import { SourcesNode } from './nodes/sources';
import { ScenesNode } from './nodes/scenes';
import { SceneItemsNode } from './nodes/scene-items';
import { TransitionNode } from './nodes/transition';
import { FiltersNode } from './nodes/filters';
import { HotkeysNode } from './nodes/hotkeys';
import electron from '../../vendor/electron';
import { ScenesService } from '../scenes';
import { SourcesService } from '../sources';
import { E_AUDIO_CHANNELS } from '../audio';
import { throttle } from 'lodash-decorators';
import { parse } from '.';
import fs from 'fs';
import path from 'path';

const NODE_TYPES = {
  RootNode,
  SourcesNode,
  ScenesNode,
  SceneItemsNode,
  TransitionNode,
  FiltersNode,
  HotkeysNode
};

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
    return this.rawSave();
  }


  rawSave(): Promise<void> {
    return new Promise(resolve => {
      const root = new RootNode();
      root.save().then(() => {
        this.ensureDirectory();
        fs.writeFileSync(this.configFilePath, JSON.stringify(root, null, 2));
        resolve();
      });
    });
  }


  load(): Promise<void> {
    return new Promise(resolve => {
      if (fs.existsSync(this.configFilePath)) {
        const data = fs.readFileSync(this.configFilePath).toString();
        const root = parse(data, NODE_TYPES);
        root.load().then(() => {
          // Make sure we actually loaded at least one scene, otherwise
          // create the default one
          if (this.scenesService.scenes.length === 0) this.setUpDefaults();
          resolve();
        });
      } else {
        this.setUpDefaults();
        this.save();
        resolve();
      }
    });
  }


  // Rather than having a default config file that would require
  // updating every time we change the schema, we simply put the
  // application into the desired state and save.
  setUpDefaults() {
    this.scenesService.createScene('Scene', { makeActive: true });
    this.setUpDefaultAudio();
  }


  setUpDefaultAudio() {
    this.sourcesService.createSource(
      'DesktopAudioDevice1',
      'wasapi_output_capture',
      {},
      { channel: E_AUDIO_CHANNELS.OUTPUT_1 }
    );

    this.sourcesService.createSource(
      'AuxAudioDevice1',
      'wasapi_input_capture',
      {},
      { channel: E_AUDIO_CHANNELS.INPUT_1 }
    );
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
