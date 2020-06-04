<template>
<input-wrapper :title="value.description">
  <div style="display: flex;">
    <text-area-input v-if="value.multiline" :value="value.value" @input="onInputHandler" :metadata="metadata" />
    <text-input v-else :value="value.value" @input="onInputHandler" :metadata="metadata" />
    <slot></slot>
  </div>
</input-wrapper>
</template>

<script lang="ts" src="./ObsTextInput.vue.ts"></script>
