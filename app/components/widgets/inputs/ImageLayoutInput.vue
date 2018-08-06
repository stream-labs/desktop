<template>
  <image-picker-input :value="value" :metadata="meta" @input="value => emitInput(value)" />
</template>

<script lang="ts" src="./ImageLayoutInput.vue.ts"></script>
