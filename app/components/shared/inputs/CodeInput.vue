<template>
  <div>
    <Textarea></Textarea>
  </div>
</template>

<script lang="ts" src="./CodeInput.vue.ts"></script>

<style lang="less">
  @import '~codemirror/theme/xq-light.css';
  @import '~codemirror/theme/material.css';
  @import '~codemirror/lib/codemirror.css';

  .CodeMirror {
    font-size: 10pt;
    height: auto;
  }

</style>
