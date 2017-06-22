<template>
  <modal-layout
    title="Transition properties"
    :done-handler="done"
    :cancel-handler="cancel"
  >

    <div slot="content">
      <GenericForm v-model="properties"></GenericForm>
    </div>

  </modal-layout>
</template>

<script lang="ts">
import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Inject } from '../../services/service';
import ScenesTransitionsService from '../../services/scenes-transitions';
import ModalLayout from '../ModalLayout.vue';
import GenericForm from '../shared/forms/GenericForm.vue';
import { WindowService } from '../../services/window';
import windowMixin from '../mixins/window';

@Component({
  components: { ModalLayout, GenericForm },
  mixins: [windowMixin]
})
export default class SceneTransitionProperties extends Vue {

  @Inject()
  transitionsService: ScenesTransitionsService;

  windowService = WindowService.instance;

  properties = this.transitionsService.getPropertiesFormData();


  done() {
    this.transitionsService.setProperties(this.properties);
    this.windowService.showSceneTransitions();
  }


  cancel() {
    this.windowService.showSceneTransitions();
  }
}
</script>

<style lang="less" scoped>

</style>
