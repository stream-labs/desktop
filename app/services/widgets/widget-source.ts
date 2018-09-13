import { ServiceHelper } from 'services/stateful-service';
import { Inject } from '../../util/injector';
import { Source, SourcesService } from 'services/sources';
import { WidgetsService } from './widgets';
import { IWidgetSource, WidgetType, IWidgetData } from './index';
import { WidgetSettingsService } from 'services/widgets';
import Utils from '../utils';
import { mutation } from '../stateful-service';

@ServiceHelper()
export class WidgetSource implements IWidgetSource {

  @Inject() private sourcesService: SourcesService;
  @Inject() private widgetsService: WidgetsService;

  readonly type: WidgetType;
  readonly sourceId: string;
  readonly previewSourceId: string;

  private widgetSourceState: IWidgetSource;

  constructor(sourceId: string) {
    this.widgetSourceState = this.widgetsService.state.widgetSources[sourceId];
    Utils.applyProxy(this, this.widgetSourceState);
  }

  getSource() {
    return this.sourcesService.getSource(this.sourceId);
  }

  getSettingsService(): WidgetSettingsService<IWidgetData> {
    return this.widgetsService.getWidgetSettingsService(this.type);
  }

  refresh() {
    this.getSource().refresh();
  }

  /**
   * create a previewSource for widget
   * the previewSource could have a different url for simulating widget's activity
   */
  createPreviewSource(): Source {

    if (this.previewSourceId) {
      throw new Error('Only one preview source is allowed for widget')
    }

    const source = this.getSource();
    const apiSettings = this.getSettingsService().getApiSettings();
    const previewSourceSettings = {
      ...source.getSettings(),
      shutdown: false,
      url: apiSettings.previewUrl
    };

    const previewSource = this.sourcesService.createSource(
      source.name,
      source.type,
      previewSourceSettings
    );

    this.SET_PREVIEW_SOURCE_ID(previewSource.sourceId);

    this.widgetsService.syncPreviewSource(this.sourceId, this.previewSourceId);
    return previewSource;
  }

  getPreviewSource() {
    return this.sourcesService.getSource(this.previewSourceId);
  }

  destroyPreviewSource() {
    this.widgetsService.stopSyncPreviewSource(this.previewSourceId);
    this.SET_PREVIEW_SOURCE_ID('');
  }

  @mutation()
  private SET_PREVIEW_SOURCE_ID(previewSourceId: string) {
    Object.assign(this.widgetSourceState, { previewSourceId });
  }
}