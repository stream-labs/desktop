import { Component, Prop } from 'vue-property-decorator';
import { IObsPathInputValue, TObsType, ObsInput } from './ObsInput';
import electron from 'electron';
import OpenDialogOptions = Electron.OpenDialogOptions;
import HFormGroup from 'components/shared/inputs/HFormGroup.vue';
import { TextInput } from 'components/shared/inputs/inputs';

@Component({ components: { HFormGroup, TextInput } })
class ObsPathInput extends ObsInput<IObsPathInputValue> {
  static obsType: TObsType[];

  @Prop() value: IObsPathInputValue;

  showFileDialog() {
    const options: OpenDialogOptions = {
      defaultPath: this.value.value,
      filters: this.value.filters,
      properties: [],
    };

    if (this.value.type === 'OBS_PROPERTY_FILE') {
      options.properties.push('openFile');
    }

    if (this.value.type === 'OBS_PROPERTY_PATH') {
      options.properties.push('openDirectory');
    }

    const paths = electron.remote.dialog.showOpenDialog(options);

    if (paths) {
      this.handleChange(paths[0]);
    }
  }

  handleChange(value: string) {
    this.emitInput({ ...this.value, value });
  }
}

ObsPathInput.obsType = ['OBS_PROPERTY_PATH', 'OBS_PROPERTY_FILE'];

export default ObsPathInput;
