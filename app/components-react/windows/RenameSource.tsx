import React, { useState, useMemo } from 'react';
import Form, { useForm } from '../shared/inputs/Form';
import { TextInput } from 'components-react/shared/inputs';
import { Services } from '../service-provider';
import { ModalLayout } from '../shared/ModalLayout';
import { $t } from '../../services/i18n';

export default function RenameSource() {
  const { SourcesService, WindowsService, EditorCommandsService } = Services;

  const form = useForm();

  const options = useMemo(() => WindowsService.getChildWindowQueryParams(), []);

  const [name, setName] = useState(
    () => SourcesService.views.getSource(options.sourceId)?.name || '',
  );

  async function submit(e?: React.MouseEvent<HTMLElement, MouseEvent>) {
    if (e) e.preventDefault();
    try {
      await form.validateFields();
    } catch (err: unknown) {
      return;
    }
    EditorCommandsService.executeCommand('RenameSourceCommand', options.sourceId, name);
    WindowsService.closeChildWindow();
  }

  return (
    <ModalLayout onOk={submit} okText={$t('Done')}>
      <Form layout="vertical" form={form} name="renameSourceForm" onFinish={() => submit()}>
        <TextInput
          label={$t('Please enter the name of the source')}
          name="sourceName"
          data-role="input"
          data-type="text"
          value={name}
          onInput={setName}
          uncontrolled={false}
          required
          autoFocus
        />
      </Form>
    </ModalLayout>
  );
}
