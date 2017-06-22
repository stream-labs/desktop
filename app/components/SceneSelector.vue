<template>
<div>
  <div class="studio-controls-top">
    <h4 class="studio-controls__label">
      Scenes
    </h4>
    <div>
      <i
        class="fa fa-plus ico-btn"
        @click="addScene"/>
      <i
        class="fa fa-minus ico-btn"
        @click="removeScene"/>
      <i
        class="fa fa-cog ico-btn"
        @click="showTransitions"/>
      </div>
  </div>
  <selector
    class="studio-controls-selector"
    :items="scenes"
    :activeItem="activeSceneId"
    @select="makeActive"
    @sort="handleSort"/>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Inject } from '../services/service';
import Selector from './Selector.vue';
import { WindowService } from '../services/window';
import { ScenesService } from '../services/scenes';

@Component({
  components: { Selector }
})
export default class SceneSelector extends Vue {

  @Inject()
  scenesService: ScenesService;

  windowService = WindowService.instance;

  makeActive(id: string) {
    this.scenesService.makeSceneActive(id);
  }


  handleSort(data: any) {
    this.scenesService.setSceneOrder(data.order);
  }


  addScene() {
    this.windowService.showNameScene();
  }

  removeScene() {
    this.scenesService.removeScene(this.activeSceneId);
  }


  showTransitions() {
    this.windowService.showSceneTransitions();
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
