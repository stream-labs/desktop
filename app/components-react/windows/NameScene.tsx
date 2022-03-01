import { Services } from 'components-react/service-provider';
import { TextInput } from 'components-react/shared/inputs';
import Form, { useForm } from 'components-react/shared/inputs/Form';
import { ModalLayout } from 'components-react/shared/ModalLayout';
import React, { useMemo, useState } from 'react';
import { ISceneCreateOptions } from 'services/editor-commands/commands/create-scene';
import { $t } from 'services/i18n';
import { assertIsDefined } from 'util/properties-type-guards';

export default function NameScene() {
  const { WindowsService, ScenesService, SourcesService, EditorCommandsService } = Services;
  const form = useForm();
  const options: {
    sceneToDuplicate?: string; // id of scene
    rename?: string; // id of scene
    itemsToGroup?: string[];
  } = useMemo(() => WindowsService.getChildWindowQueryParams(), []);
  const [name, setName] = useState(() => {
    if (options.rename) {
      return ScenesService.views.getScene(options.rename)?.name ?? '';
    }
    if (options.sceneToDuplicate) {
      return SourcesService.views.suggestName(
        ScenesService.views.getScene(options.sceneToDuplicate)?.name ?? '',
      );
    }
    if (options.itemsToGroup) {
      return SourcesService.views.suggestName(ScenesService.views.activeScene?.name ?? '');
    }

    return SourcesService.views.suggestName($t('New Scene'));
  });

  async function submit() {
    try {
      await form.validateFields();
    } catch (e: unknown) {
      return;
    }

    if (options.rename) {
      EditorCommandsService.actions.executeCommand('RenameSceneCommand', options.rename, name);
      WindowsService.actions.closeChildWindow();
    } else {
      const createOptions: ISceneCreateOptions = {};

      if (options.sceneToDuplicate) {
        createOptions.duplicateItemsFromScene = options.sceneToDuplicate;
      }

      if (options.itemsToGroup) {
        createOptions.groupFromOrigin = {
          originSceneId: ScenesService.views.activeSceneId,
          originItemIds: options.itemsToGroup,
        };
      }

      const newSceneId = await EditorCommandsService.executeCommand(
        'CreateSceneCommand',
        name,
        createOptions,
      );
      const newScene = ScenesService.views.getScene(newSceneId);
      assertIsDefined(newScene);
      newScene.makeActive();

      WindowsService.actions.closeChildWindow();
    }
  }

  return (
    <ModalLayout onOk={submit} okText={$t('Done')}>
      <Form layout="vertical" form={form} name="nameSceneForm" onFinish={() => submit()}>
        <TextInput
          label={$t('Please enter the name of the scene')}
          name="sceneName"
          value={name}
          onInput={v => setName(v)}
          required={true}
          uncontrolled={false}
          autoFocus
        />
      </Form>
    </ModalLayout>
  );
}
