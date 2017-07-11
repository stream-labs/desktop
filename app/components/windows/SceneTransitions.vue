<template>
<modal-layout
  title="Scene transition"
  :done-handler="done">

  <div slot="content">
    <div class="row">
      <div class="columns small-12">
        <ListInput v-model="form.currentName" @input="onTransitionChangeHandler"></ListInput>
      </div>
      <div class="columns small-12">
        <IntInput v-model="form.duration"></IntInput>
      </div>
      <div class="columns small-12">
        <GenericForm v-model="properties"></GenericForm>
      </div>
    </div>
  </div>

</modal-layout>
</template>

<script lang="ts">
import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Inject } from '../../services/service';
import { IInputValue, TFormData } from '../shared/forms/Input';
import ScenesTransitionsService from '../../services/scenes-transitions';
import ModalLayout from '../ModalLayout.vue';
import GenericForm from '../shared/forms/GenericForm.vue';
import * as inputComponents from '../shared/forms';
import { WindowService } from '../../services/window';
import windowMixin from '../mixins/window';

@Component({
  mixins: [windowMixin],
  components: {
    ModalLayout,
    GenericForm,
    ...inputComponents
  }
})
export default class SceneTransitions extends Vue {

  @Inject()
  transitionsService: ScenesTransitionsService;

  windowService = WindowService.instance;
  form = this.transitionsService.getFormData();
  properties = this.transitionsService.getPropertiesFormData();


  onTransitionChangeHandler(value: IInputValue<string>) {
    this.transitionsService.setCurrent({ [value.name]: value.value });
    this.properties = this.transitionsService.getPropertiesFormData();
  }


  done() {
    this.transitionsService.setCurrent({
      currentName: this.form.currentName.value,
      duration: this.form.duration.value
    });
    this.transitionsService.setProperties(this.properties);
    this.windowService.closeWindow();
  }

}
</script>

<style lang="less" scoped>
.controls {
  padding-top: 30px;
}
</style>
