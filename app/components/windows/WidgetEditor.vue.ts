import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import { Inject } from 'util/injector';
import { WindowsService } from 'services/windows';
import { ISource, ISourceApi, ISourcesServiceApi } from 'services/sources';

import { $t } from 'services/i18n';
import { WidgetsService } from 'services/widgets';
import { TObsFormData } from 'components/obs/inputs/ObsInput';
import GenericForm from 'components/obs/inputs/GenericForm.vue';
import { Subscription } from 'rxjs/Subscription';
import { ProjectorService } from 'services/projector';
import { IWidgetTab } from 'services/widget-settings/widget-settings';
import uuid from 'uuid';

import ModalLayout from 'components/ModalLayout.vue';
import Tabs from 'components/Tabs.vue';
import Display from 'components/shared/Display.vue';
import VFormGroup from 'components/shared/inputs/VFormGroup.vue';
import { ToggleInput, NumberInput } from 'components/shared/inputs/inputs';

@Component({
  components: {
    ModalLayout,
    Tabs,
    ToggleInput,
    NumberInput,
    VFormGroup,
    Display
  }
})
export default class WidgetWindow extends Vue {
  @Inject() private sourcesService: ISourcesServiceApi;
  @Inject() private windowsService: WindowsService;
  @Inject() private widgetsService: WidgetsService;
  @Inject() private projectorService: ProjectorService;

  @Prop() slots: any[];
  @Prop() settings: any[];
  @Prop() value: boolean;

  $refs: { content: HTMLElement, sidebar: HTMLElement, code: HTMLElement };

  codeTabs = [
    { value: 'HTML', name: $t('HTML') },
    { value: 'CSS', name: $t('CSS') },
    { value: 'JS', name: $t('JS') },
    { value: 'customFields', name: $t('Custom Fields') }
  ];
  canRender = false; // prevents window flickering
  sourceId = this.windowsService.getChildWindowOptions().queryParams.sourceId;
  source = this.sourcesService.getSource(this.sourceId);
  widgetType = this.source.getPropertiesManagerSettings().widgetType;
  widgetUrl = this.service.getPreviewUrl();
  previewSource: ISourceApi = null;
  currentTopTab = 'editor';
  currentCodeTab = 'HTML';
  currentSetting = '';
  properties: TObsFormData = [];
  tabs: IWidgetTab[] = [];
  tabsList: { name: string, value: string}[] = [];

  sourceUpdatedSubscr: Subscription;

  get service() {
    return this.widgetsService.getWidgetSettingsService(this.widgetType);
  }

  mounted() {
    this.properties = this.source ? this.source.getPropertiesFormData() : [];
    console.log(this.properties);

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

    const widgetType = this.source.getPropertiesManagerSettings().widgetType;
    const settingsService = this.widgetsService.getWidgetSettingsService(widgetType);

    this.tabs = settingsService.getTabs();
    this.tabsList = this.tabs.map(tab => ({ name: tab.title, value: tab.name }))
      .concat({ name: 'Source', value: 'source' });
    this.canRender = true;
  }

  get windowTitle() {
    return this.source ? $t('Settings for ') + this.source.name : '';
  }

  createProjector() {
    this.projectorService.createProjector(this.previewSource.sourceId);
  }

  updateTopTab(value: string) {
    // We do animations in JS here because flex-direction is not an animate-able attribute
    if (value === 'code') {
      this.$refs.sidebar.classList.toggle('hidden');
      setTimeout( () => {
        this.$refs.content.classList.toggle('vertical');
        this.$refs.code.classList.toggle('hidden');
      }, 300);
    } else if (this.$refs.content.classList.contains('vertical')) {
      this.$refs.code.classList.toggle('hidden');
      setTimeout( () => {
        this.$refs.content.classList.toggle('vertical');
        this.$refs.sidebar.classList.toggle('hidden');
      }, 300);
    }
    this.currentTopTab = value;
  }

  updateCodeTab(value: string) {
    this.currentCodeTab = value;
  }

  updateCurrentSetting(value: string) {
    this.currentSetting = value;
  }

  updateValue(value: boolean) {
    this.$emit('input', value);
  }

  private onSourceUpdatedHandler(sourceModel: ISource) {
    // sync settings between source and previewSource
    if (sourceModel.sourceId !== this.sourceId) return;
    const newPreviewSettings = this.source.getSettings();
    delete newPreviewSettings.shutdown;
    newPreviewSettings.url = this.service.getPreviewUrl() + '&' + uuid();
    this.previewSource.updateSettings(newPreviewSettings);
  }
}
