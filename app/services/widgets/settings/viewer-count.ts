import { CODE_EDITOR_TABS, IWidgetData, IWidgetSettings, WidgetSettingsService } from './widget-settings';
import { WidgetType } from 'services/widgets/index';


interface IViewerCountSettings extends IWidgetSettings {
  background_color: string;
  font: string;
  font_color: string;
  font_size: string;
  font_weight: number;
  twitch: boolean;
  youtube: boolean;
  mixer: boolean;
}

export interface IViewerCountData extends IWidgetData {
  settings: IViewerCountSettings;
}

export class ViewerCountService extends WidgetSettingsService<IViewerCountData> {

  getWidgetType() {
    return WidgetType.ViewerCount;
  }

  getVersion() {
    return 5;
  }

  getPreviewUrl() {
    return `https://${ this.getHost() }/widgets/viewer-count?token=${this.getWidgetToken()}&simulate=1`;
  }

  getDataUrl() {
    return `https://${ this.getHost() }/api/v${ this.getVersion() }/slobs/widget/viewercount`;
  }

  patchAfterFetch(data: any): IViewerCountData {
    // transform platform types to simple booleans
    return {
      ...data,
      settings: {
        ...data.settings,
        twitch: data.settings.types.twitch.enabled,
        youtube: data.settings.types.youtube.enabled,
        mixer: data.settings.types.mixer.enabled
      }
    };
  }

  patchBeforeSend(settings: IViewerCountSettings): any {
    // the API accepts an object instead of simple booleans for platforms
    return {
      ...settings,
      types: {
        youtube: { enabled: settings.youtube },
        mixer: { enabled: settings.mixer },
        twitch: { enabled: settings.twitch }
      }
    };
  }


  protected tabs = [
    { name: 'settings' },
    ...CODE_EDITOR_TABS
  ];

}
