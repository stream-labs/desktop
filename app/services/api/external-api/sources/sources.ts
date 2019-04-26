import { IObsListOption } from 'components/obs/inputs/ObsInput';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  ISource as IInternalSourceModel,
  SourcesService as InternalSourcesService,
  TSourceType,
} from 'services/sources';
import { Inject } from 'util/injector';
import { Fallback, Singleton } from 'services/api/external-api';
import { ISourceModel, Source } from './source';

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
