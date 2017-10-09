<template>
<modal-layout
  :title="windowTitle"
  :done-handler="done"
  :cancel-handler="cancel"
  :fixedSectionHeight="200">
  <SourcePreview slot="fixed" v-if="source" :sourceName="source.name"></SourcePreview>
  <div slot="content">
    <GenericForm v-model="properties" @input="onInputHandler"/>
  </div>
</modal-layout>
</template>

<script lang="ts" src="./SourceProperties.vue.ts"></script>
