<template>
<modal-layout
  :title="windowTitle"
  :done-handler="done"
  :cancel-handler="cancel"
  :fixedSectionHeight="200"
  @resize="onResize">
  <div
    class="SourceProperties-preview"
    slot="fixed"
    ref="preview"/>
  <div slot="content">
    <component
      v-for="property in properties"
      v-if="property.visible"
      :is="propertyComponentForType(property.type)"
      :property="property"/>
  </div>
</modal-layout>
</template>

<script>
import ModalLayout from '../ModalLayout.vue';
import windowManager from '../../util/WindowManager';
import Obs from '../../api/Obs';
import windowMixin from '../mixins/window';
import SourcesService from '../../services/sources';

import * as propertyComponents from '../source_properties';
import { propertyComponentForType } from '../source_properties/helpers';

const { webFrame, screen } = window.require('electron');

export default {

  mixins: [windowMixin],

  mounted() {
    window.addEventListener('resize', this.onResize);
    this.onResize();
  },

  beforeDestroy() {
    window.removeEventListener('resize', this.onResize);

    Obs.removeSourceDisplay('Preview Window');
  },

  components: Object.assign({ ModalLayout }, propertyComponents),

  methods: {
    onResize() {
      const preview = this.$refs.preview;
      const factor = webFrame.getZoomFactor() * screen.getPrimaryDisplay().scaleFactor;
      const rect = preview.getBoundingClientRect();

      Obs.resizeDisplay(
        'Preview Window',
        rect.width * factor,
        rect.height * factor
      );

      Obs.moveDisplay(
        'Preview Window',
        rect.left * factor,
        rect.top * factor
      );
    },

    closeWindow() {
      Obs.removeSourceDisplay('Preview Window');
      windowManager.closeWindow();
    },

    done() {
      this.closeWindow();
    },

    cancel() {
      this.closeWindow();
    },

    propertyComponentForType
  },

  created() {
    Obs.createSourceDisplay(
      this.sourceName,
      'Preview Window'
    );
  },

  computed: {
    windowTitle() {
      const source = SourcesService.instance.getSourceById(this.sourceId);

      if (source) {
        return "Properties for '" + source.name + "'";
      } else {
        return '';
      }
    },

    properties() {
      const source = SourcesService.instance.getSourceById(this.sourceId);

      if (source) {
        return source.properties;
      } else {
        return [];
      }
    },

    sourceName() {
      return SourcesService.instance.getSourceById(this.sourceId).name;
    },

    sourceId() {
      return this.$store.state.windowOptions.options.sourceId;
    }
  }

}
</script>

<style lang="less" scoped>
.SourceProperties-preview {
  height: 100%;
  background-color: black;
}
</style>
