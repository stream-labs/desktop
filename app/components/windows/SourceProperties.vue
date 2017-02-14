<template>
<modal-layout
  :title="windowTitle"
  :show-controls="true"
  :done-handler="done"
  :content-styles="contentStyles">
  <div slot="content">
    <div class="SourceProperties-preview">
    </div>
    <div class="SourceProperties-form">
    <component
      v-for="property in properties"
      :is="propertyComponentForType(property.type)"
      :source-name="sourceName"
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

export default {

  data() {
    return {
      sourceName: window.startupOptions.sourceName,

      contentStyles: {
        padding: 0,
        'margin-top': '220px',
      }
    };
  },

  components: {
    ModalLayout,
    ListProperty,
    BoolProperty
  },

  methods: {
    done() {
      console.log('Source Properties Submit');
    },

    handleInput(event) {
      debugger;
    },

    propertyComponentForType(type) {
      return {
        OBS_PROPERTY_LIST: ListProperty,
        OBS_PROPERTY_BOOL: BoolProperty
      }[type];
    }
  },

  created() {
    console.log(this.properties);
  },

  computed: {
    windowTitle() {
      return "Properties for '" + this.sourceName + "'";
    },

    properties() {
      let source = this.$store.state.sources.sources[this.sourceName];

      if (source) {
        return source.availableProperties;
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
  max-height: calc(100% - 220px);
}
</style>
