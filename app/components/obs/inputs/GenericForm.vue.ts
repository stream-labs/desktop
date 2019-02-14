import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import { IObsInput, TObsValue } from './ObsInput';
import { propertyComponentForType } from './Components';
import ValidatedForm from 'components/shared/inputs/ValidatedForm.vue';

@Component({ components: { ValidatedForm } })
export default class GenericForm extends Vue {
  @Prop()
  value: IObsInput<TObsValue>[];

  $refs: {
    form: ValidatedForm;
  };

  propertyComponentForType = propertyComponentForType;

  async onInputHandler(value: IObsInput<TObsValue>, index: number) {
    this.$refs.form.validate();

    const newValue = [].concat(this.value);
    newValue.splice(index, 1, value);
    this.$emit('input', newValue, index);
  }
}
