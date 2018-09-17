import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import { Inject } from 'util/injector';
import { WindowsService } from 'services/windows';
import { ISourceApi, ISourcesServiceApi } from 'services/sources';
import { $t } from 'services/i18n';
import { TObsFormData } from 'components/obs/inputs/ObsInput';
import GenericForm from 'components/obs/inputs/GenericForm.vue';
import { Subscription } from 'rxjs/Subscription';
import { ProjectorService } from 'services/projector';
import ModalLayout from 'components/ModalLayout.vue';
import Tabs from 'components/Tabs.vue';
import Display from 'components/shared/Display.vue';
import VFormGroup from 'components/shared/inputs/VFormGroup.vue';
import TestWidgets from 'components/TestWidgets.vue';
import { ToggleInput, NumberInput } from 'components/shared/inputs/inputs';
import { IWidgetsServiceApi } from 'services/widgets';
import { cloneDeep } from 'lodash';

interface ITab {
  name: string;
  value: string;
}

@Component({
  components: {
    ModalLayout,
    Tabs,
    ToggleInput,
    NumberInput,
    GenericForm,
    VFormGroup,
    TestWidgets,
    Display
  }
})
export default class WidgetWindow extends Vue {
  @Inject() private sourcesService: ISourcesServiceApi;
  @Inject() private windowsService: WindowsService;
  @Inject() private widgetsService: IWidgetsServiceApi;
  @Inject() private projectorService: ProjectorService;

  @Prop() slots: any[];
  @Prop() settings: any[];
  @Prop() value: boolean;

  $refs: { content: HTMLElement, sidebar: HTMLElement, code: HTMLElement };

  extraTabs: ITab[];
  sourceId = this.windowsService.getChildWindowOptions().queryParams.sourceId;
  widget = this.widgetsService.getWidgetSource(this.sourceId);
  properties: TObsFormData = [];
  commonTabs: ITab[] = [];
  tabs: ITab[] = [];


  codeTabs = [
    { value: 'HTML', name: $t('HTML') },
    { value: 'CSS', name: $t('CSS') },
    { value: 'JS', name: $t('JS') },
    { value: 'customFields', name: $t('Custom Fields') }
  ];
  source = this.sourcesService.getSource(this.sourceId);
  widgetType = this.source.getPropertiesManagerSettings().widgetType;
  previewSource: ISourceApi = null;
  currentTopTab = 'editor';
  currentCodeTab = 'HTML';
  currentSetting = 'source';

  get loadingState() {
    return this.widget.getSettingsService().state.loadingState;
  }

  get loaded() {
    return this.loadingState == 'success';
  }

  get loadingFailed() {
    return this.loadingState == 'fail';
  }

  get wData() {
    return cloneDeep(this.widget.getSettingsService().state.data);
  }

  mounted() {
    const source = this.widget.getSource();
    this.properties = source ? source.getPropertiesFormData() : [];

    const apiSettings = this.widget.getSettingsService().getApiSettings();

    // create a temporary previewSource while current window is shown
    this.widget.createPreviewSource();

    this.commonTabs = [
      { name: 'Settings', value: 'settings'},
      { name: 'HTML', value: 'html'},
      { name: 'CSS', value: 'css'},
      { name: 'JS', value: 'js'}
    ];

    if (apiSettings.customFieldsAllowed) {
      this.commonTabs.push({ name: 'Custom Fields', value: 'customFields' });
    }

    if (apiSettings.hasTestButtons) {
      this.commonTabs.push({ name: 'Test', value: 'test' });
    }

    this.commonTabs.push( { name: 'Source', value: 'source' });
    this.tabs = this.extraTabs.concat(this.commonTabs);
  }

  get windowTitle() {
    const source = this.widget.getSource();
    return $t('Settings for ') + source.name;
  }

  get sourceProperties() {
    return this.properties.slice(5);
  }

  get topProperties() {
    return this.properties.slice(1, 4);
  }

  createProjector() {
    this.projectorService.createProjector(this.previewSource.sourceId);
  }

  onPropsInputHandler(properties: TObsFormData, changedIndex: number) {
    const source = this.sourcesService.getSource(this.sourceId);
    source.setPropertiesFormData(
      [properties[changedIndex]]
    );
    this.properties = this.widget.getSource().getPropertiesFormData();
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
}
