import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import windowMixin from 'components/mixins/window';
import ModalLayout from 'components/ModalLayout.vue';
import { WindowsService } from 'services/windows';
import { Inject } from 'util/injector';
import { SceneCollectionsService } from 'services/scene-collections';
import EditableSceneCollection from 'components/EditableSceneCollection.vue';

@Component({
  mixins: [windowMixin],
  components: {
    ModalLayout,
    EditableSceneCollection
  }
})
export default class ManageSceneCollections extends Vue {
  @Inject() windowsService: WindowsService;
  @Inject() sceneCollectionsService: SceneCollectionsService;

  close() {
    this.windowsService.closeChildWindow();
  }

  get collections() {
    return this.sceneCollectionsService.collections;
  }

}
