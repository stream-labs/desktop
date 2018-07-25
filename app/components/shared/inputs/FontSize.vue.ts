
import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import { BaseInput } from './BaseInput';
import SliderInput from './SliderInput.vue';
import { IInputMetadata } from './index';

@Component({
  components: {
    WSliderInput: SliderInput
  }
})
export default class FontSize extends BaseInput<string, IInputMetadata>{
  @Prop()
  value: string;

  @Prop()
  metadata: IInputMetadata;

  get sliderValue() {
    return parseInt(this.value, 10);
  }

  updateValue(value: number) {
    this.emitInput(value.toString());
  }
}
