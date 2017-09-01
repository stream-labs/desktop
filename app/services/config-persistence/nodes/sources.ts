import { ArrayNode } from './array-node';
import { SourcesService, Source, TSourceType } from '../../sources';
import { FiltersNode } from './filters';
import { AudioService } from '../../audio';
import { HotkeysService } from '../../hotkeys';
import { Inject } from '../../../util/injector';
import { HotkeysNode } from './hotkeys';

interface ISchema {
  id: string;
  name: string;
  type: TSourceType;
  settings: object;
  volume: number;
  filters: FiltersNode;
  hotkeys?: HotkeysNode;
  channel?: number;
}

export class SourcesNode extends ArrayNode<ISchema, {}, Source> {

  schemaVersion = 1;

  @Inject() private sourcesService: SourcesService;
  @Inject() private audioService: AudioService;

  getItems() {
    return this.sourcesService.sources;
  }

  saveItem(source: Source): ISchema {
    const filters = new FiltersNode();
    filters.save({ source });

    const hotkeys = new HotkeysNode();
    hotkeys.save({ sourceId: source.sourceId });

    return {
      id: source.sourceId,
      name: source.name,
      type: source.type,
      settings: source.getObsInput().settings,
      volume: source.getObsInput().volume,
      channel: source.channel,
      filters,
      hotkeys
    };
  }

  loadItem(obj: ISchema) {
    const source = this.sourcesService.createSource(
      obj.name,
      obj.type,
      obj.settings,
      { sourceId: obj.id, channel: obj.channel }
    );

    this.sourcesService.refreshProperties(source.sourceId);

    if (source.audio) {
      this.audioService.getSource(source.sourceId).setMul(obj.volume);
    }

    obj.filters.load({ source });

    if (obj.hotkeys) obj.hotkeys.load({ sourceId: source.sourceId });
  }

}
