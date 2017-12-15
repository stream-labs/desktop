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

  @Prop()
  valueBox: boolean;

  @Prop()
  dotSize: number;

  @Prop()
  sliderStyle: object;

  @throttle(500)
  updateValue(value: number) {
    this.$emit('input', this.roundNumber(value));
  }

  handleKeydown(event: KeyboardEvent) {
    if (event.code === 'ArrowUp') this.updateValue(this.value + this.interval);
    if (event.code === 'ArrowDown') this.updateValue(this.value - this.interval);
  }

  // Javascript precision is weird
  roundNumber(num: number) {
    return parseFloat(num.toFixed(6));
  }

}
