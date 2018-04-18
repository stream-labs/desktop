<template>
<modal-layout
  title="Projector"
  :showControls="false">
  <div slot="content" class="projector-preview">
    <source-preview :source-id="sourceId" />
  </div>
</modal-layout>
</template>

<script lang="ts" src="./Projector.vue.ts"></script>

<style lang="less" scoped>
.projector-preview {
  width: 100%;
  height: 100%;
}
</style>
