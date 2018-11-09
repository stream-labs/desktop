
import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import { BaseInput } from './BaseInput';
import SliderInput from './SliderInput.vue';
import { INumberMetadata } from './index';
import { metadata } from 'components/shared/inputs'

@Component({
  components: {
    SliderInput
  }
})
export default class FontSize extends BaseInput<string, INumberMetadata>{
  @Prop()
  readonly value: string;

  @Prop()
  readonly metadata: INumberMetadata;

  sliderOptions = metadata.slider({min: 8, max: 144, ...this.options as {min : number; max: number}});

  get sliderValue() {
    return parseInt(this.value, 10);
  }

  updateValue(value: number) {
    this.emitInput(value.toString());
  }
}
