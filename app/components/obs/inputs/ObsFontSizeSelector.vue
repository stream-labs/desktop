<template>
<h-form-group :title="$t('Font Size')">
  <slider-input :value="value" @input="val => setFontSizePreset(val)" :metadata="metadata" />
</h-form-group>
</template>

<script lang="ts" src="./ObsFontSizeSelector.vue.ts"></script>
