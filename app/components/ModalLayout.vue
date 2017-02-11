<template>
<div class="ModalLayout">
  <title-bar :window-title="title" class="ModalLayout-titleBar"/>
  <div class="ModalLayout-content">
    <slot name="content"/>
  </div>
  <div class="ModalLayout-controls">
    <slot name="controls"/>
  </div>
</div>
</template>

<script>
import TitleBar from './TitleBar.vue';

export default {

  components: {
    TitleBar
  },

  props: ['title']

};
</script>

<style lang="less" scoped>
.ModalLayout {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.ModalLayout-titleBar {
  border-bottom: 1px solid #eee;
}

.ModalLayout-content {
  padding: 30px;
  flex-grow: 1;
}

.ModalLayout-controls {
  background-color: #fcfcfc;
  border-top: 1px solid #ededed;
}
</style>
