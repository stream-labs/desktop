import { Component, Prop } from 'vue-property-decorator';
import { IObsInput, TObsValue } from './ObsInput';
import { propertyComponentForType } from './Components';
import ValidatedForm from 'components/shared/inputs/ValidatedForm.vue';
import { ErrorField } from 'vee-validate';
import TsxComponent from 'components/tsx-component';

@Component({ components: { ValidatedForm } })
export default class GenericForm extends TsxComponent<{
  value: IObsInput<TObsValue>[];
  onInput: Function;
}> {
  @Prop() value: IObsInput<TObsValue>[];
  @Prop() onInput?: Function;

  $refs: {
    form: ValidatedForm;
  };

  propertyComponentForType = propertyComponentForType;

  async onInputHandler(value: IObsInput<TObsValue>, index: number) {
    const errors = await this.$refs.form.validateAndGetErrors();
    this.emitValidate(errors);
    if (errors.length) return;

    const newValue = [].concat(this.value);
    newValue.splice(index, 1, value);

    this.$emit('input', newValue, index);
  }

  private emitValidate(errors: ErrorField[]) {
    this.$emit('validate', errors);
  }
}
