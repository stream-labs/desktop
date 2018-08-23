import { IPropertyManager } from './properties-managers/properties-manager';
import { IObsListOption, TObsFormData } from 'components/obs/inputs/ObsInput';
import { WidgetType } from '../widgets';
import { Observable } from 'rxjs/Observable';

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
}

/**
 * Used to compare whether 2 sources are functionally
 * equivalent and should be created as a reference.
 */
export interface ISourceComparison {
  type: TSourceType;
  propertiesManager: TPropertiesManager;
  widgetType?: WidgetType;
  isStreamlabel?: boolean;
  appId?: string;
  appSourceId?: string;
}

export interface ISourceApi extends ISource {
  updateSettings(settings: Dictionary<any>): void;
  getSettings(): Dictionary<any>;
  isSameType(comparison: ISourceComparison): boolean;
  getPropertiesManagerType(): TPropertiesManager;
  getPropertiesManagerSettings(): Dictionary<any>;
  getPropertiesManagerUI(): string;
  getPropertiesFormData(): TObsFormData;
  setPropertiesFormData(properties: TObsFormData): void;
  setPropertiesManagerSettings(settings: Dictionary<any>): void;
  hasProps(): boolean;
  setName(newName: string): void;
}

export interface ISourcesServiceApi {
  createSource(
    name: string,
    type: TSourceType,
    settings?: Dictionary<any>,
    options?: ISourceCreateOptions
  ): ISourceApi;
  removeSource(id: string): void;
  getAvailableSourcesTypes(): TSourceType[];
  getAvailableSourcesTypesList(): IObsListOption<TSourceType>[];
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
  showNameWidget(widgetType: WidgetType): void;
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
export type TPropertiesManager = 'default' | 'widget' | 'streamlabels';

export interface ISourcesState {
  sources: Dictionary<ISource>;
}

export interface IActivePropertyManager {
  manager: IPropertyManager;
  type: TPropertiesManager;
}

export interface ISourceDisplayData {
  name: string;
  description: string;
  demoFilename?: string;
  supportList?: string[];
}
