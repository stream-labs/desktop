import { PropertiesManager, TCustomProperty, ICustomListProperty } from './properties-manager';
import { Inject } from 'util/injector';
import { WidgetsService, WidgetDefinitions, IWidget, WidgetType } from 'services/widgets';


export interface IWidgetManagerSettings {
  widgetType: WidgetType;
}


/**
 * This properties manager simply exposes all properties
 * and does not modify them.
 */
export class WidgetManager extends PropertiesManager {

  @Inject() widgetsService: WidgetsService;

  blacklist = ['url', 'is_local_file'];
  displayOrder = ['widgetType'];


  settings: IWidgetManagerSettings;


  getCustomProperties(): TCustomProperty[] {
    const options = Object.keys(WidgetDefinitions).map(type => {
      const widget = WidgetDefinitions[type] as IWidget;

      return {
        description: widget.name,
        value: type
      };
    });

    return [{
      type: 'OBS_PROPERTY_LIST',
      value: this.settings.widgetType.toString(),
      name: 'widgetType',
      enabled: true,
      visible: true,
      description: 'Widget',
      isCustom: true,
      options
    }];
  }


  setCustomProperty(property: TCustomProperty) {
    if (property.name === 'widgetType') {
      this.settings.widgetType = parseInt(property.value as string, 10);
      this.setWidgetType(property.value as WidgetType);
    }
  }


  setWidgetType(type: WidgetType) {
    this.obsSource.update({
      url: this.widgetsService.getWidgetUrl(type),
      width: WidgetDefinitions[type].width,
      height: WidgetDefinitions[type].height
    });
  }

}
