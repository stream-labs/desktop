import React from 'react';
import { remote } from 'electron';
import { Input, Button } from 'antd';
import { InputProps } from 'antd/lib/input';
import { InputComponent, useInput, TSlobsInputProps } from './inputs';
import InputWrapper from './InputWrapper';
import { $t } from '../../../services/i18n';

type TFileInputProps = TSlobsInputProps<
  { directory?: boolean; filters?: Electron.FileFilter[] },
  string,
  InputProps
>;

export const FileInput = InputComponent((p: TFileInputProps) => {
  async function showFileDialog() {
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

  return (
    <InputWrapper>
      <Input
        disabled
        value={p.value}
        style={{ marginRight: '16px' }}
        addonAfter={
          <Button onClick={showFileDialog} style={{ margin: '0 -11px' }}>
            {$t('Browse')}
          </Button>
        }
      />
    </InputWrapper>
  );
});
