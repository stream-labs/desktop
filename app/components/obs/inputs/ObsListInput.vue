<template>
<input-wrapper :title="value.showDescription !== false ? value.description : null">
  <list-input
    :value="value.value"
    :metadata="metadata"
    @input="onInputHandler"
    @search-change="onSearchChange"
  />
</input-wrapper>
</template>

<script lang="ts" src="./ObsListInput.vue.ts"></script>
