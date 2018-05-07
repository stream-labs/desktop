import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Inject } from '../util/injector';
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
import electron from 'electron';

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

  searchQuery = '';

  showContextMenu() {
    const menu = new Menu();
    menu.append({
      label: 'Duplicate',
      click: () => this.scenesService.showDuplicateScene(this.scenesService.activeScene.name)
    });
    menu.append({
      label: 'Rename',
      click: () => this.scenesService.showNameScene({
        rename: this.scenesService.activeScene.name
      })
    });
    menu.append({
      label: 'Remove',
      click: () => this.scenesService.removeScene(this.scenesService.activeScene.id)
    });
    menu.append({
      label: 'Filters',
      click: () => this.sourceFiltersService.showSourceFilters(
        this.scenesService.activeScene.id
      )
    });
    menu.append({
      label: 'Create Scene Projector',
      click: () => this.projectorService.createProjector(this.scenesService.activeScene.id)
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
    const ok = electron.remote.dialog.showMessageBox(
      electron.remote.getCurrentWindow(),
      {
        type: 'warning',
        message: `Are you sure you want to remove ${name}?`,
        buttons: ['Cancel', 'OK']
      },
      ok => {
        if (ok) this.scenesService.removeScene(this.activeSceneId);
      }
    );
  }

  showTransitions() {
    this.transitionsService.showSceneTransitions();
  }

  get scenes() {
    return this.scenesService.scenes.map(scene => {
      return {
        name: scene.name,
        value: scene.id
      };
    });
  }

  get sceneCollections() {
    const list = this.sceneCollectionsService.collections;

    if (this.searchQuery) {
      const fuse = new Fuse(list, {
        shouldSort: true,
        keys: ['name']
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
