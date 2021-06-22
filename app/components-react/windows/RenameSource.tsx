import React, { useEffect, useState, useRef } from 'react';
import Form, { useForm } from '../shared/inputs/Form';
import { TextInput } from 'components-react/shared/inputs';
import { Services } from '../service-provider';
import { ModalLayout } from '../shared/ModalLayout';
import { $t } from '../../services/i18n';

export default function RenameSource() {
  const { SourcesService, WindowsService, EditorCommandsService } = Services;

  const [name, setName] = useState('');

  const form = useForm();

  const options = useRef(WindowsService.getChildWindowQueryParams());

  useEffect(() => {
    const source = SourcesService.views.getSource(options.current.sourceId);
    if (!source) return;
    setName(source.name);
  }, []);

  async function submit(e: React.MouseEvent<HTMLElement, MouseEvent>) {
    e.preventDefault();
    try {
      await form.validateFields();
    } catch (err: unknown) {
      return;
    }
    EditorCommandsService.executeCommand('RenameSourceCommand', options.current.sourceId, name);
    WindowsService.closeChildWindow();
  }

  return (
    <ModalLayout onOk={submit}>
      <Form slot="content" form={form}>
        <TextInput
          label={$t('Please enter the name of the source')}
          value={name}
          onChange={setName}
          uncontrolled={false}
          required
        />
      </Form>
    </ModalLayout>
  );
}
