import { debounce } from 'lodash-decorators';
import { Component, Prop } from 'vue-property-decorator';
import { TObsType, ObsInput, IObsSliderInputValue } from './ObsInput';
import Slider from '../../shared/Slider.vue';

@Component({
  components: { Slider }
})
class ObsSliderInput extends ObsInput<IObsSliderInputValue> {

  static obsType: TObsType;

  @Prop() value: IObsSliderInputValue;

  // Local value is an instaneous value that is updated as the user
  // moves the slider.  It makes the UI feel more responsive.
  localValue = this.value.value;

  updateValue(value: number) {
    this.localValue = value;
    this.emitValue(value);
  }

  @debounce(100)
  emitValue(value: number) {
    this.emitInput({ ...this.value, value });
  }

}

ObsSliderInput.obsType = 'OBS_PROPERTY_SLIDER';

export default ObsSliderInput;
