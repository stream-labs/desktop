import VueSlider from 'vue-slider-component';
import { throttle } from 'lodash-decorators';
import { Component, Prop } from 'vue-property-decorator';
import { BaseInput } from './BaseInput';
import { CustomizationService } from '../../../services/customization';
import { Inject } from '../../../services/core/injector';
import { ISliderMetadata } from './index';

@Component({
  components: { VueSlider },
})
export default class SliderInput extends BaseInput<number, ISliderMetadata> {
  @Inject() customizationService: CustomizationService;

  @Prop() readonly value: number;
  @Prop() readonly metadata: ISliderMetadata;

  usePercentages: boolean;
  interval: number;

  mounted() {
    // setup defaults
    this.interval = this.options.interval || 1;
    this.usePercentages = this.options.usePercentages || false;
  }

  @throttle(500)
  updateValue(value: number) {
    this.emitInput(this.roundNumber(value));
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
