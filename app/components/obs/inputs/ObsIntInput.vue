<template>
<h-form-group :title="value.showDescription !== false ? value.description : null">
  <number-input :value="value.value" @input="updateValue" :metadata="metadata" />
</h-form-group>
</template>

<script lang="ts" src="./ObsIntInput.vue.ts"></script>
