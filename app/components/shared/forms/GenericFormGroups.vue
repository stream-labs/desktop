<template>
  <div class="form-groups">
    <div class="section" v-for="(formGroup, groupIndex) in value" v-if="formGroup.parameters.length">

      <div class="section-title--dropdown" v-if="formGroup.nameSubCategory != 'Untitled'">
        <h4 class="section-title" @click="toggleGroup(groupIndex)">
          <i class="fa fa-plus"  v-show="collapsedGroups[groupIndex]"></i>
          <i class="fa fa-minus" v-show="!collapsedGroups[groupIndex]"></i>
          {{ formGroup.nameSubCategory }}
        </h4>
      </div>

      <div class="section-content section-content--dropdown" v-if="!collapsedGroups[groupIndex]">
        <GenericForm v-model="formGroup.parameters" @input="onInputHandler"></GenericForm>
      </div>

    </div>
  </div>
</template>

<script>
import GenericForm from './GenericForm.vue';

export default {

  props: ['value'],

  components: { GenericForm },

  data() {
    return { collapsedGroups: {} };
  },

  methods: {

    toggleGroup(index) {
      this.$set(this.collapsedGroups, index, !this.collapsedGroups[index]);
    },

    onInputHandler() {
      this.$emit('input', this.value);
    }
  }
};
</script>
