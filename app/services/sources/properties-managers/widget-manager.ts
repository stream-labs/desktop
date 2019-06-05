import { PropertiesManager } from './properties-manager';
import { Inject } from 'services/core/injector';
import { WidgetsService, WidgetType } from 'services/widgets';

export interface IWidgetManagerSettings {
  widgetType: WidgetType;
}

/**
 * This properties manager is designed to wrap a browser
 * source and allows switching the widget type.  In the
 * future, this will be responsible for changing the URL
 * when the user logs into another account.
 */
export class WidgetManager extends PropertiesManager {
  @Inject() widgetsService: WidgetsService;

  blacklist = ['url', 'is_local_file'];
  displayOrder = ['widgetType'];

  customUIComponent = 'WidgetProperties';

  settings: IWidgetManagerSettings;

  applySettings(settings: Dictionary<any>) {
    this.settings.widgetType = parseInt(settings.widgetType, 10);
    this.setWidgetType(this.settings.widgetType);
  }

  setWidgetType(type: WidgetType) {
    const url = this.widgetsService.getWidgetUrl(type);

    if (this.obsSource.settings['url'] !== url) {
      this.obsSource.update({ url });
    }
  }
}
