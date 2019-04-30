import { debounce } from 'lodash-decorators';
import { Component, Prop, Watch } from 'vue-property-decorator';
import { Slider } from 'streamlabs-beaker';
import { BaseInput } from './BaseInput';
import { CustomizationService } from 'services/customization';
import ResizeSensor from 'css-element-queries/src/ResizeSensor';
import { Inject } from 'util/injector';
import { ISliderMetadata } from './index';
import { isString } from 'util';

@Component({
  components: { Slider },
})
export default class SliderInput extends BaseInput<number, ISliderMetadata> {
  @Inject() customizationService: CustomizationService;

  @Prop() readonly value: number;
  @Watch('value')
  private syncLocalValue(newVal: number) {
    this.localValue = this.usePercentages ? newVal * 100 : newVal;
  }

  @Prop() readonly title: string;
  @Prop() readonly metadata: ISliderMetadata;

  usePercentages: boolean = false;
  interval: number;
  isFullyMounted = false;

  // The displaying value on and within the ui components.
  localValue: number | string = this.value || 0;

  $refs: { slider: any };

  mounted() {
    // setup defaults
    this.interval = this.options.interval || 1;
    this.usePercentages = this.options.usePercentages || false;
    this.localValue = this.usePercentages ? this.value * 100 : this.value;

    console.log(this.max);

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
    } else if (value != null && !isNaN(value) && this.localValue !== parsedValue) {
      // Otherwise use the provided number value if it has changed
      this.localValue = parsedValue;
      this.updateValue(parsedValue);
    }
  }

  get max() {
    return this.usePercentages ? this.options.max * 100 : this.options.max;
  }

  @debounce(100)
  updateValue(value: number) {
    if (isNaN(Number(value))) {
      this.emitInput(value);
    } else {
      this.emitInput(this.roundNumber(value));
    }
  }

  get sliderColor() {
    return {
      'night-theme': '#253239',
      'day-theme': '#eaecee',
    };
  }

  get theme() {
    return this.customizationService.currentTheme;
  }

  handleKeydown(event: KeyboardEvent) {
    if (event.code === 'ArrowUp') this.updateValue(this.value + this.interval);
    if (event.code === 'ArrowDown') this.updateValue(this.value - this.interval);
  }

  // Javascript precision is weird
  roundNumber(num: number) {
    const val = this.usePercentages ? num / 100 : num;
    return parseFloat(val.toFixed(6));
  }

  @debounce(500)
  private onResizeHandler() {
    if (this.$refs.slider) this.$refs.slider.refresh();
  }
}
