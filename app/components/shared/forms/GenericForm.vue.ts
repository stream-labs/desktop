import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import { IFormInput, TObsType, TObsValue } from "./Input";
import NumberInput from './NumberInput.vue';
import * as comps from './index';

// modules with "export default" lose types when we use re-exports
const inputComponents = comps as any as { [key: string]: typeof Vue };

@Component({
  components: inputComponents
})
export default class GenericForm extends Vue {

  @Prop()
  value: IFormInput<TObsValue>[];

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

  onInputHandler(value: IFormInput<TObsValue>, index: number) {
    const newValue = [].concat(this.value);
    newValue.splice(index, 1, value);
    this.$emit('input', newValue, index);
  }

};
