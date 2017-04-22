<template>
  <div class="GenericForm">
    <div v-for="(formGroup, groupIndex) in value" v-if="formGroup.parameters.length">

      <div v-if="formGroup.nameSubCategory != 'Untitled'">
        <h4  @click="toggleGroup(groupIndex)">
          <i class="fa fa-plus"  v-show="collapsedGroups[groupIndex]"></i>
          <i class="fa fa-minus" v-show="!collapsedGroups[groupIndex]"></i>
          {{ formGroup.nameSubCategory }}
        </h4>
      </div>

      <div v-if="!collapsedGroups[groupIndex]">
        <div v-for="(parameter, inputIndex) in formGroup.parameters">
          <component
            v-if="parameter.visible && propertyComponentForType(parameter.type)"
            :is="propertyComponentForType(parameter.type)"
            v-model="formGroup.parameters[inputIndex]"
            @input="onInputHandler"
          />
        </div>
      </div>

    </div>
  </div>
</template>

<script>
  import * as inputComponents from './index';

  export default {
    props: ['value'],
    components: inputComponents,
    data() {
      return {collapsedGroups: {}}
    },
    methods: {

      toggleGroup(index) {
        this.$set(this.collapsedGroups, index, !this.collapsedGroups[index]);
      },

      propertyComponentForType(type) {
        for (let componentName in inputComponents) {
          let component = inputComponents[componentName];
          if (component.obsType === type) return component;
        }
      },

      onInputHandler() {
        this.$emit('input', this.value);
      }
    }
  }
</script>

<style lang="less" scoped>
.GenericForm > div {
  margin-bottom: 20px;
  background-color: #fcfcfc;
  border: 1px solid #ededed;
  padding: 20px 30px;

  h4 {
    cursor: pointer;
  }

  .fa-plus, .fa-minus {margin-right: 10px}
}
</style>