import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Inject } from 'util/injector';
import { WindowsService } from 'services/windows';
import { IScenesServiceApi } from 'services/scenes';
import { ISourcesServiceApi, TSourceType, TPropertiesManager, ISourceApi } from 'services/sources';
import ModalLayout from 'components/ModalLayout.vue';
import Selector from 'components/Selector.vue';
import Display from 'components/shared/Display.vue';
import { $t } from 'services/i18n';

@Component({
  components: { ModalLayout, Selector, Display }
})
export default class AddSource extends Vue {
  @Inject() sourcesService: ISourcesServiceApi;
  @Inject() scenesService: IScenesServiceApi;
  @Inject() windowsService: WindowsService;

  name = '';
  error = '';
  sourceType = this.windowsService.getChildWindowQueryParams().sourceType as TSourceType;
  propertiesManager = this.windowsService.getChildWindowQueryParams().propertiesManager as TPropertiesManager;

  sources = this.sourcesService.getSources().filter(source => {
    return source.isSameType({
      type: this.sourceType,
      propertiesManager: this.propertiesManager,
    }) && source.sourceId !== this.scenesService.activeSceneId;
  });

  existingSources = this.sources.map(source => {
    return { name: source.name, value: source.sourceId };
  });

  selectedSourceId = this.sources[0].sourceId;

  mounted() {
    const sourceType =
      this.sourceType &&
      this.sourcesService.getAvailableSourcesTypesList()
        .find(sourceTypeDef => sourceTypeDef.value === this.sourceType);

    this.name = this.sourcesService.suggestName((this.sourceType && sourceType.description));
  }

  addExisting() {
    const scene = this.scenesService.activeScene;
    if (!scene.canAddSource(this.selectedSourceId)) {
      // for now only a scene-source can be a problem
      alert($t('sources.circularReferenceMessage'));
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

      source = this.sourcesService.createSource(
        this.name,
        this.sourceType,
        {},
        {
          propertiesManager: this.propertiesManager ? this.propertiesManager : void 0
        }
      );

      this.scenesService.activeScene.addSource(source.sourceId);

      this.close();
      if (source.hasProps()) this.sourcesService.showSourceProperties(source.sourceId);
    }
  }

  get selectedSource() {
    return this.sourcesService.getSource(this.selectedSourceId);
  }

}
