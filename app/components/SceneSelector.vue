<template>
<div>
  <div class="studioControls-top">
    <h4 class="studioControls-label">
      Scenes
    </h4>
    <i
      class="fa fa-plus studioControls-button"
      @click="addScene"/>
    <i
      class="fa fa-minus studioControls-button"
      @click="removeScene"/>
    <i
      class="fa fa-cog studioControls-button"
      @click="showTransitions"/>
  </div>
  <selector
    class="studioControls-selector"
    :items="scenes"
    :activeItem="activeSceneId"
    @select="makeActive"
    @sort="handleSort"/>
</div>
</template>

<script>
import _ from 'lodash';
import Selector from './Selector.vue';
import windowManager from '../util/WindowManager';
import ScenesService from '../services/scenes';

export default {
  methods: {
    makeActive(id) {
      ScenesService.instance.makeSceneActive(id);
    },

    handleSort(data) {
      ScenesService.instance.setSceneOrder(data.order);
    },

    addScene() {
      windowManager.showNameScene();
    },

    removeScene() {
      ScenesService.instance.removeScene(this.activeSceneId);
    },

    showTransitions() {
      windowManager.showSceneTransitions();
    }
  },

  computed: {
    scenes() {
      return ScenesService.instance.scenes.map(scene => {
        return {
          name: scene.name,
          value: scene.id
        };
      });
    },

    activeSceneId() {
      if (ScenesService.instance.activeScene) {
        return ScenesService.instance.activeScene.id;
      }

      return null;
    }
  },

  components: {
    Selector
  }
};
</script>
