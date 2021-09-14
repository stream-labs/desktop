import { useModuleByName, useModuleRoot } from '../hooks/useModule';
import { IWidgetSettings, WidgetTesters, WidgetType } from '../../services/widgets';
import { Services } from '../service-provider';
import { mutation } from '../store';
import { components } from './Widget';
import { throttle } from 'lodash-decorators';
import { assertIsDefined, getDefined } from '../../util/properties-type-guards';
import { createBinding, TBindings } from '../shared/inputs';
import { pick } from 'lodash';
import { TAlertType, TWidgetType } from '../../services/widgets/widget-settings';

export function useWidgetRoot<T extends typeof WidgetModule>(Module: T, sourceId?: string) {
  return useModuleRoot(Module, { sourceId }, 'WidgetModule').select();
}

export function useWidget<TModule extends WidgetModule>() {
  return useModuleByName<TModule>('WidgetModule').select();
}

export interface IWidgetState {
  isLoading: boolean;
  sourceId: string;
  previewSourceId: string;
  selectedTab: string;
  type: TWidgetType;
  data: {
    settings: Record<string, any>;
  };
}

export const DEFAULT_WIDGET_STATE = ({
  isLoading: true,
  sourceId: '',
  previewSourceId: '',
  isPreviewVisible: false,
  selectedTab: '',
  type: '',
  data: {},
} as unknown) as IWidgetState;

export class WidgetModule<TWidgetState extends IWidgetState = IWidgetState> {
  state: TWidgetState = {
    ...((DEFAULT_WIDGET_STATE as unknown) as TWidgetState),
  };

  public widgetsInfo = this.widgetsService.widgetsInfo;
  public eventsInfo = this.widgetsService.eventsInfo;

  async init(params: { sourceId: string }) {
    this.state.sourceId = params.sourceId;
    const widget = this.widget;

    // create a temporary preview-source for the Display component
    const previewSource = widget.createPreviewSource();
    this.state.type = WidgetType[widget.type] as TWidgetType;
    this.state.previewSourceId = previewSource.sourceId;
    const data = await this.fetchData();
    this.setData(data);
    this.setIsLoading(false);

    console.log('data fetched', data);
    console.log('widget state', this.state);
  }

  destroy() {
    this.widget.destroyPreviewSource();
  }

  get settings(): TWidgetState['data']['settings'] {
    return getDefined(this.state.data).settings;
  }

  get availableAlerts(): TAlertType[] {
    return Object.keys(this.eventsInfo) as TAlertType[];
  }

  // bind = createBinding<TWidgetState['data']['settings'], keyof TWidgetState['data']['settings']>(
  //   () => this.settings,
  //   statePatch => this.updateSettings(statePatch),
  // ) as TBindings<TWidgetState['data']['settings'], keyof TWidgetState['data']['settings']>;

  // bind: TBindings<TWidgetState['data']['settings'], keyof TWidgetState['data']['settings']>;

  // get bind() {
  //   return createBinding(
  //     () => this.settings,
  //     statePatch => this.updateSettings(statePatch),
  //   );
  // }

  private get widgetsService() {
    return Services.WidgetsService;
  }

  private actions = this.widgetsService.actions;

  public get WidgetComponent() {
    return components[this.state.type];
  }

  private get widget() {
    return this.widgetsService.getWidgetSource(this.state.sourceId);
  }

  private get widgetTypeInfo() {
    return this.widgetsInfo[this.state.type];
  }

  public onMenuClickHandler(e: { key: string }) {
    this.setSelectedTab(e.key);
  }

  public playAlert(type: TAlertType) {
    const tester = WidgetTesters.find(t => t.type === type);
    if (!tester) throw new Error(`Tester not found ${type}`);
    this.actions.test(tester.name);
  }

  public updateSettings(formValues: any) {
    console.log('settingsUpdated', formValues);
    this.setSettings(formValues);
    this.saveSettings(formValues);
  }

  public updateVariation() {}

  private async fetchData(): Promise<TWidgetState['data']> {
    // load widget settings data into state
    let rawData: any;
    try {
      rawData = await this.actions.return.request({
        url: this.widgetTypeInfo.dataFetchUrl,
        method: 'GET',
      });
    } catch (e: unknown) {
      throw e;
    }
    return this.patchAfterFetch(rawData);
  }

  @throttle(500)
  private async saveSettings(settings: TWidgetState['data']['settings']) {
    const body = this.patchBeforeSend(settings);
    return await this.actions.return.request({
      body,
      url: this.widgetTypeInfo.settingsSaveUrl,
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
}
