import { PersistentStatefulService } from 'services/persistent-stateful-service';
import {
  ISource,
  ISourceAddOptions,
  Source,
  SourcesService,
  TPropertiesManager,
  TSourceType
} from 'services/sources';
import { ScenesService, TSceneNode, TSceneNodeType } from 'services/scenes';
import { Inject } from '../../util/injector';
import { mutation, ServiceHelper } from '../stateful-service';
import uuid from 'uuid/v4';
import { TObsValue } from 'components/obs/inputs/ObsInput';
import Utils from '../utils';
import Vue from 'vue';

interface IPrefabSourceCreateOptions {
  name: string,
  description?: string,
  type: TSourceType,
  settings: Dictionary<TObsValue>,
  createOptions: ISourceAddOptions,
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
    prefabs: {}
  };

  @Inject() private sourcesService: SourcesService;
  @Inject() private scenesService: ScenesService;

  registerFromExistingSource(sourceId: string, name: string, description = ''): Prefab {
    const source = this.sourcesService.getSource(sourceId);
    return this.registerSourcePrefab({
      type: source.type,
      name,
      description,
      settings: source.getSettings(),
      createOptions: {
        propertiesManager: source.getPropertiesManagerType(),
        propertiesManagerSettings: source.getPropertiesManagerSettings()
      }
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
          id
        }
      }
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
    const id = Object.keys(this.state.prefabs).find(id => this.state.prefabs[id].name == name);
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
    const prefab = this.getPrefabs().find(prefab => prefab.name == prefabName);
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

  constructor(prefabId: string) {
    Utils.applyProxy(this, this.prefabsService.state.prefabs[prefabId]);
  }

  getPrefabSourceModel(): IPrefabSource {
    if (this.type !== 'source') return null;
    return this.sources[this.id];
  }

  addToScene(sceneId: string, options: IPrefabAddToSceneOptions = {}): TSceneNode {
    const scene = this.scenesService.getScene(sceneId);
    const prefabSourceModel = this.getPrefabSourceModel();
    const source = this.sourcesService.createSource(
      options.name || prefabSourceModel.name,
      prefabSourceModel.type,
      prefabSourceModel.settings,
      prefabSourceModel.createOptions
    );
    return scene.addSource(source.sourceId);
  }

  remove() {
    this.prefabsService.removePrefab(this.id);
  }
}
