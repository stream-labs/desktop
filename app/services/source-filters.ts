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
import { mutation, StatefulService, ViewHandler } from 'services/core/stateful-service';
import { byOS, OS } from 'util/operating-systems';
import Vue from 'vue';
import { InitAfter } from 'services';

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

interface IFiltersServiceState {
  filters: {
    [sourceId: string]: ISourceFilter[] | undefined;
  };
  presets: {
    [sourceId: string]: ISourceFilter | undefined;
  };
  types: ISourceFilterType[];
}

class SourceFiltersViews extends ViewHandler<IFiltersServiceState> {
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

  get presetFilterOptionsReact() {
    return this.presetFilterOptions.map(opt => ({
      label: opt.title,
      // Empty string doesn't play nicely with our react list input
      // due to it being a falsey value in JS.
      value: opt.value === '' ? 'none' : opt.value,
    }));
  }

  get presetFilterMetadata() {
    return metadata.list({
      options: this.presetFilterOptions,
      title: $t('Visual Presets'),
      optionsHeight: 230,
    });
  }

  parsePresetValue(path: string) {
    return path.match(/luts[\\\/][a-z_]+.png$/)[0];
  }

  filtersBySourceId(sourceId: string) {
    return this.state.filters[sourceId];
  }

  presetFilterBySourceId(sourceId: string) {
    return this.state.presets[sourceId];
  }

