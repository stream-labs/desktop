<template>
<div>
  <div class="studioControls-top">
    <h4 class="studioControls-label">
      Sources
    </h4>
    <i
      class="fa fa-plus studioControls-button"
      @click="addSource"/>
    <i
      class="fa fa-minus studioControls-button"
      @click="removeSource"/>
  </div>
  <selector
    class="studioControls-selector"
    :items="sourceNames"
    :activeItem="activeSourceName"
    @select="makeActive"/>
</div>
</template>

<script>
import Selector from './Selector.vue';
import _ from 'lodash';

export default {
  components: {
    Selector
  },

  methods: {
    addSource() {
      console.log('Click Add Source');
    },

    removeSource() {
      console.log('Click Remove Source');
    },

    makeActive(sourceName) {
      this.$store.dispatch({
        type: 'makeSourceActive',
        sceneName: this.$store.getters.activeSceneName,
        sourceName: sourceName
      });
    }
  },

  computed: {
    sourceNames() {
      let scene = this.$store.getters.activeScene;
      return _.map(scene.sources, source => source.name);
    },

    activeSourceName() {
      return this.$store.getters.activeSourceName;
    }
  }
};
</script>
