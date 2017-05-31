<template>
<div>
  <div class="studioControls-top">
    <h4 class="studioControls-label">
      Sources
    </h4>
    <i
      class="fa fa-plus ico-btn"
      @click="addSource"/>
    <i
      class="fa fa-minus ico-btn"
      @click="removeSource"/>
    <i
      class="fa fa-cog ico-btn"
      @click="sourceProperties"/>
  </div>
  <selector
    class="studioControls-selector"
    @contextmenu="showContextMenu"
    :items="sources"
    :activeItem="activeSourceId"
    @select="makeActive"
    @sort="handleSort"/>
</div>
</template>

<script>
import Selector from './Selector.vue';
import windowManager from '../util/WindowManager';
import ScenesService from '../services/scenes';
import SourcesService from '../services/sources';
import { SourceMenu } from '../util/menus/SourceMenu.ts';


export default {

  components: {
    Selector
  },

  methods: {
    addSource() {
      if (ScenesService.instance.activeScene) {
        windowManager.showAddSource();
      }
    },

    showContextMenu(sourceId) {
      const menu = new SourceMenu(
        ScenesService.instance.activeSceneId,
        sourceId
      );
      menu.popup();
    },

    removeSource() {
      // We can only remove a source if one is selected
      if (this.activeSourceId) {
        SourcesService.instance.removeSource(this.activeSourceId);
      }
    },

    sourceProperties() {
      if (this.activeSourceId) {
        windowManager.showSourceProperties(this.activeSourceId);
      }
    },

    handleSort(data) {
      const positionDelta = data.change.moved.newIndex - data.change.moved.oldIndex;

      ScenesService.instance.setSourceOrder(
        ScenesService.instance.activeScene.id,
        data.change.moved.element.value,
        positionDelta,
        data.order
      );
    },

    makeActive(sourceId) {
      ScenesService.instance.makeSourceActive(
        ScenesService.instance.activeScene.id,
        sourceId
      );
    }
  },

  computed: {
    sources() {
      return ScenesService.instance.sources.map(source => {
        return {
          name: source.name,
          value: source.id
        };
      });
    },

    activeSourceId() {
      return ScenesService.instance.activeSourceId;
    }
  }
};
</script>
