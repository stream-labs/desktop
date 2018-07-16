<template>
  <div>
    <w-bool-input :title="$t('Enable Custom HTML/CSS/JS')" v-model="customEnabled"/>
    <w-code-input v-if="customEnabled" :metadata="{ type: metadata.type }" v-model="editorInputValue"/>

    <div class="modal-layout-controls">
      <button v-if="hasDefaults" class="button button--default restore-button" @click="restoreDefaults">
        {{ $t('Restore Defaults') }}
      </button>
      <button class="button button--default discard-button" @click="discardChanges">
        {{ $t('Discard Changes') }}
      </button>
      <button
          class="button"
          :class="{'button--action': canSave, 'button--disabled': !canSave }"
          @click="canSave && save()">
        {{ $t('Save') }}
      </button>
    </div>

  </div>
</template>

<script lang="ts" src="./WCodeEditor.vue.ts"></script>
<style lang="less" scoped>

  @import '../../../styles/index';

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

  .restore-button,
  .discard-button {
    float: left;
  }

  .night-theme {

    .modal-layout-controls {
      border-top-color: @night-border;
      background-color: @night-primary;
    }
  }

</style>