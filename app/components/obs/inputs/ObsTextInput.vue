<template>
<v-form-group :title="value.description">
  <text-area-input v-if="value.multiline" :value="value.value" @input="onInputHandler" :metadata="metadata" />
  <text-input v-else :value="value.value" @input="onInputHandler" :metadata="metadata" />
</v-form-group>
</template>

<script lang="ts" src="./ObsTextInput.vue.ts"></script>
