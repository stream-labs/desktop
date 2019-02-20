<template>
<div :data-test="testingAnchor" class="input-container IntInput" :class="{disabled: value.enabled == false}">
  <div class="input-label">
    <label v-if="value.showDescription !== false">{{ value.description }}</label>
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
          <i class="icon-up-arrow"></i>
        </div>
        <div class="arrow arrow-down" @click="decrement">
          <i class="icon-down-arrow"></i>
        </div>
      </div>
    </div>
  </div>
</div>
</template>

<script lang="ts" src="./IntInput.vue.ts"></script>

<style lang="less">
@import "../../../styles/_colors";
@import "../../../styles/mixins";

.int-input {
  position: relative;

  .arrows {
    .absolute(0, 8px, 0, auto);
    width: 30px;
    color: @text-primary;
    opacity: .7;
    cursor: pointer;
    .transition;

    &:hover {
      opacity: 1;
    }

    .arrow {
      display: flex !important;

      i {
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
