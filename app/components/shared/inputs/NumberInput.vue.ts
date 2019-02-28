import { Component, Prop, Watch } from 'vue-property-decorator';
import { BaseInput } from './BaseInput';
import { INumberMetadata } from './index';

@Component({
  watch: {
    value(value) {
      // @ts-ignore
      this.handleInput(value);
    },
  },
})
export default class NumberInput extends BaseInput<number | string, INumberMetadata> {
  @Prop()
  readonly value: number | string; // the string type is for empty field

  @Prop()
  readonly metadata: INumberMetadata;

  $refs: {
    input: HTMLInputElement;
  };

  displayValue: number | string = this.value;

  timeout: number;

  async emitInput(value: string) {
    let formattedValue = value;
    if (isNaN(Number(formattedValue))) formattedValue = '0';
    if (formattedValue !== value) this.displayValue = formattedValue;
    await this.$nextTick(); // VeeValidate requires UI to be updated before errors checking
    super.emitInput(Number(formattedValue));
  }

  private updateValue(value: string) {
    const formattedValue = String(isNaN(parseInt(value, 10)) ? 0 : parseInt(value, 10));
    this.displayValue = formattedValue;
    this.emitInput(formattedValue);
  }

  private updateDecimal(value: string) {
    this.displayValue = value;
    this.emitInput(value);
  }

  handleInput(value: string) {
    this.displayValue = value;
    if (this.options.isInteger) {
      this.updateValue(value);
    } else {
      this.updateDecimal(value);
    }
  }

  increment() {
    if (this.options.disabled) return;
    if (this.options.max !== void 0 && Number(this.displayValue) >= this.options.max) return;
    this.updateValue(String(Number(this.displayValue) + 1));
  }

  decrement() {
    if (this.options.disabled) return;
    if (this.options.min !== void 0 && Number(this.displayValue) <= this.options.min) return;
    this.updateValue(String(Number(this.displayValue) - 1));
  }

  onMouseWheelHandler(event: WheelEvent) {
    const canChange =
      (event.target !== this.$refs.input || this.$refs.input === document.activeElement) &&
      this.options.isInteger &&
      !this.options.disabled;
    if (!canChange) return;
    if (event.deltaY > 0) this.decrement();
    else this.increment();
    event.preventDefault();
  }

  getValidations() {
    return {
      ...super.getValidations(),
      max_value: this.options.max,
      min_value: this.options.min,
    };
  }
}
