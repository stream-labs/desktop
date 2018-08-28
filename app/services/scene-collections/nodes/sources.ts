import { Node } from './node';
import { HotkeysNode } from './hotkeys';
import {
  SourcesService,
  TSourceType,
  TPropertiesManager
} from 'services/sources';
import { FontLibraryService } from 'services/font-library';
import { AudioService } from 'services/audio';
import { Inject } from '../../../util/injector';
import * as obs from '../../../../obs-api';
import * as fi from 'node-fontinfo';

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
  deinterlaceMode?: obs.EDeinterlaceMode;
  deinterlaceFieldOrder?: obs.EDeinterlaceFieldOrder;

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

          if (source.video && source.async) {
            data = {
              ...data,
              deinterlaceMode: source.deinterlaceMode,
              deinterlaceFieldOrder: source.deinterlaceFieldOrder,
            }
          }

          if (audioSource) {
            data = {
              ...data,
              forceMono: audioSource.forceMono,
              syncOffset: AudioService.msToTimeSpec(audioSource.syncOffset),
              audioMixers: audioSource.audioMixers,
              monitoringType: audioSource.monitoringType,
              mixerHidden: audioSource.mixerHidden
            };
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


  checkTextSourceValidity(item: ISourceInfo) {
    if (item.type !== 'text_gdiplus') {
      return;
    }

    const settings = item.settings;

    if (settings['font']['face'] && (settings['font']['flags'] != null)) {
      return;
    }

    /* Defaults */
    settings['font']['face'] = 'Arial';
    settings['font']['flags'] = 0;

    /* This should never happen */
    if (!settings.custom_font) {
      const source = this.sourcesService.getSource(item.id);
      source.updateSettings({ font: settings.font });
      return;
    }

    const fontInfo = fi.getFontInfo(settings.custom_font);

    if (!fontInfo) {
      const source = this.sourcesService.getSource(item.id);
      source.updateSettings({ font: settings.font });
      return;
    }

    settings['font']['face'] = fontInfo.family_name;

    settings['font']['flags'] =
      (fontInfo.italic ? obs.EFontStyle.Italic : 0) |
      (fontInfo.bold ? obs.EFontStyle.Bold : 0);

    const source = this.sourcesService.getSource(item.id);
    source.updateSettings({ font: settings.font });
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
          propertiesManagerSettings: sourceInfo.propertiesManagerSettings || {},
        }
      );

      let newSource = this.sourcesService.getSource(sourceInfo.id);
      if (newSource.async && newSource.video) {
        newSource.setDeinterlaceMode(sourceInfo.deinterlaceMode);
        newSource.setDeinterlaceFieldOrder(sourceInfo.deinterlaceFieldOrder);
      }

      if (source.audioMixers) {
        this.audioService.getSource(sourceInfo.id).setMul((sourceInfo.volume != null) ? sourceInfo.volume : 1);
        this.audioService.getSource(sourceInfo.id).setSettings({
          forceMono: sourceInfo.forceMono,
          syncOffset: sourceInfo.syncOffset ? AudioService.timeSpecToMs(sourceInfo.syncOffset) : 0,
          audioMixers: sourceInfo.audioMixers,
          monitoringType: sourceInfo.monitoringType
        });
        this.audioService.getSource(sourceInfo.id).setHidden(!!sourceInfo.mixerHidden);
      }

      this.checkTextSourceValidity(sourceInfo);

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
          source.name = 'Desktop Audio' + (index > 1 ? ' ' + index : '');
          return;
        }

        const auxDeviceMatch = /^AuxAudioDevice(\d)$/.exec(source.name);
        if (auxDeviceMatch) {
          const index = parseInt(auxDeviceMatch[1], 10);
          source.name = 'Mic/Aux' + (index > 1 ? ' ' + index : '');
          return;
        }

      });

    }
  }
}
