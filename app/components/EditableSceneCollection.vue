<template>
<div
  class="editable-scene-collection flex flex--center flex--justify-start"
  :class="{ 'editable-scene-collection--selected': selected }">
  <span class="editable-scene-collection--name">
    <div v-if="renaming">
      <input type="text" v-model="editableName" />
      <i class="fa fa-check" @click="submitRename" />
      <i class="fa fa-times" @click="cancelRename" />
    </div>
    <div v-else>
      {{ collection.name }}
    </div>
  </span>
  <span class="editable-scene-collection--modified">
    Updated {{ modified }}
  </span>
  <a class="editable-scene-collection--action link link--underlined">
    <span @click="startRenaming">Rename</span>
  </a>
  <a class="editable-scene-collection--action editable-scene-collection--action-delete link link--underlined">
    <span>Delete</span>
  </a>
</div>
</template>

<script lang="ts" src="./EditableSceneCollection.vue.ts"></script>

<style lang="less" scoped>
@import "../styles/index";

.editable-scene-collection {
  height: 35px;
  padding: 5px;

  font-size: 14px;
  cursor: pointer;

  >span, >a {
    margin-right: 8px;
  }

  &:hover {
    background: @night-accent-light;

    .editable-scene-collection--action {
      display: inline;
    }
  }
}

.editable-scene-collection--action {
  display: none;
}

.editable-scene-collection--action-delete {
  color: @red;
}

.editable-scene-collection--name {
  color: @white;
}

.editable-scene-collection--modified {
  font-size: 12px;
}
</style>
