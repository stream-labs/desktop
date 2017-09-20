<template>
<div>
  <div class="studio-controls-top">
    <h4 class="studio-controls__label">
      Scenes
    </h4>
    <div>
      <i
        class="fa fa-plus icon-btn icon-btn--lg"
        @click="addScene"/>
      <i
        class="fa fa-minus icon-btn icon-btn--lg"
        @click="removeScene"/>
      <i
        class="fa fa-cog icon-btn icon-btn--lg"
        @click="showTransitions"/>
      </div>
  </div>
  <selector
    class="studio-controls-selector"
    :items="scenes"
    :activeItem="activeSceneId"
    @select="makeActive"
    @sort="handleSort"
    @contextmenu="menu.popup()"
  />
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Inject } from '../util/injector';
import Selector from './Selector.vue';
import { ScenesService } from '../services/scenes';
import { Menu } from '../util/menus/Menu';
import { ScenesTransitionsService } from "../services/scenes-transitions";

@Component({
  components: { Selector }
})
export default class SceneSelector extends Vue {

  @Inject()
  scenesService: ScenesService;

  @Inject()
  scenesTransitionsService: ScenesTransitionsService;

  menu = new Menu();

  created() {
    this.menu.append({
      label: 'Duplicate',
      click: () => this.scenesService.showDuplicateScene(this.scenesService.activeScene.name)
    });
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
    this.scenesService.removeScene(this.activeSceneId);
  }

  showTransitions() {
    this.scenesTransitionsService.showSceneTransitions();
  }

  get scenes() {
    return this.scenesService.scenes.map(scene => {
      return {
        name: scene.name,
        value: scene.id
      };
    });
  }

  get activeSceneId() {
    if (this.scenesService.activeScene) {
      return this.scenesService.activeScene.id;
    }

    return null;
  }

}
</script>
