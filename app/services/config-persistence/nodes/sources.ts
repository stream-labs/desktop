import { Node } from './node';
import { SourcesService, Source, TSourceType } from '../../sources';
import { FiltersNode } from './filters';
import { AudioService } from '../../audio';
import { HotkeysService } from '../../hotkeys';
import { Inject } from '../../../util/injector';
import { HotkeysNode } from './hotkeys';
import * as obs from '../../../../obs-api';
import { TPropertiesManager } from 'services/sources';

interface ISchema {
  items: ISourceInfo[];
}

interface IFilterInfo {
  name: string;
  type: string;
  settings: obs.ISettings;
  enabled?: boolean;
}

interface ISourceInfo {
  id: string;
  name: string;
  type: TSourceType;
  settings: obs.ISettings;

  volume: number;
  forceMono?: boolean;
  audioMixers?: number;
  monitoringType?: obs.EMonitoringType;

  filters: {
    items: IFilterInfo[];
  };
  hotkeys?: HotkeysNode;
  channel?: number;
  muted?: boolean;

  propertiesManager?: TPropertiesManager;
  propertiesManagerSettings?: Dictionary<any>;
}

export class SourcesNode extends Node<ISchema, {}> {

  schemaVersion = 1;

  @Inject() private sourcesService: SourcesService;
  @Inject() private audioService: AudioService;

  getItems() {
    return this.sourcesService.sources.filter(source => source.type !== 'scene');
  }

  save(context: {}): Promise<void> {
    const items: ISourceInfo[] = [];
    const promises: Promise<ISourceInfo>[] = this.getItems().map(source => {
      return new Promise(resolve => {
        const hotkeys = new HotkeysNode();

        return hotkeys.save({ sourceId: source.sourceId }).then(() => {

          const audioSource = this.audioService.getSource(source.sourceId);

          let data: ISourceInfo = {
            id: source.sourceId,
            name: source.name,
            type: source.type,
            settings: source.getObsInput().settings,
            volume: source.getObsInput().volume,
            channel: source.channel,
            hotkeys,
            muted: source.getObsInput().muted,
            filters: {
              items: source.getObsInput().filters.map(filter => {
                return {
                  name: filter.name,
                  type: filter.id,
                  settings: filter.settings,
                  enabled: filter.enabled
                };
              })
            },
            propertiesManager: source.getPropertiesManagerType(),
            propertiesManagerSettings: source.getPropertiesManagerSettings()
          };

          if (audioSource) data = {
            ...data,
            forceMono: audioSource.forceMono,
            audioMixers: audioSource.audioMixers,
            monitoringType: audioSource.monitoringType,
          };

          resolve(data);
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
    // This shit is complicated, IPC sucks
    const sourceCreateData = this.data.items.map(source => {
      return {
        name: source.name,
        type: source.type,
        muted: source.muted || false,
        settings: source.settings,
        volume: source.volume,
        filters: source.filters.items.map(filter => {
          return {
            name: filter.name,
            type: filter.type,
            settings: filter.settings,
            enabled: (filter.enabled === void 0) ? true : filter.enabled
          };
        })
      };
    });

    const sources = obs.createSources(sourceCreateData);
    const promises: Promise<void>[] = [];

    sources.forEach((source, index) => {

      const sourceInfo = this.data.items[index];

      this.sourcesService.addSource(
        source,
        this.data.items[index].id,
        {
          channel: sourceInfo.channel,
          propertiesManager: sourceInfo.propertiesManager,
          propertiesManagerSettings: sourceInfo.propertiesManagerSettings || {}
        }
      );
      if (source.audioMixers) {
        this.audioService.getSource(sourceInfo.id).setMul(sourceInfo.volume);
        this.audioService.getSource(sourceInfo.id).setSettings({
          forceMono: sourceInfo.forceMono,
          audioMixers: sourceInfo.audioMixers,
          monitoringType: sourceInfo.monitoringType
        });
      }

      if (sourceInfo.hotkeys) {
        promises.push(this.data.items[index].hotkeys.load({ sourceId: sourceInfo.id }));
      }
    });

    return new Promise(resolve => {
      Promise.all(promises).then(() => resolve());
    });
  }
}
