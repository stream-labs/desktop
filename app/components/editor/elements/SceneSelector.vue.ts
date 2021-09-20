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
import { getOS } from 'util/operating-systems';
import Scrollable from 'components/shared/Scrollable';

@Component({
  components: { DropdownMenu, HelpTip, SlVueTree, Scrollable },
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
    return this.scenesService.views.scenes.map(scene => {
      return {
        title: scene.name,
        isLeaf: true,
        isSelected: scene.id === this.scenesService.views.activeSceneId,
        data: { id: scene.id },
      };
    });
  }

  showContextMenu() {
    const menu = new Menu();
    menu.append({
      label: $t('Duplicate'),
      click: () => this.scenesService.showDuplicateScene(this.scenesService.views.activeScene.id),
    });
    menu.append({
      label: $t('Rename'),
      click: () =>
        this.scenesService.showNameScene({
          rename: this.scenesService.views.activeScene.id,
        }),
    });
    menu.append({
      label: $t('Remove'),
      click: () => this.removeScene(),
    });
    menu.append({
      label: $t('Filters'),
      click: () =>
        this.sourceFiltersService.showSourceFilters(this.scenesService.views.activeScene.id),
    });
    menu.append({
      label: $t('Create Scene Projector'),
      click: () =>
        this.projectorService.createProjector(
          ERenderingMode.OBS_MAIN_RENDERING,
          this.scenesService.views.activeScene.id,
        ),
    });
    menu.popup();
  }

  makeActive(selectedNodes: ISlTreeNode<{ id: string }>[]) {
    this.scenesService.actions.makeSceneActive(selectedNodes[0].data.id);
  }

  handleSort(nodes: ISlTreeNode<{ id: string }>[]) {
    this.scenesService.actions.setSceneOrder(nodes.map(node => node.data.id));
  }

  addScene() {
    this.scenesService.showNameScene();
  }

  removeScene() {
    const name = this.scenesService.views.activeScene.name;
    electron.remote.dialog
      .showMessageBox(electron.remote.getCurrentWindow(), {
        title: 'Streamlabs OBS',
        type: 'warning',
        message: $t('Are you sure you want to remove %{sceneName}?', { sceneName: name }),
        buttons: [$t('Cancel'), $t('OK')],
      })
      .then(({ response }) => {
        if (!response) return;
        if (!this.scenesService.canRemoveScene()) {
          electron.remote.dialog.showMessageBox({
            title: 'Streamlabs OBS'
            message: $t('There needs to be at least one scene.'),
          });
          return;
        }

        this.editorCommandsService.executeCommand(
          'RemoveSceneCommand',
          this.scenesService.views.activeSceneId,
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
    if (this.scenesService.views.activeScene) {
      return this.scenesService.views.activeScene.id;
    }

    return null;
  }

  get os() {
    return getOS();
  }

  loadCollection(id: string) {
    if (this.sceneCollectionsService.getCollection(id).operatingSystem !== this.os) return;

    this.sceneCollectionsService.load(id);
  }

  manageCollections() {
    this.sceneCollectionsService.showManageWindow();
  }

  get helpTipDismissable() {
    return EDismissable.SceneCollectionsHelpTip;
  }
}
