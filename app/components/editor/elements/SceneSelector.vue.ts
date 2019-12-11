import { Component } from 'vue-property-decorator';
import { Inject } from 'services/core/injector';
import { ScenesService } from 'services/scenes';
import { Menu } from 'util/menus/Menu';
import { TransitionsService } from 'services/transitions';
import { SceneCollectionsService } from 'services/scene-collections';
import { AppService } from 'services/app';
import DropdownMenu from 'components/shared/DropdownMenu.vue';
import HelpTip from 'components/shared/HelpTip';
import { EDismissable } from 'services/dismissables';
import Fuse from 'fuse.js';
import { SourceFiltersService } from 'services/source-filters';
import { ProjectorService } from 'services/projector';
import { $t } from 'services/i18n';
import electron from 'electron';
import { EditorCommandsService } from 'services/editor-commands';
import SlVueTree, { ISlTreeNode } from 'sl-vue-tree';
import { ERenderingMode } from '../../../../obs-api';
import TsxComponent from 'components/tsx-component';

@Component({
  components: { DropdownMenu, HelpTip, SlVueTree },
})
export default class SceneSelector extends TsxComponent {
  @Inject() scenesService: ScenesService;
  @Inject() sceneCollectionsService: SceneCollectionsService;
  @Inject() appService: AppService;
  @Inject() transitionsService: TransitionsService;
  @Inject() sourceFiltersService: SourceFiltersService;
  @Inject() projectorService: ProjectorService;
  @Inject() private editorCommandsService: EditorCommandsService;

  searchQuery = '';

  addSceneTooltip = $t('Add a new Scene.');
  removeSceneTooltip = $t('Remove Scene.');
  showTransitionsTooltip = $t('Edit Scene Transitions.');

  get scenes() {
    return this.scenesService.scenes.map(scene => {
      return {
        title: scene.name,
        isLeaf: true,
        isSelected: scene.id === this.scenesService.activeSceneId,
        data: { id: scene.id },
      };
    });
  }

  showContextMenu() {
    const menu = new Menu();
    menu.append({
      label: $t('Duplicate'),
      click: () => this.scenesService.showDuplicateScene(this.scenesService.activeScene.id),
    });
    menu.append({
      label: $t('Rename'),
      click: () =>
        this.scenesService.showNameScene({
          rename: this.scenesService.activeScene.id,
        }),
    });
    menu.append({
      label: $t('Remove'),
      click: () => this.removeScene(),
    });
    menu.append({
      label: $t('Filters'),
      click: () => this.sourceFiltersService.showSourceFilters(this.scenesService.activeScene.id),
    });
    menu.append({
      label: $t('Create Scene Projector'),
      click: () =>
        this.projectorService.createProjector(
          ERenderingMode.OBS_MAIN_RENDERING,
          this.scenesService.activeScene.id,
        ),
    });
    menu.popup();
  }

  makeActive(selectedNodes: ISlTreeNode<{ id: string }>[]) {
    this.scenesService.makeSceneActive(selectedNodes[0].data.id);
  }

  handleSort(nodes: ISlTreeNode<{ id: string }>[]) {
    this.scenesService.setSceneOrder(nodes.map(node => node.data.id));
  }

  addScene() {
    this.scenesService.showNameScene();
  }

  removeScene() {
    const name = this.scenesService.activeScene.name;
    electron.remote.dialog
      .showMessageBox(electron.remote.getCurrentWindow(), {
        type: 'warning',
        message: $t('Are you sure you want to remove %{sceneName}?', { sceneName: name }),
        buttons: [$t('Cancel'), $t('OK')],
      })
      .then(({ response }) => {
        if (!response) return;
        if (!this.scenesService.canRemoveScene()) {
          electron.remote.dialog.showMessageBox({
            message: $t('There needs to be at least one scene.'),
          });
          return;
        }

        this.editorCommandsService.executeCommand(
          'RemoveSceneCommand',
          this.scenesService.activeSceneId,
        );
      });
  }

  showTransitions() {
    this.transitionsService.showSceneTransitions();
  }

  get sceneCollections() {
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

  get activeId() {
    return this.sceneCollectionsService.activeCollection.id;
  }

  get activeCollection() {
    return this.sceneCollectionsService.activeCollection;
  }

  get activeSceneId() {
    if (this.scenesService.activeScene) {
      return this.scenesService.activeScene.id;
    }

    return null;
  }

  loadCollection(id: string) {
    this.sceneCollectionsService.load(id);
  }

  manageCollections() {
    this.sceneCollectionsService.showManageWindow();
  }

  get helpTipDismissable() {
    return EDismissable.SceneCollectionsHelpTip;
  }
}
