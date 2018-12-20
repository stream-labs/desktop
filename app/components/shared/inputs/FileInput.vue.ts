import { BaseInput } from './BaseInput';
import { Component, Prop } from 'vue-property-decorator';
import { IFileMetadata } from './index';
import electron from 'electron';

@Component({})
export default class FileInput extends BaseInput<string, IFileMetadata> {
  @Prop() readonly value: string;
  @Prop() readonly metadata: IFileMetadata;

  showFileDialog() {
    const options: Electron.OpenDialogOptions = {
      defaultPath: this.value,
      filters: this.metadata.filters,
      properties: [],
    };

    if (this.metadata.directory) {
      options.properties.push('openDirectory');
    } else {
      options.properties.push('openFile');
    }

    const paths = electron.remote.dialog.showOpenDialog(options);

    if (paths) {
      this.emitInput(paths[0]);
    }
  }
}
