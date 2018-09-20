<template>
  <div>

    <div v-if="customFields">
      <div v-if="isEditMode">
        <code-input :metadata="{ type: 'js' }" v-model="editorInputValue"/>
      </div>
      <div v-else>
        <h-form-group
          v-for="inputData in inputsData"
          v-if="inputData.metadata"
          :key="inputData.fieldName"
          v-model="customFields[inputData.fieldName].value"
          :metadata="inputData.metadata"
        />
      </div>
    </div>
    <div v-else>
      {{ $t('No fields added')}}
    </div>

    <div class="modal-layout-controls">

      <button
        class="button button--action"
        v-if="!customFields"
        @click="addDefaultFields()"
      >
        {{ $t('Add Custom Fields') }}
      </button>

      <button
        class="button button--default left-button button--action"
        v-if="customFields && !isEditMode"
        @click="removeFields()"
      >
        {{ $t('Remove Custom Fields') }}
      </button>

      <button
        class="button button--action"
        v-if="customFields && !isEditMode"
        @click="showJsonEditor()"
      >
        {{ $t('Update') }}
      </button>

      <button
        class="button button--default"
        v-if="isEditMode"
        @click="closeJsonEditor()">
        {{ $t('Cancel') }}
      </button>

      <button
          class="button button--action"
          v-if="isEditMode"
          @click="closeJsonEditor(true)">
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
