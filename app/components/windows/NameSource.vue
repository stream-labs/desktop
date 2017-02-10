<template>
<div class="NameSource">
  <title-bar
    class="NameSource-titleBar"
    window-title="Name Source"/>
  <div class="NameSource-content">
    <p
      class="NameSource-label">
      Please enter the name of the source
    </p>
    <input
      type="text"
      v-model="name"/>
  </div>
  <div class="NameSource-controls">
    <button
      class="button button--default"
      @click="cancel">
      Cancel
    </button>
    <button
      class="button button--action NameSource-button"
      @click="submit">
      Submit
    </button>
  </div>
</div>
</template>

<script>
import TitleBar from '../TitleBar.vue';
import windowManager from '../../util/WindowManager.js';

export default {

  components: {
    TitleBar
  },

  methods: {
    cancel() {
      windowManager.closeWindow();
    },

    submit() {
      this.$store.dispatch({
        type: 'addSourceToScene',
        sourceType: window.startupOptions.sourceType,
        sourceName: this.name,
        settings: {},
        hotkeyData: {}
      });

      windowManager.closeWindow();
    }
  },

  data() {
    return {
      name: window.startupOptions.sourceType
    };
  }

};
</script>

<style lang="less" scoped>
.NameSource-titleBar {
  border-bottom: 1px solid #eee;
}

.NameSource-content {
  padding: 15px 30px;
  flex-grow: 1;
}

.NameSource-controls {
  padding: 15px 30px;
  background-color: #fcfcfc;
  border-top: 1px solid #ededed;
  text-align: right;
}

.NameSource-button {
  margin-left: 15px;
}

.NameSource-label {
  margin-bottom: 10px;
}

.NameSource {
  display: flex;
  flex-direction: column;
  height: 100%;
}
</style>
