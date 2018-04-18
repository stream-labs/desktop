import { ArrayNode } from './array-node';
import { Inject } from '../../../util/injector';
import { ISourceFilter, SourceFiltersService } from 'services/source-filters';


interface IContext {
  sceneId: string;
}

export class SceneFiltersNode extends ArrayNode<ISourceFilter, IContext, ISourceFilter> {

  schemaVersion = 1;

  @Inject() private sourceFiltersService: SourceFiltersService;

  getItems(context: IContext): ISourceFilter[] {
    return this.sourceFiltersService.getFilters(context.sceneId);
  }


  saveItem(filter: ISourceFilter, context: IContext): Promise<ISourceFilter> {
    return Promise.resolve(filter);
  }


  loadItem(filter: ISourceFilter, context: IContext): Promise<void> {
    this.sourceFiltersService.add(context.sceneId, filter.type, filter.name, filter.settings);
    this.sourceFiltersService.setVisibility(context.sceneId, filter.name, filter.visible);
    return Promise.resolve();
  }

}
