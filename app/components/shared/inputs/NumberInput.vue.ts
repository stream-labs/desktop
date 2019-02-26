import { Component, Prop } from 'vue-property-decorator';
import { BaseInput } from './BaseInput';
import { INumberMetadata } from './index';

@Component({})
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

  emitInput(value: string) {
    let formattedValue = value;
    if (isNaN(Number(formattedValue))) formattedValue = '0';
    if (formattedValue !== value) this.displayValue = formattedValue;
    super.emitInput(Number(formattedValue));
  }

  updateValue(value: string) {
    let formattedValue = String(isNaN(parseInt(value, 10)) ? 0 : parseInt(value, 10));
    formattedValue = this.constrainValue(formattedValue);
    this.displayValue = formattedValue;
    // TODO: Remove early return and re-implement proper validations
    if (this.timeout) return;
    this.emitInput(formattedValue);
  }

  updateDecimal(value: string) {
    const formattedValue = this.constrainValue(value);
    this.displayValue = formattedValue;
    // TODO: Remove early return and re-implement proper validations
    if (this.timeout) return;
    this.emitInput(formattedValue);
  }

  constrainValue(value: string) {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }

    if (this.options.min !== void 0 && Number(value) < this.options.min) {
      this.timeout = window.setTimeout(() => this.updateValue(`${this.options.min}`), 1000);
    }

    if (this.options.max !== void 0 && Number(value) > this.options.max) {
      return String(this.options.max);
    }

    return value;
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
    this.updateValue(String(Number(this.displayValue) + 1));
  }

  decrement() {
    if (this.options.disabled) return;
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
