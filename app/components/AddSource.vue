<template>
<div>
  <title-bar
    class="AddSource-titleBar"
    window-title="Add Source" />
  <div class="AddSource-content">
    <h4 class="AddSource-heading">
      Standard
    </h4>
  </div>
</div>
</template>

<script>
import TitleBar from './TitleBar.vue';
import windowManager from '../util/WindowManager.js';

export default {

  components: {
    TitleBar
  },

  methods: {
    handleDone() {
      windowManager.showSettings();
    }
  }

};
</script>

<style lang="less" scoped>
.AddSource-titleBar {
  border-bottom: 1px solid #eee;
}

.AddSource-content {
  padding: 30px;
  background-color: #fcfcfc;
}

.AddSource-heading {
  text-transform: uppercase;
  font-size: 11px;
  letter-spacing: 1px;
  color: #777;
}
</style>
