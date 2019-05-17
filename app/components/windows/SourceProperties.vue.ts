import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Inject } from 'services/core/injector';
import { TObsFormData } from 'components/obs/inputs/ObsInput';
import { WindowsService } from 'services/windows';
import { ISourcesServiceApi } from 'services/sources';
import ModalLayout from 'components/ModalLayout.vue';
import Display from 'components/shared/Display.vue';
import GenericForm from 'components/obs/inputs/GenericForm.vue';
import WidgetProperties from 'components/custom-source-properties/WidgetProperties.vue';
import StreamlabelProperties from 'components/custom-source-properties/StreamlabelProperties.vue';
import PlatformAppProperties from 'components/custom-source-properties/PlatformAppProperties.vue';
import { $t } from 'services/i18n';
import { Subscription } from 'rxjs';
import electron from 'electron';
import { ErrorField } from 'vee-validate';
import { CustomizationService } from 'services/customization';
import { EditorCommandsService } from 'services/editor-commands';

@Component({
  components: {
    ModalLayout,
    Display,
    GenericForm,
    WidgetProperties,
    StreamlabelProperties,
    PlatformAppProperties,
  },
})
export default class SourceProperties extends Vue {
  @Inject() sourcesService: ISourcesServiceApi;
  @Inject() windowsService: WindowsService;
  @Inject() customizationService: CustomizationService;
  @Inject() private editorCommandsService: EditorCommandsService;

  sourceId = this.windowsService.getChildWindowQueryParams().sourceId;
  source = this.sourcesService.getSource(this.sourceId);
  properties: TObsFormData = [];
  hasErrors = false;

  sourceRemovedSub: Subscription;
  sourceUpdatedSub: Subscription;

  mounted() {
    this.properties = this.source ? this.source.getPropertiesFormData() : [];
    this.sourceRemovedSub = this.sourcesService.sourceRemoved.subscribe(source => {
      if (source.sourceId === this.sourceId) {
        electron.remote.getCurrentWindow().close();
      }
    });
    this.sourceUpdatedSub = this.sourcesService.sourceUpdated.subscribe(source => {
      if (source.sourceId === this.sourceId) {
        this.refresh();
      }
    });
  }

  destroyed() {
    this.sourceRemovedSub.unsubscribe();
    this.sourceUpdatedSub.unsubscribe();
  }

  get hideStyleBlockers() {
    return this.windowsService.state.child.hideStyleBlockers;
  }

  get propertiesManagerUI() {
    if (this.source) return this.source.getPropertiesManagerUI();
  }

  onInputHandler(properties: TObsFormData, changedIndex: number) {
    this.editorCommandsService.executeCommand('EditSourcePropertiesCommand', this.sourceId, [
      properties[changedIndex],
    ]);
  }

  refresh() {
    this.properties = this.source.getPropertiesFormData();
  }

  closeWindow() {
    this.windowsService.closeChildWindow();
  }

  done() {
    this.closeWindow();
  }

  cancel() {
    this.closeWindow();
  }

  get windowTitle() {
    const source = this.sourcesService.getSource(this.sourceId);
    return source ? $t('Properties for %{sourceName}', { sourceName: source.name }) : '';
  }

  onValidateHandler(errors: ErrorField[]) {
    this.hasErrors = !!errors.length;
  }
}
