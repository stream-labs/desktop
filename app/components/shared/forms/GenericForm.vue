<template>
  <div class="GenericForm">
    <div v-for="formGroup in value" v-if="formGroup.parameters.length">
      <h4>{{ formGroup.nameSubCategory }}</h4>
      <div v-for="(parameter, index) in formGroup.parameters">
        <component
          v-if="parameter.visible && propertyComponentForType(parameter.type)"
          :is="propertyComponentForType(parameter.type)"
          v-model="formGroup.parameters[index]"
        />
      </div>
    </div>
  </div>
</template>

<script>
  import * as inputComponents from './index';

  export default {
    props: ['value'],
    components: inputComponents,
    methods: {
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
  }
</style>