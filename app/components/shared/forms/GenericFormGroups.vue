<template>
  <div class="GenericFormGroups">
    <div v-for="(formGroup, groupIndex) in value" v-if="formGroup.parameters.length">

      <div v-if="formGroup.nameSubCategory != 'Untitled'">
        <h4  @click="toggleGroup(groupIndex)">
          <i class="fa fa-plus"  v-show="collapsedGroups[groupIndex]"></i>
          <i class="fa fa-minus" v-show="!collapsedGroups[groupIndex]"></i>
          {{ formGroup.nameSubCategory }}
        </h4>
      </div>

      <div v-if="!collapsedGroups[groupIndex]">
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

<style lang="less" scoped>
@import "../../../styles/index";

.GenericFormGroups > div {
  margin-bottom: 20px;
  background-color: @panel-bg-color;
  border: 1px solid @panel-border-color;
  padding: 20px 30px;

  h4 {
    cursor: pointer;
  }

  .fa-plus, .fa-minus {margin-right: 10px}
}
</style>