<template>
<modal-layout
  :title="windowTitle"
  :show-controls="true"
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
import windowManager from '../../util/WindowManager.js';
import Obs from '../../api/Obs.js';
import _ from 'lodash';

import ListProperty from '../source_properties/ListProperty.vue';
import BoolProperty from '../source_properties/BoolProperty.vue';
import FloatProperty from '../source_properties/FloatProperty.vue';
import IntProperty from '../source_properties/IntProperty.vue';
import ColorProperty from '../source_properties/ColorProperty.vue';
import FrameRateProperty from '../source_properties/FrameRateProperty.vue';
import FontProperty from '../source_properties/FontProperty.vue';
import TextProperty from '../source_properties/TextProperty.vue';
import PathProperty from '../source_properties/PathProperty.vue';
import EditableListProperty from '../source_properties/EditableListProperty.vue';
import ButtonProperty from '../source_properties/ButtonProperty.vue';
const { webFrame, screen } = window.require('electron')

export default {

  mounted() {
    window.addEventListener('resize', this.onResize);
    this.onResize();
  },

  beforeDestroy() {
    window.removeEventListener('resize', this.onResize);

    Obs.removeSourceDisplay('Preview Window');
  },

  components: {
    ModalLayout,
    ListProperty,
    BoolProperty,
    FloatProperty,
    IntProperty,
    ColorProperty,
    FrameRateProperty,
    FontProperty,
    TextProperty,
    PathProperty,
    EditableListProperty,
    ButtonProperty
  },

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
      // TODO: Get property restore working.
      // For now, do the same as done.
      // this.$store.dispatch({
      //   type: 'restoreProperties',
      //   sourceId: this.sourceId
      // });

      this.closeWindow();
    },

    propertyComponentForType(type) {
      return {
        OBS_PROPERTY_LIST: ListProperty,
        OBS_PROPERTY_BOOL: BoolProperty,
        OBS_PROPERTY_FLOAT: FloatProperty,
        OBS_PROPERTY_INT: IntProperty,
        OBS_PROPERTY_COLOR: ColorProperty,
        OBS_PROPERTY_FRAME_RATE: FrameRateProperty,
        OBS_PROPERTY_FONT: FontProperty,
        OBS_PROPERTY_TEXT: TextProperty,
        OBS_PROPERTY_PATH: PathProperty,
        OBS_PROPERTY_EDITABLE_LIST: EditableListProperty,
        OBS_PROPERTY_BUTTON: ButtonProperty
      }[type];
    }
  },

  created() {
    Obs.createSourceDisplay(
      this.sourceName,
      'Preview Window'
    );
  },

  watch: {
    properties() {
      if (this.properties && !this.restorePointSet) {
        this.restorePointSet = true;
        this.$store.dispatch({
          type: 'createPropertiesRestorePoint',
          sourceId: this.sourceId
        });
      }
    }
  },

  computed: {
    windowTitle() {
      let source = this.$store.state.sources.sources[this.sourceId];

      if (source) {
        return "Properties for '" + source.name + "'";
      } else {
        return '';
      }
    },

    properties() {
      let source = this.$store.state.sources.sources[this.sourceId];

      if (source) {
        return source.properties;
      } else {
        return [];
      }
    },

    sourceName() {
      return this.$store.state.sources.sources[this.sourceId].name;
    },

    sourceId() {
      return this.$store.state.windowOptions.options.sourceId;
    },

    windowHandle() {
      return this.$store.state.windowOptions.options.windowHandle;
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
