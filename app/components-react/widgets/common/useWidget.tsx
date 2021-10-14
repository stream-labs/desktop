import { useModuleByName, useModuleRoot } from '../../hooks/useModule';
import { WidgetTesters, WidgetType } from '../../../services/widgets';
import { Services } from '../../service-provider';
import {mutation, watch} from '../../store';
import { throttle } from 'lodash-decorators';
import { assertIsDefined, getDefined } from '../../../util/properties-type-guards';
import { TAlertType, TWidgetType } from '../../../services/widgets/widget-config';
import { TObsFormData } from '../../../components/obs/inputs/ObsInput';
import { pick } from 'lodash';
import { $t } from '../../../services/i18n';
import Utils from '../../../services/utils';

/**
 * Common state for all widgets
 */
export interface IWidgetState {
  isLoading: boolean;
  sourceId: string;
  shouldCreatePreviewSource: boolean;
  previewSourceId: string;
  selectedTab: string;
  type: TWidgetType;
  browserSourceProps: TObsFormData;
  data: {
    settings: Record<string, any>;
  };
}

/**
 * Default state for all widgets
 */
export const DEFAULT_WIDGET_STATE = ({
  isLoading: true,
  sourceId: '',
  shouldCreatePreviewSource: true,
  previewSourceId: '',
  isPreviewVisible: false,
  selectedTab: 'general',
  type: '',
  data: {},
  browserSourceProps: null,
} as unknown) as IWidgetState;

/**
 * A base Redux module for all widget components
 */
export class WidgetModule<TWidgetState extends IWidgetState = IWidgetState> {
  // init default state
  state: TWidgetState = {
    ...((DEFAULT_WIDGET_STATE as unknown) as TWidgetState),
  };

  // create shortcuts for widgetsConfig and eventsInfo
  public widgetsConfig = this.widgetsService.widgetsConfig;
  public eventsConfig = this.widgetsService.eventsConfig;

  // init module
  async init(params: { sourceId: string; shouldCreatePreviewSource?: boolean }) {
    this.state.sourceId = params.sourceId;
    this.state.shouldCreatePreviewSource = !!params.shouldCreatePreviewSource;

    // save browser source settings into store
    const widget = this.widget;
    this.setBrowserSourceProps(widget.getSource()!.getPropertiesFormData());

    // create a temporary preview-source for the Display component
    if (this.state.shouldCreatePreviewSource) {
      const previewSource = widget.createPreviewSource();
      this.state.previewSourceId = previewSource.sourceId;
    }

    // load settings from the server to the store
    this.state.type = WidgetType[widget.type] as TWidgetType;
    const data = await this.fetchData();
    this.setData(data);
    this.setIsLoading(false);
  }

  // de-init module
  destroy() {
    if (this.state.previewSourceId) this.widget.destroyPreviewSource();
  }

  async reload() {
    this.setIsLoading(true);
    this.setData(await this.fetchData());
    this.setIsLoading(false);
  }

  /**
   * returns widget's settings from the store
   */
  get settings(): TWidgetState['data']['settings'] {
    return getDefined(this.state.data).settings;
  }

  get availableAlerts(): TAlertType[] {
    return Object.keys(this.eventsConfig) as TAlertType[];
  }

  get customCode(): ICustomCode {
    return pick(
      this.settings,
      'custom_enabled',
      'custom_html',
      'custom_css',
      'custom_js',
      'custom_json',
    );
  }

  updateCustomCode(patch: Partial<ICustomCode>) {
    this.updateSettings(patch);
  }

  get hasCustomFields() {
    const { custom_enabled, custom_json } = this.customCode;
    return custom_enabled && custom_json;
  }

  async openCustomCodeEditor() {
    const sourceId = this.state.sourceId;
    const windowId = `${sourceId}-code_editor`;
    const widgetWindowBounds = Utils.getChildWindow().getBounds();
    const position = {
      x: widgetWindowBounds.x + widgetWindowBounds.width,
      y: widgetWindowBounds.y,
    };

    const winId = await Services.WindowsService.actions.return.createOneOffWindow(
      {
        componentName: 'CustomCodeWindow',
        title: $t('Custom Code'),
        queryParams: { sourceId },
        size: {
          width: 800,
          height: 800,
        },
        position,
      },
      windowId,
    );
  }

  private get widgetsService() {
    return Services.WidgetsService;
  }

  /**
   * A shortcut for WidgetsService.actions
   */
  private actions = this.widgetsService.actions;

