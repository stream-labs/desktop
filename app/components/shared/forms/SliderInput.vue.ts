import { debounce } from 'lodash-decorators';
import { Component, Prop } from 'vue-property-decorator';
import { TObsType, Input, ISliderInputValue } from './Input';
import Slider from '../Slider.vue';

@Component({
  components: { Slider }
})
class SliderInput extends Input<ISliderInputValue> {

  static obsType: TObsType;

  @Prop() value: ISliderInputValue;
  testingAnchor = `Form/Slider/${this.value.name}`;

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

SliderInput.obsType = 'OBS_PROPERTY_SLIDER';

export default SliderInput;
