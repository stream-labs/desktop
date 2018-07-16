
import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import { WInput } from './WInput';
import WSliderInput from './WSliderInput.vue';

@Component({
  components: {
    WSliderInput
  }
})
export default class WFontSize extends WInput<string, {}>{
  @Prop()
  value: string;

  get sliderValue() {
    return parseInt(this.value, 10);
  }

  updateValue(value: number) {
    this.emitInput(value.toString());
  }
}
