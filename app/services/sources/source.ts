
import {
  ISourceApi,
  TSourceType,
  ISource,
  SourcesService,
  TPropertiesManager,
  ISourceComparison,
  PROPERTIES_MANAGER_TYPES
} from './index';
import { mutation, ServiceHelper } from 'services/stateful-service';
import { Inject } from 'util/injector';
import { ScenesService } from 'services/scenes';
import { TObsFormData } from 'components/obs/inputs/ObsInput';
import Utils from 'services/utils';
import * as obs from '../../../obs-api';
import { isEqual } from 'lodash';


@ServiceHelper()
export class Source implements ISourceApi {
  sourceId: string;
  name: string;
  type: TSourceType;
  audio: boolean;
  video: boolean;
  async: boolean;
  muted: boolean;
  width: number;
  height: number;
  doNotDuplicate: boolean;
  channel?: number;
  resourceId: string;

  sourceState: ISource;

  @Inject()
  scenesService: ScenesService;

  getObsInput(): obs.IInput {
    return obs.InputFactory.fromName(this.sourceId);
  }

  getModel() {
    return this.sourceState;
  }

  updateSettings(settings: Dictionary<any>) {
    const obsInputSettings = this.sourcesService.getObsSourceSettings(this.type, settings);
    this.getObsInput().update(obsInputSettings);
    this.sourcesService.sourceUpdated.next(this.sourceState);
  }


  getSettings(): Dictionary<any> {
    return this.getObsInput().settings;
  }

  /**
   * Compares the details of this source to another, to determine
   * whether adding as a reference makes sense.
   * @param comparison the comparison details of the other source
   */
  isSameType(comparison: ISourceComparison): boolean {
    if (this.channel) return false;

    return isEqual(this.getComparisonDetails(), comparison);
  }

  getComparisonDetails(): ISourceComparison {
    const details: ISourceComparison = {
      type: this.type,
      propertiesManager: this.getPropertiesManagerType()
    };
    if (this.getPropertiesManagerType() === 'streamlabels') {
      details.isStreamlabel = true;
    }

    if (this.getPropertiesManagerType() === 'widget') {
      details.widgetType = this.getPropertiesManagerSettings().widgetType;
    }

    if (this.getPropertiesManagerType() === 'platformApp') {
      details.appId = this.getPropertiesManagerSettings().appId;
      details.appSourceId = this.getPropertiesManagerSettings().appSourceId;
    }

    return details;
  }


  getPropertiesManagerType(): TPropertiesManager {
    return this.sourcesService.propertiesManagers[this.sourceId].type;
  }


  getPropertiesManagerSettings(): Dictionary<any> {
    return this.sourcesService.propertiesManagers[this.sourceId].manager.settings;
  }


  getPropertiesManagerUI(): string {
    return this.sourcesService.propertiesManagers[this.sourceId].manager.customUIComponent;
  }

  /**
   * Replaces the current properties manager on a source
   * @param type the type of the new properties manager
   * @param settings the properties manager settings
   */
  replacePropertiesManager(type: TPropertiesManager, settings: Dictionary<any>) {
    const oldManager = this.sourcesService.propertiesManagers[this.sourceId].manager;
    oldManager.destroy();

    const managerKlass = PROPERTIES_MANAGER_TYPES[type];
    this.sourcesService.propertiesManagers[this.sourceId].manager =
      new managerKlass(this.getObsInput(), settings);
    this.sourcesService.propertiesManagers[this.sourceId].type = type;
  }


  setPropertiesManagerSettings(settings: Dictionary<any>) {
    this.sourcesService.propertiesManagers[this.sourceId].manager.applySettings(settings);
  }


  getPropertiesFormData(): TObsFormData {
    const manager = this.sourcesService.propertiesManagers[this.sourceId].manager;
    return manager.getPropertiesFormData();
  }


  setPropertiesFormData(properties: TObsFormData) {
    const manager = this.sourcesService.propertiesManagers[this.sourceId].manager;
    manager.setPropertiesFormData(properties);
    this.sourcesService.sourceUpdated.next(this.sourceState);
  }


  duplicate(): Source {
    if (this.doNotDuplicate) return null;
    return this.sourcesService.createSource(
      this.name,
      this.type,
      this.getSettings(),
      {
        propertiesManager: this.getPropertiesManagerType(),
        propertiesManagerSettings: this.getPropertiesManagerSettings()
      }
    );
  }


  remove() {
    this.sourcesService.removeSource(this.sourceId);
  }

  setName(newName: string) {
    this.SET_NAME(newName);
    this.sourcesService.sourceUpdated.next(this.sourceState);
  }

  hasProps(): boolean {
    return this.getObsInput().configurable;
  }

  /**
   * works only for browser_source
   */
  refresh() {
    const obsInput = this.getObsInput();
    (obsInput.properties.get('refreshnocache') as obs.IButtonProperty)
      .buttonClicked(obsInput);
  }


  @Inject()
  protected sourcesService: SourcesService;

  constructor(sourceId: string) {
    // Using a proxy will ensure that this object
    // is always up-to-date, and essentially acts
    // as a view into the store.  It also enforces
    // the read-only nature of this data
    const isTemporarySource = !!this.sourcesService.state.temporarySources[sourceId];
    if (isTemporarySource) {
      this.sourceState = this.sourcesService.state.temporarySources[sourceId];
      Utils.applyProxy(this, this.sourcesService.state.temporarySources[sourceId]);
    } else {
      this.sourceState = this.sourcesService.state.sources[sourceId];
      Utils.applyProxy(this, this.sourcesService.state.sources[sourceId]);
    }
  }

  @mutation()
  private SET_NAME(newName: string) {
    this.sourceState.name = newName;
  }
}
