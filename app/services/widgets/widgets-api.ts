import { TPlatform } from '../platforms';
import { AnchorPoint } from 'util/ScalableRectangle';
import { WidgetType } from './widgets-data';
import { ISourceApi } from 'services/sources';

export interface ISerializableWidget {
  name: string;
  type: WidgetType;
  settings: Dictionary<any>;
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
}

type TUrlGenerator = (
  host: string,
  token: string,
  platform: TPlatform
) => string;

export interface IWidgetTester {
  name: string;
  url: (host: string, platform: TPlatform) => string;

  // Which platforms this tester can be used on
  platforms: TPlatform[];
}

export interface IWidget {
  name: string;
  url: TUrlGenerator;

  // Default transform for the widget
  width: number;
  height: number;

  // These are relative, so they will adjust to the
  // canvas resolution.  Valid values are between 0 and 1.
  x: number;
  y: number;

  // An anchor (origin) point can be specified for the x&y positions
  anchor: AnchorPoint;
}

export interface IWidgetApiSettings {
  type: WidgetType;
  url: string;
  dataFetchUrl: string;
  settingsSaveUrl: string;
  previewUrl: string;
  settingsUpdateEvent: string;
  testers?: string[];
  customCodeAllowed?: boolean;
  customFieldsAllowed?: boolean;
}

export interface IWidgetSource {
  type: WidgetType;
  sourceId: string;
  previewSourceId: string;
}

export interface IWidgetApi extends IWidgetSource {
  getSource(): ISourceApi;
  refresh(): void;
  getSettingsService(): IWidgetSettingsServiceApi;
  createPreviewSource(): ISourceApi;
  destroyPreviewSource(): void;
}

export interface IWidgetsServiceApi {
  getWidgetSource(sourceId: string): IWidgetApi
}

export interface IWidgetSettingsServiceApi {
  getApiSettings(): IWidgetApiSettings;
  fetchData(): Promise<any>;
  saveSettings(settings: IWidgetSettings): Promise<any>;
  state: IWidgetSettingsGenericState;
}


export interface IWidgetSettings {
  custom_enabled: boolean;
  custom_html: string;
  custom_css: string;
  custom_js: string;
}

export interface IWidgetData {

  type: WidgetType;

  settings: IWidgetSettings;

  custom_defaults?: {
    html: string;
    css: string;
    js: string;
  };
}

export type TWIdgetLoadingState = 'none' | 'pending' | 'success' | 'fail';

export interface IWidgetSettingsGenericState {
  loadingState: TWIdgetLoadingState;
  data: IWidgetData;
  rawData: Dictionary<any>; // widget data before patching
}

export interface IWidgetSettingsState<TWidgetData extends IWidgetData> extends IWidgetSettingsGenericState {
  data: TWidgetData;
}