import { Service } from './core/service';
import {
  TObsFormData,
  getPropertiesFormData,
  setPropertiesFormData,
  IObsListOption,
  TObsValue,
  IObsListInput,
} from 'components/obs/inputs/ObsInput';
import { metadata } from 'components/shared/inputs';
import path from 'path';
import { Inject } from './core/injector';
import { SourcesService } from './sources';
import { WindowsService } from './windows';
import * as obs from '../../obs-api';
import namingHelpers from '../util/NamingHelpers';
import { $t } from 'services/i18n';
import { EOrderMovement } from 'obs-studio-node';
import { Subject } from 'rxjs';
import { UsageStatisticsService } from './usage-statistics';
import { getSharedResource } from 'util/get-shared-resource';
import { ViewHandler } from 'services/core/stateful-service';
import { byOS, OS } from 'util/operating-systems';

export type TSourceFilterType =
  | 'mask_filter'
  | 'crop_filter'
  | 'gain_filter'
  | 'color_filter'
  | 'scale_filter'
  | 'scroll_filter'
  | 'gpu_delay'
  | 'color_key_filter'
  | 'clut_filter'
  | 'sharpness_filter'
  | 'chroma_key_filter'
  | 'async_delay_filter'
  | 'noise_suppress_filter'
  | 'noise_gate_filter'
  | 'compressor_filter'
  | 'vst_filter'
  | 'face_mask_filter'
  | 'invert_polarity_filter'
  | 'limiter_filter'
  | 'expander_filter'
  | 'shader_filter';

interface ISourceFilterType {
  type: TSourceFilterType;
  description: string;
  video: boolean;
  audio: boolean;
  async: boolean;
}

export interface ISourceFilter {
  name: string;
  type: TSourceFilterType;
  visible: boolean;
  settings: Dictionary<TObsValue>;
}

export interface ISourceFilterIdentifier {
  sourceId: string;
  name: string;
}

class SourceFiltersViews extends ViewHandler<{}> {
  get presetFilterOptions() {
    return [
      { title: $t('None'), value: '' },
      { title: $t('Grayscale'), value: path.join('luts', 'grayscale.png') },
      { title: $t('Sepiatone'), value: path.join('luts', 'sepia.png') },
      { title: $t('Dramatic'), value: path.join('luts', 'gazing.png') },
      { title: $t('Flashback'), value: path.join('luts', 'muted.png') },
      { title: $t('Inverted'), value: path.join('luts', 'inverted.png') },
      { title: $t('Action Movie'), value: path.join('luts', 'cool_tone.png') },
      { title: $t('Hearth'), value: path.join('luts', 'warm_tone.png') },
      { title: $t('Wintergreen'), value: path.join('luts', 'green_tone.png') },
      { title: $t('Heat Map'), value: path.join('luts', 'heat_map.png') },
      { title: $t('Cel Shade'), value: path.join('luts', 'cel_shade.png') },
    ];
  }

  get presetFilterMetadata() {
    return metadata.list({
      options: this.presetFilterOptions,
      title: $t('Visual Presets'),
      optionsHeight: 230,
    });
  }

  parsePresetValue(path: string) {
    return path.match(/luts\\[a-z_]+.png$/)[0];
  }
}

export class SourceFiltersService extends Service {
  @Inject() private sourcesService: SourcesService;
  @Inject() private windowsService: WindowsService;
  @Inject() private usageStatisticsService: UsageStatisticsService;

  filterAdded = new Subject<ISourceFilterIdentifier>();
  filterRemoved = new Subject<ISourceFilterIdentifier>();
  filterUpdated = new Subject<ISourceFilterIdentifier>();
  filtersReordered = new Subject<void>();

  get views() {
    return new SourceFiltersViews({});
  }

