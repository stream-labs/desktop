<template>
<div class="IntInput" :class="{disabled: value.enabled == false}">
  <label>{{ value.description }}</label>
  <input
    ref="input"
    type="text"
    :value="value.value"
    @mousewheel="onMouseWheelHandler"
    :disabled="value.enabled == false"
    @input="updateValue($event.target.value)"
  />
  <div class="arrows" @mousewheel="onMouseWheelHandler">
    <div class="arrow arrow-up" @click="increment">
      <i class="fa fa-sort-up"></i>
    </div>
    <div class="arrow arrow-down" @click="decrement">
      <i class="fa fa-sort-down"></i>
    </div>
  </div>
</div>
</template>

<script lang="ts">
import { Component, Prop } from 'vue-property-decorator';
import { IInputValue, TObsType, Input } from './Input';

@Component
class IntInput extends Input<IInputValue<number>> {

  static obsType: TObsType[];

  @Prop()
  value: IInputValue<number>;

  $refs: {
    input: HTMLInputElement
  };

  updateValue(value: string) {
    let formattedValue = String(isNaN(parseInt(value)) ? 0 : parseInt(value));
    if (this.value.type == 'OBS_PROPERTY_UINT' && Number(formattedValue) < 0) {
      formattedValue = '0';
    }
    if (formattedValue != value) {
      this.$refs.input.value = formattedValue;
    }
    // Emit the number value through the input event
    this.emitInput({ ...this.value, value: Number(formattedValue) });
  }

  increment() {
    this.updateValue(String(Number(this.$refs.input.value) + 1));
  }

  decrement() {
    this.updateValue(String(Number(this.$refs.input.value) - 1));
  }

  onMouseWheelHandler(event: WheelEvent) {
    const canChange = (
      event.target !== this.$refs.input ||
      this.$refs.input === document.activeElement
    );
    if (!canChange) return;
    if (event.deltaY > 0) this.decrement(); else this.increment();
  }
}
IntInput.obsType = ['OBS_PROPERTY_INT', 'OBS_PROPERTY_UINT'];

export default IntInput;

</script>

<style lang="less">
@import "../../../styles/index";

.IntInput {
  position: relative;

  .arrows {
    .absolute(0, 0, 0);
    width: 30px;
    color: @input-border-color;

    .arrow {
      border: 1px solid @input-border-color;
      width: 13px;
      height: 11px;

      &:hover {
        color: fade(black, 60%);
        border-color: fade(black, 60%)
      }

      &:active {
        color: black;
        border-color: black;
      }

      &.arrow-up {
        .absolute(auto, 4px, 20px);
        .fa {
          position: relative;
          top: -2px;
          left: 2px;
        }
      }

      &.arrow-down {
        .absolute(auto, 4px, 4px);
        .fa {
          position: relative;
          top: -7px;
          left: 2px;
        }

      }

    }
  }
}
</style>
