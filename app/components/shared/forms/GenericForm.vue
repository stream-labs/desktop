<template>
  <div class="GenericForm">
    <div v-for="(formGroup, index) in value" v-if="formGroup.parameters.length">

      <div v-if="formGroup.nameSubCategory != 'Untitled'">
        <h4  @click="toggleGroup(index)">
          <i class="fa fa-plus"  v-show="!expandedGroups[index]"></i>
          <i class="fa fa-minus" v-show="expandedGroups[index]"></i>
          {{ formGroup.nameSubCategory }}
        </h4>
      </div>

      <div v-show="expandedGroups[index] == true">
        <div v-for="(parameter, index) in formGroup.parameters">
          <component
            v-if="parameter.visible && propertyComponentForType(parameter.type)"
            :is="propertyComponentForType(parameter.type)"
            v-model="formGroup.parameters[index]"
            @input="$emit('input', value)"
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
      return {expandedGroups: {}}
    },
    methods: {

      toggleGroup(index) {
        this.expandedGroups = Object.assign(this.expandedGroups, {[index]: !this.expandedGroups[index]});
      },

      collapseGroups() {
        this.expandedGroups = {};
      },

      propertyComponentForType(type) {
        for (let componentName in inputComponents) {
          let component = inputComponents[componentName];
          if (component.obsType === type) return component;
        }
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
}
</style>