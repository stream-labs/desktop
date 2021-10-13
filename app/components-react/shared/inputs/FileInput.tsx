import React from 'react';
import { remote } from 'electron';
import { Input, Button } from 'antd';
import { InputProps } from 'antd/lib/input';
import { InputComponent, useInput, TSlobsInputProps } from './inputs';
import InputWrapper from './InputWrapper';
import { $t } from '../../../services/i18n';

type TFileInputProps = TSlobsInputProps<
  { directory?: boolean; filters?: Electron.FileFilter[]; save?: boolean },
  string,
  InputProps
>;

export const FileInput = InputComponent((p: TFileInputProps) => {
  async function showFileDialog() {
    if (p.save) {
      const options: Electron.SaveDialogOptions = {
        defaultPath: p.value,
        filters: p.filters,
        properties: [],
      };

      const { filePath } = await remote.dialog.showSaveDialog(options);

      if (filePath && p.onChange) {
        p.onChange(filePath);
      }
    } else {
      const options: Electron.OpenDialogOptions = {
        defaultPath: p.value,
        filters: p.filters,
        properties: [],
      };

      if (p.directory && options.properties) {
        options.properties.push('openDirectory');
      } else if (options.properties) {
        options.properties.push('openFile');
      }

      const { filePaths } = await remote.dialog.showOpenDialog(options);

      if (filePaths[0] && p.onChange) {
        p.onChange(filePaths[0]);
      }
    }
  }

  return (
    <InputWrapper label={p.label}>
      <Input
        disabled
        value={p.value}
        addonAfter={<Button onClick={showFileDialog}>{$t('Browse')}</Button>}
      />
    </InputWrapper>
  );
});
