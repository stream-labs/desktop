import { throttle } from 'lodash-decorators';
import { Component, Prop } from 'vue-property-decorator';
import { TObsType, Input, ISliderInputValue } from './Input';
import Slider from '../Slider.vue';

@Component({
  components: { Slider }
})
class SliderInput extends Input<ISliderInputValue> {

  static obsType: TObsType;

  @Prop()
  value: ISliderInputValue;

  @throttle(100)
  updateValue(value: number) {
    this.emitInput({ ...this.value, value });
  }

}

SliderInput.obsType = 'OBS_PROPERTY_SLIDER';

export default SliderInput;
