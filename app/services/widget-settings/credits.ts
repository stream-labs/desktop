import { CODE_EDITOR_TABS, IWidgetData, IWidgetSettings, WidgetSettingsService } from './widget-settings';
import { WidgetType } from 'services/widgets';

export interface ICreditsData extends IWidgetData {
  settings: {};
}

export class CreditsService extends WidgetSettingsService<ICreditsData> {

  getWidgetType() {
    return WidgetType.Credits;
  }

  getVersion() {
    return 5;
  }

  getPreviewUrl() {
    return `https://${ this.getHost() }/widgets/end-credits?token=${this.getWidgetToken()}&simulate=1`;
  }

  getDataUrl() {
    return `https://${ this.getHost() }/api/v${ this.getVersion() }/slobs/widget/endcredits`;
  }

  patchAfterFetch(data: any): ICreditsData {
    // transform platform types to simple booleans
    return data;
  }

  patchBeforeSend(settings: ICreditsSettings): any {
    // the API accepts an object instead of simple booleans for platforms
    return settings;
  }


  protected tabs = [
    { name: 'settings' },
    ...CODE_EDITOR_TABS
  ];

}
