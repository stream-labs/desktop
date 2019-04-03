import { Component, Prop } from 'vue-property-decorator';
import { IObsNumberInputValue, TObsType, ObsInput } from './ObsInput';
import HFormGroup from 'components/shared/inputs/HFormGroup.vue';

@Component({
  components: { HFormGroup },
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
      type: 'number',
      name: this.value.name,
      disabled: this.value.enabled === false,
      min: this.value.minVal,
      max: this.value.maxVal,
      title: this.value.description,
      fullWidth: true,
      required: true,
    };
  }

  updateValue(value: number) {
    this.emitInput({ ...this.value, value });
  }
}

ObsNumberInput.obsType = ['OBS_PROPERTY_DOUBLE', 'OBS_PROPERTY_FLOAT'];

export default ObsNumberInput;
