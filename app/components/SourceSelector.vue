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
    @select="makeActive"
    @sort="handleSort"/>
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
      if (this.$store.getters.activeScene) {
        windowManager.showAddSource();
      }
    },

    removeSource() {
      // We can only remove a source if one is selected
      if(this.activeSourceId) {
        this.$store.dispatch({
          type: 'removeSource',
          sourceId: this.activeSourceId
        });
      }
    },

    sourceProperties() {
      if (this.activeSourceId) {
        windowManager.showSourceProperties(this.activeSourceId);
      }
    },

    handleSort(data) {
      let positionDelta = data.change.moved.newIndex - data.change.moved.oldIndex;

      this.$store.dispatch({
        type: 'setSourceOrder',
        sceneName: this.$store.getters.activeSceneName,
        order: data.order,

        // For now, we are passing this data since the OBS API
        // uses a move-up move-down type interface.
        sourceName: data.change.moved.element.name,
        positionDelta
      });
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
      if (this.$store.getters.activeScene) {
        return _.map(this.$store.getters.activeScene.sources, sourceId => {
          let source = this.$store.state.sources.sources[sourceId];

          // This is the format that the Selector component wants
          return {
            name: source.name,
            value: source.id
          }
        });
      } else {
        return [];
      }
    },

    activeSourceId() {
      return this.$store.getters.activeSourceId;
    }
  }
};
</script>
