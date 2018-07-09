import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import { Inject } from 'util/injector';
import { WindowsService } from 'services/windows';
import windowMixin from 'components/mixins/window';
import { ISource, ISourceApi, ISourcesServiceApi } from 'services/sources';

import ModalLayout from 'components/ModalLayout.vue';
import Display from 'components/shared/Display.vue';

import { $t } from 'services/i18n';
import { WidgetsService, WidgetType } from 'services/widgets';
import Tabs from 'components/Tabs.vue';
import { TFormData } from 'components/shared/forms/Input';
import GenericForm from 'components/shared/forms/GenericForm.vue';
import { Subscription } from 'rxjs/Subscription';
import { ProjectorService } from 'services/projector';

@Component({
  components: {
    ModalLayout,
    Display,
    Tabs,
    GenericForm
  },
  mixins: [windowMixin]
})
export default class WidgetWindow extends Vue {

  @Inject() private sourcesService: ISourcesServiceApi;
  @Inject() private windowsService: WindowsService;
  @Inject() private widgetsService: WidgetsService;
  @Inject() private projectorService: ProjectorService;

  @Prop()
  value: string; // selected tab

  sourceId = this.windowsService.getChildWindowOptions().queryParams.sourceId;
  source = this.sourcesService.getSource(this.sourceId);
  widgetType = this.source.getPropertiesManagerSettings().widgetType;
  service = this.widgetsService.getWidgetSettingsService(this.widgetType);
  widgetUrl = this.service.getPreviewUrl();
  previewSource: ISourceApi = null;
  properties: TFormData = [];

  sourceUpdatedSubscr: Subscription;

  mounted() {
    this.properties = this.source ? this.source.getPropertiesFormData() : [];

    // create a temporary previewSource
    // the previewSource could have a different url for simulating widget's activity
    const source = this.source;
    const previewSettings = {
      ...source.getSettings(),
      shutdown: false,
      url: this.widgetUrl
    };
    this.previewSource = this.sourcesService.createSource(source.name, source.type, previewSettings);
    this.sourceUpdatedSubscr = this.sourcesService.sourceUpdated.subscribe(
      sourceModel => this.onSourceUpdatedHandler(sourceModel)
    );
  }

  get webview() {
    return this.$refs.webview;
  }

  get tabs() {
    const settingsService = this.widgetsService.getWidgetSettingsService(this.widgetType);
    const tabs = settingsService.getTabs().map(tab => ({ name: tab.title, value: tab.name }));
    return tabs.concat([{ name: 'Source', value: 'source' }]);
  }

  get windowTitle() {
    return this.source ? $t('Properties for %{sourceName}', { sourceName: this.source.name }) : '';
  }

  close() {
    this.sourcesService.removeSource(this.previewSource.sourceId);
    this.sourceUpdatedSubscr.unsubscribe();
    this.windowsService.closeChildWindow();
  }

  onPropsInputHandler(properties: TFormData, changedIndex: number) {
    const source = this.sourcesService.getSource(this.sourceId);
    source.setPropertiesFormData(
      [properties[changedIndex]]
    );
    this.refresh();
  }

  refresh() {
    this.properties = this.source.getPropertiesFormData();
  }

  createProjector() {
    this.projectorService.createProjector(this.previewSource.sourceId);
  }

  private onSourceUpdatedHandler(sourceModel: ISource) {
    // sync settings between source and previewSource
    if (sourceModel.sourceId !== this.sourceId) return;
    const newPreviewSettings = this.source.getSettings();
    delete newPreviewSettings.shutdown;
    delete newPreviewSettings.url;
    this.previewSource.updateSettings(newPreviewSettings);
  }
}
