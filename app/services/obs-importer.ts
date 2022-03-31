import electron from 'electron';
import { StatefulService, ViewHandler } from 'services/core/stateful-service';
import fs from 'fs';
import path from 'path';
import { ScenesService } from 'services/scenes';
import { SourcesService, TPropertiesManager } from 'services/sources';
import { WidgetsService } from 'services/widgets';
import { TSourceType } from 'services/sources/sources-api';
import { SourceFiltersService, TSourceFilterType } from 'services/source-filters';
import { TransitionsService, ETransitionType } from 'services/transitions';
import { AudioService } from 'services/audio';
import { Inject } from 'services/core/injector';
import { SceneCollectionsService } from 'services/scene-collections';
import * as obs from '../../obs-api';
import { SettingsService } from 'services/settings';
import { AppService } from 'services/app';
import { RunInLoadingMode } from 'services/app/app-decorators';
import defaultTo from 'lodash/defaultTo';
import { $t } from 'services/i18n';
import * as remote from '@electron/remote';

interface Source {
  name?: string;
  sourceId?: string;
}

interface ISceneCollection {
  filename: string;
  name: string;
}

interface IOBSConfigFilter {
  id: TSourceFilterType;
  name: string;
  enabled: boolean;
  settings: Dictionary<any>;
}

interface IOBSConfigSceneItem {
  name: string;
  crop_top: number;
  crop_right: number;
  crop_bottom: number;
  crop_left: number;
  pos: IVec2;
  scale: IVec2;
  visible: boolean;
  bounds: IVec2;
  bounds_align: number;
  bounds_type: number;
}

interface IOBSConfigSource {
  id: TSourceType;
  name: string;
  settings: {
    shutdown?: boolean;
    items?: IOBSConfigSceneItem[];
    url?: string;
  };
  channel?: number;
  muted: boolean;
  volume: number;
  filters: IOBSConfigFilter[];
  mixers: number;
  monitoring_type: number;
  sync: number;
  flags: number;
}

interface IOBSConfigTransition {
  id: string;
}

interface IOBSConfigJSON {
  sources: IOBSConfigSource[];
  current_scene: string;
  scene_order: { name: string }[];
  transitions: IOBSConfigTransition[];
  transition_duration: number;
}

class ObsImporterViews extends ViewHandler<{ progress: number; total: number }> {
  get OBSconfigFileDirectory() {
    return path.join(remote.app.getPath('appData'), 'obs-studio');
  }

  get sceneCollectionsDirectory() {
    return path.join(this.OBSconfigFileDirectory, 'basic/scenes/');
  }

  get profilesDirectory() {
    return path.join(this.OBSconfigFileDirectory, 'basic/profiles');
  }

  isOBSinstalled() {
    return fs.existsSync(this.OBSconfigFileDirectory);
  }
}

export class ObsImporterService extends StatefulService<{ progress: number; total: number }> {
  @Inject() scenesService: ScenesService;
  @Inject() sourcesService: SourcesService;
  @Inject() widgetsService: WidgetsService;
  @Inject('SourceFiltersService') filtersService: SourceFiltersService;
  @Inject() transitionsService: TransitionsService;
  @Inject() sceneCollectionsService: SceneCollectionsService;
  @Inject() audioService: AudioService;
  @Inject() settingsService: SettingsService;
  @Inject() appService: AppService;

  get views() {
    return new ObsImporterViews(this.state);
  }

  @RunInLoadingMode()
  async import() {
    await this.load();
  }

  async load(selectedProfile?: string) {
    if (!this.views.isOBSinstalled()) return;
    // Scene collections
    const collections = this.getSceneCollections();
    for (const collection of collections) {
      await this.importCollection(collection);
    }

    // Profile
    if (selectedProfile) this.importProfile(selectedProfile);

    // Select current scene collection
    const globalConfigFile = path.join(this.views.OBSconfigFileDirectory, 'global.ini');

    const data = fs.readFileSync(globalConfigFile).toString();

    if (data) {
      const match = data.match(/^SceneCollection\=(.*)$/m);
      if (match && match[1]) {
        const coll = this.sceneCollectionsService.collections.find(co => co.name === match[1]);
        if (coll) this.sceneCollectionsService.load(coll.id);
      }
    }

    obs.NodeObs.OBS_service_resetVideoContext();
    obs.NodeObs.OBS_service_resetAudioContext();

    // Ensure we reload any updated settings
    this.settingsService.loadSettingsIntoStore();
  }

  private async importCollection(collection: ISceneCollection) {
    const sceneCollectionPath = path.join(
      this.views.sceneCollectionsDirectory,
      collection.filename,
    );
    if (sceneCollectionPath.indexOf('.json') === -1) {
      return true;
    }
    const configJSON: IOBSConfigJSON = JSON.parse(fs.readFileSync(sceneCollectionPath).toString());

    await this.sceneCollectionsService.create({
      name: collection.name,
      setupFunction: () => {
        this.importSources(configJSON);
        this.importScenes(configJSON);
        this.importSceneOrder(configJSON);
        this.importMixerSources(configJSON);
        this.importTransitions(configJSON);

        return this.scenesService.views.scenes.length !== 0;
      },
    });
  }

