<template>
<h-form-group :title="value.showDescription !== false ? value.description : null">
  <list-input :value="currentValue" @input="onInputHandler" @searchChange="onSearchChange" :metadata="metadata" />
</h-form-group>
</template>

<script lang="ts" src="./ObsResolutionInput.vue.ts"></script>
