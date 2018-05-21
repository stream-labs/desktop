import Vue from 'vue';
import VueSlider from 'vue-slider-component';
import { throttle } from 'lodash-decorators';
import { Component, Prop } from 'vue-property-decorator';

interface IWSlider {
  size: number;
}

@Component({
  components: { VueSlider }
})
export default class SliderInput extends Vue {
  @Prop() value: { value: number };
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
    console.log('wslider state', this);
    // Hack to prevent transitions from messing up slider width
    setTimeout(() => {
      if (this.$refs.slider) this.$refs.slider.refresh();
    }, 500);
  }

//   @throttle(500)
//   updateValue(value: number) {
//     this.$emit('input', this.roundNumber(value));
//   }

//   handleKeydown(event: KeyboardEvent) {
//     if (event.code === 'ArrowUp') this.updateValue(this.value + this.interval);
//     if (event.code === 'ArrowDown') this.updateValue(this.value - this.interval);
//   }

  // Javascript precision is weird
  roundNumber(num: number) {
    return parseFloat(num.toFixed(6));
  }

  formatter(value: number) {
    let formattedValue = String(value);
    if (this.usePercentages) formattedValue = Math.round(value * 100) + '%';
    return formattedValue;
  }
}
