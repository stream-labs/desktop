import React from 'react';
import { remote } from 'electron';
import { Button, Input } from 'antd';
import { InputComponent, useInput } from './inputs';
import { TTextInputProps } from './TextInput';
import InputWrapper from './InputWrapper';
import { $t } from '../../../services/i18n';

export const FileInput = InputComponent((p: TTextInputProps) => {
  const { inputAttrs, wrapperAttrs } = useInput('text', p);

  async function showFileDialog() {
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

    const { filePaths } = await remote.dialog.showOpenDialog(options);

    if (filePaths[0]) {
      inputAttrs.onChange(filePaths[0]);
    }
  }

  return (
    <InputWrapper {...wrapperAttrs}>
      <Input disabled value={inputAttrs.value} />
      <Button onClick={showFileDialog}>{$t('Browse')}</Button>
    </InputWrapper>
  );
});
