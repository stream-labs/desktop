import { Component, Prop } from 'vue-property-decorator';
import { TObsType, ObsInput, IObsNumberInputValue } from './ObsInput';
import { Debounce } from 'lodash-decorators';

@Component
class ObsIntInput extends ObsInput<IObsNumberInputValue> {
  static obsType: TObsType[];

  @Prop()
  value: IObsNumberInputValue;

  $refs: {
    input: HTMLInputElement;
  };

  updateValue(value: string, force = false) {
    if (!force && this.value.minVal) {
      // fields with min value don't work well without Debounce
      this.updateValueDebounced(value);
      return;
    }
    let formattedValue = String(isNaN(parseInt(value, 10)) ? 0 : parseInt(value, 10));
    if (this.value.type === 'OBS_PROPERTY_UINT' && Number(formattedValue) < 0) {
      formattedValue = '0';
    }

    if (this.value.minVal !== void 0 && Number(value) < this.value.minVal) {
      formattedValue = String(this.value.minVal);
    }

    if (this.value.maxVal !== void 0 && Number(value) > this.value.maxVal) {
      formattedValue = String(this.value.maxVal);
    }

    if (formattedValue !== value) {
      this.$refs.input.value = formattedValue;
    }
    // Emit the number value through the input event
    this.emitInput({ ...this.value, value: Number(formattedValue) });
  }

  @Debounce(1000)
  updateValueDebounced(value: string) {
    this.updateValue(value, true);
  }

  increment() {
    this.updateValue(String(Number(this.$refs.input.value) + 1));
  }

  decrement() {
    this.updateValue(String(Number(this.$refs.input.value) - 1));
  }

  onMouseWheelHandler(event: WheelEvent) {
    const canChange =
      event.target !== this.$refs.input || this.$refs.input === document.activeElement;
    if (!canChange) return;
    if (event.deltaY > 0) this.decrement();
    else this.increment();
    event.preventDefault();
  }
}

ObsIntInput.obsType = ['OBS_PROPERTY_INT', 'OBS_PROPERTY_UINT'];

export default ObsIntInput;
