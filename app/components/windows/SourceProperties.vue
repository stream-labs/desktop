<template>
<modal-layout
  :title="windowTitle"
  :show-controls="true"
  :done-handler="done"
  :cancel-handler="cancel"
  :content-styles="contentStyles">
  <div slot="content">
    <source-properties-preview
      class="SourceProperties-preview"
      :source-id="sourceId"/>
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
import SourcePropertiesPreview from '../SourcePropertiesPreview.vue';
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

export default {

  data() {
    return {
      contentStyles: {
        padding: 0,
        'margin-top': '220px',
      }
    };
  },

  components: {
    ModalLayout,
    SourcePropertiesPreview,
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
    done() {
      this.$store.dispatch({
        type: 'removeSourceDisplay',
        sourceId: this.sourceId
      });
      windowManager.closeWindow();
    },

    cancel() {
      this.$store.dispatch({
        type: 'restoreProperties',
        sourceId: this.sourceId
      });
      this.$store.dispatch({
        type: 'removeSourceDisplay',
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
        OBS_PROPERTY_FONT: FontProperty,
        OBS_PROPERTY_TEXT: TextProperty,
        OBS_PROPERTY_PATH: PathProperty,
        OBS_PROPERTY_EDITABLE_LIST: EditableListProperty,
        OBS_PROPERTY_BUTTON: ButtonProperty
      }[type];
    }
  },

  created() {
    console.log(this.properties);
    this.$store.dispatch({
          type: 'createSourceDisplay',
          sourceId: this.sourceId,
          windowHandle: this.windowHandle
    });
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
  position: fixed;
  top: 30px;
  left: 0;
  right: 0;
  margin: auto;

  height: 220px;
  // width: 100%;
  background-color: black;
}

.SourceProperties-form {
  padding: 30px;
}
</style>
