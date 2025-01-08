import React from 'react';
import { $t } from 'services/i18n';
import Form from '../../../shared/inputs/Form';
import { createBinding } from '../../../shared/inputs';
import { IPlatformComponentParams } from './PlatformSettingsLayout';
import { clipboard } from 'electron';
import { TextInput } from 'components-react/shared/inputs';
import { Alert, Button } from 'antd';

/**
 * Note: The implementation for this component is a light refactor of the InstagramEditStreamInfo component.
 */

type Props = IPlatformComponentParams<'kick'> & {
  isStreamSettingsWindow?: boolean;
};

export function KickEditStreamInfo(p: Props) {
  const bind = createBinding(p.value, updatedSettings =>
    p.onChange({ ...p.value, ...updatedSettings }),
  );

  const { isStreamSettingsWindow } = p;
  const streamKeyLabel = $t(isStreamSettingsWindow ? 'Stream Key' : 'Kick Stream Key');
  const streamUrlLabel = $t(isStreamSettingsWindow ? 'Stream URL' : 'Kick Stream URL');

  return (
    <Form name="kick-settings">
      <TextInput
        {...bind.streamUrl}
        required
        label={streamUrlLabel}
        addonAfter={<PasteButton onPaste={bind.streamUrl.onChange} />}
      />

      <TextInput
        {...bind.streamKey}
        required
        label={streamKeyLabel}
        isPassword
        placeholder={$t('Remember to update your Stream Key')}
        addonAfter={<PasteButton onPaste={bind.streamKey.onChange} />}
      />
      {!isStreamSettingsWindow && (
        <Alert
          style={{ marginBottom: 8 }}
          message={$t(
            'Remember to open Kick in browser and enter your Stream URL and Key to start streaming!',
          )}
          type="warning"
          showIcon
          closable
        />
      )}
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
