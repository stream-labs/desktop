import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import { IPathInputValue, TObsType, Input } from './Input';
import electron from 'electron';
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

    if (paths) {
      this.$refs.input.value = paths[0];
      this.handleChange();
    }
  }


  handleChange() {
    this.emitInput({ ...this.value, value: this.$refs.input.value });
  }

}

PathInput.obsType = ['OBS_PROPERTY_PATH', 'OBS_PROPERTY_FILE'];

export default PathInput;
