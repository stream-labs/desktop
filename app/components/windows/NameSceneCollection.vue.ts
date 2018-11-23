import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Inject } from '../../util/injector';
import ModalLayout from '../ModalLayout.vue';
import { WindowsService } from '../../services/windows';
import { SceneCollectionsService } from 'services/scene-collections';
import { $t } from 'services/i18n';

interface INameSceneCollectionOptions {
  rename?: string;
  sceneCollectionToDuplicate?: string;
}

@Component({
  components: { ModalLayout },
})
export default class NameSceneCollection extends Vue {
  name = '';
  error = '';

  @Inject() sceneCollectionsService: SceneCollectionsService;
  @Inject() windowsService: WindowsService;

  options: INameSceneCollectionOptions = this.windowsService.getChildWindowQueryParams();

  mounted() {
    const suggestedName = this.options.sceneCollectionToDuplicate || 'New Scene Collection';
    this.name = this.sceneCollectionsService.suggestName(suggestedName);
  }

  submit() {
    if (this.isTaken(this.name)) {
      this.error = $t('That name is already taken');
    } else if (this.options.rename) {
      this.sceneCollectionsService.rename(this.name);
      this.windowsService.closeChildWindow();
    } else if (this.options.sceneCollectionToDuplicate) {
      this.sceneCollectionsService.duplicate(this.name);
      this.windowsService.closeChildWindow();
    } else {
      this.sceneCollectionsService.create({ name: this.name });
      this.windowsService.closeChildWindow();
    }
  }

  isTaken(name: string) {
    return !!this.sceneCollectionsService.collections.find(coll => {
      return coll.name === name;
    });
  }
}
