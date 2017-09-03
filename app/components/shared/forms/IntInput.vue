<template>
<div class="input-container IntInput" :class="{disabled: value.enabled == false}">
  <div class="input-label">
    <label>{{ value.description }}</label>
  </div>
  <div class="input-wrapper">
    <div class="int-input">
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
          <i class="fa fa-chevron-up"></i>
        </div>
        <div class="arrow arrow-down" @click="decrement">
          <i class="fa fa-chevron-down"></i>
        </div>
      </div>
    </div>
  </div>
</div>
</template>

<script lang="ts">
import { Component, Prop } from 'vue-property-decorator';
import { IFormInput, TObsType, Input } from './Input';

@Component
class IntInput extends Input<IFormInput<number>> {

  static obsType: TObsType[];

  @Prop()
  value: IFormInput<number>;

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
    event.preventDefault();
  }

}

IntInput.obsType = ['OBS_PROPERTY_INT', 'OBS_PROPERTY_UINT'];

export default IntInput;
</script>

<style lang="less">
@import "../../../styles/index";

.int-input {
  position: relative;

  .arrows {
    .absolute(0, 8px, 0, auto);
    width: 30px;
    color: @grey;
    opacity: .7;
    cursor: pointer;
    .transition;

    &:hover {
      opacity: 1;
    }

    .arrow {
      display: flex !important;

      .fa {
        position: relative;
        font-size: 9px;
      }

      &:active {
        color: black;
      }

      &.arrow-up {
        .absolute(6px, 0px, auto, auto);
      }

      &.arrow-down {
        .absolute(auto, 0px, 6px, auto);
      }
    }
  }
}
</style>
