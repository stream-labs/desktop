import { Component, Prop } from 'vue-property-decorator';
import { IObsInput, TObsType, ObsInput } from './ObsInput';
import { Debounce } from 'lodash-decorators';

@Component
class ObsNumberInput extends ObsInput<IObsInput<number>> {

  static obsType: TObsType[];

  @Prop()
  value: IObsInput<number>;

  $refs: {
    input: HTMLInputElement
  };

  @Debounce(1000) // fields with min value don't work well without Debounce
  updateValue(value: string) {
    let formattedValue = value;
    if (isNaN(Number(formattedValue))) formattedValue = '0';
    if (formattedValue !== value) {
      this.$refs.input.value = formattedValue;
    }
    // Emit the number value through the input event
    this.emitInput({ ...this.value, value: Number(formattedValue) });
  }

}

ObsNumberInput.obsType = ['OBS_PROPERTY_DOUBLE', 'OBS_PROPERTY_FLOAT'];

export default ObsNumberInput;
