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
      <i class="icon-check" @click.stop="submitRename" />
      <i class="icon-times" @click.stop="cancelRename" v-if="!needsRename" />
    </div>
    <div v-else>
      {{ collection.name }}
    </div>
  </span>
  <span
    class="editable-scene-collection--active"
    v-if="isActive">
    {{ $t('scenes.activeSceneCollection') }}
  </span>
  <span class="editable-scene-collection--modified flex--grow">
    {{ $t('scenes.sceneCollectionModified', { when: modified }) }}
  </span>
  <a class="editable-scene-collection--action link link--underlined">
    <span @click.stop="startRenaming">{{ $t('common.rename') }}</span>
  </a>
  <a v-if="!duplicating" class="editable-scene-collection--action link link--underlined">
    <span @click.stop="duplicate">{{ $t('common.duplicate') }}</span>
  </a>
  <i class="icon-spinner icon-spin" v-else />
  <a class="editable-scene-collection--action editable-scene-collection--action-delete link link--underlined">
    <span @click.stop="remove">{{ $t('common.delete') }}</span>
  </a>
</div>
</template>

<script lang="ts" src="./EditableSceneCollection.vue.ts"></script>

<style lang="less" scoped>
@import "../styles/_colors";
@import "../styles/mixins";

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
    background: @hover;

    .editable-scene-collection--action {
      display: inline;
    }
  }
}

.editable-scene-collection--active {
  font-size: 12px;
  color: @accent;
}

.editable-scene-collection--action {
  display: none;
}

.editable-scene-collection--action-delete {
  color: @red;
}

.editable-scene-collection--name {
  max-width: 230px;
  color: @white;

  >div {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  input {
    font-size: 14px;
    width: 250px;
    background: transparent;
  }
}

.editable-scene-collection--modified {
  font-size: 12px;
}

.icon-spin {
  animation: icon-spin 2s infinite linear;
}

@keyframes icon-spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(359deg);
  }
}

</style>
