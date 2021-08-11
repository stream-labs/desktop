import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Inject } from 'services/core/injector';
import { WindowsService } from 'services/windows';
import { ScenesService } from 'services/scenes';
import { ISourcesServiceApi, TSourceType, ISourceApi, ISourceAddOptions } from 'services/sources';
import ModalLayout from 'components/ModalLayout.vue';
import Selector from 'components/Selector.vue';
import Display from 'components/shared/Display.vue';
import { $t } from 'services/i18n';

@Component({
  components: { ModalLayout, Selector, Display },
})
export default class AddSource extends Vue {
  @Inject() sourcesService: ISourcesServiceApi;
  @Inject() scenesService: ScenesService;
  @Inject() windowsService: WindowsService;

  name = '';
  error = '';
  sourceType = this.windowsService.getChildWindowQueryParams().sourceType as TSourceType;
  sourceAddOptions = this.windowsService.getChildWindowQueryParams()
    .sourceAddOptions as ISourceAddOptions;

  sources = this.sourcesService.getSources().filter(source => {
    return (
      source.isSameType({
        type: this.sourceType,
        propertiesManager: this.sourceAddOptions.propertiesManager,
      }) && source.sourceId !== this.scenesService.activeSceneId
    );
  });

  existingSources = this.sources.map(source => {
    return { name: source.name, value: source.sourceId };
  });

  selectedSourceId = this.sources[0] ? this.sources[0].sourceId : null;

  mounted() {
    const sourceType =
      this.sourceType &&
      this.sourcesService
        .getAvailableSourcesTypesList()
        .find(sourceTypeDef => sourceTypeDef.value === this.sourceType);

    this.name = this.sourcesService.suggestName(this.sourceType && sourceType.description);
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
      this.error = $t('sources.sourceNameIsRequired');
    } else {
      const source: ISourceApi = this.sourcesService.createSource(
        this.name,
        this.sourceType,
        {}, // IPCがundefinedをnullに変換するのでデフォルト値は使わない
        {
          propertiesManager: this.sourceAddOptions.propertiesManager,
          propertiesManagerSettings: this.sourceAddOptions.propertiesManagerSettings,
        },
      );

      this.scenesService.activeScene.addSource(source.sourceId);

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
