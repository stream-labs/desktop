import React, { useEffect, useState } from 'react';
import { Layout, Input } from 'antd';
import Fuse from 'fuse.js';
import moment from 'moment';
import cx from 'classnames';
import { ModalLayout } from 'components-react/shared/ModalLayout';
import { Services } from 'components-react/service-provider';
import { alertAsync, promptAsync } from 'components-react/modals';
import { $t } from 'services/i18n';
import { ISceneCollectionsManifestEntry } from 'services/scene-collections';
import { byOS, getOS, OS } from 'util/operating-systems';

const { Sider, Content } = Layout;
const { Search } = Input;

export default function ManageSceneCollections() {
  const {
    WindowsService,
    SceneCollectionsService,
    ObsImporterService,
    NavigationService,
  } = Services;
  const [query, setQuery] = useState('');

  function close() {
    SceneCollectionsService.stateService.flushManifestFile();
    WindowsService.actions.closeChildWindow();
  }

  async function create() {
    const name = await promptAsync(
      { placeholder: $t('Enter a Scene Collection Name') },
      SceneCollectionsService.suggestName('Scenes'),
    );
    SceneCollectionsService.actions.create({ name });
  }

  function importFromObs() {
    ObsImporterService.actions.import();
  }

  function filteredCollections() {
    const list = SceneCollectionsService.collections.sort((a, b) =>
      a.modified > b.modified ? 1 : -1,
    );

    if (query) {
      const fuse = new Fuse(list, { shouldSort: true, keys: ['name'] });
      return fuse.search(query);
    }

    return list;
  }

  function goToThemes() {
    NavigationService.actions.navigate('BrowseOverlays');
    WindowsService.actions.closeChildWindow();
  }

  return (
    <ModalLayout>
      <Layout>
        <Sider>
          <div>{$t('Your Scene Collections:')}</div>
          <Search placeholder={$t('Search Scene Collections')} onSearch={setQuery} allowClear />
          {filteredCollections().map(collection => (
            <CollectionNode collection={collection} />
          ))}
        </Sider>
        <Content>
          <div>{$t('Add New Scene Collection')}</div>
          <div>
            <button onClick={create}>
              <i className="icon-paper" />
              <strong>{$t('New')}</strong>
              <p>{$t('Start fresh and build from scratch')}</p>
            </button>
            <button onClick={importFromObs}>
              <i className="icon-upload" />
              <strong>{$t('Import')}</strong>
              <p>{$t('Load existing scenes from OBS')}</p>
            </button>
            <button onClick={goToThemes}>
              <div>
                <strong>{$t('Template')}</strong>
                <p>{$t('Choose a template from our theme library')}</p>
              </div>
              <img />
            </button>
          </div>
        </Content>
      </Layout>
    </ModalLayout>
  );
}

function CollectionNode(p: { collection: ISceneCollectionsManifestEntry }) {
  const { SceneCollectionsService } = Services;
  const [duplicating, setDuplicating] = useState(false);
  const modified = moment(p.collection.modified).fromNow();
  const isActive = p.collection.id === SceneCollectionsService.activeCollection?.id;

  useEffect(onNeedsRenamedChanged, [p.collection.needsRename]);

  function onNeedsRenamedChanged() {
    if (p.collection.needsRename) startRenaming();
  }

  function makeActive() {
    if (SceneCollectionsService.getCollection(p.collection.id)?.operatingSystem !== getOS()) {
      return;
    }

    SceneCollectionsService.actions.load(p.collection.id);
  }

  function duplicate() {
    setDuplicating(true);

    setTimeout(() => {
      SceneCollectionsService.actions.return
        .duplicate(p.collection.name, p.collection.id)
        .then(() => setDuplicating(false))
        .catch(() => setDuplicating(false));
    }, 500);
  }

  async function startRenaming() {
    return await promptAsync(
      { placeholder: $t('Enter a Scene Collection Name'), onOk: submitRename },
      p.collection.name,
    );
  }

  function submitRename(editableName: string) {
    SceneCollectionsService.actions.rename(editableName, p.collection.id);
  }

  function remove() {
    alertAsync({
      content: $t(
        $t('Are you sure you want to remove %{collectionName}?', {
          collectionName: p.collection.name,
        }),
      ),
      onOk: () => SceneCollectionsService.actions.delete(p.collection.id),
    });
  }

  return (
    <div onDoubleClick={makeActive}>
      <span className="editable-scene-collection--name">
        <i className={cx('fab', byOS({ [OS.Windows]: 'fa-windows', [OS.Mac]: 'fa-apple' }))} />
        {p.collection.name}
      </span>
      {isActive && <span className="editable-scene-collection--active">Active</span>}
      <span className="editable-scene-collection--modified flex--grow">Updated {modified}</span>
      <a className="editable-scene-collection--action">
        <span onClick={startRenaming}>{$t('Rename')}</span>
      </a>
      {!duplicating && (
        <a className="editable-scene-collection--action">
          <span onClick={duplicate}>{$t('Duplicate')}</span>
        </a>
      )}
      {duplicating && <i className="fa fa-spinner fa-pulse" />}
      <a className="editable-scene-collection--action editable-scene-collection--action-delete">
        <span onClick={remove}>{$t('Delete')}</span>
      </a>
    </div>
  );
}
