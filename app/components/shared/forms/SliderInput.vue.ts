import { throttle } from 'lodash-decorators';
import { Component, Prop } from 'vue-property-decorator';
import { INumberInputValue, TObsType, Input } from './Input';
import Slider from '../Slider.vue';

@Component({
  components: { Slider }
})
class SliderInput extends Input<INumberInputValue> {

  static obsType: TObsType;

  @Prop()
  value: INumberInputValue;

  @throttle(100)
  updateValue(value: number) {
    this.emitInput({ ...this.value, value });
  }

}

SliderInput.obsType = 'OBS_PROPERTY_SLIDER';

export default SliderInput;
