import { Component, Prop } from 'vue-property-decorator';
import { TObsType, ObsInput, IObsNumberInputValue } from './ObsInput';
import HFormGroup from 'components/shared/inputs/HFormGroup.vue';
import { NumberInput } from 'components/shared/inputs/inputs';

@Component({ components: { NumberInput, HFormGroup } })
class ObsIntInput extends ObsInput<IObsNumberInputValue> {
  static obsType: TObsType[];

  @Prop()
  value: IObsNumberInputValue;

  $refs: {
    input: HTMLInputElement;
  };

  get metadata() {
    return {
      min: this.value.minVal,
      max: this.value.maxVal,
      disabled: this.value.enabled === false,
      isInteger: true,
    };
  }

  updateValue(value: number) {
    let formattedValue = value;
    if (this.value.type === 'OBS_PROPERTY_UINT' && formattedValue < 0) {
      formattedValue = 0;
    }

    this.emitInput({ ...this.value, value: formattedValue });
  }
}

ObsIntInput.obsType = ['OBS_PROPERTY_INT', 'OBS_PROPERTY_UINT'];

export default ObsIntInput;
