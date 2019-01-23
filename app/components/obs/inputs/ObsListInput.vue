<template>
<h-form-group :title="value.showDescription !== false ? value.description : null">
  <list-input
    :value="value.value"
    :metadata="metadata"
    @input="onInputHandler"
    @search-change="onSearchChange"
  />
</h-form-group>
</template>

<script lang="ts" src="./ObsListInput.vue.ts"></script>
