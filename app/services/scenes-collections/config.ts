import { PersistentStatefulService } from '../persistent-stateful-service';
import { mutation } from '../stateful-service';
import { Inject } from '../../util/injector';
import { RootNode } from './nodes/root';
import { ISourceInfo, SourcesNode } from './nodes/sources';
import { ISceneSchema, ScenesNode } from './nodes/scenes';
import { SceneItemsNode, ISceneItemInfo } from './nodes/scene-items';
import { TransitionNode } from './nodes/transition';
import { HotkeysNode } from './nodes/hotkeys';
import { WindowsService } from '../windows';
import namingHelpers from '../../util/NamingHelpers';
import electron from 'electron';
import { ScenesService } from '../scenes';
import { SourcesService } from '../sources';
import { E_AUDIO_CHANNELS } from '../audio';
import { throttle } from 'lodash-decorators';
import { parse } from '.';
import fs from 'fs';
import path from 'path';
import {
  ISceneCollectionSchema,
  IScenesCollectionsServiceApi,
  IScenesCollectionState
} from './scenes-collections-api';

export const CONFIG_NODE_TYPES = {
  RootNode,
  SourcesNode,
  ScenesNode,
  SceneItemsNode,
  TransitionNode,
  HotkeysNode
};

const DEFAULT_SCENES_COLLECTION_NAME = 'scenes';

/**
 * This class exposes the public API for saving and loading
 * the scene configuration.  This service and its supporting
 * code is responsible for mainting a strict versioned schema
 * for the config files, and handling any data migrations from
 * one version to another.
 */
export class ScenesCollectionsService extends PersistentStatefulService<
  IScenesCollectionState
