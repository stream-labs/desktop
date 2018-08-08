import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import { IFormInput, TObsValue } from './Input';
import { propertyComponentForType } from './Components';


@Component({})
export default class GenericForm extends Vue {

  @Prop()
  value: IFormInput<TObsValue>[];

  @Prop()
  category: string;

  @Prop()
  subCategory: string;

  propertyComponentForType = propertyComponentForType;

  onInputHandler(value: IFormInput<TObsValue>, index: number) {
    const newValue = [].concat(this.value);
    newValue.splice(index, 1, value);
    this.$emit('input', newValue, index);
  }

};
