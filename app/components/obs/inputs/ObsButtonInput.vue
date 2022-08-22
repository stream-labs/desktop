<template>
  <div :data-test="testingAnchor" class="input-container">
    <div class="input-label">
    </div>
    <div class="input-wrapper">
      <button
        class="button button--primary button-property-button"
        @click="handleClick">
        {{ value.description }}
      </button>
    </div>
  </div>
</template>

<script lang="ts" src="./ObsButtonInput.vue.ts"></script>
