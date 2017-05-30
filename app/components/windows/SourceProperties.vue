<template>
<modal-layout
  :title="windowTitle"
  :done-handler="done"
  :cancel-handler="cancel"
  :fixedSectionHeight="200">
  <SourcePreview slot="fixed" :sourceName="sourceName"></SourcePreview>
  <div slot="content">
    <GenericForm v-model="properties" @input="onInputHandler"/>
  </div>
</modal-layout>
</template>

<script>
import windowManager from '../../util/WindowManager';
import windowMixin from '../mixins/window';
import SourcesService from '../../services/sources';

import ModalLayout from '../ModalLayout.vue';
import SourcePreview from '../shared/SourcePreview.vue';
import GenericForm from '../shared/forms/GenericForm.vue';


export default {

  mixins: [windowMixin],

  components: { ModalLayout, SourcePreview, GenericForm },

  data() {
    const sourceId = this.$store.state.windowOptions.options.sourceId;
    const properties = SourcesService.instance.getPropertiesFormData(sourceId);
    return {
      sourceId,
      properties
    };
  },

  methods: {

    onInputHandler(properties, changedIndex) {
      SourcesService.instance.setProperties(
        this.sourceId,
        [properties[changedIndex]]
      );
      this.properties = SourcesService.instance.getPropertiesFormData(this.sourceId);
    },

    closeWindow() {
      windowManager.closeWindow();
    },

    done() {
      this.closeWindow();
    },

    cancel() {
      this.closeWindow();
    }
  },


  computed: {
    windowTitle() {
      const source = SourcesService.instance.getSourceById(this.sourceId);

      if (source) return `Properties for '${source.name}'`;
      return '';
    },

    sourceName() {
      return SourcesService.instance.getSourceById(this.sourceId).name;
    },

  }

};
</script>