> implements IScenesCollectionsServiceApi {
  static defaultState: IScenesCollectionState = {
    activeCollection: '',
    scenesCollections: []
  };

  @Inject() scenesService: ScenesService;
  @Inject() sourcesService: SourcesService;
  @Inject() windowsService: WindowsService;

  init() {
    super.init();
    this.CLEAR_SCENES_COLLECTIONS();
    if (!fs.existsSync(this.configFileDirectory)) return;

    const configsNames = fs.readdirSync(this.configFileDirectory).filter(fileName => {
      return !fileName.match(/\.bak$/);
    }).map(file => file.replace(/\.[^/.]+$/, ''))
      .filter(configName => configName); // rid of empty config names caused by '.json' file

    this.ADD_SCENES_COLLECTIONS(configsNames);
  }

  @throttle(5000)
  save() {
    this.rawSave();
  }

  getState(): IScenesCollectionState {
    return this.state;
  }

  rawSave(configName?: string): Promise<void> {
    configName = configName || this.state.activeCollection;

    return new Promise(resolve => {
      const root = new RootNode();
      root.save().then(() => {
        this.ensureDirectory();
        const configFileName = this.getConfigFilePath(configName);

        if (!this.hasConfig(configName)) {
          this.ADD_SCENES_COLLECTIONS([configName]);
        }
        this.SET_ACTIVE_COLLECTION(configName);

        fs.writeFileSync(configFileName, JSON.stringify(root, null, 2));

        resolve();
      });
    });
  }

  load(configName?: string): Promise<void> {
    configName = configName || this.state.activeCollection;

    if (!this.hasConfig(configName)) {
      configName = this.state.scenesCollections[0];
    }

    return new Promise(resolve => {
      const data = fs
        .readFileSync(this.getConfigFilePath(configName))
        .toString();
      if (data != null) {
        try {
          const root = parse(data, CONFIG_NODE_TYPES);
          this.SET_ACTIVE_COLLECTION(configName);
          root
            .load()
            .then(() => {
              // Make sure we actually loaded at least one scene, otherwise
              // create the default one
              if (this.scenesService.scenes.length === 0) this.setUpDefaults();
              resolve();
            })
            .catch((error: any) => {
              // TODO: Download a backup
            });
        } catch (e) {
          // TODO: Download a backup
        }
      } else {
        this.switchToBlankConfig(configName);
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

  duplicateConfig(toConfig: string): Promise<void> {
    return new Promise(resolve => {
      this.rawSave().then(() => {
        this.rawSave(toConfig).then(() => resolve());
      });
    });
  }

  renameConfig(newName: string) {
    fs.renameSync(
      this.getConfigFilePath(this.state.activeCollection),
      this.getConfigFilePath(newName)
    );
    this.RENAME_COLLECTION(this.state.activeCollection, newName);
    this.SET_ACTIVE_COLLECTION(newName);
  }

  /**
   * removes active config
   * use AppService.removeConfig() to remove the config and to switch to the new one
   */
  removeConfig() {
    const configName = this.state.activeCollection;
    fs.unlinkSync(this.getConfigFilePath(configName));
    this.REMOVE_COLLECTION(configName);
  }

  hasConfig(configName: string): boolean {
    return this.state.scenesCollections.includes(configName);
  }

  hasConfigs() {
    return this.state.scenesCollections.length > 0;
  }

  switchToBlankConfig(configName = DEFAULT_SCENES_COLLECTION_NAME) {
    this.switchToEmptyConfig(configName);
    this.setUpDefaults();
  }

  switchToEmptyConfig(configName: string) {
    if (this.scenesService.state.scenes.length) {
      throw 'unable to switch to blank config while current config is loaded';
    }
    this.SET_ACTIVE_COLLECTION(configName);
    this.ADD_SCENES_COLLECTIONS([configName]);
  }

  suggestName(name: string) {
    return namingHelpers.suggestName(name, (name: string) =>
      this.state.scenesCollections.includes(name)
    );
  }

  /**
   * scene collection name actually is file name
   * so we have to validate it
   */
  isValidName(name: string) {
    return /^[^\/\\\.]+$/.test(name);
  }

  private ensureDirectory() {
    if (!fs.existsSync(this.configFileDirectory)) {
      fs.mkdirSync(this.configFileDirectory);
    }
  }

  private get configFileDirectory() {
    return path.join(electron.remote.app.getPath('userData'), 'SceneConfigs');
  }

  private getConfigFilePath(configName: string) {
    // Eventually this will be changeable by the user
    return path.join(this.configFileDirectory, `${configName}.json`);
  }

  showNameConfig(
    options: { scenesCollectionToDuplicate?: string; rename?: boolean } = {}
  ) {
    this.windowsService.showWindow({
      componentName: 'NameSceneCollection',
      queryParams: {
        scenesCollectionToDuplicate: options.scenesCollectionToDuplicate,
        rename: options.rename ? 'true' : ''
      },
      size: {
        width: 400,
        height: 250
      }
    });
  }

  fetchSceneCollectionsSchema(): Promise<Dictionary<ISceneCollectionSchema>> {
    return new Promise(resolve => {
      const schemes: Dictionary<ISceneCollectionSchema> = {};
      const parseTasks: Promise<void>[] = [];
      this.state.scenesCollections.forEach(configName => {
        parseTasks.push(
          new Promise(resolveTask => {
            fs.readFile(this.getConfigFilePath(configName), (err, contents) => {
              const data = contents.toString();
              const root = parse(data, CONFIG_NODE_TYPES);
              const collectionScheme = {
                scenes: root.data.scenes.data.items.map(
                  (sceneData: ISceneSchema) => {
                    return {
                      id: sceneData.id,
                      name: sceneData.name,
                      sceneItems: sceneData.sceneItems.data.items.map(
                        (sceneItemData: ISceneItemInfo) => {
                          return {
                            sceneItemId: sceneItemData.id,
                            sourceId: sceneItemData.sourceId
                          };
                        }
                      )
                    };
                  }
                ),

                sources: root.data.sources.data.items.map(
                  (sourceData: ISourceInfo) => {
                    return {
                      id: sourceData.id,
                      name: sourceData.name,
                      type: sourceData.type,
                      channel: sourceData.channel
                    };
                  }
                )
              };

              schemes[configName] = collectionScheme;
              resolveTask();
            });
          })
        );
      });

      return Promise.all(parseTasks).then(() => resolve(schemes));
    });
  }

  @mutation()
  private CLEAR_SCENES_COLLECTIONS() {
    this.state.scenesCollections.length = 0;
  }

  @mutation()
  private ADD_SCENES_COLLECTIONS(configNames: string[]) {
    this.state.scenesCollections.push(...configNames);
  }

  @mutation()
  private SET_ACTIVE_COLLECTION(collectionName: string) {
    this.state.activeCollection = collectionName;
  }

  @mutation()
  private RENAME_COLLECTION(currentName: string, newName: string) {
    const collections = this.state.scenesCollections;
    collections.splice(collections.indexOf(currentName), 1, newName);
  }

  @mutation()
  private REMOVE_COLLECTION(name: string) {
    this.state.scenesCollections.splice(
      this.state.scenesCollections.indexOf(name),
      1
    );
  }
}
