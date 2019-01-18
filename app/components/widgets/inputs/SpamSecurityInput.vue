<template>
  <slider-input :metadata="spamMetadata" :value="localValue" @input="value => updateLocalValue(value)" />
</template>

<script lang="ts" src="./SpamSecurityInput.vue.ts"></script>
