<template>
  <div class="input-container">
    <div class="input-label">
    </div>
    <div class="input-wrapper">
      <button
        class="button button--action button-property-button"
        @click="handleClick">
        {{ value.description }}
      </button>
    </div>
  </div>
</template>

<script lang="ts" src="./ButtonInput.vue.ts"></script>
