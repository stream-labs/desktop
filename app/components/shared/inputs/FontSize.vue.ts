
import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import { BaseInput } from './BaseInput';
import SliderInput from './SliderInput.vue';
import { IInputMetadata } from './index';
import { metadata } from 'components/shared/inputs'
import { cloneDeep } from 'lodash';

@Component({
  components: {
    SliderInput
  }
})
export default class FontSize extends BaseInput<string, IInputMetadata>{
  @Prop()
  value: string;

  @Prop()
  metadata: IInputMetadata;

  get sliderMetadata() {
    let sliderOptions = metadata.slider({ min: 8, max: 144 });
    return {
      ...cloneDeep(sliderOptions),
      ...metadata
    }
  }

  get sliderValue() {
    return parseInt(this.value, 10);
  }

  updateValue(value: number) {
    this.emitInput(value.toString());
  }
}
