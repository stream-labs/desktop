<template>
<div>
  <h4 class="studioControls-label">
    Scenes
  </h4>
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
