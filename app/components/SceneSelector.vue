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
    :items="sceneNames"
    :activeItem="activeSceneName"
    @select="makeActive"
    @sort="handleSort"/>
</div>
</template>

<script>
import Selector from './Selector.vue';
import windowManager from '../util/WindowManager.js';
import _ from 'lodash';

export default {
  methods: {
    makeActive(scene) {
      this.$store.dispatch({
        type: 'makeSceneActive',
        sceneName: scene
      });
    },

    handleSort(data) {
      this.$store.dispatch({
        type: 'setSceneOrder',
        order: data.order
      });
    },

    addScene() {
      windowManager.showNameScene();
    },

    removeScene() {
      this.$store.dispatch({
        type: 'removeScene',
        sceneName: this.activeSceneName
      });
    },

    showTransitions() {
      windowManager.showSceneTransitions();
    }
  },

  computed: {
    sceneNames() {
      return _.map(this.$store.state.scenes.scenes, scene => scene.name);
    },

    activeSceneName() {
      return this.$store.state.scenes.activeSceneName;
    }
  },

  components: {
    Selector
  }
};
</script>
