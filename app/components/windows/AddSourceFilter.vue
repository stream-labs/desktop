<template>
  <modal-layout
    title="Add source filter"
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
import windowManager from '../../util/WindowManager';
import windowMixin from '../mixins/window';
import SourceFiltersService from '../../services/source-filters';
import namingHelpers from '../../util/NamingHelpers';

import * as inputComponents from '../shared/forms';
import ModalLayout from '../ModalLayout.vue';


@Component({
  components: { ModalLayout, ...inputComponents },
  mixins: [windowMixin]
})
export default class AddSourceFilter extends Vue {

  @Inject()
  filtersService: SourceFiltersService;
  sourceName: string = windowManager.getOptions().sourceName;
  form = this.filtersService.getAddNewFormData();
  error = '';

  mounted() {
    this.setTypeAsName();
  }

  get state() { return this.filtersService.state; }

  done() {
    const name = this.form.name.value;
    this.error = this.validateName(name);
    if (this.error) return;

    this.filtersService.add(
      this.sourceName,
      this.form.type.value,
      name
    );

    windowManager.showSourceFilters(this.sourceName, name);
  }


  cancel() {
    windowManager.showSourceFilters(this.sourceName);
  }


  validateName(name: string) {
    if (!name) return 'Name is required';
    if (this.filtersService.getFilters(this.sourceName).find(filter => filter.name === name)) {
      return 'That name is already taken';
    }
    return '';
  }


  setTypeAsName() {
    const name = this.state.availableTypes.find(({ type }) => {
      return type === this.form.type.value;
    }).description;
    this.form.name.value = namingHelpers.suggestName(
      name, (suggestedName: string) => this.validateName(suggestedName)
    );
  }
}
</script>
