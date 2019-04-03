<template>
<div class="editable-scene-collection flex flex--center flex--justify-start" @dblclick="makeActive">
  <span class="editable-scene-collection--name">
    <div v-if="renaming" class="flex flex--center flex--justify-start">
      <input
        ref="rename"
        class="input--transparent"
        type="text"
        @keypress="handleKeypress"
        v-model="editableName" />
      <i class="fa fa-check" @click.stop="submitRename" />
      <i class="icon-times" @click.stop="cancelRename" v-if="!needsRename" />
    </div>
    <div v-else>
      {{ collection.name }}
    </div>
  </span>
  <span
    class="editable-scene-collection--active"
    v-if="isActive">
    Active
  </span>
  <span class="editable-scene-collection--modified flex--grow">
    Updated {{ modified }}
  </span>
  <a class="editable-scene-collection--action">
    <span @click.stop="startRenaming">{{ $t('Rename') }}</span>
  </a>
  <a v-if="!duplicating" class="editable-scene-collection--action">
    <span @click.stop="duplicate">{{ $t('Duplicate') }}</span>
  </a>
  <i class="fa fa-spinner fa-pulse" v-else />
  <a class="editable-scene-collection--action editable-scene-collection--action-delete">
    <span @click.stop="remove">{{ $t('Delete') }}</span>
  </a>
</div>
</template>

<script lang="ts" src="./EditableSceneCollection.vue.ts"></script>

<style lang="less" scoped>
@import "../styles/index";

.editable-scene-collection {
  height: 35px;
  padding: 5px;
  .radius;
  font-size: 14px;
  cursor: pointer;

  span, a, input, i {
    margin-right: 8px;
  }

  &:hover {
    background: var(--hover);

    .editable-scene-collection--action {
      display: inline;
    }
  }
}

.editable-scene-collection--active {
  font-size: 12px;
  color: var(--teal);
}

.editable-scene-collection--action {
  display: none;
}

.editable-scene-collection--action-delete {
  color: var(--warning);
}

.editable-scene-collection--name {
  max-width: 230px;
  color: var(--title);

  >div {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  input {
    font-size: 14px;
    width: 250px;
  }
}

.editable-scene-collection--modified {
  font-size: 12px;
}
</style>
