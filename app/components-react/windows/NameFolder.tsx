import { ModalLayout } from '../shared/ModalLayout';
import { $t } from '../../services/i18n';
import React, { useState } from 'react';
import { Services } from '../service-provider';
import { useOnce } from '../hooks';
import { assertIsDefined } from '../../util/properties-type-guards';

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
  const [error, setError] = useState('');

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
  function submit(e: any) {
    e.preventDefault();
    if (!name) {
      setError($t('The source name is required'));
      return;
    } else if (options.renameId) {
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
      <form onSubmit={submit}>
        {!error && (
          <p style={{ marginBottom: '10px' }}>{$t('Please enter the name of the folder')}</p>
        )}

        {error && <p style={{ marginBottom: '10px', color: 'red' }}>{error}</p>}
        <input type="text" value={name} onInput={ev => setName(ev.target['value'])} />
      </form>
    </ModalLayout>
  );
}
