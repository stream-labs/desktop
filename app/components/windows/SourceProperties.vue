<template>
<modal-layout
  :title="windowTitle"
  :show-controls="true"
  :done-handler="done"
  :cancel-handler="cancel"
  :content-styles="contentStyles">
  <div slot="content">
    <div class="SourceProperties-preview">
    </div>
    <div class="SourceProperties-form">
    <component
      v-for="property in properties"
      v-if="property.visible"
      :is="propertyComponentForType(property.type)"
      :property="property"/>
    </div>
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

export default {

  data() {
    return {
      sourceId: window.startupOptions.sourceId,

      contentStyles: {
        padding: 0,
        'margin-top': '220px',
      }
    };
  },

  components: {
    ModalLayout,
    ListProperty,
    BoolProperty,
    FloatProperty,
    IntProperty,
    ColorProperty,
    FrameRateProperty,
    FontProperty
  },

  methods: {
    done() {
      windowManager.closeWindow();
    },

    cancel() {
      this.$store.dispatch({
        type: 'restoreProperties',
        sourceId: this.sourceId
      });

      windowManager.closeWindow();
    },

    propertyComponentForType(type) {
      return {
        OBS_PROPERTY_LIST: ListProperty,
        OBS_PROPERTY_BOOL: BoolProperty,
        OBS_PROPERTY_FLOAT: FloatProperty,
        OBS_PROPERTY_INT: IntProperty,
        OBS_PROPERTY_COLOR: ColorProperty,
        OBS_PROPERTY_FRAME_RATE: FrameRateProperty,
        OBS_PROPERTY_FONT: FontProperty
      }[type];
    }
  },

  created() {
    console.log(this.properties);
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
    }
  }

}
</script>

<style lang="less" scoped>
.SourceProperties-preview {
  position: fixed;
  top: 30px;

  height: 220px;
  width: 100%;
  background-color: black;
}

.SourceProperties-form {
  padding: 30px;
}
</style>
