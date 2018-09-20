import Vue from 'vue';
import { cloneDeep } from 'lodash';
import { Component, Prop } from 'vue-property-decorator';
import { Inject } from 'util/injector';
import { WindowsService } from 'services/windows';
import { ISourcesServiceApi } from 'services/sources';

import ModalLayout from 'components/ModalLayout.vue';
import Display from 'components/shared/Display.vue';

import { $t } from 'services/i18n';
import { IWidgetsServiceApi } from 'services/widgets';
import Tabs from 'components/Tabs.vue';
import { TObsFormData } from 'components/obs/inputs/ObsInput';
import GenericForm from 'components/obs/inputs/GenericForm.vue';
import { ProjectorService } from 'services/projector';
import CodeEditor from '../widgets/CodeEditor.vue';


interface ITab {
 name: string;
 value: string;
}

@Component({
  components: {
    ModalLayout,
    Display,
    Tabs,
    GenericForm,
    CodeEditor
  }
})
export default class WidgetWindow extends Vue {

  @Inject() private sourcesService: ISourcesServiceApi;
  @Inject() private windowsService: WindowsService;
  @Inject() private widgetsService: IWidgetsServiceApi;
  @Inject() private projectorService: ProjectorService;
  @Prop() value: string; // selected tab
  @Prop({
    default: function () {
      return [] as ITab[];
    }
  })
  extraTabs: ITab[];
  sourceId = this.windowsService.getChildWindowOptions().queryParams.sourceId;
  widget = this.widgetsService.getWidgetSource(this.sourceId);
  properties: TObsFormData = [];
  commonTabs: ITab[] = [];
  tabs: ITab[] = [];


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

    if (apiSettings.testers) {
      this.commonTabs.push({ name: 'Test', value: 'test' });
    }

    this.commonTabs.push( { name: 'Source', value: 'source' });
    this.tabs = this.extraTabs.concat(this.commonTabs);
  }

  get webview() {
    return this.$refs.webview;
  }

  get windowTitle() {
    const source = this.widget.getSource();
    return $t('Settings for ') + source.name;
  }

  get hasControls() {
    return (
      this.value == 'source' ||
      this.loaded && (!['html', 'css', 'js'].includes(this.value))
    )
  }

  destroyed() {
    this.widget.destroyPreviewSource();
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
    this.properties = this.widget.getSource().getPropertiesFormData();
  }

  createProjector() {
    this.projectorService.createProjector(this.widget.previewSourceId);
  }
}
