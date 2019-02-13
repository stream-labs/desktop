import { Component, Prop } from 'vue-property-decorator';
import { BaseInput } from './BaseInput';
import { INumberMetadata } from './index';
import { Debounce } from 'lodash-decorators';

@Component({})
export default class NumberInput extends BaseInput<number | string, INumberMetadata> {
  @Prop()
  readonly value: number | string; // the string type is for empty field

  @Prop()
  readonly metadata: INumberMetadata;

  $refs: {
    input: HTMLInputElement;
  };

  emitInput(value: string) {
    let formattedValue = value;
    if (isNaN(Number(formattedValue))) formattedValue = '0';
    if (formattedValue !== value) this.$refs.input.value = formattedValue;
    super.emitInput(Number(formattedValue));
  }

  updateValue(value: string) {
    let formattedValue = String(isNaN(parseInt(value, 10)) ? 0 : parseInt(value, 10));

    if (this.options.min !== void 0 && Number(value) < this.options.min) {
      formattedValue = String(this.options.min);
    }

    if (this.options.max !== void 0 && Number(value) > this.options.max) {
      formattedValue = String(this.options.max);
    }

    if (formattedValue !== value) {
      this.$refs.input.value = formattedValue;
    }
    this.emitInput(formattedValue);
  }

  handleInput(value: string) {
    if (this.options.isInteger) {
      this.updateValue(value);
    } else {
      this.emitInput(value);
    }
  }

  increment() {
    this.updateValue(String(Number(this.$refs.input.value) + 1));
  }

  decrement() {
    this.updateValue(String(Number(this.$refs.input.value) - 1));
  }

  onMouseWheelHandler(event: WheelEvent) {
    const canChange =
      (event.target !== this.$refs.input || this.$refs.input === document.activeElement) &&
      this.options.isInteger;
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
