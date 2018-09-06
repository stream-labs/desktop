import { ServiceHelper } from 'services/stateful-service';
import { Inject } from '../../util/injector';
import { SourcesService } from 'services/sources';
import { WidgetsService } from './widgets';
import { WidgetType } from './index';
import { WidgetSettingsService } from 'services/widgets';
import { IWidgetData } from './settings/widget-settings';

@ServiceHelper()
export class WidgetSource {

  @Inject() private sourcesService: SourcesService;
  @Inject() private widgetsService: WidgetsService;

  constructor(protected sourceId: string) {
  }

  getSource() {
    return this.sourcesService.getSource(this.sourceId);
  }

  getWidgetType(): WidgetType {
    return this.getSource().getPropertiesManagerSettings().widgetType;
  }

  getSettingsService(): WidgetSettingsService<IWidgetData> {
    return this.widgetsService.getWidgetSettingsService(this.getWidgetType());
  }

  createPreviewSource() {

  }

  destroyPreviewSource() {

  }
}