import VueSlider from 'vue-slider-component';
import { debounce } from 'lodash-decorators';
import { Component, Prop } from 'vue-property-decorator';
import { BaseInput } from './BaseInput';
import { CustomizationService } from 'services/customization';
import ResizeSensor from 'css-element-queries/src/ResizeSensor';
import { Inject } from 'util/injector';
import { ISliderMetadata } from './index';
import { isString } from 'util';

@Component({
  components: { VueSlider },
})
export default class SliderInput extends BaseInput<number, ISliderMetadata> {
  @Inject() customizationService: CustomizationService;

  @Prop() readonly value: number;
  @Prop() readonly metadata: ISliderMetadata;

  usePercentages: boolean;
  interval: number;
  isFullyMounted = false;

  // The displaying value on and within the ui components.
  localValue: number | string = this.value || 0;

  $refs: { slider: any };

  mounted() {
    // setup defaults
    this.interval = this.options.interval || 1;
    this.usePercentages = this.options.usePercentages || false;

    // Hack to prevent transitions from messing up slider width
    setTimeout(() => this.onResizeHandler(), 500);
    new ResizeSensor(this.$el, () => this.onResizeHandler());
  }

  /**
   * Updates the local value that is used during the display processs.
   * @param value The value that will be displayed on the interface.
   */
  updateLocalValue(value: number) {
    const parsedValue = Number(value);

    // Dislay a empty string if and only if the user deletes all of the input field.
    if ((isNaN(parsedValue) && isString(value)) || (isString(value) && value === '')) {
      // preview only, when there is no input or just a negative symbol.
      this.localValue = value.trim() !== '-' ? '' : value;
    } else if (value != null && !isNaN(value)) {
      // Otherwise use the provided number value.
      this.localValue = parsedValue;
      this.updateValue(parsedValue);
    }
  }

  @debounce(100)
  updateValue(value: number) {
    if (isNaN(Number(value))) {
      this.emitInput(value);
    } else {
      this.emitInput(this.roundNumber(value));
    }
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
    if (this.usePercentages) formattedValue = `${Math.round(value * 100)}%`;
    return formattedValue;
  }

  @debounce(500)
  private onResizeHandler() {
    if (this.$refs.slider) this.$refs.slider.refresh();
  }
}
