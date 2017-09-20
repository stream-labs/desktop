<template>
<modal-layout
  title="Scene transition"
  :done-handler="done">

  <div slot="content">
    <div class="row">
      <div class="columns small-12">
        <ListInput
          v-model="form.type"
          @input="setTransitionType"/>
      </div>
      <div class="columns small-12">
        <IntInput
          v-model="form.duration"
          @input="setTransitionDuration"/>
      </div>
    </div>
  </div>

</modal-layout>
</template>

<script lang="ts">
import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Inject } from '../../util/injector';
import { ScenesTransitionsService } from '../../services/scenes-transitions';
import ModalLayout from '../ModalLayout.vue';
import * as inputComponents from '../shared/forms';
import { WindowsService } from '../../services/windows';
import windowMixin from '../mixins/window';

@Component({
  mixins: [windowMixin],
  components: {
    ModalLayout,
    ...inputComponents
  }
})
export default class SceneTransitions extends Vue {

  @Inject('ScenesTransitionsService')
  transitionsService: ScenesTransitionsService;

  @Inject()
  windowsService: WindowsService;
  form = this.transitionsService.getFormData();


  setTransitionType() {
    this.transitionsService.setType(this.form.type.value);
  }


  setTransitionDuration() {
    this.transitionsService.setDuration(this.form.duration.value);
  }


  done() {
    this.windowsService.closeChildWindow();
  }

}
</script>

<style lang="less" scoped>
.controls {
  padding-top: 30px;
}
</style>
