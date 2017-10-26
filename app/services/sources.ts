import Vue from 'vue';
import { Subject } from 'rxjs/Subject';
import {
  TFormData,
  inputValuesToObsValues,
  obsValuesToInputValues
} from '../components/shared/forms/Input';
import { StatefulService, mutation, Inject, Mutator } from './stateful-service';
import Obs from '../api/Obs';
import configFileManager from '../util/ConfigFileManager';
import electron from '../vendor/electron';
import Utils from './utils';

const nodeObs = Obs.nodeObs as Dictionary<Function>;
const { ipcRenderer } = electron;

export interface ISource {
  id: string;
  name: string;
  type: TSourceType;
  audio: boolean;
  video: boolean;
  muted: boolean;
  width: number;
  height: number;
  properties: TFormData;
}

// TODO: add more types
export type TSourceType =
  'Audio Output Capture' |
  'Audio Input Capture';

interface ISourcesState {
  sources: Dictionary<ISource>;
}


export class SourcesService extends StatefulService<ISourcesState> {

  static initialState = {
    sources: {}
  } as ISourcesState;

  sourceAdded = new Subject<ISource>();
  sourceUpdated = new Subject<ISource>();
  sourceRemoved = new Subject<ISource>();

  @mutation
  private RESET_SOURCES() {
    this.state.sources = {};
  }

  @mutation
  private ADD_SOURCE(id: string, name: string, type: TSourceType, properties: TFormData) {
    Vue.set(this.state.sources, id, {
      id,
      name,
      type,
      properties,

      // Whether the source has audio and/or video
      // Will be updated periodically
      audio: false,
      video: false,

      // Unscaled width and height
      width: 0,
      height: 0,

      muted: false
    });
  }

  @mutation
  private REMOVE_SOURCE(id: string) {
    Vue.delete(this.state.sources, id);
  }

  @mutation
  private UPDATE_SOURCE(sourcePatch: TPatch<ISource>) {
    Object.assign(this.state.sources[sourcePatch.id], sourcePatch);
  }

  // This is currently a single function because node-obs
  // does not support adding the same source to multiple
  // scenes.  This will be split into multiple functions
  // in the future.
  // TODO: When node-obs supports associating and existing
  // source with a scene, we should rid of sceneName and sceneId here.
  createSceneSource(
    sceneId: string,
    sceneName: string,
    name: string,
    type: TSourceType,
    isHidden = false
  ) {
    const sourceName = isHidden ? `[HIDDEN_${sceneId}]${name}` : name;

    nodeObs.OBS_content_addSource(
      type,
      sourceName,
      {},
      {},
      sceneName
    );

    const id = this.initSource(sourceName, type);
    return id;
  }

  // Initializes a source and assigns it an id.
  // The id is returned.
  initSource(name: string, type: TSourceType) {
    // Get an id to identify the source on the frontend
    const id = ipcRenderer.sendSync('getUniqueId');
    const properties = this.getPropertiesFormData(id);

    this.ADD_SOURCE(id, name, type, properties);
    const source = this.state.sources[id];

    const muted = nodeObs.OBS_content_isSourceMuted(name);
    this.UPDATE_SOURCE({ id, muted });
    this.refreshSourceFlags(source, id);
    this.sourceAdded.next(source);
    return id;
  }


  removeSource(id: string) {
    const source = this.state.sources[id];

    nodeObs.OBS_content_removeSource(source.name);

    this.REMOVE_SOURCE(id);
    this.sourceRemoved.next(source);
  }


  private refreshProperties(id: string) {
    const properties = this.getPropertiesFormData(id);

    this.UPDATE_SOURCE({ id, properties });
  }


  refreshSourceAttributes() {
    Object.keys(this.state.sources).forEach(id => {
      const source = this.state.sources[id];

      const size: {width: number, height: number } = nodeObs.OBS_content_getSourceSize(source.name);

      if ((source.width !== size.width) || (source.height !== size.height)) {
        const { width, height } = size;
        this.UPDATE_SOURCE({ id, width, height });
      }

      this.refreshSourceFlags(source, id);
    });
  }


  private refreshSourceFlags(source: ISource, id: string) {
    const flags = nodeObs.OBS_content_getSourceFlags(source.name);
    const audio = !!flags.audio;
    const video = !!flags.video;

    if ((source.audio !== audio) || (source.video !== video)) {
      this.UPDATE_SOURCE({ id, audio, video });
      this.sourceUpdated.next(source);
    }
  }


  setProperties(sourceId: string, properties: TFormData) {
    const source = this.state.sources[sourceId];
    const propertiesToSave = inputValuesToObsValues(properties, {
      boolToString: true,
      intToString: true,
      valueToObject: true
    });

    for (const prop of propertiesToSave) {
      nodeObs.OBS_content_setProperty(
        source.name,
        prop.name,
        prop.value
      );
    }

    this.refreshProperties(sourceId);
    configFileManager.save();
  }


  setMuted(id: string, muted: boolean) {
    const source = this.state.sources[id];

    nodeObs.OBS_content_sourceSetMuted(source.name, muted);
    this.UPDATE_SOURCE({ id, muted });
    this.sourceUpdated.next(source);
  }


  reset() {
    this.RESET_SOURCES();
  }

  // Utility functions / getters

  getSourceById(id: string): Source {
    return this.getSource(id);
  }


  getSourceByName(name: string): Source {
    const sourceModel = Object.values(this.state.sources).find(source => {
      return source.name === name;
    });
    return sourceModel ? this.getSource(sourceModel.id) : void 0;
  }


  get sources(): Source[] {
    return Object.values(this.state.sources).map(sourceModel => this.getSource(sourceModel.id));
  }

  getSource(id: string): Source {
    return this.state.sources[id] ? new Source(id) : void 0;
  }


  getPropertiesFormData(sourceId: string) {
    const source = this.getSourceById(sourceId);
    if (!source) return [];

    const obsProps = nodeObs.OBS_content_getSourceProperties(source.name);
    const props = obsValuesToInputValues(obsProps, {
      boolIsString: true,
      valueIsObject: true,
      valueGetter: (propName) => {
        return nodeObs.OBS_content_getSourcePropertyCurrentValue(
          source.name,
          propName
        );
      },
      subParametersGetter: (propName) => {
        return nodeObs.OBS_content_getSourcePropertiesSubParameters(source.name, propName);
      }
    });

    // some magic required by node-obs
    nodeObs.OBS_content_updateSourceProperties(source.name);

    return props;
  }
}

@Mutator()
export class Source implements ISource {
  id: string;
  name: string;
  type: TSourceType;
  audio: boolean;
  video: boolean;
  muted: boolean;
  width: number;
  height: number;
  properties: TFormData;

  get displayName() {
    return this.isHidden ?
      this.name.replace(/\[HIDDEN_[\d\w-]+\]/, '') :
      this.name;
  }

  get isHidden() {
    return !!this.name.match(/\[HIDDEN_[\d\w-]+\].+/);
  }

  @Inject()
  protected sourcesService: SourcesService;

  constructor(sourceId: string) {
    // Using a proxy will ensure that this object
    // is always up-to-date, and essentially acts
    // as a view into the store.  It also enforces
    // the read-only nature of this data
    Utils.applyProxy(this, this.sourcesService.state.sources[sourceId]);
  }
}