  getTypesList(): IObsListOption<TSourceFilterType>[] {
    const obsAvailableTypes = obs.FilterFactory.types();
    const allowlistedTypes: IObsListOption<TSourceFilterType>[] = [
      { description: $t('Image Mask/Blend'), value: 'mask_filter' },
      { description: $t('Crop/Pad'), value: 'crop_filter' },
      { description: $t('Gain'), value: 'gain_filter' },
      { description: $t('Color Correction'), value: 'color_filter' },
      { description: $t('Scaling/Aspect Ratio'), value: 'scale_filter' },
      { description: $t('Scroll'), value: 'scroll_filter' },
      { description: $t('Render Delay'), value: 'gpu_delay' },
      { description: $t('Color Key'), value: 'color_key_filter' },
      { description: $t('Apply LUT'), value: 'clut_filter' },
      { description: $t('Sharpen'), value: 'sharpness_filter' },
      { description: $t('Chroma Key'), value: 'chroma_key_filter' },
      { description: $t('Video Delay (Async)'), value: 'async_delay_filter' },
      { description: $t('Noise Suppression'), value: 'noise_suppress_filter' },
      { description: $t('Noise Gate'), value: 'noise_gate_filter' },
      { description: $t('Compressor'), value: 'compressor_filter' },
      { description: $t('VST 2.x Plugin'), value: 'vst_filter' },
      { description: $t('Face Mask Plugin'), value: 'face_mask_filter' },
      { description: $t('Invert Polarity'), value: 'invert_polarity_filter' },
      { description: $t('Limiter'), value: 'limiter_filter' },
      { description: $t('Expander'), value: 'expander_filter' },
      { description: $t('Shader'), value: 'shader_filter' },
    ];

    return allowlistedTypes.filter(type => obsAvailableTypes.includes(type.value));
  }

  getTypes(): ISourceFilterType[] {
    const typesList = this.getTypesList();
    const types: ISourceFilterType[] = [];

    obs.FilterFactory.types().forEach((type: TSourceFilterType) => {
      const listItem = typesList.find(item => item.value === type);
      if (!listItem) {
        console.warn(`filter ${type} is not found in available types`);
        return;
      }
      const description = listItem.description;
      const flags = obs.Global.getOutputFlagsFromId(type);
      types.push({
        type,
        description,
        audio: !!(obs.ESourceOutputFlags.Audio & flags),
        video: !!(obs.ESourceOutputFlags.Video & flags),
        async: !!(obs.ESourceOutputFlags.Async & flags),
      });
    });

    return types;
  }

  getTypesForSource(sourceId: string): ISourceFilterType[] {
    const source = this.sourcesService.views.getSource(sourceId);
    return this.getTypes().filter(filterType => {
      if (filterType.type === 'face_mask_filter') return false;

      /* Audio filters can be applied to audio sources. */
      if (source.audio && filterType.audio) {
        return true;
      }

      /* We have either a video filter or source */
      /* Can't apply asynchronous video filters to non-asynchronous video sources. */
      if (!source.async && filterType.async) {
        return false;
      }

      /* Video filters can be applied to video sources. */
      if (source.video && filterType.video) {
        return true;
      }

      return false;
    });
  }

  add(
    sourceId: string,
    filterType: TSourceFilterType,
    filterName: string,
    settings?: Dictionary<TObsValue>,
  ) {
    const source = this.sourcesService.views.getSource(sourceId);
    const obsFilter = obs.FilterFactory.create(filterType, filterName, settings || {});

    const obsSource = source.getObsInput();
    obsSource.addFilter(obsFilter);
    // The filter should be created with the settings provided, is this necessary?
    if (settings) obsFilter.update(settings);
    const filterReference = obsSource.findFilter(filterName);
    // There is now 2 references to the filter at that point
    // We need to release one
    obsFilter.release();

    if (this.presetFilter(sourceId)) {
      this.usageStatisticsService.recordFeatureUsage('PresetFilter');
      this.setOrder(sourceId, '__PRESET', 1);
    }
    this.filterAdded.next({ sourceId, name: filterName });

    if (filterType === 'vst_filter') {
      this.usageStatisticsService.recordFeatureUsage('VST');
    }

    return filterReference;
  }

  suggestName(sourceId: string, filterName: string): string {
    return namingHelpers.suggestName(filterName, (name: string) =>
      this.getObsFilter(sourceId, name),
    );
  }

