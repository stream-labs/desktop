<template>
  <div>
    <bool-input :title="$t('Enable Custom HTML/CSS/JS')" v-model="customEnabled"/>
    <code-input v-if="customEnabled" :metadata="{ type: metadata.type }" v-model="editorInputValue"/>

    <div class="modal-layout-controls">
      <button v-if="hasDefaults" class="button button--default restore-button" @click="restoreDefaults">
        {{ $t('Restore Defaults') }}
      </button>
      <button
        class="button button--soft-warning discard-button"
        @click="hasChanges && discardChanges()"
        :class="{ 'is-disabled': !hasChanges }"
      >
        {{ $t('Discard Changes') }}
      </button>
      <button
          class="button"
          :class="{'button--action': canSave, 'button--default is-disabled': !canSave }"
          @click="canSave && save()">
        {{ $t('Save') }}
      </button>
    </div>

  </div>
</template>

<script lang="ts" src="./CodeEditor.vue.ts"></script>
<style lang="less" scoped>

  @import '../../styles/index';

  .modal-layout-controls {
    position: fixed;
    width: 100%;
    left: 0;
    bottom: 0;
    background-color: @day-section;
    padding: 10px 20px;
    text-align: right;
    flex-shrink: 0;
    z-index: 11;
  }

  .restore-button,
  .discard-button {
    float: left;
    .margin-right();
  }

  .night-theme {
    .modal-layout-controls {
      background-color: @night-section;
    }
  }

</style>
