import { Node } from './node';
import { HotkeysNode } from './hotkeys';
import { SourcesService, TSourceType, TPropertiesManager } from 'services/sources';
import { AudioService } from 'services/audio';
import { Inject } from '../../core/injector';
import * as obs from '../../../../obs-api';
import { ScenesService } from 'services/scenes';

interface ISchema {
  items: ISourceInfo[];
}

interface IFilterInfo {
  name: string;
  type: string;
  settings: obs.ISettings;
  enabled?: boolean;
}

export interface ISourceInfo {
  id: string;
  name: string;
  type: TSourceType;
  settings: obs.ISettings;

  volume: number;
  forceMono?: boolean;
  syncOffset?: obs.ITimeSpec;
  audioMixers?: number;
  monitoringType?: obs.EMonitoringType;
  mixerHidden?: boolean;

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
  schemaVersion = 3;

  @Inject() private sourcesService: SourcesService;
  @Inject() private audioService: AudioService;
  @Inject() private scenesService: ScenesService;

  getItems() {
    const linkedSourcesIds = this.scenesService
      .getSceneItems()
      .map(sceneItem => sceneItem.sourceId);

    return this.sourcesService.sources.filter(source => {
      // we store scenes in separated config
      if (source.type === 'scene') return false;

      // global audio sources must be saved
      if (source.channel) return true;

      // prevent sources without linked sceneItems to be saved
      return linkedSourcesIds.includes(source.sourceId);
    });
  }

  save(context: {}): Promise<void> {
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
            hotkeys,
            id: source.sourceId,
            name: source.name,
            type: source.type,
            settings: obsInput.settings,
            volume: obsInput.volume,
            channel: source.channel,
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
                  enabled: filter.enabled,
                };
              }),
            },
            propertiesManager: source.getPropertiesManagerType(),
            propertiesManagerSettings: source.getPropertiesManagerSettings(),
          };

          if (audioSource) {
            data = {
              ...data,
              forceMono: audioSource.forceMono,
              syncOffset: AudioService.msToTimeSpec(audioSource.syncOffset),
              audioMixers: audioSource.audioMixers,
              monitoringType: audioSource.monitoringType,
              mixerHidden: audioSource.mixerHidden,
            };
          }

          if (data.propertiesManager === 'replay') {
            // Don't save the last replay, otherwise it will just play an old
            // replay when this source is loaded back in.
            delete data.settings['local_file'];
          }

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

  /**
   * Do some data sanitizing
   */
  sanitizeSources() {
    // Look for duplicate ids and channels
    const ids: Set<string> = new Set();
    const channels: Set<number> = new Set();

    this.data.items = this.data.items.filter(item => {
      if (ids.has(item.id)) return false;
      ids.add(item.id);

      if (item.channel != null) {
        if (channels.has(item.channel)) return false;
        channels.add(item.channel);
      }

      return true;
    });
  }

  load(context: {}): Promise<void> {
    this.sanitizeSources();

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
            enabled: filter.enabled === void 0 ? true : filter.enabled,
          };
        }),
      };
    });

    // This ensures we have bound the source size callback
    // before creating any sources in OBS.
    this.sourcesService;

    const sources = obs.createSources(sourceCreateData);
    const promises: Promise<void>[] = [];

    sources.forEach((source, index) => {
      const sourceInfo = this.data.items[index];

      this.sourcesService.addSource(source, this.data.items[index].name, {
        channel: sourceInfo.channel,
        propertiesManager: sourceInfo.propertiesManager,
        propertiesManagerSettings: sourceInfo.propertiesManagerSettings || {},
      });

      if (source.audioMixers) {
        this.audioService
          .getSource(sourceInfo.id)
          .setMul(sourceInfo.volume != null ? sourceInfo.volume : 1);
        this.audioService.getSource(sourceInfo.id).setSettings({
          forceMono: sourceInfo.forceMono,
          syncOffset: sourceInfo.syncOffset ? AudioService.timeSpecToMs(sourceInfo.syncOffset) : 0,
          audioMixers: sourceInfo.audioMixers,
          monitoringType: sourceInfo.monitoringType,
        });
        this.audioService.getSource(sourceInfo.id).setHidden(!!sourceInfo.mixerHidden);
      }

      if (sourceInfo.hotkeys) {
        promises.push(this.data.items[index].hotkeys.load({ sourceId: sourceInfo.id }));
      }
    });

    return new Promise(resolve => {
      Promise.all(promises).then(() => resolve());
    });
  }

  migrate(version: number) {
    // migrate audio sources names
    if (version < 3) {
      this.data.items.forEach(source => {
        const desktopDeviceMatch = /^DesktopAudioDevice(\d)$/.exec(source.name);
        if (desktopDeviceMatch) {
          const index = parseInt(desktopDeviceMatch[1], 10);
          // tslint:disable-next-line:prefer-template
          source.name = 'Desktop Audio' + (index > 1 ? ' ' + index : '');
          return;
        }

        const auxDeviceMatch = /^AuxAudioDevice(\d)$/.exec(source.name);
        if (auxDeviceMatch) {
          const index = parseInt(auxDeviceMatch[1], 10);
          // tslint:disable-next-line:prefer-template
          source.name = 'Mic/Aux' + (index > 1 ? ' ' + index : '');
          return;
        }
      });
    }
  }
}
