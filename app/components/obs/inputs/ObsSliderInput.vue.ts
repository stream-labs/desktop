import { Component, Prop } from 'vue-property-decorator';
import { TObsType, ObsInput, IObsSliderInputValue } from './ObsInput';
import HFormGroup from 'components/shared/inputs/HFormGroup.vue';
import { SliderInput } from 'components/shared/inputs/inputs';

@Component({
  components: { HFormGroup, SliderInput },
})
class ObsSliderInput extends ObsInput<IObsSliderInputValue> {
  static obsType: TObsType;

  @Prop() value: IObsSliderInputValue;

  // Local value is an instaneous value that is updated as the user
  // moves the slider.  It makes the UI feel more responsive.
  localValue = this.value.value;

  get metadata() {
    return {
      disabled: this.value.enabled === false,
      max: this.value.maxVal,
      min: this.value.minVal,
      interval: this.value.stepVal,
      hasValueBox: true,
      usePercentages: this.value.usePercentages,
    };
  }

  updateValue(value: number) {
    this.localValue = value;
    this.emitValue(value);
  }

  emitValue(value: number) {
    this.emitInput({ ...this.value, value });
  }
}

ObsSliderInput.obsType = 'OBS_PROPERTY_SLIDER';

export default ObsSliderInput;
