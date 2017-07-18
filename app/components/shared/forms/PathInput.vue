<template>
<div class="input-container">
  <div class="input-label">
    <label>{{ value.description }}</label>
  </div>
  <div class="input-wrapper">
    <div class="PathProperty-fieldGroup">
      <input
        type="text"
        ref="input"
        :value="value.value"
        class="PathProperty-path"
        @change="handleChange">
      <button
        @click="showFileDialog"
        class="PathProperty-browse button">
        Browse
      </button>
    </div>
  </div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import { IPathInputValue, TObsType, Input } from './Input';
import electron from '../../../vendor/electron';
import OpenDialogOptions = Electron.OpenDialogOptions;

@Component
class PathInput extends Input<IPathInputValue> {

  static obsType: TObsType[];

  @Prop()
  value: IPathInputValue;


  $refs: {
    input: HTMLInputElement
  };


  showFileDialog() {
    const options: OpenDialogOptions = {
      defaultPath: this.value.value,
      filters: this.value.filters,
      properties: []
    };

    if (this.value.type === 'OBS_PROPERTY_FILE') {
      options.properties.push('openFile');
    }

    if (this.value.type === 'OBS_PROPERTY_PATH') {
      options.properties.push('openDirectory');
    }

    const paths = electron.remote.dialog.showOpenDialog(options);
    const path = paths ? paths[0] : '';

    this.$refs.input.value = path;
    this.handleChange();
  }


  handleChange() {
    this.emitInput({ ...this.value, value: this.$refs.input.value });
  }

}

PathInput.obsType = ['OBS_PROPERTY_PATH', 'OBS_PROPERTY_FILE'];

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
