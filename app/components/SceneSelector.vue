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

<script>
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
