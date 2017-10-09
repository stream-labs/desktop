import Vue from 'vue';
import vueSlider from 'vue-slider-component';
import { throttle } from 'lodash-decorators';
import { Component, Prop } from 'vue-property-decorator';

@Component({
  components: { vueSlider }
})
export default class SliderInput extends Vue {

  @Prop()
  value: number;

  @Prop()
  min: number;

  @Prop()
  max: number;

  @Prop()
  interval: number;

  @Prop()
  disabled: boolean;

   @Prop()
  tooltip: string;

  @throttle(100)
  updateValue(value: number) {
    this.$emit('input', value);
  }

}