  remove(sourceId: string, filterName: string) {
    const obsFilter = this.getObsFilter(sourceId, filterName);
    const source = this.sourcesService.views.getSource(sourceId);
    source.getObsInput().removeFilter(obsFilter);
    this.filterRemoved.next({ sourceId, name: filterName });
  }

  setPropertiesFormData(sourceId: string, filterName: string, properties: TObsFormData) {
    if (!filterName) return;
    setPropertiesFormData(this.getObsFilter(sourceId, filterName), properties);
    this.filterUpdated.next({ sourceId, name: filterName });
  }

  getFilters(sourceId: string): ISourceFilter[] {
    return this.sourcesService.views
      .getSource(sourceId)
      .getObsInput()
      .filters.map(obsFilter => ({
        visible: obsFilter.enabled,
        name: obsFilter.name,
        type: obsFilter.id as TSourceFilterType,
        settings: obsFilter.settings,
      }));
  }

  presetFilter(sourceId: string): ISourceFilter {
    return this.getFilters(sourceId).find((filter: ISourceFilter) => filter.name === '__PRESET');
  }

  addPresetFilter(sourceId: string, path: string) {
    const preset = this.presetFilter(sourceId);
    if (preset) {
      this.setPropertiesFormData(sourceId, '__PRESET', [
        { name: 'image_path', value: getSharedResource(path), options: null, description: null },
      ]);
    } else {
      // Funky name to attempt avoiding namespace collisions with user-set filters
      this.add(sourceId, 'clut_filter', '__PRESET', { image_path: getSharedResource(path) });
    }
  }

  setVisibility(sourceId: string, filterName: string, visible: boolean) {
    this.getObsFilter(sourceId, filterName).enabled = visible;
    this.filterUpdated.next({ sourceId, name: filterName });
  }

  getAddNewFormData(sourceId: string) {
    const availableTypesList = this.getTypesForSource(sourceId).map(filterType => {
      return { description: filterType.description, value: filterType.type };
    });

    return {
      type: availableTypesList[0].value,
      name: $t('New filter'),
    };
  }

  getPropertiesFormData(sourceId: string, filterName: string): TObsFormData {
    if (!filterName) return [];
    const formData = getPropertiesFormData(this.getObsFilter(sourceId, filterName));
    if (!formData) return [];

    // Show SLOBS frontend display names for the sidechain source options
    formData.forEach(input => {
      if (input.name === 'sidechain_source') {
        (input as IObsListInput<string>).options.forEach(option => {
          if (option.value === 'none') return;

          const source = this.sourcesService.views.getSource(option.value);
          if (source) option.description = source.name;
        });
      }
    });

    return formData;
  }

  setOrder(sourceId: string, filterName: string, delta: number) {
    const obsFilter = this.getObsFilter(sourceId, filterName);
    const obsInput = this.sourcesService.views.getSource(sourceId).getObsInput();
    const movement = delta > 0 ? EOrderMovement.Down : EOrderMovement.Up;
    let i = Math.abs(delta);
    while (i--) {
      obsInput.setFilterOrder(obsFilter, movement);
    }
    this.filtersReordered.next();
  }

  showSourceFilters(sourceId: string, selectedFilterName = '') {
    const sourceDisplayName = this.sourcesService.views.getSource(sourceId).name;
    this.windowsService.showWindow({
      componentName: 'SourceFilters',
      title: `${$t('Source filters')} (${sourceDisplayName})`,
      queryParams: { sourceId, selectedFilterName },
      size: {
        width: 800,
        height: 800,
      },
    });
  }

  showAddSourceFilter(sourceId: string) {
    this.windowsService.showWindow({
      componentName: 'AddSourceFilter',
      title: $t('Add source filter'),
      queryParams: { sourceId },
      size: {
        width: 600,
        height: 500,
      },
    });
  }

  private getObsFilter(sourceId: string, filterName: string): obs.IFilter {
    return this.sourcesService.views
      .getSource(sourceId)
      .getObsInput()
      .findFilter(filterName);
  }
}
