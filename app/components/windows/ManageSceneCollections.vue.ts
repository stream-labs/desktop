import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import ModalLayout from 'components/ModalLayout.vue';
import { WindowsService } from 'services/windows';
import { Inject } from 'util/injector';
import { SceneCollectionsService } from 'services/scene-collections';
import EditableSceneCollection from 'components/EditableSceneCollection.vue';
import Fuse from 'fuse.js';

@Component({
  components: {
    ModalLayout,
    EditableSceneCollection,
  },
})
export default class ManageSceneCollections extends Vue {
  @Inject() windowsService: WindowsService;
  @Inject() sceneCollectionsService: SceneCollectionsService;

  searchQuery = '';

  close() {
    this.sceneCollectionsService.stateService.flushManifestFile();
    this.windowsService.closeChildWindow();
  }

  create() {
    this.sceneCollectionsService.create({ needsRename: true });
  }

  get collections() {
    const list = this.sceneCollectionsService.collections;

    if (this.searchQuery) {
      const fuse = new Fuse(list, {
        shouldSort: true,
        keys: ['name'],
      });

      return fuse.search(this.searchQuery);
    }

    return list;
  }
}
