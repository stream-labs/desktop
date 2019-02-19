import { Component, Prop } from 'vue-property-decorator';
import { IObsNumberInputValue, TObsType, ObsInput } from './ObsInput';
import HFormGroup from 'components/shared/inputs/HFormGroup.vue';
import { NumberInput } from 'components/shared/inputs/inputs';

@Component({
  components: { HFormGroup, NumberInput },
})
class ObsNumberInput extends ObsInput<IObsNumberInputValue> {
  static obsType: TObsType[];

  @Prop()
  value: IObsNumberInputValue;

  $refs: {
    input: HTMLInputElement;
  };

  get metadata() {
    return {
      disabled: this.value.enabled === false,
      min: this.value.minVal,
      max: this.value.maxVal,
    };
  }

  updateValue(value: number) {
    this.emitInput({ ...this.value, value });
  }
}

ObsNumberInput.obsType = ['OBS_PROPERTY_DOUBLE', 'OBS_PROPERTY_FLOAT'];

export default ObsNumberInput;
