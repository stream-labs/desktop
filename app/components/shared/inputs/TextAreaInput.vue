<template>
  <span
    class="text-area-container"
    :class="{ 'full-width': options.fullWidth }"
    data-role="input"
    data-type="textArea"
    :data-name="options.name"
  >
    <textarea
      type="text"
      :placeholder="options.placeholder"
      :value="value"
      @input="handleInput"
      class="text-area radius"
      :class="{ 'full-width': options.fullWidth  }"
      :name="options.uuid"
      :disabled="metadata.disabled"
      :rows="metadata.rows || 2"
      v-validate="validate"
      @keydown.enter="handleEnter"
    />
  </span>
</template>

<script lang="ts" src="./TextAreaInput.vue.ts"></script>

<style lang="less" scoped>
@import "../../../styles/index";

.text-area-container.full-width,
.text-area.full-width {
  width: 100%;
}

.text-area:focus {
  background-color: var(--hover);
}
</style>

