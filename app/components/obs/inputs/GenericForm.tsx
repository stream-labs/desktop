import { Component, Prop } from 'vue-property-decorator';
import { IObsInput, TObsValue } from './ObsInput';
import { propertyComponentForType } from './Components';
import ValidatedForm from 'components/shared/inputs/ValidatedForm';
import { ErrorField } from 'vee-validate';
import TsxComponent, { createProps } from 'components/tsx-component';

class GenericFormProps {
  value: IObsInput<TObsValue>[] = [];
  onInput: (value: any) => void = () => {};
}

@Component({ props: createProps(GenericFormProps) })
export default class GenericForm extends TsxComponent<GenericFormProps> {
  $refs: { form: ValidatedForm };

  propertyComponentForType = propertyComponentForType;

  async onInputHandler(value: IObsInput<TObsValue>, index: number) {
    const errors = await this.$refs.form.validateAndGetErrors();
    this.emitValidate(errors);
    if (errors.length) return;

    const newValue = [].concat(this.props.value);
    newValue.splice(index, 1, value);

    this.$emit('input', newValue, index);
  }

  private emitValidate(errors: ErrorField[]) {
    this.$emit('validate', errors);
  }

  render() {
    return (
      <ValidatedForm ref="form">
        {this.props.value.map((parameter, inputIndex) => {
          const Component = propertyComponentForType(parameter.type);
          return (
            <div key={parameter.name}>
              {parameter.visible && Component && (
                <Component
                  value={this.props.value[inputIndex]}
                  onInput={(value: any) => this.onInputHandler(value, inputIndex)}
                />
              )}
            </div>
          );
        })}
      </ValidatedForm>
    );
  }
}
