<template>
  <div>
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

<script lang="ts">
import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import { IInputValue, TObsType, TObsValue } from "./Input";
import NumberInput from './NumberInput.vue';
import * as comps from './index';

// modules with "export default" lose types when we use re-exports
const inputComponents = comps as any as { [key: string]: typeof Vue };

@Component({
  components: inputComponents
})
export default class GenericForm extends Vue {

  @Prop()
  value: IInputValue<TObsValue>[];

  propertyComponentForType(type: TObsType): typeof Vue {
    const componentName = Object.keys(inputComponents).find(name => {
      const componentObsType = inputComponents[name]['obsType'];
      return Array.isArray(componentObsType) ?
        componentObsType.includes(type) :
        componentObsType === type;
    });
    if (!componentName) console.log('Component not found. Type:', type);
    return inputComponents[componentName];
  }

  onInputHandler(value: IInputValue<TObsValue>, index: number) {
    const newValue = [].concat(this.value);
    newValue.splice(index, 1, value);
    this.$emit('input', newValue, index);
  }

};
</script>
