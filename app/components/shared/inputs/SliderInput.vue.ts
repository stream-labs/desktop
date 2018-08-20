import VueSlider from 'vue-slider-component';
import { throttle } from 'lodash-decorators';
import { Component, Prop } from 'vue-property-decorator';
import { BaseInput } from './BaseInput';
import { CustomizationService } from '../../../services/customization';
import { Inject } from '../../../util/injector';
import { ISliderMetadata } from './index';

@Component({
  components: { VueSlider }
})
export default class SliderInput extends BaseInput<number, ISliderMetadata>  {
  @Inject() customizationService: CustomizationService;

  @Prop() readonly value: number;
  @Prop() readonly metadata: ISliderMetadata;

  usePercentages: boolean;
  interval: number;

  $refs: { slider: any };

  mounted() {

    // setup defaults
    this.interval = this.options.interval || 1;
    this.usePercentages = this.options.usePercentages || false;

    // Hack to prevent transitions from messing up slider width
    setTimeout(() => {
      if (this.$refs.slider) this.$refs.slider.refresh();
    }, 500);
  }

  @throttle(500)
  updateValue(value: number) {
    this.$emit('input', this.roundNumber(value));
  }

  get nightMode() {
    return this.customizationService.nightMode;
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
}
