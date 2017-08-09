import { ArrayNode } from './array-node';
import { SourcesService, Source, TSourceType } from '../../sources';
import { FiltersNode } from './filters';
import { AudioService } from '../../audio';

interface ISchema {
  id: string;
  name: string;
  type: TSourceType;
  settings: object;
  volume: number;
  filters: FiltersNode;
  channel?: number;
}

export class SourcesNode extends ArrayNode<ISchema, {}, Source> {

  schemaVersion = 1;

  sourcesService: SourcesService = SourcesService.instance;
  audioService: AudioService = AudioService.instance;

  getItems() {
    return this.sourcesService.sources;
  }

  saveItem(source: Source): ISchema {
    const filters = new FiltersNode();
    filters.save({ source });

    return {
      id: source.sourceId,
      name: source.name,
      type: source.type,
      settings: source.getObsInput().settings,
      volume: source.getObsInput().volume,
      channel: source.channel,
      filters
    };
  }

  loadItem(obj: ISchema) {
    const source = this.sourcesService.createSource(
      obj.name,
      obj.type,
      { sourceId: obj.id, channel: obj.channel }
    );

    const input = source.getObsInput();

    input.update(obj.settings);
    this.sourcesService.refreshProperties(source.sourceId);

    if (source.audio) {
      this.audioService.getSource(source.sourceId).setMul(obj.volume);
    }

    obj.filters.load({ source });
  }

}
