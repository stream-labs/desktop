<template>
  <span class="text-area-container" :class="{ 'full-width': options.fullWidth }" >
    <textarea
      type="text"
      :placeholder="options.placeholder"
      :value="value"
      @input="emitInput($event.target.value)"
      class="text-area radius"
      :class="{ 'full-width': options.fullWidth  }"
      :name="uuid"
      :disabled="metadata.disabled"
      :rows="metadata.rows || 2"
      v-validate="validate"
    />
    <span class="input-error" v-show="errors.first(uuid)">
      {{ errors.first(uuid) }}
    </span>
  </span>
</template>

<script lang="ts" src="./TextAreaInput.vue.ts"></script>

<style lang="less" scoped>
@import "../../../styles/index";

.text-area-container.full-width,
.text-area.full-width {
  width: 100%;
}

.night-theme {
  .text-area:focus {
    background-color: @night-hover;
    border-color: @teal-light-opac;
  }
}
</style>