  getTypesForSource(sourceId: string): ISourceFilterType[] {
    const source = this.getServiceViews(SourcesService).getSource(sourceId);
    return this.state.types.filter(filterType => {
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

  suggestName(sourceId: string, filterName: string): string {
    return namingHelpers.suggestName(
      filterName,
      (name: string) => !!this.state.filters[sourceId].find(f => f.name === name),
    );
  }
}

@InitAfter('SourcesService')
export class SourceFiltersService extends StatefulService<IFiltersServiceState> {
  @Inject() private sourcesService: SourcesService;
  @Inject() private windowsService: WindowsService;
  @Inject() private usageStatisticsService: UsageStatisticsService;

  static initialState: IFiltersServiceState = { filters: {}, presets: {}, types: [] };

  filterAdded = new Subject<ISourceFilterIdentifier>();
  filterRemoved = new Subject<ISourceFilterIdentifier>();
  filterUpdated = new Subject<ISourceFilterIdentifier>();
  filtersReordered = new Subject<void>();

  init() {
    this.sourcesService.sourceAdded.subscribe(s => {
      if (!this.state.filters[s.sourceId]) this.SET_FILTERS(s.sourceId, []);
    });

    this.sourcesService.sourceRemoved.subscribe(s => {
      this.REMOVE_FILTERS(s.sourceId);
    });

    this.SET_TYPES(this.getTypes());
  }

  get views() {
    return new SourceFiltersViews(this.state);
  }

  /**
   * Called once at startup to load available types from OBS.
   * External code should access type list via the Vuex store.
   */
  private getTypes() {
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
    const allowedAvailableTypes = allowlistedTypes.filter(type =>
      obsAvailableTypes.includes(type.value),
    );

    return allowedAvailableTypes.map(type => {
      const flags = obs.Global.getOutputFlagsFromId(type.value);

      return {
        type: type.value,
        description: type.description,
        audio: !!(obs.ESourceOutputFlags.Audio & flags),
        video: !!(obs.ESourceOutputFlags.Video & flags),
        async: !!(obs.ESourceOutputFlags.Async & flags),
      };
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

    if (filterName === '__PRESET') {
      this.SET_PRESET_FILTER(sourceId, {
        name: filterName,
        type: filterType,
        visible: true,
        settings: filterReference.settings,
      });
    } else {
      this.SET_FILTERS(sourceId, [
        ...(this.state.filters[sourceId] ?? []),
        {
          name: filterName,
          type: filterType,
          visible: true,
          settings: filterReference.settings,
        },
      ]);
    }

    if (this.views.presetFilterBySourceId(sourceId)) {
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

    if (filterName === '__PRESET') {
      this.REMOVE_PRESET_FILTER(sourceId);
    } else {
      this.SET_FILTERS(
        sourceId,
        this.state.filters[sourceId].filter(f => f.name !== filterName),
      );
    }

    source.getObsInput().removeFilter(obsFilter);
    this.filterRemoved.next({ sourceId, name: filterName });
  }

  setPropertiesFormData(sourceId: string, filterName: string, properties: TObsFormData) {
    if (!filterName) return;
    const obsFilter = this.getObsFilter(sourceId, filterName);

    setPropertiesFormData(obsFilter, properties);
    this.UPDATE_FILTER(sourceId, { name: filterName, settings: obsFilter.settings });
    this.filterUpdated.next({ sourceId, name: filterName });
  }

  getFilters(sourceId: string): ISourceFilter[] {
    return this.state.filters[sourceId];
  }

  /**
   * Loads the provided filter data into the store. This is only
   * really called when loading a scene collection.
   * @param sourceId The id of the source to load
   * @param filters The filter data
   */
  loadFilterData(sourceId: string, filters: ISourceFilter[]): void {
    this.SET_FILTERS(
      sourceId,
      filters.filter(f => f.name !== '__PRESET'),
    );

    const preset = filters.find(f => f.name === '__PRESET');
    if (preset) this.SET_PRESET_FILTER(sourceId, preset);
  }

  addPresetFilter(sourceId: string, path: string) {
    const preset = this.views.presetFilterBySourceId(sourceId);
    if (preset) {
      this.setPropertiesFormData(sourceId, '__PRESET', [
        {
          name: 'image_path',
          value: getSharedResource(path),
          options: null,
          description: null,
          type: 'OBS_PROPERTY_PATH',
        },
      ]);
    } else {
      // Funky name to attempt avoiding namespace collisions with user-set filters
      this.add(sourceId, 'clut_filter', '__PRESET', { image_path: getSharedResource(path) });
    }
  }

  setVisibility(sourceId: string, filterName: string, visible: boolean) {
    this.getObsFilter(sourceId, filterName).enabled = visible;
    this.UPDATE_FILTER(sourceId, { name: filterName, visible });
    this.filterUpdated.next({ sourceId, name: filterName });
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
    // Reorder in the store
    if (filterName !== '__PRESET') {
      const from = this.state.filters[sourceId].findIndex(f => f.name === filterName);
      const to = from + delta;
      this.REORDER_FILTERS(sourceId, from, to);
    }

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
    const source = this.sourcesService.views.getSource(sourceId);
    this.windowsService.showWindow({
      componentName: 'SourceFilters',
      title: $t('Filters for %{sourceName}', { sourceName: source.name }),
      queryParams: { sourceId, selectedFilterName },
      size: {
        width: 800,
        height: 800,
      },
    });
  }

  private getObsFilter(sourceId: string, filterName: string): obs.IFilter {
    return this.sourcesService.views.getSource(sourceId).getObsInput().findFilter(filterName);
  }

  @mutation()
  SET_FILTERS(sourceId: string, filters: ISourceFilter[]) {
    Vue.set(this.state.filters, sourceId, filters);
  }

  @mutation()
  UPDATE_FILTER(sourceId: string, patch: Partial<ISourceFilter>) {
    const filter =
      patch.name === '__PRESET'
        ? this.state.presets[sourceId]
        : this.state.filters[sourceId].find(f => f.name === patch.name);

    Object.assign(filter, patch);
  }

  @mutation()
  REMOVE_FILTERS(sourceId: string) {
    Vue.delete(this.state.filters, sourceId);
    Vue.delete(this.state.presets, sourceId);
  }

  @mutation()
  SET_PRESET_FILTER(sourceId: string, filter: ISourceFilter) {
    Vue.set(this.state.presets, sourceId, filter);
  }

  @mutation()
  REMOVE_PRESET_FILTER(sourceId: string) {
    Vue.delete(this.state.presets, sourceId);
  }

  @mutation()
  REORDER_FILTERS(sourceId: string, from: number, to: number) {
    const filter = this.state.filters[sourceId][from];
    this.state.filters[sourceId].splice(from, 1);
    this.state.filters[sourceId].splice(to, 0, filter);
  }

  @mutation()
  SET_TYPES(types: ISourceFilterType[]) {
    this.state.types = types;
  }
}
