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

<script lang="ts">
import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Inject } from '../../util/injector';
import { TFormData } from '../shared/forms/Input';
import { WindowService } from '../../services/window';
import windowMixin from '../mixins/window';
import { SourcesService } from '../../services/sources';

import ModalLayout from '../ModalLayout.vue';
import SourcePreview from '../shared/SourcePreview.vue';
import GenericForm from '../shared/forms/GenericForm.vue';

@Component({
  components: { ModalLayout, SourcePreview, GenericForm },
  mixins: [windowMixin]
})
export default class SourceProperties extends Vue {

  @Inject()
  sourcesService: SourcesService;

  windowService = WindowService.instance;
  sourceId = this.windowService.getOptions().sourceId;
  properties = this.sourcesService.getPropertiesFormData(this.sourceId);


  onInputHandler(properties: TFormData, changedIndex: number) {
    this.sourcesService.setProperties(
      this.sourceId,
      [properties[changedIndex]]
    );
    this.properties = this.sourcesService.getPropertiesFormData(this.sourceId);
  }

  closeWindow() {
    this.windowService.closeWindow();
  }

  done() {
    this.closeWindow();
  }

  cancel() {
    this.closeWindow();
  }


  get windowTitle() {
    const source = this.sourcesService.getSourceById(this.sourceId);
    return source ? `Properties for '${source.displayName}'` : '';
  }

  get sourceName() {
    return this.sourcesService.getSourceById(this.sourceId).name;
  }

}
</script>
