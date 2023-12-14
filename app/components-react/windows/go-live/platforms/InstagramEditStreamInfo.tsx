import React from 'react';
import { Alert, Button } from 'antd';
import { clipboard } from 'electron';
import PlatformSettingsLayout, { IPlatformComponentParams } from './PlatformSettingsLayout';
import { TextInput, createBinding } from '../../../shared/inputs';
import Form from '../../../shared/inputs/Form';
import { CommonPlatformFields } from '../CommonPlatformFields';
import GameSelector from '../GameSelector';
import { $t } from 'services/i18n';
import InputWrapper from 'components-react/shared/inputs/InputWrapper';

export function InstagramEditStreamInfo(p: IPlatformComponentParams<'instagram'>) {
  const bind = createBinding(p.value, updatedSettings =>
    p.onChange({ ...p.value, ...updatedSettings }),
  );

  return (
    <Form name="instagram-settings">
      <TextInput
        {...bind.streamUrl}
        required
        label={$t('Instagram Stream URL')}
        addonAfter={<PasteButton onPaste={bind.streamUrl.onChange} />}
      />

      <TextInput
        {...bind.streamKey}
        required
        label={$t('Instagram Stream Key')}
        isPassword
        placeholder={$t('Please update your Stream Key')}
        addonAfter={<PasteButton onPaste={bind.streamKey.onChange} />}
      />
      <Alert
        message={$t(
          'Remember to open Instagram in browser and click "Go Live" to start streaming!',
        )}
        type="warning"
        showIcon
        closable
      />
    </Form>
  );
}

function PasteButton({ onPaste }: { onPaste: (text: string) => void }) {
  return (
    <Button title={$t('Paste')} onClick={() => onPaste(clipboard.readText())}>
      <i className="fa fa-paste" />
    </Button>
  );
}
