import { Service } from './service';
import {
  TFormData, getPropertiesFormData, setPropertiesFormData, IListOption,
  TObsValue
} from '../components/shared/forms/Input';
import { Inject } from '../util/injector';
import { SourcesService } from './sources';
import { WindowsService } from './windows';
import * as obs from '../../obs-api';
import namingHelpers from '../util/NamingHelpers';


export type TSourceFilterType =
  'mask_filter' |
  'crop_filter' |
  'gain_filter' |
  'color_filter' |
  'scale_filter' |
  'scroll_filter' |
  'gpu_delay' |
  'color_key_filter' |
  'clut_filter' |
  'sharpness_filter' |
  'chroma_key_filter' |
  'async_delay_filter' |
  'noise_suppress_filter' |
  'noise_gate_filter' |
  'compressor_filter' |
  'vst_filter' |
  'face_mask_filter';

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


export class SourceFiltersService extends Service {

  @Inject()
  sourcesService: SourcesService;

  @Inject()
  windowsService: WindowsService;

  getTypesList(): IListOption<TSourceFilterType>[] {
    const obsAvailableTypes = obs.FilterFactory.types();
    const whitelistedTypes: IListOption<TSourceFilterType>[] = [
      { description: 'Image Mask/Blend', value: 'mask_filter' },
      { description: 'Crop/Pad', value: 'crop_filter' },
      { description: 'Gain', value: 'gain_filter' },
      { description: 'Color Correction', value: 'color_filter' },
      { description: 'Scaling/Aspect Ratio', value: 'scale_filter' },
      { description: 'Scroll', value: 'scroll_filter' },
      { description: 'Render Delay', value: 'gpu_delay' },
      { description: 'Color Key', value: 'color_key_filter' },
      { description: 'Apply LUT', value: 'clut_filter' },
      { description: 'Sharpen', value: 'sharpness_filter' },
      { description: 'Chroma Key', value: 'chroma_key_filter' },
      { description: 'Video Delay (Async)', value: 'async_delay_filter' },
      { description: 'Noise Suppression', value: 'noise_suppress_filter' },
      { description: 'Noise Gate', value: 'noise_gate_filter' },
      { description: 'Compressor', value: 'compressor_filter' },
      { description: 'VST 2.x Plugin', value: 'vst_filter' },
      { description: 'Face Mask Plugin', value: 'face_mask_filter' }
    ];

    return whitelistedTypes.filter(type => obsAvailableTypes.includes(type.value));
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
        audio: !!(obs.ESourceOutputFlags.Audio & flags),
        video: !!(obs.ESourceOutputFlags.Video & flags),
        async: !!(obs.ESourceOutputFlags.Async & flags),
        type,
        description
      });
    });

    return types;
  }


  getTypesForSource(sourceId: string): ISourceFilterType[] {
    const source = this.sourcesService.getSource(sourceId);
    return this.getTypes().filter(filterType => {
      return (filterType.audio && source.audio) || (filterType.video && source.video);
    });
  }


  add(sourceId: string, filterType: TSourceFilterType, filterName: string, settings?: Dictionary<TObsValue>) {
    const source = this.sourcesService.getSource(sourceId);
    const obsFilter = obs.FilterFactory.create(filterType, filterName);
    source.getObsInput().addFilter(obsFilter);
    // There is now 2 references to the filter at that point
    // We need to release one
    obsFilter.release();
    if (settings) obsFilter.update(settings);
    return obsFilter;
  }


  copyFilters(fromSourceId: string, toSourceId: string) {
    this.getFilters(fromSourceId).forEach(filter => {
      this.add(
        toSourceId,
        filter.type,
        this.suggestName(toSourceId, filter.name),
        filter.settings
      );
    });
  }


  suggestName(sourceId: string, filterName: string): string {
    return namingHelpers.suggestName(filterName, (name: string) => this.getObsFilter(sourceId, name));
  }


  remove(sourceId: string, filterName: string) {
    const obsFilter = this.getObsFilter(sourceId, filterName);
    const source = this.sourcesService.getSource(sourceId);
    source.getObsInput().removeFilter(obsFilter);
  }


  setPropertiesFormData(sourceId: string, filterName: string, properties: TFormData) {
    if (!filterName) return;
    setPropertiesFormData(this.getObsFilter(sourceId, filterName), properties);
  }


  getFilters(sourceId: string): ISourceFilter[] {
    return this.sourcesService
      .getSource(sourceId)
      .getObsInput()
      .filters.map(obsFilter => ({
        visible: obsFilter.enabled,
        name: obsFilter.name,
        type: obsFilter.id as TSourceFilterType,
        settings: obsFilter.settings
      }));
  }


  setVisibility(sourceId: string, filterName: string, visible: boolean) {
    this.getObsFilter(sourceId, filterName).enabled = visible;
  }


  getAddNewFormData(sourceId: string) {
    const availableTypesList = this.getTypesForSource(sourceId).map(filterType => {
      return { description: filterType.description, value: filterType.type };
    });

    return {
      type: {
        description: 'Filter type',
        name: 'type',
        value: availableTypesList[0].value,
        options: availableTypesList
      },
      name: {
        description: 'Filter name',
        name: 'name',
        value: 'New filter'
      }
    };
  }


  getPropertiesFormData(sourceId: string, filterName: string): TFormData {
    if (!filterName) return [];
    return getPropertiesFormData(this.getObsFilter(sourceId, filterName));
  }


  showSourceFilters(sourceId: string, selectedFilterName = '') {
    this.windowsService.showWindow({
      componentName: 'SourceFilters',
      queryParams: { sourceId, selectedFilterName },
      size: {
        width: 800,
        height: 800
      }
    });
  }


  showAddSourceFilter(sourceId: string) {
    this.windowsService.showWindow({
      componentName: 'AddSourceFilter',
      queryParams: { sourceId },
      size: {
        width: 600,
        height: 400
      }
    });
  }

  private getObsFilter(sourceId: string, filterName: string): obs.IFilter {
    return this.sourcesService.getSource(sourceId).getObsInput().findFilter(filterName);
  }
}
