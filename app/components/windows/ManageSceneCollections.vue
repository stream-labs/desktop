<template>
<modal-layout
  title="Manage Scene Collections"
  :show-cancel="false"
  :done-handler="close">
  <div slot="content">
    <div class="manage-scene-collections--new" @click="create">
      <i class="fa fa-plus" />
      Create New
    </div>
    <editable-scene-collection
      v-for="collection in collections"
      :key="collection.id"
      :collection-id="collection.id"/>
  </div>
</modal-layout>
</template>

<script lang="ts" src="./ManageSceneCollections.vue.ts"></script>

<style lang="less" scoped>
@import "../../styles/index";

.manage-scene-collections--new {
  font-size: 14px;
  height: 35px;
  padding: 5px;
  cursor: pointer;

  &:hover {
    background: @day-hover;
  }
}

.night-theme {
  .manage-scene-collections--new {
    &:hover {
      background: @night-hover;
    }
  }
}
</style>
