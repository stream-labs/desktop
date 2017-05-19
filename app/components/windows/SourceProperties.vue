<template>
<modal-layout
  :title="windowTitle"
  :done-handler="done"
  :cancel-handler="cancel"
  :fixedSectionHeight="200">
  <SourcePreview slot="fixed" :sourceName="sourceName"></SourcePreview>
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
import windowManager from '../../util/WindowManager';
import windowMixin from '../mixins/window';
import { propertyComponentForType } from '../source_properties/helpers';
import SourcesService from '../../services/sources';

import ModalLayout from '../ModalLayout.vue';
import SourcePreview from '../shared/SourcePreview.vue';
import * as propertyComponents from '../source_properties';


export default {

  mixins: [windowMixin],

  components: Object.assign({ ModalLayout, SourcePreview }, propertyComponents),

  methods: {

    closeWindow() {
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


  computed: {
    windowTitle() {
      const source = SourcesService.instance.getSourceById(this.sourceId);

      if (source) return `Properties for '${source.name}'`;
      return '';
    },

    properties() {
      const source = SourcesService.instance.getSourceById(this.sourceId);

      if (source) return source.properties;
      return [];
    },

    sourceName() {
      return SourcesService.instance.getSourceById(this.sourceId).name;
    },

    sourceId() {
      return this.$store.state.windowOptions.options.sourceId;
    }
  }

};
</script>
