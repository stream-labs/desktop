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

<script>
import windowManager from '../../util/WindowManager';
import windowMixin from '../mixins/window';
import SourceFiltersService from '../../services/source-filters';

import * as inputComponents from '../shared/forms';
import ModalLayout from '../ModalLayout.vue';

export default {

  mixins: [windowMixin],

  components: Object.assign({
    ModalLayout
  }, inputComponents),

  beforeCreate() {
    /**
     * @type {SourceFilterService}
     */
    this.sourceFiltersService = SourceFiltersService.instance;
  },

  mounted() {
    this.setTypeAsName(this.form.type);
  },

  data() {
    return {
      sourceName: windowManager.getOptions().sourceName,
      form: this.sourceFiltersService.getAddNewFormData(),
      error: ''
    };
  },

  computed: {
    state() { return this.sourceFiltersService.state; }
  },


  methods: {

    done() {
      const name = this.form.name.currentValue;
      this.error = this.validateName(name);
      if (this.error) return;

      this.sourceFiltersService.add(
        this.sourceName,
        this.form.type.currentValue,
        name
      );

      windowManager.showSourceFilters(this.sourceName, name);
    },


    cancel() {
      windowManager.showSourceFilters(this.sourceName);
    },


    validateName(name) {
      if (!name) return 'Name is required';
      if (this.sourceFiltersService.getFiltersNames(this.sourceName).includes(name)) {
        return 'That name is already taken';
      }
      return '';
    },


    setTypeAsName(typeField) {
      this.form.name.currentValue = this.state.availableTypes.find(({ type }) => {
        return type === typeField.currentValue;
      }).description;
    }
  }

};
</script>
