import { Node } from './node';
import { FiltersNode } from './filters';
import { HotkeysNode } from './hotkeys';
import { 
  SourcesService, 
  Source, 
  TSourceType, 
  TPropertiesManager 
} from 'services/sources';
import { FontLibraryService } from 'services/font-library';
import { AudioService } from 'services/audio';
import { HotkeysService } from 'services/hotkeys';
import { Inject } from '../../../util/injector';
import * as obs from '../../../../obs-api';
import path from 'path';

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
  syncOffset?: obs.ITimeSpec;
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

  schemaVersion = 2;

  @Inject() private fontLibraryService: FontLibraryService;
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

          const obsInput = source.getObsInput();

          /* Signal to the source that it needs to save settings as 
           * we're about to cache them to disk. */
          obsInput.save();

          let data: ISourceInfo = {
            id: source.sourceId,
            name: source.name,
            type: source.type,
            settings: obsInput.settings,
            volume: obsInput.volume,
            channel: source.channel,
            hotkeys,
            muted: obsInput.muted,
            filters: {
              items: obsInput.filters.map(filter => {
                /* Remember that filters are also sources. 
                 * We should eventually do this for transitions
                 * as well. Scenes can be ignored. */
                filter.save();

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
            syncOffset: AudioService.msToTimeSpec(audioSource.syncOffset),
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

  migrate(version: number) {
    if (version < 2) {
      this.data.items.forEach(item => {
        if (item.type !== 'text_gdiplus') {
          return;
        }

        const settings = item.settings;

        if (!settings.custom_font) {
          return;
        }

        const filename = path.basename(settings.custom_font);

        this.fontLibraryService.findFontFile(filename).then(family => {
          settings['font']['face'] = family.name;

          const source = this.sourcesService.getSource(item.id);
          source.updateSettings(settings);
        });
      });
    }
  }

  load(context: {}): Promise<void> {
    // This shit is complicated, IPC sucks
    const sourceCreateData = this.data.items.map(source => {
      return {
        name: source.id,
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
        this.data.items[index].name,
        {
          channel: sourceInfo.channel,
          propertiesManager: sourceInfo.propertiesManager,
          propertiesManagerSettings: sourceInfo.propertiesManagerSettings || {}
        }
      );
      if (source.audioMixers) {
        this.audioService.getSource(sourceInfo.id).setMul((sourceInfo.volume != null) ? sourceInfo.volume : 1);
        this.audioService.getSource(sourceInfo.id).setSettings({
          forceMono: sourceInfo.forceMono,
          syncOffset: sourceInfo.syncOffset ? AudioService.timeSpecToMs(sourceInfo.syncOffset) : 0,
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
