import { useModuleByName, useModuleRoot } from '../../hooks/useModule';
import { WidgetType } from '../../../services/widgets';
import { Services } from '../../service-provider';
import { mutation } from '../../store';
import { throttle } from 'lodash-decorators';
import { assertIsDefined, getDefined } from '../../../util/properties-type-guards';
import { TObsFormData } from '../../../components/obs/inputs/ObsInput';
import { pick, cloneDeep } from 'lodash';
import { $t } from '../../../services/i18n';
import Utils from '../../../services/utils';
import { TAlertType } from '../../../services/widgets/alerts-config';
import { alertAsync } from '../../modals';
import { onUnload } from 'util/unload';
import merge from 'lodash/merge';

/**
 * Common state for all widgets
 */
export interface IWidgetState {
  isLoading: boolean;
  sourceId: string;
  shouldCreatePreviewSource: boolean;
  previewSourceId: string;
  selectedTab: string;
  type: WidgetType;
  browserSourceProps: TObsFormData;
  prevSettings: any;
  canRevert: boolean;
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
  prevSettings: {},
  canRevert: false,
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
  public eventsConfig = this.widgetsService.alertsConfig;

  cancelUnload: () => void;

  // init module
  async init(params: {
    sourceId: string;
    shouldCreatePreviewSource?: boolean;
    selectedTab?: string;
  }) {
    // init state from params
    this.state.sourceId = params.sourceId;
    if (params.shouldCreatePreviewSource === false) {
      this.state.shouldCreatePreviewSource = false;
    }
    if (params.selectedTab) {
      this.state.selectedTab = params.selectedTab;
    }

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
    this.setIsLoading(false);
  }

  // de-init module
  destroy() {
    if (this.state.previewSourceId) this.widget.destroyPreviewSource();
    this.cancelUnload();
  }

  async reload() {
    this.setIsLoading(true);
    this.setData(await this.fetchData());
    this.setIsLoading(false);
  }

  close() {
    Services.WindowsService.actions.closeChildWindow();
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
    return this.widgetsService.getWidgetSource(this.state.sourceId);
  }

  get config() {
    return this.widgetsConfig[this.state.type];
  }

  get isCustomCodeEnabled() {
    return this.customCode?.custom_enabled;
  }

  public onMenuClickHandler(e: { key: string }) {
    this.setSelectedTab(e.key);
  }

  public playAlert(type: TAlertType) {
    this.actions.playAlert(type);
  }

  /**
   * Update settings and save on the server
   */
  public async updateSettings(formValues: any) {
    console.log(formValues);
    const newSettings = merge(cloneDeep(this.settings), formValues);
    console.log(newSettings);
    // save setting to the store
    this.setSettings(newSettings);
    // send setting to the server
    await this.saveSettings(newSettings);
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
    this.setIsLoading(true);
    await this.updateSettings(this.state.prevSettings);
    this.setCanRevert(false);
    await this.reload();
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
  protected setData(data: TWidgetState['data']) {
    this.state.data = data;
  }

  @mutation()
  private setPrevSettings(data: TWidgetState['data']) {
    this.state.prevSettings = cloneDeep(data.settings);
  }

  @mutation()
  private setCanRevert(canRevert: boolean) {
    this.state.canRevert = canRevert;
  }

  @mutation()
  private setSettings(settings: TWidgetState['data']['settings']) {
    assertIsDefined(this.state.data);
    this.state.data.settings = settings;
    this.state.canRevert = true;
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
  params: { sourceId?: string; shouldCreatePreviewSource?: boolean; selectedTab?: string },
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
