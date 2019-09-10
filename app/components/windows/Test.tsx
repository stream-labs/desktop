import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Inject } from 'services/core/injector';
import { SelectionService } from 'services/selection';
import { SceneItem, ScenesService, TSceneNode } from 'services/scenes';
import ModalLayout from '../ModalLayout.vue';

@Component({ components: { ModalLayout } })
export default class Test extends Vue {
  @Inject() private selectionService: SelectionService;
  @Inject() private scenesService: ScenesService;

  get selectedItems(): TSceneNode[] {
    return this.selectionService.getNodes();
  }

  get selectedReactiveItems(): TSceneNode[] {
    return this.selectionService.state.selectedIds.map(id =>
      this.scenesService.activeScene.getNode(id),
    );
  }

  render(h: Function) {
    return (
      <modal-layout>
        <div slot="content">
          Read selected items from the service method:
          {this.selectedItems.map(item => (
            <div> {item.id} </div>
          ))}
          <br />
          Read selected items directly from the store:
          {this.selectedReactiveItems.map(item => (
            <div> {item.id} </div>
          ))}
        </div>
      </modal-layout>
    );
  }
}
