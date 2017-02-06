<template>
<div>
  <h4 class="studioControls-label">
    Scenes
  </h4>
  <selector
    class="studioControls-selector"
    :items="scenes"
    :activeItem="activeScene"
    @select="makeActive"/>
</div>
</template>

<script>
import Selector from './Selector.vue';

export default {
  methods: {
    makeActive(scene) {
      this.$store.dispatch('makeSceneActive', scene);
    }
  },

  computed: {
    scenes() {
      return this.$store.state.scenes.scenes;
    },

    activeScene() {
      return this.$store.state.scenes.activeScene;
    }
  },

  components: {
    Selector
  }
};
</script>
