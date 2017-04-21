<template>
  <div>
    <div v-for="formGroup in value">
      <div>{{ formGroup.nameSubCategory }}</div>
      <div v-for="(parameter, index) in formGroup.parameters">
        {{ parameter.type }}
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
  import { propertyComponentForType } from './helpers';

  export default {
    props: ['value'],
    components: inputComponents,
    methods: {
      propertyComponentForType,
    }
  }
</script>
