<template>
<h-form-group :title="value.showDescription !== false ? value.description : null">
  <list-input :value="value.value" @input="onInputHandler" @search-change="onSearchChange" :metadata="metadata" />
</h-form-group>
</template>

<script lang="ts" src="./ObsResolutionInput.vue.ts"></script>
