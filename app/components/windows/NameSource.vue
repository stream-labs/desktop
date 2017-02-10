<template>
<div class="NameSource">
  <title-bar
    class="NameSource-titleBar"
    window-title="Name Source"/>
  <form
    class="NameSource-content"
    id="nameForm"
    @submit.prevent="submit">
    <p
      class="NameSource-label">
      Please enter the name of the source
    </p>
    <input
      autofocus
      type="text"
      v-model="name"/>
  </form>
  <div class="NameSource-controls">
    <button
      class="button button--default"
      @click="cancel">
      Cancel
    </button>
    <button
      class="button button--action NameSource-button"
      type="submit"
      form="nameForm">
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
        type: 'createSourceAndAddToScene',
        sceneName: this.$store.getters.activeSceneName,
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
