<template>
<div class="input-container" :class="{disabled: value.enabled == false}">
  <div class="input-label">
  </div>
  <div class="input-wrapper">
    <div class="checkbox">
      <input
        type="checkbox"
        :checked="value.value"
        :disabled="value.enabled == false"
        @change="onChangeHandler"
      />
      <label><span v-if="value.showDescription !== false">{{ value.description }}</span></label>
    </div>
  </div>
</div>
</template>

<script lang="ts" src="./BoolInput.vue.ts"></script>
