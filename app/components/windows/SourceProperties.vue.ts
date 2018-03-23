import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Inject } from '../../util/injector';
import { TFormData } from '../shared/forms/Input';
import { WindowsService } from '../../services/windows';
import windowMixin from '../mixins/window';
import { ISourcesServiceApi } from '../../services/sources';

import ModalLayout from '../ModalLayout.vue';
import SourcePreview from '../shared/SourcePreview.vue';
import GenericForm from '../shared/forms/GenericForm.vue';
import WidgetProperties from 'components/custom-source-properties/WidgetProperties.vue';
import StreamlabelProperties from 'components/custom-source-properties/StreamlabelProperties.vue';

@Component({
  components: {
    ModalLayout,
    SourcePreview,
    GenericForm,
    WidgetProperties,
    StreamlabelProperties
  },
  mixins: [windowMixin]
})
export default class SourceProperties extends Vue {

  @Inject()
  sourcesService: ISourcesServiceApi;

  @Inject()
  windowsService: WindowsService;

  sourceId = this.windowsService.getChildWindowQueryParams().sourceId;
  source = this.sourcesService.getSource(this.sourceId);
  properties: TFormData = [];

  mounted() {
    this.properties = this.source ? this.source.getPropertiesFormData() : [];
  }


  get propertiesManagerUI() {
    if (this.source) return  this.source.getPropertiesManagerUI();
  }


  onInputHandler(properties: TFormData, changedIndex: number) {
    const source = this.sourcesService.getSource(this.sourceId);
    source.setPropertiesFormData(
      [properties[changedIndex]]
    );
    this.refresh();
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
    return source ? `Properties for '${source.name}'` : '';
  }

}
