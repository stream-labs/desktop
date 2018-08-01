<template>
  <span>
    <textarea
      type="text"
      :placeholder="options.placeholder"
      :value="value"
      @input="emitInput($event.target.value)"
      class="text-area radius"
      :name="uuid"
      v-validate="validate"
      :style="options.inputStyle"
    />
    <span class="input-error" v-show="errors.first(uuid)">
      {{ errors.first(uuid) }}
    </span>
  </span>
</template>

<script lang="ts" src="./TextAreaInput.vue.ts"></script>

<style lang="less" scoped>
@import "../../../styles/index";

.night-theme {
  .text-area:focus {
    background-color: @night-hover;
    border-color: @teal-light-opac;
  }
}
</style>