  importFilters(filtersJSON: IOBSConfigFilter[], source: Source) {
    if (Array.isArray(filtersJSON)) {
      filtersJSON.forEach(filterJSON => {
        const isFilterAvailable = this.filtersService.state.types.find(availableFilter => {
          return availableFilter.type === filterJSON.id;
        });

        if (isFilterAvailable) {
          const sourceId = this.sourcesService.views.getSourcesByName(source.name)[0].sourceId;

          const filter = this.filtersService.add(sourceId, filterJSON.id, filterJSON.name);
          filter.enabled = filterJSON.enabled;

          // Setting properties
          const properties = this.filtersService.getPropertiesFormData(sourceId, filterJSON.name);

          if (properties) {
            if (Array.isArray(properties)) {
              properties.forEach(property => {
                if (filterJSON.settings[property.name]) {
                  property.value = filterJSON.settings[property.name];
                }
              });
            }
          }

          this.filtersService.setPropertiesFormData(sourceId, filterJSON.name, properties);
        } else {
          // TODO Report to the user that slobs does not support the filter
        }
      });
    }
  }

  importSources(configJSON: IOBSConfigJSON) {
    const sourcesJSON = configJSON.sources;

    if (Array.isArray(sourcesJSON)) {
      sourcesJSON.forEach(sourceJSON => {
        const isSourceAvailable = this.sourcesService
          .getAvailableSourcesTypes()
          .includes(sourceJSON.id);

        if (isSourceAvailable) {
          if (sourceJSON.id !== 'scene') {
            let propertiesManager: TPropertiesManager = 'default';
            let propertiesManagerSettings: Dictionary<any> = {};

            if (sourceJSON.id === 'browser_source') {
              sourceJSON.settings.shutdown = true;
              const widgetType: number = this.widgetsService.getWidgetTypeByUrl(
                sourceJSON.settings.url,
              );
              if (widgetType !== -1) {
                propertiesManager = 'widget';
                propertiesManagerSettings = { widgetType };
              }
            }

            // Check "Shutdown source when not visible" by default for browser sources
            const source = this.sourcesService.createSource(
              sourceJSON.name,
              sourceJSON.id,
              sourceJSON.settings,
              {
                propertiesManager,
                propertiesManagerSettings,
                channel: sourceJSON.channel !== 0 ? sourceJSON.channel : void 0,
              },
            );

            if (source.audio) {
              const defaultMonitoring =
                source.type === 'browser_source'
                  ? obs.EMonitoringType.MonitoringOnly
                  : obs.EMonitoringType.None;

              this.audioService.views.getSource(source.sourceId).setMuted(sourceJSON.muted);
              this.audioService.views.getSource(source.sourceId).setMul(sourceJSON.volume);
              this.audioService.views.getSource(source.sourceId).setSettings({
                audioMixers: defaultTo(sourceJSON.mixers, 255),
                monitoringType: defaultTo(sourceJSON.monitoring_type, defaultMonitoring),
                syncOffset: defaultTo(sourceJSON.sync / 1000000, 0),
                forceMono: !!(sourceJSON.flags & obs.ESourceFlags.ForceMono),
              });
            }

            // Adding the filters
            const filtersJSON = sourceJSON.filters;
            this.importFilters(filtersJSON, source);
          }
        } else {
          // TODO Report to the user that slobs does not support the source
        }
      });
    }
  }

  importScenes(configJSON: IOBSConfigJSON) {
    const sourcesJSON = configJSON.sources;
    const currentScene = configJSON.current_scene;

    // OBS uses unique scene names instead id
    // so create a mapping variable
    const nameToIdMap: Dictionary<string> = {};

    if (Array.isArray(sourcesJSON)) {
      // Create all the scenes
      sourcesJSON.forEach(sourceJSON => {
        if (sourceJSON.id === 'scene') {
          const scene = this.scenesService.createScene(sourceJSON.name, {
            makeActive: sourceJSON.name === currentScene,
          });
          nameToIdMap[scene.name] = scene.id;
        }
      });

      // Add all the sceneItems to every scene
      sourcesJSON.forEach(sourceJSON => {
        if (sourceJSON.id === 'scene') {
          const scene = this.scenesService.views.getScene(nameToIdMap[sourceJSON.name]);
          if (!scene) return;

          const sceneItems = sourceJSON.settings.items;
          if (Array.isArray(sceneItems)) {
            // Looking for the source to add to the scene
            sceneItems.forEach(item => {
              const sourceToAdd = this.sourcesService.views.getSources().find(source => {
                return source.name === item.name;
              });
              if (sourceToAdd) {
                const sceneItem = scene.addSource(sourceToAdd.sourceId);

                const crop = {
                  bottom: item.crop_bottom,
                  left: item.crop_left,
                  right: item.crop_right,
                  top: item.crop_top,
                };
                const pos = item.pos;
                const scale = item.scale;

                if (
                  item.bounds &&
                  item.bounds.x &&
                  item.bounds.y &&
                  item.bounds_align === 0 &&
                  [1, 2].includes(item.bounds_type)
                ) {
                  // Stretch
                  scale.x = item.bounds.x / sourceToAdd.width;
                  scale.y = item.bounds.y / sourceToAdd.height;

                  // Fit
                  if (item.bounds_type === 2) {
                    if (scale.x > scale.y) {
                      scale.x = scale.y;

                      // Account for centering in the bounding box
                      const actualWidth = sourceToAdd.width * scale.x;
                      pos.x += (item.bounds.x - actualWidth) / 2;
                    } else {
                      scale.y = scale.x;

                      // Account for centering in the bounding box
                      const actualHeight = sourceToAdd.height * scale.y;
                      pos.y += (item.bounds.y - actualHeight) / 2;
                    }
                  }
                }

                sceneItem.setSettings({
                  visible: item.visible,
                  transform: {
                    crop,
                    scale,
                    position: pos,
                  },
                });
              }
            });
          }
        }
      });
    }
  }

