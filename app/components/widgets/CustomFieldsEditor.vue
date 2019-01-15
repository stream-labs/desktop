<template>
  <div>
    <div class="toolbar">
      <i class="icon-edit" v-if="customFields && !isEditMode" @click="showJsonEditor()" v-tooltip="$t('Edit')" />
      <i class="icon-save" v-if="isEditMode" @click="closeJsonEditor(true)" v-tooltip="$t('Save')" />
      <i class="icon-close" v-if="isEditMode" @click="closeJsonEditor()" v-tooltip="$t('Cancel')" />
      <i class="icon-add" v-if="!customFields" @click="addDefaultFields()" v-tooltip="$t('Add Custom Fields')" />
      <i class="icon-trash" v-if="customFields" @click="removeFields()" v-tooltip="$t('Remove Custom Fields')" />
    </div>
    <div v-if="customFields && isEditMode">
      <code-input :metadata="{ type: 'js' }" v-model="editorInputValue"/>
    </div>
    <div class="custom-fields-container" v-else-if="customFields && !isEditMode">
      <h-form-group
        v-for="inputData in inputsData"
        v-if="inputData.metadata"
        :key="inputData.fieldName"
        v-model="customFields[inputData.fieldName].value"
        :metadata="inputData.metadata"
      />
    </div>
    <div class="custom-fields-container" v-else>
      {{ $t('No fields added')}}
    </div>
  </div>
</template>

<script lang="ts" src="./CustomFieldsEditor.vue.ts"></script>

<style lang="less" scoped>
  @import '../../styles/index';

  .toolbar {
    height: 32px;
    padding-top: 8px;
    border-bottom: 1px solid @day-border;
    display: flex;

    i {
      font-size: 16px;
      margin-left: 16px;

      &:hover {
        cursor: pointer;
      }
    }
  }

  .custom-fields-container {
    padding: 16px;
  }

  .night-theme {
    .toolbar {
      border-color: @night-slider-bg;
    }
  }
</style>
