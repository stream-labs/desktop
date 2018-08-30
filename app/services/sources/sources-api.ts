import { IPropertyManager } from './properties-managers/properties-manager';
import { IListOption, TFormData } from '../../components/shared/forms/Input';
import { Observable } from 'rxjs/Observable';
import * as obs from '../../../obs-api';

export interface ISource extends IResource {
  sourceId: string;
  name: string;
  type: TSourceType;
  audio: boolean;
  video: boolean;
  async: boolean;
  muted: boolean;
  width: number;
  height: number;
  doNotDuplicate: boolean;
  channel?: number;
  deinterlaceMode: obs.EDeinterlaceMode;
  deinterlaceFieldOrder: obs.EDeinterlaceFieldOrder;
}

/**
 * Used to compare whether 2 sources are functionally
 * equivalent and should be created as a reference.
 */
export interface ISourceComparison {
  type: TSourceType;
  propertiesManager: TPropertiesManager;
}


export interface ISourceApi extends ISource {
  updateSettings(settings: Dictionary<any>): void;
  getSettings(): Dictionary<any>;
  isSameType(comparison: ISourceComparison): boolean;
  getPropertiesManagerType(): TPropertiesManager;
  getPropertiesManagerSettings(): Dictionary<any>;
  getPropertiesManagerUI(): string;
  getPropertiesFormData(): TFormData;
  setPropertiesFormData(properties: TFormData): void;
  setPropertiesManagerSettings(settings: Dictionary<any>): void;
  hasProps(): boolean;
  setName(newName: string): void;
  setDeinterlaceMode(newMode: obs.EDeinterlaceMode): void;
  setDeinterlaceFieldOrder(newOrder: obs.EDeinterlaceFieldOrder): void;
}


export interface ISourcesServiceApi {
  createSource(
    name: string,
    type: TSourceType,
    settings?: Dictionary<any>,
    options?: ISourceCreateOptions
  ): ISourceApi;
  getAvailableSourcesTypes(): TSourceType[];
  getAvailableSourcesTypesList(): IListOption<TSourceType>[];
  getSources(): ISourceApi[];
  getSource(sourceId: string): ISourceApi;
  getSourcesByName(name: string): ISourceApi[];

  /**
   * creates a source from a file
   * source type depends on the file extension
   */
  addFile(path: string): ISourceApi;
  suggestName(name: string): string;
  showSourceProperties(sourceId: string): void;
  showShowcase(): void;
  showAddSource(sourceType: TSourceType): void;
  showNameSource(sourceType: TSourceType): void;
  sourceAdded: Observable<ISource>;
  sourceUpdated: Observable<ISource>;
  sourceRemoved: Observable<ISource>;
}


export interface ISourceCreateOptions {
  channel?: number;
  sourceId?: string; // A new ID will be generated if one is not specified
  propertiesManager?: TPropertiesManager;
  propertiesManagerSettings?: Dictionary<any>;
}

export type TSourceType =
  'image_source' |
  'color_source' |
  'browser_source' |
  'slideshow' |
  'ffmpeg_source' |
  'text_gdiplus' |
  'text_ft2_source' |
  'monitor_capture' |
  'window_capture' |
  'game_capture' |
  'dshow_input' |
  'wasapi_input_capture' |
  'wasapi_output_capture' |
  'decklink-input' |
  'scene' |
  'ndi_source' |
  'openvr_capture' |
  'liv_capture'
  ;

// Register new properties manager here
export type TPropertiesManager = 'default';


export interface ISourcesState {
  sources: Dictionary<ISource>;
}

export interface IActivePropertyManager {
  manager: IPropertyManager;
  type: TPropertiesManager;
}
