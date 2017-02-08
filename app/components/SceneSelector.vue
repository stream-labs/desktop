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
  </div>
  <selector
    class="studioControls-selector"
    :items="sceneNames"
    :activeItem="activeSceneName"
    @select="makeActive"/>
</div>
</template>

<script>
import Selector from './Selector.vue';
import _ from 'lodash';

export default {
  methods: {
    makeActive(scene) {
      this.$store.dispatch({
        type: 'makeSceneActive',
        sceneName: scene
      });
    },

    addScene() {
      console.log('Click Add Scene');
    },

    removeScene() {
      console.log('Click Remove Scene');
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
