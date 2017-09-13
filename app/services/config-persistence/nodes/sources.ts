import { Node } from './node';
import { SourcesService, Source, TSourceType } from '../../sources';
import { FiltersNode } from './filters';
import { AudioService } from '../../audio';
import { HotkeysService } from '../../hotkeys';
import { Inject } from '../../../util/injector';
import { HotkeysNode } from './hotkeys';
import * as obs from '../../../../obs-api';

interface ISchema {
  items: ISourceInfo[];
}

interface ISourceInfo {
  id: string;
  name: string;
  type: TSourceType;
  settings: object;
  volume: number;
  filters: FiltersNode;
  hotkeys?: HotkeysNode;
  channel?: number;
  muted?: boolean;
}

export class SourcesNode extends Node<ISchema, {}> {

  schemaVersion = 1;

  @Inject() private sourcesService: SourcesService;
  @Inject() private audioService: AudioService;

  getItems() {
    return this.sourcesService.sources;
  }

  save(context: {}): Promise<void> {
    const items: ISourceInfo[] = [];
    const promises: Promise<ISourceInfo>[] = this.getItems().map(source => {
      return new Promise(resolve => {
        const filters = new FiltersNode();
        const hotkeys = new HotkeysNode();

        filters.save({ source }).then(() => {
          return hotkeys.save({ sourceId: source.sourceId });
        }).then(() => {
          resolve({
            id: source.sourceId,
            name: source.name,
            type: source.type,
            settings: source.getObsInput().settings,
            volume: source.getObsInput().volume,
            channel: source.channel,
            filters,
            hotkeys,
            muted: source.getObsInput().muted
          });
        });
      });
    });

    return new Promise(resolve => {
      Promise.all(promises).then(items => {
        this.data = { items };
        resolve();
      });
    });
  }

  load(context: {}): Promise<void> {
    const sources = obs.createSources(this.data.items);
    const promises: Promise<void>[] = [];

    sources.forEach((source, index) => {
      this.sourcesService.addSource(
        source,
        this.data.items[index].id,
        { channel: this.data.items[index].channel }
      );
      if (source.audioMixers) {
        this.audioService.getSource(this.data.items[index].id).setMul(this.data.items[index].volume);
      }

      if (this.data.items[index].hotkeys) {
        promises.push(this.data.items[index].hotkeys.load({ sourceId: this.data.items[index].id }));
      }
    });

    return new Promise(resolve => {
      Promise.all(promises).then(() => resolve());
    });
  }
}
