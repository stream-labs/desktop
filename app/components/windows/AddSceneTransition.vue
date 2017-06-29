<template>
  <modal-layout
    title="Add transition"
    :done-handler="done"
    :cancel-handler="cancel"
  >

    <div slot="content">
      <ListInput v-model="form.type" @input="setTypeAsName"></ListInput>
      <TextInput v-model="form.name"></TextInput>
      <p v-if="error" style="color: red">
        {{ error }}
      </p>

    </div>

  </modal-layout>
</template>

<script lang="ts">
import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Inject } from '../../services/service';
import { IInputValue } from "../shared/forms/Input";
import ModalLayout from '../ModalLayout.vue';
import { WindowService } from '../../services/window';
import windowMixin from '../mixins/window';
import * as inputComponents from '../shared/forms';
import namingHelpers from '../../util/NamingHelpers';
import ScenesTransitionsService from "../../services/scenes-transitions";

@Component({
  components: { ModalLayout, ...inputComponents },
  mixins: [windowMixin]
})
export default class AddSceneTransition extends Vue {

  @Inject()
  transitionsService: ScenesTransitionsService;

  windowService = WindowService.instance;
  form = this.transitionsService.getAddNewFormData();
  error = '';

  mounted() {
    this.setTypeAsName();
  }

  done() {
    const name = this.form.name.value;
    this.error = this.validateName(name);
    if (this.error) return;

    this.transitionsService.add(name, this.form.type.value);

    if (this.state.properties.length) {
      this.windowService.showSceneTransitionProperties(name);
    } else {
      this.windowService.showSceneTransitions();
    }
  }

  cancel() {
    this.windowService.showSceneTransitions();
  }

  validateName(name: string) {
    if (!name) return 'Name is required';
    if (this.state.availableNames.find(item => item.value === name)) return 'That name is already taken';
    return '';
  }

  setTypeAsName() {
    const name = this.state.availableTypes.find(item => {
      return item.value === this.form.type.value;
    }).description;
    this.form.name.value = namingHelpers.suggestName(
      name, (suggestedName: string) => this.validateName(suggestedName)
    );
  }


  get state() { return this.transitionsService.state; }

};
</script>
