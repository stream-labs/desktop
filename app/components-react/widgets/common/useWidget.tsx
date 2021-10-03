import { useModuleByName, useModuleRoot } from '../../hooks/useModule';
import { WidgetTesters, WidgetType } from '../../../services/widgets';
import { Services } from '../../service-provider';
import { mutation } from '../../store';
import { throttle } from 'lodash-decorators';
import { assertIsDefined, getDefined } from '../../../util/properties-type-guards';
import { TAlertType, TWidgetType } from '../../../services/widgets/widget-config';
import { TObsFormData } from '../../../components/obs/inputs/ObsInput';

/**
 * Common state for all widgets
 */
export interface IWidgetState {
  isLoading: boolean;
  sourceId: string;
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
  async init(params: { sourceId: string }) {
    this.state.sourceId = params.sourceId;

    // save browser source settings into store
    const widget = this.widget;
    this.setBrowserSourceProps(widget.getSource()!.getPropertiesFormData());

    // create a temporary preview-source for the Display component
    const previewSource = widget.createPreviewSource();
    this.state.previewSourceId = previewSource.sourceId;

    // load settings from the server to the store
    this.state.type = WidgetType[widget.type] as TWidgetType;
    const data = await this.fetchData();
    this.setData(data);
    this.setIsLoading(false);

    console.log('data fetched', data);
    console.log('widget state', this.state);
  }

  // de-init module
  destroy() {
    this.widget.destroyPreviewSource();
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
    console.log('settingsUpdated', formValues);
    // save setting to the store
    this.setSettings(formValues);
    // send setting to the server
    this.saveSettings(formValues);
  }

  /**
   * Fetch settings from the server
   */
  private async fetchData(): Promise<TWidgetState['data']> {
    // load widget settings data into state
    let rawData: any;
    try {
      rawData = await this.actions.return.request({
        url: this.config.dataFetchUrl,
        method: 'GET',
      });
    } catch (e: unknown) {
      throw e;
    }
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
    console.log('widget data fetched', data);
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
export function useWidgetRoot<T extends typeof WidgetModule>(Module: T, sourceId?: string) {
  return useModuleRoot(Module, { sourceId }, 'WidgetModule').select();
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