  importSceneOrder(configJSON: IOBSConfigJSON) {
    const sceneNames: string[] = [];
    const sceneOrderJSON = configJSON.scene_order;
    const listScene = this.scenesService.views.scenes;

    if (Array.isArray(sceneOrderJSON)) {
      sceneOrderJSON.forEach(obsScene => {
        sceneNames.push(
          listScene.find(scene => {
            return scene.name === obsScene.name;
          }).id,
        );
      });
    }
    this.scenesService.setSceneOrder(sceneNames);
  }

  importMixerSources(configJSON: IOBSConfigJSON) {
    const channelNames = [
      'DesktopAudioDevice1',
      'DesktopAudioDevice2',
      'AuxAudioDevice1',
      'AuxAudioDevice2',
      'AuxAudioDevice3',
    ];
    channelNames.forEach((channelName, i) => {
      const obsAudioSource = configJSON[channelName];
      if (obsAudioSource) {
        const isSourceAvailable = this.sourcesService
          .getAvailableSourcesTypes()
          .includes(obsAudioSource.id);

        if (!isSourceAvailable) return;

        const newSource = this.sourcesService.createSource(
          obsAudioSource.name,
          obsAudioSource.id,
          { device_id: obsAudioSource.settings.device_id },
          { channel: i + 1 },
        );

        const audioSource = this.audioService.views.getSource(newSource.sourceId);

        audioSource.setMuted(obsAudioSource.muted);
        audioSource.setMul(obsAudioSource.volume);
        audioSource.setSettings({
          audioMixers: obsAudioSource.mixers,
          monitoringType: obsAudioSource.monitoring_type,
          syncOffset: obsAudioSource.sync / 1000000,
          forceMono: !!(obsAudioSource.flags & obs.ESourceFlags.ForceMono),
        });

        this.importFilters(obsAudioSource.filters, newSource);
      }
    });
  }

  // TODO: Fix this function
  importTransitions(configJSON: IOBSConfigJSON) {
    // Only import a single transition from OBS for now.
    // Eventually we should import all transitions
    if (
      configJSON.transitions &&
      configJSON.transitions.length > 0 &&
      // only import if it's a supported transition type
      this.transitionsService.views
        .getTypes()
        .map(t => t.value)
        .includes(configJSON.transitions[0].id as ETransitionType)
    ) {
      this.transitionsService.deleteAllTransitions();
      this.transitionsService.createTransition(
        configJSON.transitions[0].id as ETransitionType,
        $t('Global Transition'),
        { duration: configJSON.transition_duration },
      );
    }
  }

  importProfile(profile: string) {
    const profileDirectory = path.join(this.views.profilesDirectory, profile);
    const files = fs.readdirSync(profileDirectory);

    files.forEach(file => {
      if (file === 'basic.ini' || file === 'streamEncoder.json' || file === 'recordEncoder.json') {
        const obsFilePath = path.join(profileDirectory, file);

        const appData = this.appService.appDataDirectory;
        const currentFilePath = path.join(appData, file);

        const readData = fs.readFileSync(obsFilePath);
        fs.writeFileSync(currentFilePath, readData);
      }
    });
  }

  getSceneCollections(): ISceneCollection[] {
    if (!this.views.isOBSinstalled()) return [];
    if (!fs.existsSync(this.views.sceneCollectionsDirectory)) return [];

    let files = fs.readdirSync(this.views.sceneCollectionsDirectory);

    files = files.filter(file => !file.match(/\.bak$/));
    return files.map(file => {
      return {
        filename: file,
        name: file.replace('_', ' ').replace('.json', ''),
      };
    });
  }

  getProfiles(): string[] {
    if (!this.views.isOBSinstalled()) return [];

    let profiles = fs.readdirSync(this.views.profilesDirectory);
    profiles = profiles.filter(profile => !profile.match(/\./));
    return profiles;
  }
}
