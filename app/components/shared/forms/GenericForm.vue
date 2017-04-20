<template>
  <div>
    <div v-for="formGroup in data">
      <div>{{ formGroup.nameSubCategory }}</div>
      <div v-for="parameter in formGroup.parameters">
        {{ parameter.type }}
        <component
          v-if="parameter.visible && parameter.type == 'OBS_PROPERTY_BOOL'"
          :is="'BoolProperty'"
          :property="parameter"/>
      </div>
    </div>
  </div>
</template>

<script>
  import * as propertyComponents from './index';
  import { propertyComponentForType } from './helpers';

  export default {
    props: ['data'],
    components: {BoolProperty: propertyComponents.BoolProperty},
    methods: {propertyComponentForType}
  }
</script>
