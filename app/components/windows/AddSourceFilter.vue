<template>
  <modal-layout
    title="Add layer filter"
    :done-handler="done"
    :cancel-handler="cancel"
  >

    <div slot="content">
      <ListInput v-model="form.type" @input="setTypeAsName"></ListInput>
      <TextInput v-model="form.name"></TextInput>
      <p v-if="error" style="color: red">
        {{ error }}
      </p>

    </div>

  </modal-layout>
</template>

<script lang="ts" src="./AddSourceFilter.vue.ts"></script>
