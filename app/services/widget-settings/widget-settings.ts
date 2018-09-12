import { HostsService } from '../hosts';
import { Inject } from '../../util/injector';
import { UserService } from 'services/user';
import {
  handleErrors,
  authorizedHeaders
} from '../../util/requests';
import { WidgetsService, WidgetType } from 'services/widgets';
import { Service } from 'services/service';
import { Subject } from 'rxjs/Subject';
import { IInputMetadata } from 'components/shared/inputs';
import { Source, SourcesService } from 'services/sources';


export interface IWidgetTab {
  title: string;
  name: string;
  fetchUrl: string;
  saveUrl: string;
  resetUrl: string;
  resetMethod: THttpMethod;
  autosave: boolean;
  showControls: boolean;
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

export type THttpMethod = 'GET' | 'POST' | 'DELETE';

export const CODE_EDITOR_TABS: (Partial<IWidgetTab> & { name: string })[] = [
  { name: 'HTML', showControls: false, autosave: false },
  { name: 'CSS', showControls: false, autosave: false },
  { name: 'JS', showControls: false, autosave: false }
];

export const CODE_EDITOR_WITH_CUSTOM_FIELDS_TABS: (Partial<IWidgetTab> & { name: string })[] = [
  ...CODE_EDITOR_TABS,
  { name: 'customFields', title: 'Custom Fields', showControls: false, autosave: false }
];

/**
 * base class for widget settings
 * TODO: join this service with WidgetsService.ts after widgets rewrite
 */
export abstract class WidgetSettingsService<TWidgetData extends IWidgetData> extends Service {
  static initialState = {};

  @Inject() private hostsService: HostsService;
  @Inject() private userService: UserService;
  @Inject() private widgetsService: WidgetsService;
  @Inject() private sourcesService: SourcesService;

  dataUpdated = new Subject<TWidgetData>();

  abstract getPreviewUrl(): string;
  abstract getDataUrl(): string;
  abstract getWidgetType(): WidgetType;

  protected tabs: ({ name: string } & Partial<IWidgetTab>)[] = [{ name: 'settings' }];

  getWidgetUrl(): string {
    return this.widgetsService.getWidgetUrl(this.getWidgetType());
  }

  getTabs(): IWidgetTab[] {
    return this.tabs.map(tab => {
      const resetMethod: THttpMethod = 'DELETE';

      const fetchUrl = this.getDataUrl() || tab.fetchUrl;
      const saveUrl = tab.saveUrl || fetchUrl;
      const resetUrl = tab.resetUrl || saveUrl;

      return {
        autosave: true,
        title: tab.name.charAt(0).toUpperCase() + tab.name.substr(1),
        fetchUrl,
        saveUrl,
        resetUrl,
        resetMethod,
        showControls: true,
        ...tab
      };
    });
  }

  getTab(name: string) {
    return this.getTabs().find(tab => tab.name === name);
  }

  async fetchData(): Promise<TWidgetData> {
    let data = await this.request({
      url: this.getDataUrl(),
      method: 'GET'
    });
    data = this.handleDataAfterFetch(data);
    this.dataUpdated.next(data);
    debugger;
    return data;
  }

  protected handleDataAfterFetch(data: any): TWidgetData {

    // patch fetched data to have the same data format
    if (data.custom) data.custom_defaults = data.custom;

    data.type = this.getWidgetType();


    // widget-specific patching
    return this.patchAfterFetch(data);
  }

  /**
   * override this method to patch data after fetching
   */
  protected patchAfterFetch(data: TWidgetData): any {
    return data;
  }

  /**
   * override this method to patch data before save
   */
  protected patchBeforeSend(data: any): any {
    return data;
  }

  getMetadata(): Dictionary<IInputMetadata>  {
    return {};
  }

  async saveData(data: TWidgetData, tabName? :string, method: THttpMethod = 'POST'): Promise<TWidgetData> {
    const tab = this.getTab(tabName);
    const url = tab && tab.saveUrl ? tab.saveUrl : this.getDataUrl();
    const bodyData = this.patchBeforeSend(data);
    await this.request({
      url,
      method,
      body: bodyData
    });
    return this.fetchData();
  }

  async reset(tabName?: string): Promise<TWidgetData> {
    const tab = this.getTab(tabName);
    const url = tab ? tab.resetUrl : this.getDataUrl();
    const method = tab ? tab.resetMethod : 'DELETE';
    await this.request({
      url,
      method
    });
    return this.fetchData();
  }

  async request(req: { url: string, method?: THttpMethod, body?: any }): Promise<TWidgetData> {
    const method = req.method || 'GET';
    const headers = authorizedHeaders(this.getApiToken());
    headers.append('Content-Type', 'application/json');

    const request = new Request(req.url, {
      headers,
      method,
      body: req.body ? JSON.stringify(req.body) : void 0
    });

    return fetch(request)
      .then(handleErrors)
      .then(response => response.json());
  }

  protected getHost(): string {
    return this.hostsService.streamlabs;
  }

  protected getWidgetToken(): string {
    return this.userService.widgetToken;
  }

  protected getApiToken(): string {
    return this.userService.apiToken;
  }

}
