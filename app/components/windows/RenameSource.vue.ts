import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Inject } from '../../util/injector';
import ModalLayout from '../ModalLayout.vue';
import { WindowsService } from '../../services/windows';
import { IScenesServiceApi } from '../../services/scenes';
import { ISourcesServiceApi, TSourceType, TPropertiesManager } from '../../services/sources';
import { WidgetsService, WidgetDefinitions, WidgetType } from '../../services/widgets';
import { $t } from 'services/i18n';

@Component({
  components: { ModalLayout }
})
export default class RenameSource extends Vue {
  @Inject() sourcesService: ISourcesServiceApi;
  @Inject() scenesService: IScenesServiceApi;
  @Inject() widgetsService: WidgetsService;
  @Inject() windowsService: WindowsService;

  options: {
    sourceId?: string,
  }  = this.windowsService.getChildWindowQueryParams();

  name = '';
  error = '';

  mounted() {
    const source = this.sourcesService.getSource(this.options.sourceId);
    this.name = source.name;
  }

  submit() {
    if (!this.name) {
      this.error = $t('The source name is required');
    } else {
      this.sourcesService.getSource(this.options.sourceId).setName(this.name);
      this.windowsService.closeChildWindow();
    }
  }

}
