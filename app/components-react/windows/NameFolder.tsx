import { ModalLayout } from '../shared/ModalLayout';
import { $t } from '../../services/i18n';
import React, { useState } from 'react';
import { Services } from '../service-provider';
import { useOnce } from '../hooks';
import { assertIsDefined } from '../../util/properties-type-guards';
import { TextInput } from '../shared/inputs/TextInput';
import { Form, Button } from 'antd';
import ContextForm from '../shared/inputs/ContextForm';

interface IWindowOptions {
  renameId?: string;
  itemsToGroup?: string[];
  parentId?: string;
  sceneId: string;
}

/**
 * Modal for creating or re-naming a folder
 */
export default function NameFolder() {
  // inject services
  const { ScenesService, EditorCommandsService, WindowsService } = Services;

  // define stateful variables and setters
  const [name, setName] = useState('');

  // define a form
  const [form] = Form.useForm();

  // get window options on component create
  const options = useOnce(() => {
    const options = (WindowsService.state.child.queryParams as unknown) as IWindowOptions;
    const scene = ScenesService.views.getScene(options.sceneId);
    assertIsDefined(scene);
    const name = options.renameId
      ? scene.getFolder(options.renameId)!.name
      : ScenesService.suggestName('New Folder');
    setName(name);
    return options;
  });

  // define a submit method
  async function submit(e: Event) {
    try {
      await form.validateFields();
    } catch (e) {
      return;
    }

    if (options.renameId) {
      EditorCommandsService.executeCommand(
        'RenameFolderCommand',
        options.sceneId,
        options.renameId,
        name,
      );
      WindowsService.actions.closeChildWindow();
    } else {
      const scene = ScenesService.views.getScene(options.sceneId);
      assertIsDefined(scene);

      EditorCommandsService.executeCommand(
        'CreateFolderCommand',
        options.sceneId,
        name,
        options?.itemsToGroup && options.itemsToGroup.length > 0
          ? scene.getSelection(options.itemsToGroup)
          : void 0,
      );
      WindowsService.actions.closeChildWindow();
    }
  }

  return (
    <ModalLayout onSubmit={submit}>
      <ContextForm layout="vertical" form={form}>
        <TextInput
          name="name"
          value={name}
          label={$t('Please enter the name of the folder')}
          required={true}
        />
        <Button type="primary">Submit</Button>
      </ContextForm>
    </ModalLayout>
  );
}
