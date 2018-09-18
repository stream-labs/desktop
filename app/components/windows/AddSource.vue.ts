import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Inject } from 'util/injector';
import { WindowsService } from 'services/windows';
import { IScenesServiceApi } from 'services/scenes';
import { ISourcesServiceApi, TSourceType, TPropertiesManager, ISourceApi } from 'services/sources';
import ModalLayout from 'components/ModalLayout.vue';
import Selector from 'components/Selector.vue';
import Display from 'components/shared/Display.vue';
import { WidgetsService, WidgetType, WidgetDefinitions } from 'services/widgets';
import { $t } from 'services/i18n';
import { log } from 'lodash-decorators/utils';

@Component({
  components: { ModalLayout, Selector, Display }
})
export default class AddSource extends Vue {
  @Inject() sourcesService: ISourcesServiceApi;
  @Inject() scenesService: IScenesServiceApi;
  @Inject() windowsService: WindowsService;
  @Inject() widgetsService: WidgetsService;

  name = '';
  error = '';
  sourceType = this.windowsService.getChildWindowQueryParams().sourceType as TSourceType;
  propertiesManager = this.windowsService.getChildWindowQueryParams().propertiesManager as TPropertiesManager;

  get widgetType() {
    const val = this.windowsService.getChildWindowQueryParams().widgetType;

    if (val != null) {
      return parseInt(val, 10);
    }
  }

  sources = this.sourcesService.getSources().filter(source => {
    return source.isSameType({
      type: this.sourceType,
      propertiesManager: this.propertiesManager,
      widgetType: this.widgetType
    }) && source.sourceId !== this.scenesService.activeSceneId;
  });

  existingSources = this.sources.map(source => {
    return { name: source.name, value: source.sourceId };
  });

  selectedSourceId = this.sources[0] ? this.sources[0].sourceId : null;

  mounted() {
    if (this.propertiesManager === 'widget') {
      this.name = this.sourcesService.suggestName(WidgetDefinitions[this.widgetType].name);
    } else {
      const sourceType =
        this.sourceType &&
        this.sourcesService.getAvailableSourcesTypesList()
          .find(sourceTypeDef => sourceTypeDef.value === this.sourceType);

      this.name = this.sourcesService.suggestName((this.sourceType && sourceType.description));
    }
  }

  addExisting() {
    const scene = this.scenesService.activeScene;
    if (!scene.canAddSource(this.selectedSourceId)) {
      // for now only a scene-source can be a problem
      alert($t('Unable to add a source: the scene you are trying to add already contains your current scene'));
      return;
    }
    this.scenesService.activeScene.addSource(this.selectedSourceId);
    this.close();
  }

  close() {
    this.windowsService.closeChildWindow();
  }


  addNew() {
    if (!this.name) {
      this.error = 'The source name is required';
    } else {
      let source: ISourceApi;

      if (this.propertiesManager === 'widget') {
        const widget = this.widgetsService.createWidget(this.widgetType, this.name);
        source = widget.getSource();
      } else {
        source = this.sourcesService.createSource(
          this.name,
          this.sourceType,
          {},
          {
            propertiesManager: this.propertiesManager ? this.propertiesManager : void 0
          }
        );

        this.scenesService.activeScene.addSource(source.sourceId);
      }

      if (source.hasProps()) {
        this.sourcesService.showSourceProperties(source.sourceId);
      } else {
        this.close();
      }
    }
  }

  get selectedSource() {
    return this.sourcesService.getSource(this.selectedSourceId);
  }

}
