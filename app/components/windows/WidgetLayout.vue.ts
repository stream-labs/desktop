import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import { Inject } from 'util/injector';
import { WindowsService } from 'services/windows';
import windowMixin from 'components/mixins/window';
import { ISourcesServiceApi } from 'services/sources';

import ModalLayout from 'components/ModalLayout.vue';
import Display from 'components/shared/Display.vue';

import { $t } from 'services/i18n';
import { WidgetsService, WidgetType } from 'services/widgets';
import Tabs from 'components/Tabs.vue';
import { TFormData } from 'components/shared/forms/Input';
import GenericForm from 'components/shared/forms/GenericForm.vue';

@Component({
  components: {
    ModalLayout,
    Display,
    Tabs,
    GenericForm
  },
  mixins: [windowMixin]
})
export default class WidgetLayout extends Vue {

  @Inject() sourcesService: ISourcesServiceApi;
  @Inject() windowsService: WindowsService;
  @Inject() widgetsService: WidgetsService;

  @Prop()
  value: string; // selected tab

  sourceId = this.windowsService.getChildWindowOptions().queryParams.sourceId;
  source = this.sourcesService.getSource(this.sourceId);
  widgetType = this.source.getPropertiesManagerSettings().widgetType;
  service = this.widgetsService.getWidgetSettingsService(this.widgetType);
  widgetUrl = this.service.getWidgetUrl();

  properties: TFormData = [];

  $refs: {
    webview: Electron.WebviewTag;
  };


  mounted() {
    this.properties = this.source ? this.source.getPropertiesFormData() : [];
    const webview = this.$refs.webview;
    webview.addEventListener('dom-ready', () => {
      webview.insertCSS('html,body{ overflow: hidden !important;}');
    });
  }

  get tabs() {
    const settingsService = this.widgetsService.getWidgetSettingsService(this.widgetType);
    const tabs = settingsService.getTabs().map(tab => ({ name: tab.title, value: tab.name }));
    return tabs.concat([{ name: 'Source', value: 'source' }]);
  }

  close() {
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


  get windowTitle() {
    return this.source ? $t('Properties for %{sourceName}', { sourceName: this.source.name }) : '';
  }
}
