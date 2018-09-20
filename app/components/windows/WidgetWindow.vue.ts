import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import { Inject } from 'util/injector';
import { WindowsService } from 'services/windows';
import { ISource, ISourceApi, ISourcesServiceApi } from 'services/sources';

import ModalLayout from 'components/ModalLayout.vue';
import Display from 'components/shared/Display.vue';

import { $t } from 'services/i18n';
import { WidgetsService } from 'services/widgets';
import Tabs from 'components/Tabs.vue';
import { TObsFormData } from 'components/obs/inputs/ObsInput';
import GenericForm from 'components/obs/inputs/GenericForm.vue';
import { Subscription } from 'rxjs/Subscription';
import { ProjectorService } from 'services/projector';
import { IWidgetTab } from 'services/widget-settings/widget-settings';

@Component({
  components: {
    ModalLayout,
    Display,
    Tabs,
    GenericForm
  }
})
export default class WidgetWindow extends Vue {

  @Inject() private sourcesService: ISourcesServiceApi;
  @Inject() private windowsService: WindowsService;
  @Inject() private widgetsService: WidgetsService;
  @Inject() private projectorService: ProjectorService;

  @Prop() value: string; // selected tab
  @Prop() requestState: 'fail' | 'success' | 'pending';
  @Prop() loaded: boolean;

  sourceId = this.windowsService.getChildWindowOptions().queryParams.sourceId;
  source = this.sourcesService.getSource(this.sourceId);
  widgetType = this.source.getPropertiesManagerSettings().widgetType;
  widgetUrl = this.service.getPreviewUrl();
  previewSource: ISourceApi = null;
  properties: TObsFormData = [];
  tabs: IWidgetTab[] = [];
  tabsList: { name: string, value: string}[] = [];

  sourceUpdatedSubscr: Subscription;

  get service() {
    return this.widgetsService.getWidgetSettingsService(this.widgetType);
  }

  get loadingFailed() {
    return this.requestState === 'fail' && !this.loaded;
  }

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
    console.log('PREVIEW SOURCE');
    this.sourceUpdatedSubscr = this.sourcesService.sourceUpdated.subscribe(
      sourceModel => this.onSourceUpdatedHandler(sourceModel)
    );

    const widgetType = this.source.getPropertiesManagerSettings().widgetType;
    const settingsService = this.widgetsService.getWidgetSettingsService(widgetType);

    this.tabs = settingsService.getTabs();
    this.tabsList = this.tabs.map(tab => ({ name: tab.title, value: tab.name }))
      .concat({ name: 'Source', value: 'source' });
  }

  get webview() {
    return this.$refs.webview;
  }

  get tab(): IWidgetTab {
    return this.tabs.find(tab => tab.name === this.value);
  }

  destroyed() {
    this.sourcesService.removeSource(this.previewSource.sourceId);
    this.sourceUpdatedSubscr.unsubscribe();
  }

  close() {
    this.windowsService.closeChildWindow();
  }

  onPropsInputHandler(properties: TObsFormData, changedIndex: number) {
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
    newPreviewSettings.url = this.service.getPreviewUrl();
    this.previewSource.updateSettings(newPreviewSettings);
    this.previewSource.refresh();
  }
}
