<template>
<div class="input">
  <label>{{ value.description }}</label>
  <div class="PathProperty-fieldGroup">
    <input
      type="text"
      ref="input"
      :value="value.currentValue"
      class="PathProperty-path">
    <button
      @click="showFileDialog"
      class="PathProperty-browse button">
      Browse
    </button>
  </div>
</div>
</template>

<script>
import Input from './Input.vue';
const { remote } = window.require('electron');

let PathInput = Input.extend({

  methods: {
    showFileDialog() {
      let path = remote.dialog.showOpenDialog({
        defaultPath: this.value.currentValue,
        properties: ['openDirectory']
      })[0];

      this.$refs.input.value = path;
      this.$emit('input', Object.assign(this.value, {currentValue: path}))
    }
  }

});
PathInput.obsType = 'OBS_PROPERTY_PATH';
export default PathInput;
</script>

<style lang="less" scoped>
.PathProperty-fieldGroup {
  display: flex;
  flex-direction: row;
}

.PathProperty-path {
  flex-grow: 1;
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}

.PathProperty-browse {
  flex-shrink: 0;
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
  margin-left: -1px;
  background-color: #525e65;
}
</style>
