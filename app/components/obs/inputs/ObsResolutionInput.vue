<template>
  <div>
    <h-form-group :title="value.showDescription !== false ? value.description : null">
      <list-input
        :value="value.value"
        @input="onSelectHandler"
        @search-change="onSearchHandler"
        :metadata="metadata"
      />
    </h-form-group>
  </div>
</template>

<script lang="ts" src="./ObsResolutionInput.vue.ts"></script>
