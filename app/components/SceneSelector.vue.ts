import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Inject } from '../services/core/injector';
import Selector from './Selector.vue';
import { ScenesService } from 'services/scenes';
import { Menu } from '../util/menus/Menu';
import { TransitionsService } from 'services/transitions';
import { SceneCollectionsService } from 'services/scene-collections';
import { AppService } from 'services/app';
import DropdownMenu from './shared/DropdownMenu.vue';
import HelpTip from './shared/HelpTip.vue';
import { EDismissable } from 'services/dismissables';
import Fuse from 'fuse.js';
import { SourceFiltersService } from 'services/source-filters';
import { ProjectorService } from 'services/projector';
import { $t } from 'services/i18n';
import electron from 'electron';
import { EditorCommandsService } from 'services/editor-commands';

@Component({
  components: { Selector, DropdownMenu, HelpTip },
})
export default class SceneSelector extends Vue {
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
      click: () => this.projectorService.createProjector(this.scenesService.activeScene.id),
    });
    menu.popup();
  }

  makeActive(id: string) {
    this.scenesService.makeSceneActive(id);
  }

  handleSort(data: any) {
    this.scenesService.setSceneOrder(data.order);
  }

  addScene() {
    this.scenesService.showNameScene();
  }

  removeScene() {
    const name = this.scenesService.activeScene.name;
    electron.remote.dialog.showMessageBox(
      electron.remote.getCurrentWindow(),
      {
        type: 'warning',
        message: $t('Are you sure you want to remove %{sceneName}?', { sceneName: name }),
        buttons: [$t('Cancel'), $t('OK')],
      },
      ok => {
        if (!ok) return;
        if (!this.scenesService.canRemoveScene()) {
          alert($t('There needs to be at least one scene.'));
          return;
        }

        this.editorCommandsService.executeCommand(
          'RemoveSceneCommand',
          this.scenesService.activeSceneId,
        );
      },
    );
  }

  showTransitions() {
    this.transitionsService.showSceneTransitions();
  }

  get scenes() {
    return this.scenesService.scenes.map(scene => {
      return {
        name: scene.name,
        value: scene.id,
      };
    });
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
