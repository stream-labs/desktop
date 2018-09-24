<template>
  <div>
    <codemirror
        :value="value"
        :options="editorOptions[metadata.type]"
        @input="value => emitInput(value)"
    />
  </div>
</template>

<script lang="ts" src="./CodeInput.vue.ts"></script>

<style lang="less">
  @import '~codemirror/theme/material.css';
  @import '~codemirror/lib/codemirror.css';
  .CodeMirror {
    font-size: 10pt;
    min-height: 371px;
  }
</style>