  /**
   * Returns a Widget class
   */
  private get widget() {
    return this.widgetsService.getWidgetSource(this.state.sourceId);
  }

  get config() {
    return this.widgetsConfig[this.state.type];
  }

  public onMenuClickHandler(e: { key: string }) {
    this.setSelectedTab(e.key);
  }

  public playAlert(type: TAlertType) {
    const testersMap = createAlertsMap({
      donation: 'Donation',
      follow: 'Follow',
      raid: 'Raid',
      host: 'Host',
      subscription: 'Subscriber',
      cheer: 'Bits',
      superchat: 'Super Chat',
      stars: 'Star',
      support: 'Support',
    });
    const testerName = testersMap[type];
    const tester = WidgetTesters.find(t => t.name === testerName);
    if (!tester) throw new Error(`Tester not found ${type}`);
    this.actions.test(tester.name);
  }

  /**
   * Update settings and save on the server
   */
  public updateSettings(formValues: any) {
    const newSettings = { ...this.settings, ...formValues };
    // save setting to the store
    this.setSettings(newSettings);
    // send setting to the server
    this.saveSettings(newSettings);
  }

  /**
   * Fetch settings from the server
   */
  private async fetchData(): Promise<TWidgetState['data']> {
    // load widget settings data into state
    const rawData = await this.actions.return.request({
      url: this.config.dataFetchUrl,
      method: 'GET',
    });
    return this.patchAfterFetch(rawData);
  }

  /**
   * Save setting on the server
   */
  @throttle(500)
  private async saveSettings(settings: TWidgetState['data']['settings']) {
    const body = this.patchBeforeSend(settings);
    return await this.actions.return.request({
      body,
      url: this.config.settingsSaveUrl,
      method: 'POST',
    });
  }

  /**
   * override this method to patch data after fetching
   */
  protected patchAfterFetch(data: any): any {
    return data;
  }

  /**
   * override this method to patch data before save
   */
  protected patchBeforeSend(settings: any): any {
    return settings;
  }

  /**
   * save browser source settings
   */
  updateBrowserSourceProps(formData: TObsFormData) {
    // save source settings in OBS source
    const source = getDefined(this.widget.getSource());
    source.setPropertiesFormData(formData);
    // sync source setting with state
    const updatedProps = source.getPropertiesFormData();
    this.setBrowserSourceProps(updatedProps);
  }

  // DEFINE MUTATIONS

  @mutation()
  private setIsLoading(isLoading: boolean) {
    this.state.isLoading = isLoading;
  }

  @mutation()
  private setSelectedTab(name: string) {
    this.state.selectedTab = name;
  }

  @mutation()
  private setData(data: TWidgetState['data']) {
    this.state.data = data;
  }

  @mutation()
  private setSettings(settings: TWidgetState['data']['settings']) {
    assertIsDefined(this.state.data);
    this.state.data.settings = settings;
  }

  @mutation()
  private setBrowserSourceProps(props: TObsFormData) {
    const propsOrder = [
      'width',
      'height',
      'css',
      'refreshnocache',
      'reroute_audio',
      'restart_when_active',
      'shutdown',
      'fps_custom',
      'fps',
    ];
    const sortedProps = propsOrder.map(propName => props.find(p => p.name === propName)!);
    this.state.browserSourceProps = sortedProps;
  }
}

/**
 * Initializes a context with a Redux module for a given widget
 * Have to be called in the root widget component
 * all widget components can access the initialized module via `useWidget` hook
 */
export function useWidgetRoot<T extends typeof WidgetModule>(
  Module: T,
  params: { sourceId?: string; shouldCreatePreviewSource?: boolean },
) {
  return useModuleRoot(Module, params, 'WidgetModule').select();
}

/**
 * Returns the widget's module from the existing context and selects requested fields
 */
export function useWidget<TModule extends WidgetModule>() {
  return useModuleByName<TModule>('WidgetModule').select();
}

/**
 * This function ensures that given object have a key for each alert type
 * Also it provides better experience for Typescript types related to widgets
 */
export function createAlertsMap<T extends { [key in TAlertType]: any }>(obj: T) {
  return obj;
}

export interface ICustomCode {
  custom_enabled: boolean;
  custom_html: string;
  custom_css: string;
  custom_js: string;
  custom_json: Record<string, ICustomField>;
}

export interface ICustomField {
  label: string;
  type: string;
  value: any;

  options?: Record<string, string>;
  max?: number;
  min?: number;
  steps?: number;
}
