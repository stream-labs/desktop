import { PersistentStatefulService } from 'services/persistent-stateful-service';
import { ISourceAddOptions, SourcesService, TSourceType, Source } from 'services/sources';
import { ScenesService, TSceneNode, TSceneNodeType } from 'services/scenes';
import { Inject } from '../../util/injector';
import { mutation, ServiceHelper } from 'services/stateful-service';
import uuid from 'uuid/v4';
import { TObsValue } from 'components/obs/inputs/ObsInput';
import Utils from '../utils';
import Vue from 'vue';
import { HardwareService } from 'services/hardware';

interface IPrefabSourceCreateOptions {
  name: string;
  description?: string;
  type: TSourceType;
  settings: Dictionary<TObsValue>;
  createOptions: ISourceAddOptions;
}

interface IPrefabSource extends IPrefabSourceCreateOptions {
  id: string;
}

interface IPrefab {
  id: string;
  name: string;
  description: string;
  type: 'source' | TSceneNodeType; // only `source` type is supported for now
  sources: Dictionary<IPrefabSource>;
}

interface IPrefabsServiceState {
  prefabs: Dictionary<IPrefab>;
  version: 1; // add a schema version for case if we need to use migrations in the future
}

interface IPrefabAddToSceneOptions {
  name?: string;
}

/**
 * Allows to add pre-configured items to scene
 */
export class PrefabsService extends PersistentStatefulService<IPrefabsServiceState> {
  static defaultState: IPrefabsServiceState = {
    version: 1,
    prefabs: {},
  };

  @Inject() private sourcesService: SourcesService;
  @Inject() private scenesService: ScenesService;

  registerFromExistingSource(sourceId: string, name: string, description = ''): Prefab {
    const source = this.sourcesService.getSource(sourceId);
    return this.registerSourcePrefab({
      name,
      description,
      type: source.type,
      settings: source.getSettings(),
      createOptions: {
        propertiesManager: source.getPropertiesManagerType(),
        propertiesManagerSettings: source.getPropertiesManagerSettings(),
      },
    });
  }

  /**
   * register a single-source prefab
   */
  registerSourcePrefab(prefabSourceModel: IPrefabSourceCreateOptions) {
    const id = uuid();
    const prefabModel: IPrefab = {
      id,
      name: prefabSourceModel.name,
      description: prefabSourceModel.description,
      type: 'source',
      sources: {
        [id]: {
          ...prefabSourceModel,
          id,
        },
      },
    };
    this.REGISTER_PREFAB(prefabModel);
    return this.getPrefab(id);
  }

  getPrefab(id: string): Prefab {
    return this.state.prefabs[id] ? new Prefab(id) : void 0;
  }

  getPrefabs(): Prefab[] {
    return Object.keys(this.state.prefabs).map(id => this.getPrefab(id));
  }

  getPrefabByName(name: string): Prefab {
    const id = Object.keys(this.state.prefabs).find(id => this.state.prefabs[id].name === name);
    return this.getPrefab(id);
  }

  removePrefab(id: string) {
    this.REMOVE_PREFAB(id);
  }

  removePrefabs() {
    this.getPrefabs().forEach(prefab => this.removePrefab(prefab.id));
  }

  /**
   * @deprecated
   * only for the brand-device onboarding
   */
  addPrefabToActiveScene(prefabName: string) {
    const prefab = this.getPrefabs().find(prefab => prefab.name === prefabName);
    if (!prefab) return;
    prefab.addToScene(this.scenesService.activeSceneId);
  }

  @mutation()
  private REGISTER_PREFAB(prefabModel: IPrefab) {
    Vue.set(this.state.prefabs, prefabModel.id, prefabModel);
  }

  @mutation()
  private REMOVE_PREFAB(id: string) {
    Vue.delete(this.state.prefabs, id);
  }
}

@ServiceHelper()
export class Prefab implements IPrefab {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly type: 'source' | TSceneNodeType;
  readonly sources: Dictionary<IPrefabSource>;

  @Inject() private prefabsService: PrefabsService;
  @Inject() private scenesService: ScenesService;
  @Inject() private sourcesService: SourcesService;
  @Inject() private hardwareService: HardwareService;

  constructor(prefabId: string) {
    Utils.applyProxy(this, this.prefabsService.state.prefabs[prefabId]);
  }

  getPrefabSourceModel(): IPrefabSource {
    if (this.type !== 'source') return null;
    return this.sources[this.id];
  }

  addToScene(sceneId: string, options: IPrefabAddToSceneOptions = {}): TSceneNode {
    const scene = this.scenesService.getScene(sceneId);
    const existingSource = this.getExistingSource();

    if (existingSource) return scene.addSource(existingSource.sourceId);

    const prefabSourceModel = this.getPrefabSourceModel();
    const source = this.sourcesService.createSource(
      options.name || prefabSourceModel.name,
      prefabSourceModel.type,
      prefabSourceModel.settings,
      prefabSourceModel.createOptions,
    );
    return scene.addSource(source.sourceId);
  }

  remove() {
    this.prefabsService.removePrefab(this.id);
  }

  /**
   * dshow_input allows to use only one source of the same device
   * instead of creating a new source we add an existing for this type of source
   */
  private getExistingSource(): Source {
    const prefabSourceModel = this.getPrefabSourceModel();

    // only dshow_input requires usage of existing source
    if (!prefabSourceModel || prefabSourceModel.type !== 'dshow_input') return null;

    // find and return already existing dshow_input source with the same device.
    const deviceId = (prefabSourceModel.settings &&
      prefabSourceModel.settings.video_device_id) as string;
    if (!deviceId) return null;
    const device =
      this.hardwareService.getDshowDeviceByName(deviceId) ||
      this.hardwareService.getDshowDevice(deviceId);
    return this.sourcesService.getSources().find(source => {
      return source.type === 'dshow_input' && source.getSettings().video_device_id === device.id;
    });
  }
}
