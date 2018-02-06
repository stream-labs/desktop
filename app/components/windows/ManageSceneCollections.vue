<template>
<modal-layout
  title="Manage Scene Collections"
  :show-cancel="false"
  :done-handler="close">
  <div slot="content">
    <editable-scene-collection
      v-for="collection in collections"
      :key="collection.id"
      :collection-id="collection.id"/>
  </div>
</modal-layout>
</template>

<script lang="ts" src="./ManageSceneCollections.vue.ts"></script>
