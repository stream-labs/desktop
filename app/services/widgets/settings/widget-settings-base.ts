import { IWidgetApiSettings, IWidgetSettings } from '../widgets-api';
import { authorizedHeaders, handleResponse } from '../../../util/requests';
import { THttpMethod } from './widget-settings';
import { Inject, Service } from '../../core';
import { HostsService } from '../../hosts';
import { UserService } from '../../user';
import { WidgetsService } from '../widgets';

export abstract class WidgetSettingsBaseService extends Service {
  @Inject() private hostsService: HostsService;
  @Inject() private userService: UserService;
  @Inject() private widgetsService: WidgetsService;

  public abstract getApiSettings(): IWidgetApiSettings;

  public async fetchSettings() {
    // load widget settings data into state
    const apiSettings = this.getApiSettings();
    let rawData: any;
    try {
      rawData = await this.request({
        url: apiSettings.dataFetchUrl,
        method: 'GET',
      });
    } catch (e: unknown) {
      throw e;
    }
    return this.patchAfterFetch(rawData);
  }

  public async saveSettings(settings: IWidgetSettings) {
    const body = this.patchBeforeSend(settings);
    const apiSettings = this.getApiSettings();
    return await this.request({
      body,
      url: apiSettings.settingsSaveUrl,
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
  protected patchBeforeSend(settings: IWidgetSettings): any {
    return settings;
  }

  private async request(req: { url: string; method?: THttpMethod; body?: any }): Promise<any> {
    const method = req.method || 'GET';
    const headers = authorizedHeaders(this.getApiToken());
    headers.append('Content-Type', 'application/json');

    const request = new Request(req.url, {
      headers,
      method,
      body: req.body ? JSON.stringify(req.body) : void 0,
    });

    return fetch(request)
      .then(res => {
        return Promise.resolve(res);
      })
      .then(handleResponse);
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
