import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import { Inject } from 'util/injector';
import { WindowsService } from 'services/windows';
import { ISourceApi, ISourcesServiceApi } from 'services/sources';
import { $t } from 'services/i18n';
import { TObsFormData } from 'components/obs/inputs/ObsInput';
import GenericForm from 'components/obs/inputs/GenericForm.vue';
import { ProjectorService } from 'services/projector';
import ModalLayout from 'components/ModalLayout.vue';
import Tabs from 'components/Tabs.vue';
import Display from 'components/shared/Display.vue';
import VFormGroup from 'components/shared/inputs/VFormGroup.vue';
import TestWidgets from 'components/TestWidgets.vue';
import { ToggleInput, NumberInput } from 'components/shared/inputs/inputs';
import { IWidgetData, IWidgetsServiceApi } from 'services/widgets';
import { cloneDeep } from 'lodash';
import { IWidgetNavItem } from 'components/widgets/WidgetSettings.vue';
import CustomFieldsEditor from 'components/widgets/CustomFieldsEditor.vue';
import CodeEditor from 'components/widgets/CodeEditor.vue';

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
    Display,
    CustomFieldsEditor,
    CodeEditor
  }
})
export default class WidgetWindow extends Vue {
  @Inject() private sourcesService: ISourcesServiceApi;
  @Inject() private windowsService: WindowsService;
  @Inject() private widgetsService: IWidgetsServiceApi;
  @Inject() private projectorService: ProjectorService;

  /**
   * Declaration of additional sections in the right panel
   * @see example of usage in TipJar.vue.ts
   */
  @Prop() slots?: IWidgetNavItem[];

  /**
   * Navigation items for the right panel
   */
  @Prop() navItems: IWidgetNavItem[];

  $refs: { content: HTMLElement, sidebar: HTMLElement, code: HTMLElement };

  extraTabs: ITab[];
  sourceId = this.windowsService.getChildWindowOptions().queryParams.sourceId;
  widget = this.widgetsService.getWidgetSource(this.sourceId);
  apiSettings = this.widget.getSettingsService().getApiSettings();
  properties: TObsFormData = [];
  codeTabs = [
    { value: 'HTML', name: $t('HTML') },
    { value: 'CSS', name: $t('CSS') },
    { value: 'JS', name: $t('JS') }
  ];

  source = this.sourcesService.getSource(this.sourceId);
  widgetType = this.source.getPropertiesManagerSettings().widgetType;
  currentTopTab = 'editor';
  currentCodeTab = 'HTML';
  currentSetting = 'source';
  readonly settingsState = this.widget.getSettingsService().state;

  get loaded() {
    return !!this.settingsState.data;
  }

  get loadingFailed() {
    return !this.loaded && this.settingsState.loadingState == 'fail';
  }

  get wData(): IWidgetData {
    if (!this.settingsState.data) return null;
    return cloneDeep(this.settingsState.data) as IWidgetData;
  }

  get customCodeIsEnabled() {
    return this.wData && this.wData.settings.custom_enabled;
  }

  mounted() {
    const source = this.widget.getSource();
    this.properties = source ? source.getPropertiesFormData() : [];

    // create a temporary previewSource while current window is shown
    this.widget.createPreviewSource();

    // some widgets have CustomFieldsEditor
    if (this.apiSettings.customFieldsAllowed) {
      this.codeTabs.push({ value: 'customFields', name: $t('Custom Fields') });
    }
  }

  destroyed() {
    this.widget.destroyPreviewSource();
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
    this.projectorService.createProjector(this.widget.previewSourceId);
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

  toggleCustomCode(enabled: boolean) {
    const newSettings = { ...this.wData.settings, custom_enabled: enabled };
    this.widget.getSettingsService().saveSettings(newSettings)
  }
}
