import Vue from 'vue';
import VueSlider from 'vue-slider-component';
import { Component, Prop } from 'vue-property-decorator';
import ResizeSensor from 'css-element-queries/src/ResizeSensor';
import { debounce } from 'lodash-decorators';

@Component({
  components: { VueSlider }
})
export default class SliderInput extends Vue {
  @Prop() value: number;
  @Prop() min: number;
  @Prop() max: number;
  @Prop() interval: number;
  @Prop() disabled: boolean;
  @Prop() tooltip: string;
  @Prop() valueBox: boolean;
  @Prop() dotSize: number;
  @Prop() sliderStyle: object;
  @Prop() usePercentages: boolean;

  $refs: { slider: any };

  mounted() {
    // Hack to prevent transitions from messing up slider width
    setTimeout(() => {
      this.onResizeHandler();
    }, 500);

    new ResizeSensor(this.$el, () => {
      this.onResizeHandler();
    });
  }

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

  formatter(value: number) {
    let formattedValue = String(value);
    if (this.usePercentages) formattedValue = Math.round(value * 100) + '%';
    return formattedValue;
  }

  @debounce(500)
  private onResizeHandler() {
    if (this.$refs.slider) this.$refs.slider.refresh();
  }
}
