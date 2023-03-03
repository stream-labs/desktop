import { WidgetType } from '../../../services/widgets';
import { Services } from '../../service-provider';
import { throttle } from 'lodash-decorators';
import { assertIsDefined, getDefined } from '../../../util/properties-type-guards';
import { TObsFormData } from '../../../components/obs/inputs/ObsInput';
import pick from 'lodash/pick';
import cloneDeep from 'lodash/cloneDeep';
import { $t } from '../../../services/i18n';
import Utils from '../../../services/utils';
import { TAlertType } from '../../../services/widgets/alerts-config';
import { alertAsync } from '../../modals';
import { onUnload } from 'util/unload';
import merge from 'lodash/merge';
import { GetUseModuleResult, injectFormBinding, injectState, useModule } from 'slap';
import { IWidgetConfig } from '../../../services/widgets/widgets-config';

/**
 * Common state for all widgets
 */
export interface IWidgetCommonState {
  isLoading: boolean;
  sourceId: string;
  shouldCreatePreviewSource: boolean;
  previewSourceId: string;
  selectedTab: string;
  type: WidgetType;
  browserSourceProps: TObsFormData;
  prevSettings: any;
  canRevert: boolean;
  widgetData: IWidgetState;
}

/**
 * Common state for all widgets
 */
export interface IWidgetState {
  data: {
    settings: any;
  };
}

/**
 * Default state for all widgets
 */
export const DEFAULT_WIDGET_STATE: IWidgetCommonState = {
  isLoading: true,
  sourceId: '',
  shouldCreatePreviewSource: true,
  previewSourceId: '',
  isPreviewVisible: false,
  selectedTab: 'general',
  type: ('' as any) as WidgetType,
  widgetData: {
    data: {
      settings: {},
    },
  },
  prevSettings: {},
  canRevert: false,
  browserSourceProps: (null as any) as TObsFormData,
} as IWidgetCommonState;

/**
 * A base Redux module for all widget components
 */
export class WidgetModule<TWidgetState extends IWidgetState = IWidgetState> {
  constructor(public params: WidgetParams) {}

  // init default state
  state = injectState({
    ...DEFAULT_WIDGET_STATE,
    sourceId: this.params.sourceId,
    shouldCreatePreviewSource: this.params.shouldCreatePreviewSource ?? true,
    selectedTab: this.params.selectedTab ?? 'general',
  } as IWidgetCommonState);

  // create shortcuts for widgetsConfig and eventsInfo
  public widgetsConfig = this.widgetsService.widgetsConfig;
  public eventsConfig = this.widgetsService.alertsConfig;

  bind = injectFormBinding(
    () => this.settings,
    statePatch => this.updateSettings(statePatch),
  );

  cancelUnload: () => void;

  // init module
  async init() {
    // save browser source settings into store
    const widget = this.widget;
    this.setBrowserSourceProps(widget.getSource()!.getPropertiesFormData());

    // create a temporary preview-source for the Display component
    if (this.state.shouldCreatePreviewSource) {
      const previewSource = widget.createPreviewSource();
      this.state.previewSourceId = previewSource.sourceId;
    }

    this.cancelUnload = onUnload(() => this.widget.destroyPreviewSource());

    // load settings from the server to the store
    this.state.type = widget.type;
    const data = await this.fetchData();
    this.setData(data);
    this.setPrevSettings(data);
    this.state.setIsLoading(false);
  }

  destroy() {
    if (this.state.previewSourceId) this.widget.destroyPreviewSource();
    this.cancelUnload();
  }

  async reload() {
    this.state.setIsLoading(true);
    this.setData(await this.fetchData());
    this.state.setIsLoading(false);
  }

  close() {
    Services.WindowsService.actions.closeChildWindow();
  }

  get widgetState() {
    return getDefined(this.state.widgetData) as TWidgetState;
  }

  get widgetData(): TWidgetState['data'] {
    return this.widgetState.data;
  }

  /**
   * returns widget's settings from the store
   */
  get settings(): TWidgetState['data']['settings'] {
    return this.widgetData.settings;
  }

  get availableAlerts(): TAlertType[] {
    return Object.keys(this.eventsConfig) as TAlertType[];
  }

  get customCode(): ICustomCode | null {
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
    if (!this.customCode) return false;
    const { custom_enabled, custom_json } = this.customCode;
    return custom_enabled && custom_json;
  }

  async openCustomCodeEditor() {
    const { sourceId, selectedTab } = this.state;
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
        queryParams: { sourceId, selectedTab },
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
    return this.widgetsService.views.getWidgetSource(this.state.sourceId);
  }

  get config(): IWidgetConfig {
    return this.widgetsConfig[this.state.type];
  }

  get isCustomCodeEnabled() {
    return this.customCode?.custom_enabled;
  }

  public onMenuClickHandler(e: { key: string }) {
    this.state.setSelectedTab(e.key);
  }

  public playAlert(type: TAlertType) {
    this.actions.playAlert(type);
  }

  /**
   * Update settings and save on the server
   */
  public async updateSettings(formValues: any) {
    const newSettings = merge(cloneDeep(this.settings), formValues);
    // save setting to the store
    this.setSettings(newSettings);
    // send setting to the server
    await this.saveSettings(newSettings);
  }

  // Update setting compatible with FormFactory
  updateSetting(key: string) {
    return (value: any) => this.updateSettings({ [key]: value });
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
    try {
      return await this.actions.return.request({
        body,
        url: this.config.settingsSaveUrl,
        method: 'POST',
      });
    } catch (e: unknown) {
      await alertAsync({
        title: $t('Something went wrong while applying settings'),
        style: { marginTop: '300px' },
        okText: $t('Reload'),
      });
      await this.reload();
    }
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

  async revertChanges() {
    this.state.setIsLoading(true);
    await this.updateSettings(this.state.prevSettings);
    this.state.setCanRevert(false);
    await this.reload();
  }

  // DEFINE MUTATIONS

  private setPrevSettings(data: TWidgetState['data']) {
    this.state.setPrevSettings(cloneDeep(data.settings));
  }

  protected setData(data: TWidgetState['data']) {
    this.state.mutate(state => {
      state.widgetData.data = data;
    });
  }

  private setSettings(settings: TWidgetState['data']['settings']) {
    assertIsDefined(this.state.widgetData.data);
    this.state.mutate(state => {
      state.widgetData.data.settings = settings;
      state.canRevert = true;
    });
  }

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
    this.state.setBrowserSourceProps(sortedProps);
  }
}

export type WidgetParams = {
  sourceId?: string;
  shouldCreatePreviewSource?: boolean;
  selectedTab?: string;
};

/**
 * Have to be called in the root widget component
 */
export function useWidgetRoot<T extends typeof WidgetModule>(Module: T, params: WidgetParams) {
  return useModule(Module, [params] as any, 'WidgetModule');
}

/**
 * Returns the widget's module from the existing context and selects requested fields
 */
export function useWidget<TModule extends WidgetModule>() {
  return useModule('WidgetModule') as GetUseModuleResult<TModule>;
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
