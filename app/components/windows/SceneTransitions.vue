<template>
<modal-layout
  title="Scene transition"
  :done-handler="done">

  <div slot="content">
    <div class="row">
      <div class="columns small-8">
        <ListInput :value="form.currentName" @input="onInputHandler"></ListInput>
      </div>
      <div class="columns small-4 controls">
        <div class="fa fa-plus ico-btn" @click="addTransition"></div>
        <div
          class="fa fa-minus ico-btn"
          @click="removeTransition" v-if="state.availableNames.length > 1">
        </div>
        <div class="fa fa-cog ico-btn" @click="setupTransition" v-if="state.properties.length"></div>
      </div>
    </div>
    <div class="row">
      <div class="columns small-12">
        <IntInput :value="form.duration" @input="onInputHandler"></IntInput>
      </div>
    </div>
  </div>

</modal-layout>
</template>

<script lang="ts">
import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Inject } from '../../services/service';
import { IInputValue } from "../shared/forms/Input";
import ScenesTransitionsService from '../../services/scenes-transitions';
import ModalLayout from '../ModalLayout.vue';
import * as inputComponents from '../shared/forms';
import windowManager from '../../util/WindowManager';
import windowMixin from '../mixins/window';

@Component({
  components: { ModalLayout, ...inputComponents },
  mixins: [windowMixin]
})
export default class SceneTransitions extends Vue {

  @Inject()
  transitionsService: ScenesTransitionsService;
  form = this.transitionsService.getFormData();

  get state() { return this.transitionsService.state; }


  onInputHandler(value: IInputValue<string>) {
    this.transitionsService.setCurrent({ [value.name]: value.value });
  }


  addTransition() {
    windowManager.showAddSceneTransition();
  }


  setupTransition() {
    windowManager.showSceneTransitionProperties(this.state.currentName);
  }


  removeTransition() {
    this.transitionsService.remove(this.state.currentName);
  }


  done() {
    windowManager.closeWindow();
  }
}

</script>

<style lang="less" scoped>
  .controls {
    padding-top: 30px;
  }
</style>
