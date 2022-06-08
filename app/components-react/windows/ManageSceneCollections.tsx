import React, { useState } from 'react';
import Fuse from 'fuse.js';
import { ModalLayout } from 'components-react/shared/ModalLayout';
import { Services } from 'components-react/service-provider';

export default function ManageSceneCollections() {
  const { WindowsService, SceneCollectionsService, ObsImporterService } = Services;
  const [query, setQuery] = useState('');

  function close() {
    SceneCollectionsService.stateService.flushManifestFile();
    WindowsService.actions.closeChildWindow();
  }

  function create() {
    SceneCollectionsService.actions.create({ needsRename: true });
  }

  function importFromObs() {
    ObsImporterService.actions.import();
  }

  function fitleredCollections() {
    const list = SceneCollectionsService.collections;

    if (query) {
      const fuse = new Fuse(list, { shouldSort: true, keys: ['name'] });
      return fuse.search(query);
    }

    return list;
  }

  return (
    <ModalLayout>
      <div></div>
    </ModalLayout>
  );
}
