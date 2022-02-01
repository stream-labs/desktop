import React, { useState } from 'react';
import Fuse from 'fuse.js';
import cx from 'classnames';
import { Dropdown, Tooltip, Tree } from 'antd';
import { Menu } from 'util/menus/Menu';
import { EDismissable } from 'services/dismissables';
import { $t } from 'services/i18n';
import { getOS } from 'util/operating-systems';
import * as remote from '@electron/remote';
import { Services } from 'components-react/service-provider';
import { useVuex } from 'components-react/hooks';
import { ERenderingMode } from '../../../../obs-api';
import { TextInput } from 'components-react/shared/inputs';
import Scrollable from 'components-react/shared/Scrollable';
import { useTree, IOnDropInfo } from 'components-react/hooks/useTree';
import HelpTip from 'components-react/shared/HelpTip';

export default function SceneSelector() {
  const {
    ScenesService,
    SceneCollectionsService,
    AppService,
    TransitionsService,
    SourceFiltersService,
    ProjectorService,
    EditorCommandsService,
  } = Services;

  const { treeSort } = useTree();

  const [searchQuery, setSearchQuery] = useState('');
  const { scenes, activeSceneId, collections, activeCollection } = useVuex(() => ({
    scenes: ScenesService.views.scenes.map(scene => ({
      title: scene.name,
      key: scene.id,
      selectable: true,
    })),
    activeSceneId: ScenesService.views.activeSceneId,
    activeCollection: SceneCollectionsService.activeCollection,
    collections: SceneCollectionsService.collections,
  }));

  function showContextMenu() {
    const menu = new Menu();
    menu.append({
      label: $t('Duplicate'),
      click: () => ScenesService.actions.showDuplicateScene(activeSceneId),
    });
    menu.append({
      label: $t('Rename'),
      click: () => ScenesService.actions.showNameScene({ rename: activeSceneId }),
    });
    menu.append({
      label: $t('Remove'),
      click: removeScene,
    });
    menu.append({
      label: $t('Filters'),
      click: () => SourceFiltersService.actions.showSourceFilters(activeSceneId),
    });
    menu.append({
      label: $t('Create Scene Projector'),
      click: () =>
        ProjectorService.actions.createProjector(ERenderingMode.OBS_MAIN_RENDERING, activeSceneId),
    });
    menu.popup();
  }

  function makeActive(selectedNodes: any) {
    ScenesService.actions.makeSceneActive(selectedNodes[0].data.id);
  }

  function handleSort(info: IOnDropInfo) {
    const newState = treeSort(info, scenes);
    ScenesService.actions.setSceneOrder(newState.map(node => node.key as string));
  }

  function addScene() {
    ScenesService.actions.showNameScene();
  }

  function removeScene() {
    const name = ScenesService.views.activeScene?.name;
    remote.dialog
      .showMessageBox(remote.getCurrentWindow(), {
        title: 'Streamlabs Desktop',
        type: 'warning',
        message: $t('Are you sure you want to remove %{sceneName}?', { sceneName: name }),
        buttons: [$t('Cancel'), $t('OK')],
      })
      .then(({ response }) => {
        if (!response) return;
        if (!ScenesService.canRemoveScene()) {
          remote.dialog.showMessageBox({
            title: 'Streamlabs Desktop',
            message: $t('There needs to be at least one scene.'),
          });
          return;
        }

        EditorCommandsService.actions.executeCommand('RemoveSceneCommand', activeSceneId);
      });
  }

  function showTransitions() {
    TransitionsService.actions.showSceneTransitions();
  }

  function manageCollections() {
    SceneCollectionsService.actions.showManageWindow();
  }

  function loadCollection(id: string) {
    if (SceneCollectionsService.getCollection(id)?.operatingSystem !== getOS()) return;

    SceneCollectionsService.actions.load(id);
  }

  function filteredCollections() {
    if (!searchQuery) return collections;
    const fuse = new Fuse(collections, { shouldSort: true, keys: ['name'] });
    return fuse.search(searchQuery);
  }

  const helpTipDismissable = EDismissable.SceneCollectionsHelpTip;

  const DropdownMenu = (
    <>
      <TextInput placeholder={$t('Search')} value={searchQuery} onChange={setSearchQuery} />
      <div className="link link--pointer" onClick={manageCollections}>
        {$t('Manage All')}
      </div>
      <div className="dropdown-menu__separator" />
      {filteredCollections().map(collection => (
        <div key={collection.id} onClick={() => loadCollection(collection.id)}>
          <i
            className={cx(
              'fab',
              collection.operatingSystem === 'win32' ? 'fa-windows' : 'fa-apple',
            )}
          />
          {collection.name}
        </div>
      ))}
    </>
  );

  return (
    <>
      <div style={{ display: 'flex' }}>
        <Dropdown overlay={DropdownMenu}>
          <span>{activeCollection?.name}</span>
        </Dropdown>
        <div style={{ display: 'flex' }}>
          <Tooltip title={$t('Add a new Scene.')} placement="bottom">
            <i className="icon-add icon-button icon-button--lg" onClick={addScene} />
          </Tooltip>
          <Tooltip title={$t('Remove Scene.')} placement="bottom">
            <i className="icon-subtract icon-button icon-button--lg" onClick={removeScene} />
          </Tooltip>
          <Tooltip title={$t('Edit Scene Transitions.')} placement="bottom">
            <i className="icon-settings icon-button icon-button--lg" onClick={showTransitions} />
          </Tooltip>
        </div>
      </div>
      <Scrollable style={{ height: '100%' }}>
        <Tree draggable treeData={scenes} onDrop={handleSort} onSelect={makeActive} />
      </Scrollable>
      <HelpTip
        title={$t('Scene Collections')}
        dismissableKey={EDismissable.SceneCollectionsHelpTip}
        position={{ top: '-8px', left: '102px' }}
      >
        <div>
          {$t(
            'This is where your Scene Collections live. Clicking the title will dropdown a menu where you can view & manage.',
          )}
        </div>
      </HelpTip>
    </>
  );
}
