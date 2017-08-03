import { ArrayNode } from './array-node';
import { SourcesService, Source, TSourceType } from '../../sources';
import { FiltersNode } from './filters';

interface ISchema {
  id: string;
  name: string;
  type: TSourceType;
  settings: object;
  volume: number;
  filters: FiltersNode;
}

export class SourcesNode extends ArrayNode<ISchema, {}, Source> {

  schemaVersion = 1;

  sourcesService: SourcesService = SourcesService.instance;

  getItems() {
    return this.sourcesService.sources;
  }

  saveItem(source: Source) {
    const filters = new FiltersNode();
    filters.save({ source });

    return {
      id: source.sourceId,
      name: source.name,
      type: source.type,
      settings: source.getObsInput().settings,
      volume: source.getObsInput().volume,
      filters
    };
  }

  loadItem(obj: ISchema) {
    const source = this.sourcesService.createSource(
      obj.name,
      obj.type,
      { sourceId: obj.id }
    );

    const input = source.getObsInput();

    input.update(obj.settings);
    this.sourcesService.refreshProperties(source.sourceId);

    input.volume = obj.volume;

    obj.filters.load({ source });
  }

}
