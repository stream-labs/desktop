import { IObsListOption } from 'components/obs/inputs/ObsInput';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  ISource as IInternalSourceModel,
  SourcesService as InternalSourcesService,
  TSourceType,
} from 'services/sources';
import { Inject } from 'services/core/injector';
import { Fallback, Singleton } from 'services/api/external-api';
import { ISourceModel, Source } from './source';

export interface ISourceAddOptions {
  channel?: number;
  isTemporary?: boolean;
}

@Singleton()
export class SourcesService {
  @Fallback()
  @Inject()
  protected sourcesService: InternalSourcesService;

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
    const source = this.sourcesService.views.getSource(sourceId);
    return source ? new Source(sourceId) : null;
  }

  getSources(): Source[] {
    return this.sourcesService.views.getSources().map(source => this.getSource(source.sourceId));
  }

  removeSource(id: string): void {
    this.sourcesService.removeSource(id);
  }

  getAvailableSourcesTypesList(): IObsListOption<TSourceType>[] {
    return this.sourcesService.getAvailableSourcesTypesList();
  }

  getSourcesByName(name: string): Source[] {
    return this.sourcesService.views
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
    return this.exposeSourceEvent(this.sourcesService.sourceAdded);
  }

  get sourceUpdated(): Observable<ISourceModel> {
    return this.exposeSourceEvent(this.sourcesService.sourceUpdated);
  }

  get sourceRemoved(): Observable<ISourceModel> {
    return this.exposeSourceEvent(this.sourcesService.sourceRemoved);
  }

  /**
   * converts an InternalApi event to ExternalApi event
   */
  private exposeSourceEvent(
    observable: Observable<IInternalSourceModel>,
  ): Observable<ISourceModel> {
    return observable.pipe(
      map(internalSourceModel => this.convertInternalModelToExternal(internalSourceModel)),
    );
  }

  convertInternalModelToExternal(internalModel: IInternalSourceModel): ISourceModel {
    return {
      sourceId: internalModel.sourceId,
      id: internalModel.sourceId,
      name: internalModel.name,
      type: internalModel.type,
      audio: internalModel.audio,
      video: internalModel.video,
      async: internalModel.async,
      muted: internalModel.muted,
      width: internalModel.width,
      height: internalModel.height,
      doNotDuplicate: internalModel.doNotDuplicate,
      channel: internalModel.channel,
      configurable: internalModel.configurable,
      resourceId: `Source["${internalModel.sourceId}"]`,
    };
  }
}
