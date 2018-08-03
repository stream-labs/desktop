<template>
  <image-picker :value="value" :metadata="meta" @input="value => emitInput(value)" />
</template>

<script lang="ts" src="./ImageLayout.vue.ts"></script>
