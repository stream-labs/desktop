<template>
<modal-layout
  :title="windowTitle"
  :done-handler="done"
  :cancel-handler="cancel"
  :fixedSectionHeight="200">
  <SourcePreview slot="fixed" v-if="source" :sourceName="source.name"></SourcePreview>
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
import { WindowsService } from '../../services/windows';
import windowMixin from '../mixins/window';
import { ISourcesServiceApi } from '../../services/sources';

import ModalLayout from '../ModalLayout.vue';
import SourcePreview from '../shared/SourcePreview.vue';
import GenericForm from '../shared/forms/GenericForm.vue';

@Component({
  components: { ModalLayout, SourcePreview, GenericForm },
  mixins: [windowMixin]
})
export default class SourceProperties extends Vue {

  @Inject()
  sourcesService: ISourcesServiceApi;

  @Inject()
  windowsService: WindowsService;

  sourceId = this.windowsService.getChildWindowQueryParams().sourceId;
  source = this.sourcesService.getSource(this.sourceId);
  properties = this.source ? this.source.getPropertiesFormData() : [];


  onInputHandler(properties: TFormData, changedIndex: number) {
    const source = this.sourcesService.getSource(this.sourceId);
    source.setPropertiesFormData(
      [properties[changedIndex]]
    );
    this.properties = source.getPropertiesFormData();
  }

  closeWindow() {
    this.windowsService.closeChildWindow();
  }

  done() {
    this.closeWindow();
  }

  cancel() {
    this.closeWindow();
  }


  get windowTitle() {
    const source = this.sourcesService.getSource(this.sourceId);
    return source ? `Properties for '${source.displayName}'` : '';
  }

}
</script>
