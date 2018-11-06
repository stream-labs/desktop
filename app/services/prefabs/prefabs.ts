import { PersistentStatefulService } from 'services/persistent-stateful-service';
import { ISource, ISourceCreateOptions, Source, SourcesService, TPropertiesManager } from 'services/sources';
import { ScenesService, TSceneNode, TSceneNodeType } from 'services/scenes';
import { Inject } from '../../util/injector';
import { mutation, ServiceHelper } from '../stateful-service';
import uuid from 'uuid/v4';
import { TObsValue } from 'components/obs/inputs/ObsInput';
import Utils from '../utils';
import Vue from 'vue';

interface IPrefabSource {
  model: ISource,
  settings: Dictionary<TObsValue>,
  createOptions: ISourceCreateOptions,
}

interface IPrefab {
  id: string;
  name: string;
  description: string;
  type: 'source' | TSceneNodeType; // only `source` type is supported for now
  sources: Dictionary<IPrefabSource>;
  version: 1; // add a schema version for case if we need to use migrations in the future
}

interface IPrefabsServiceState {
  prefabs: Dictionary<IPrefab>;
}

interface IPrefabAddToSceneOptions {
  name?: string;
}

/**
 * Allows to add pre-configured items to scene
 */
export class PrefabsService extends PersistentStatefulService<IPrefabsServiceState> {

  static defaultState: IPrefabsServiceState = {
    prefabs: {}
  };

  @Inject() private sourcesService: SourcesService;
  @Inject() private scenesService: ScenesService;

  /**
   * register a single-source prefab
   */
  registerFromSource(sourceId: string, name: string, description = ''): Prefab {
    const source = this.sourcesService.getSource(sourceId);
    const id = uuid();
    const prefabModel: IPrefab = {
      id,
      name,
      description,
      type: 'source',
      sources: {
        [id]: {
          model: {
            ...source.getModel(),
            sourceId: id
          },
          settings: source.getSettings(),
          createOptions: {
            propertiesManager: source.getPropertiesManagerType(),
            propertiesManagerSettings: source.getPropertiesManagerSettings()
          },
        }
      },
      version: 1
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
  readonly version: 1;
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
      name || options.name,
      prefabSourceModel.model.type,
      prefabSourceModel.settings,
      prefabSourceModel.createOptions
    );
    return scene.addSource(source.sourceId);
  }

  remove() {
    this.prefabsService.removePrefab(this.id);
  }
}
