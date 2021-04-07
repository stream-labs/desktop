import { BaseInput } from './BaseInput';
import { Component, Prop } from 'vue-property-decorator';
import { IFileMetadata } from './index';
import electron from 'electron';

@Component({})
export default class FileInput extends BaseInput<string, IFileMetadata> {
  @Prop() readonly value: string;
  @Prop() readonly metadata: IFileMetadata;
  @Prop() readonly title: string;

  async showFileDialog() {
    if (this.metadata.save) {
      const options: Electron.SaveDialogOptions = {
        defaultPath: this.value,
        filters: this.metadata.filters,
        properties: [],
      };

      const { filePath } = await electron.remote.dialog.showSaveDialog(options);

      if (filePath) this.emitInput(filePath);
    } else {
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

      const { filePaths } = await electron.remote.dialog.showOpenDialog(options);

      if (filePaths[0]) {
        this.emitInput(filePaths[0]);
      }
    }
  }
}
