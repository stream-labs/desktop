import { IObsListOption, TObsFormData } from 'components/obs/inputs/ObsInput';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  ISource as IInternalSourceModel,
  Source as InternalSource,
  SourcesService as InternalSourcesService, TPropertiesManager,
  TSourceType
} from 'services/sources';
import { Inject } from 'util/injector';
import { Singleton } from 'services/api/external-api';
import { ServiceHelper } from 'services/stateful-service';
import { ISerializable } from '../rpc-api';

export interface ISourceAddOptions {
  channel?: number;
  isTemporary?: boolean;
}

/**
 * converts an InternalApi event to ExternalApi event
 */
function exposeSourceEvent(observable: Observable<IInternalSourceModel>): Observable<ISourceModel> {
  // add `id` field to each sourceModel
  return observable.pipe(map(source => ({ ...source, id: source.sourceId })));
}

@Singleton()
export class SourcesService {
  @Inject() protected sourcesService: InternalSourcesService;

  createSource(
    name: string,
    type: TSourceType,
    settings?: Dictionary<any>,
    options?: ISourceAddOptions,
  ): Source {
    const source = this.sourcesService.createSource(name, type, settings, options);
    return this.getSource(source.sourceId);
  }

  getSource(sourceId: string): Source {
    const source = this.sourcesService.getSource(sourceId);
    return source ? new Source(sourceId) : null;
  }

  getSources(): Source[] {
    return this.sourcesService.getSources().map(source => this.getSource(source.sourceId));
  }

  removeSource(id: string): void {
    this.sourcesService.removeSource(id);
  }

  getAvailableSourcesTypesList(): IObsListOption<TSourceType>[] {
    return this.sourcesService.getAvailableSourcesTypesList();
  }

  getSourcesByName(name: string): Source[] {
    return this.sourcesService
      .getSourcesByName(name)
      .map(source => this.getSource(source.sourceId));
  }

  /**
   * creates a source from a file
   * source type depends on the file extension
   */
  addFile(path: string): Source {
    return this.getSource(this.sourcesService.addFile(path).sourceId);
  }

  showSourceProperties(sourceId: string): void {
    return this.sourcesService.showSourceProperties(sourceId);
  }

  showShowcase(): void {
    return this.sourcesService.showShowcase();
  }

  showAddSource(sourceType: TSourceType): void {
    return this.sourcesService.showAddSource(sourceType);
  }

  get sourceAdded(): Observable<ISourceModel> {
    return exposeSourceEvent(this.sourcesService.sourceAdded);
  }

  get sourceUpdated(): Observable<ISourceModel> {
    return exposeSourceEvent(this.sourcesService.sourceUpdated);
  }

  get sourceRemoved(): Observable<ISourceModel> {
    return exposeSourceEvent(this.sourcesService.sourceRemoved);
  }
}

interface ISourceModel {
  sourceId: string;
  id: string; // Streamdeck uses id field
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
}

// We need ServiceHelper to mark this class as serializable
// TODO: refactor ServiceHelper, it has too much logic under the hood
@ServiceHelper()
export class Source implements ISourceModel, ISerializable {
  @Inject() private sourcesService: InternalSourcesService;
  readonly sourceId: string;
  readonly id: string;
  readonly name: string;
  readonly type: TSourceType;
  readonly audio: boolean;
  readonly video: boolean;
  readonly async: boolean;
  readonly muted: boolean;
  readonly width: number;
  readonly height: number;
  readonly doNotDuplicate: boolean;
  readonly channel?: number;
  readonly resourceId: string;

  private source: InternalSource;

  constructor(sourceId: string) {
    this.source = this.sourcesService.getSource(sourceId);
  }

  /**
   * serialize source
   */
  getModel(): ISourceModel {
    return {
      sourceId: this.sourceId,
      id: this.sourceId,
      name: this.source.name,
      type: this.source.type,
      audio: this.source.audio,
      video: this.source.video,
      async: this.source.async,
      muted: this.source.muted,
      width: this.source.width,
      height: this.source.height,
      doNotDuplicate: this.source.doNotDuplicate,
      channel: this.source.channel,
    };
  }

  updateSettings(settings: Dictionary<any>): void {
    this.source.updateSettings(settings);
  }

  getSettings(): Dictionary<any> {
    return this.source.getSettings();
  }

  getPropertiesFormData(): TObsFormData {
    return this.source.getPropertiesFormData();
  }

  setPropertiesFormData(properties: TObsFormData): void {
    return this.source.setPropertiesFormData(properties);
  }

  hasProps(): boolean {
    return this.source.hasProps();
  }

  setName(newName: string): void {
    return this.source.setName(newName);
  }

  refresh(): void {
    this.source.refresh();
  }
}
