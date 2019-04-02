<template>
  <span class="text-area-container" :class="{ 'full-width': options.fullWidth }" >
    <textarea
      v-if="options.blockReturn"
      type="text"
      :placeholder="options.placeholder"
      :value="value"
      @input="handleInput"
      class="text-area radius"
      :class="{ 'full-width': options.fullWidth  }"
      :name="uuid"
      :disabled="metadata.disabled"
      :rows="metadata.rows || 2"
      v-validate="validate"
      @keydown.enter.prevent
    />
    <textarea
      v-else
      type="text"
      :placeholder="options.placeholder"
      :value="value"
      @input="handleInput"
      class="text-area radius"
      :class="{ 'full-width': options.fullWidth  }"
      :name="uuid"
      :disabled="metadata.disabled"
      :rows="metadata.rows || 2"
      v-validate="validate"
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

