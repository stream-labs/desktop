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

const { remote } = window.require('electron');
const { Menu, MenuItem } = remote;


export default {

  components: {
    Selector
  },

  mounted() {
    this.menu = new Menu();
    this.menu.append(new MenuItem({
      label: 'Filters',
      click: () => {
        windowManager.showSourceFilters(ScenesService.instance.activeSource.name);
      }
    }));
    this.menu.append(new MenuItem({
      label: 'Properties',
      click: () => {
        this.sourceProperties();
      }
    }));
  },


  methods: {
    addSource() {
      if (ScenesService.instance.activeScene) {
        windowManager.showAddSource();
      }
    },

    showContextMenu() {
      this.menu.popup(remote.getCurrentWindow());
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
