import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import { Inject } from 'util/injector';
import { WindowsService } from 'services/windows';
import windowMixin from 'components/mixins/window';
import { ISourcesServiceApi } from 'services/sources';

import ModalLayout from 'components/ModalLayout.vue';
import Display from 'components/shared/Display.vue';

import { $t } from 'services/i18n';
import { WidgetsService } from 'services/widgets';
import Tabs from 'components/Tabs.vue';
import { TFormData } from 'components/shared/forms/Input';
import GenericForm from 'components/shared/forms/GenericForm.vue';
import { IWidgetTab } from 'services/widget-settings/widget-settings';

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

  @Inject() private sourcesService: ISourcesServiceApi;
  @Inject() private windowsService: WindowsService;
  @Inject() private widgetsService: WidgetsService;

  @Prop()
  value: string; // selected tab

  sourceId = this.windowsService.getChildWindowOptions().queryParams.sourceId;
  source = this.sourcesService.getSource(this.sourceId);

  properties: TFormData = [];
  tabs: IWidgetTab[] = [];
  tabsList: { name: string, value: string}[] = [];

  mounted() {
    this.properties = this.source ? this.source.getPropertiesFormData() : [];
    const widgetType = this.source.getPropertiesManagerSettings().widgetType;
    const settingsService = this.widgetsService.getWidgetSettingsService(widgetType);
    this.tabs = settingsService.getTabs();
    this.tabsList = this.tabs.map(tab => ({ name: tab.title, value: tab.name }))
      .concat({ name: 'Source', value: 'source' });
  }

  get tab(): IWidgetTab {
    return this.tabs.find(tab => tab.name === this.value);
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
