<template>
  <div class="GenericForm">
    <div v-for="(parameter, inputIndex) in value">
      <component
        v-if="parameter.visible && propertyComponentForType(parameter.type)"
        :is="propertyComponentForType(parameter.type)"
        :value="value[inputIndex]"
        @input="value => onInputHandler(value, inputIndex)"
      />
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
      const componentName = Object.keys(inputComponents).find(name => {
        return inputComponents[name].obsType === type;
      });
      return inputComponents[componentName];
    },

    onInputHandler(value, index) {
      const newValue = [].concat(this.value);
      newValue.splice(index, 1, value);
      this.$emit('input', newValue);
    }
  }
};
</script>
