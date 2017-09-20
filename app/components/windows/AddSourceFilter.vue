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
import { Inject } from '../../util/injector';
import { WindowsService } from '../../services/windows';
import windowMixin from '../mixins/window';
import { SourceFiltersService } from '../../services/source-filters';

import * as inputComponents from '../shared/forms';
import ModalLayout from '../ModalLayout.vue';


@Component({
  components: { ModalLayout, ...inputComponents },
  mixins: [windowMixin]
})
export default class AddSourceFilter extends Vue {

  @Inject()
  windowsService: WindowsService;

  @Inject('SourceFiltersService')
  filtersService: SourceFiltersService;

  sourceName: string = this.windowsService.getChildWindowQueryParams().sourceName;
  form = this.filtersService.getAddNewFormData(this.sourceName);
  availableTypes = this.filtersService.getTypesForSource(this.sourceName);
  error = '';

  mounted() {
    this.setTypeAsName();
  }

  done() {
    const name = this.form.name.value;
    this.error = this.validateName(name);
    if (this.error) return;

    this.filtersService.add(
      this.sourceName,
      this.form.type.value,
      name
    );

    this.filtersService.showSourceFilters(this.sourceName, name);
  }

  cancel() {
    this.filtersService.showSourceFilters(this.sourceName);
  }

  validateName(name: string) {
    if (!name) return 'Name is required';
    if (this.filtersService.getFilters(this.sourceName).find(filter => filter.name === name)) {
      return 'That name is already taken';
    }
    return '';
  }

  setTypeAsName() {
    const name = this.availableTypes.find(({ type }) => {
      return type === this.form.type.value;
    }).description;
    this.form.name.value = this.filtersService.suggestName(this.sourceName, name);
  }

}
</script>
