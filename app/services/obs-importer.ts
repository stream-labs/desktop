
import electron from '../vendor/electron';
import { Service } from './service';
import fs from 'fs';
import path from 'path';
import { parse } from './config-persistence/';
import { ScenesService } from './scenes';
import { SourcesService } from './sources';
import  SourceFiltersService from './source-filters';
import { ScenesTransitionsService } from './scenes-transitions';
import { Inject } from '../util/injector';

interface Source {
  name?: string;
  sourceId?: string;
}

interface ISceneCollection {
  filename: string;
  name: string;
}

export class ObsImporterService extends Service {

  @Inject()
  scenesService: ScenesService;

  @Inject()
  sourcesService: SourcesService;

  @Inject('SourceFiltersService')
  filtersService: SourceFiltersService;

  @Inject('ScenesTransitionsService')
  transitionsService: ScenesTransitionsService;

  load(sceneCollectionSelected: ISceneCollection) {
    if (this.isOBSinstalled()) {
      const sceneCollectionPath = path.join(this.sceneCollectionsDirectory, sceneCollectionSelected.filename);
      const data = fs.readFileSync(sceneCollectionPath).toString();
      const root = this.parseOBSconfig(data);
    }
  }

  parseOBSconfig(config: string) {
    const configJSON = JSON.parse(config);

    this.importSources(configJSON);
    this.importScenes(configJSON);
    this.importSceneOrder(configJSON);
    this.importMixerSources(configJSON);
    this.importTransitions(configJSON);
  }

  importFilters(filtersJSON :any, source :Source) {
    if (Array.isArray(filtersJSON)) {
      filtersJSON.forEach(filterJSON => {
        this.filtersService.add(source.name, filterJSON.id, filterJSON.name);

        // Setting properties
        const properties = this.filtersService.getPropertiesFormData(source.name, filterJSON.name) ;

        if (properties) {
          if (Array.isArray(properties)) {
            properties.forEach(property => {
              if (filterJSON.settings[property.name]) {
                property.value = filterJSON.settings[property.name];
              }
            });
          }
        }

        this.filtersService.setProperties(source.name, filterJSON.name, properties);
      });
    }
  }

  importSources(configJSON :any) {
    const sourcesJSON = configJSON.sources;

    if (Array.isArray(sourcesJSON)) {
      sourcesJSON.forEach(sourceJSON => {
        if (sourceJSON.id !== 'scene') {
          const source = this.sourcesService.createSource(
            sourceJSON.name,
            sourceJSON.id,
            sourceJSON.settings,
            { sourceId: sourceJSON.id, channel: sourceJSON.channel }
          );

          // Adding the filters
          const filtersJSON = sourceJSON.filters;
          this.importFilters(filtersJSON, source);
        }
      });
    }
  }

  importScenes(configJSON :any) {
    const sourcesJSON = configJSON.sources;
    const currentScene = configJSON.current_scene;

    if (Array.isArray(sourcesJSON)) {
      sourcesJSON.forEach(sourceJSON => {
        if (sourceJSON.id === 'scene') {
          const scene = this.scenesService.createScene(sourceJSON.name,
            { makeActive: (sourceJSON.name === currentScene) });

          const sceneItems = sourceJSON.settings.items;
          if (Array.isArray(sceneItems)) {
            // Looking for the source to add to the scene
            sceneItems.forEach(item => {
              const sourceToAdd = this.sourcesService.getSources().find((source) => {
                return source.name === item.name;
              });
              if (sourceToAdd) {
                const sceneItem = scene.addSource(sourceToAdd.sourceId, { sceneItemId: sourceToAdd.sourceId });

                const crop = {
                  bottom: item.crop_bottom,
                  left: item.crop_left,
                  right: item.crop_right,
                  top: item.crop_top
                };
                const pos = item.pos;
                const scale = item.scale;

                sceneItem.setCrop(crop);
                sceneItem.setPositionAndScale(pos.x, pos.y, scale.x, scale.y);
                sceneItem.setVisibility(item.visible);
              }
            });
          }
        }
      });
    }
  }

  importSceneOrder(configJSON :any) {
    const sceneNames = Array();
    const sceneOrderJSON = configJSON.scene_order;
    const listScene = this.scenesService.scenes;

    if (Array.isArray(sceneOrderJSON)) {
      sceneOrderJSON.forEach(obsScene => {
        sceneNames.push(listScene.find((scene) => {
          return scene.name === obsScene.name;
        }).id);
      });
    }
    this.scenesService.setSceneOrder(sceneNames);
  }

  importMixerSources(configJSON :any) {
    const mixerSources = [
      configJSON.DesktopAudioDevice1,
      configJSON.DesktopAudioDevice2,
      configJSON.AuxAudioDevice1,
      configJSON.AuxAudioDevice2,
      configJSON.AuxAudioDevice3
    ];

    mixerSources.forEach((source, i) => {
      const mixerSource = mixerSources[i];
      if (mixerSource) {
        this.sourcesService.createSource(
          mixerSource.name,
          mixerSource.id,
          {},
          { channel: i + 1 }
        );
      }
    });
  }

  importTransitions(configJSON :any) {
    // Only import the first transition found in obs as slobs only
    // uses one global transition
    if (configJSON.transitions && (configJSON.transitions.length > 0)) {
      this.transitionsService.setType(configJSON.transitions[0].id);
      this.transitionsService.setDuration(configJSON.transition_duration);
    }
  }

  getSceneCollections(): ISceneCollection[] {
    if (!this.isOBSinstalled()) return [];

    let files =  fs.readdirSync(this.sceneCollectionsDirectory);

    files = files.filter(file => !file.match(/\.bak$/));
    return files.map(file => {
      return {
        filename: file,
        name: file.replace('_', ' ').replace('.json', '')
      };
    });
  }

  getProfiles() {
    fs.readdir(this.profilesDirectory, (error, files) => {
      if (error) {
        return null;
      } else {
        return files;
      }
    });
  }

  get OBSconfigFileDirectory() {
    return path.join(electron.remote.app.getPath('appData'), 'obs-studio');
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
