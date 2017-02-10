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
import windowManager from '../util/WindowManager.js';

import _ from 'lodash';

export default {
  components: {
    Selector
  },

  methods: {
    addSource() {
      windowManager.showAddSource();
    },

    removeSource() {
      console.log('Click Remove Source');

      // We can only remove a source if one is selected
      if(this.$store.getters.activeSourceName) {
        this.$store.dispatch({
          type: 'removeSource',
          sceneName: this.$store.getters.activeSceneName,
          sourceName: this.$store.getters.activeSourceName
        });
      }
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
      return this.$store.getters.activeScene.sources;
    },

    activeSourceName() {
      return this.$store.getters.activeSourceName;
    }
  }
};
</script>
