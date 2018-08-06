<template>
  <div>

    <div v-if="hasCustomFields">
      <div v-if="isEditMode">
        <code-input :metadata="{ type: 'js' }" v-model="editorInputValue"/>
      </div>
      <div v-else>
        <form-group
          v-for="inputData in inputsData"
          v-if="inputData.metadata"
          :key="inputData.fieldName"
          :value="inputData.value"
          :metadata="inputData.metadata"
        />
      </div>
    </div>
    <div v-else>
      <button
        class="button"
        @click="addFields()">
        {{ $t('Add Custom Fields') }}
      </button>
    </div>

    <div class="modal-layout-controls">
      <button class="button button--default left-button button--action"  v-if="hasCustomFields" @click="removeFields()">
        {{ $t('Remove Custom Fields') }}
      </button>

      <button
        class="button left-button button--action"
        v-if="!isEditMode"
        @click="setEditMode(true)"
      >
        {{ $t('Update') }}
      </button>

      <button
          class="button"
          :class="{'button--action': canSave, 'is-disabled': !canSave }"
          @click="canSave && save()">
        {{ $t('Save') }}
      </button>
    </div>

  </div>
</template>

<script lang="ts" src="./CustomFieldsEditor.vue.ts"></script>
<style lang="less" scoped>

  @import '../../styles/index';

  .modal-layout-controls {
    position: fixed;
    width: 100%;
    left: 0;
    bottom: 0;
    background-color: @day-secondary;
    border-top: 1px solid @day-border;
    padding: 10px 20px;
    text-align: right;
    flex-shrink: 0;
    z-index: 11;

    .button {
      margin-left: 8px;
    }
  }

  .left-button {
    float: left;
  }

  .night-theme {

    .modal-layout-controls {
      border-top-color: @night-border;
      background-color: @night-primary;
    }
  }

</style>
