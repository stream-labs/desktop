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
export default class NameSource extends Vue {
  @Inject() sourcesService: ISourcesServiceApi;
  @Inject() scenesService: IScenesServiceApi;
  @Inject() widgetsService: WidgetsService;
  @Inject() windowsService: WindowsService;

  options: {
    sourceType?: TSourceType,
    widgetType?: string,
    renameId?: string,
    propertiesManager?: TPropertiesManager
  }  = this.windowsService.getChildWindowQueryParams();

  name = '';
  error = '';

  disabled = false;

  mounted() {

    if (this.options.renameId) {
      const source = this.sourcesService.getSource(this.options.renameId);
      this.name = source.name;
      return;
    }

    const sourceType =
      this.sourceType &&
      this.sourcesService.getAvailableSourcesTypesList()
        .find(sourceTypeDef => sourceTypeDef.value === this.sourceType);

    this.name = this.sourcesService.suggestName(
      (this.sourceType && sourceType.description) || WidgetDefinitions[this.widgetType].name
    );
  }

  submit() {
    if (!this.name) {
      this.error = $t('The source name is required');
    } else if (this.options.renameId) {
      this.sourcesService.getSource(this.options.renameId).setName(this.name);
      this.windowsService.closeChildWindow();
    } else {
      let sourceId: string;

      if (this.disabled) return;
      this.disabled = true;

      if (this.sourceType != null) {
        const source = this.sourcesService.createSource(
          this.name,
          this.sourceType,
          {},
          {
            propertiesManager: this.options.propertiesManager || void 0
          }
        );

        this.scenesService.activeScene.addSource(source.sourceId);
        sourceId = source.sourceId;
      } else if (this.widgetType != null) {
        sourceId = this.widgetsService.createWidget(
          this.widgetType,
          this.name
        ).sourceId;
      }

      this.sourcesService.showSourceProperties(sourceId);
    }
  }

  get sourceType(): TSourceType {
    return this.options.sourceType;
  }

  get widgetType(): WidgetType {
    return parseInt(this.options.widgetType) as WidgetType;
  }

}
