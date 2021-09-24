import { Component, Prop } from 'vue-property-decorator';
import { IObsPathInputValue, TObsType, ObsInput } from './ObsInput';
// eslint-disable-next-line
import OpenDialogOptions = Electron.OpenDialogOptions;
import HFormGroup from 'components/shared/inputs/HFormGroup.vue';
import { TextInput } from 'components/shared/inputs/inputs';
import remote from '@electron/remote';

@Component({ components: { HFormGroup, TextInput } })
class ObsPathInput extends ObsInput<IObsPathInputValue> {
  static obsType: TObsType[];

  @Prop() value: IObsPathInputValue;

  async showFileDialog() {
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

    const { filePaths } = await remote.dialog.showOpenDialog(options);

    if (filePaths[0]) {
      this.handleChange(filePaths[0]);
    }
  }

  handleChange(value: string) {
    this.emitInput({ ...this.value, value });
  }
}

ObsPathInput.obsType = ['OBS_PROPERTY_PATH', 'OBS_PROPERTY_FILE'];

export default ObsPathInput;
