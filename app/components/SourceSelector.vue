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
    <i
      class="fa fa-cog studioControls-button"
      @click="sourceProperties"/>
  </div>
  <selector
    class="studioControls-selector"
    :items="sources"
    :activeItem="activeSourceId"
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
      if(this.$store.getters.activeSourceId) {
        this.$store.dispatch({
          type: 'removeSource',
          sourceId: this.$store.getters.activeSourceId
        });
      }
    },

    sourceProperties() {
      if (this.$store.getters.activeSourceId) {
        windowManager.showSourceProperties(false,
          this.$store.getters.activeSourceId);
      }
    },

    makeActive(sourceId) {
      this.$store.dispatch({
        type: 'makeSourceActive',
        sceneName: this.$store.getters.activeSceneName,
        sourceId
      });
    }
  },

  computed: {
    sources() {
      return _.map(this.$store.getters.activeScene.sources, sourceId => {
        let source = this.$store.state.sources.sources[sourceId];

        // This is the format that the Selector component wants
        return {
          name: source.name,
          value: source.id
        }
      });
    },

    activeSourceId() {
      return this.$store.getters.activeSourceId;
    }
  }
};
</script>
