<template>
  <div>
    <div class="toolbar">
      <i class="icon-reset" v-tooltip="$t('Restore Defaults')" @click="restoreDefaults" />
    </div>
    <code-input
      v-if="value.settings.custom_enabled || selectedVariation.settings.customHtmlEnabled"
      @input="save()"
      :metadata="{ type: metadata.type }"
      v-model="editorInputValue"
    />
  </div>
</template>

<script lang="ts" src="./CodeEditor.vue.ts"></script>

<style lang="less" scoped>
  @import '../../styles/index';

  .toolbar {
    height: 32px;
    padding-top: 8px;
    border-bottom: 1px solid var(--border);

    i {
      font-size: 16px;
      margin-left: 16px;

      &:hover {
        cursor: pointer;
      }
    }
  }
</style>
