import React, { useEffect, useState } from 'react';
import { Layout, Input, Tooltip } from 'antd';
import Fuse from 'fuse.js';
import moment from 'moment';
import cx from 'classnames';
import { ModalLayout } from 'components-react/shared/ModalLayout';
import { Services } from 'components-react/service-provider';
import { alertAsync, promptAsync } from 'components-react/modals';
import Scrollable from 'components-react/shared/Scrollable';
import { $t } from 'services/i18n';
import { ISceneCollectionsManifestEntry } from 'services/scene-collections';
import { byOS, getOS, OS } from 'util/operating-systems';
import styles from './ManageSceneCollections.m.less';

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
      { placeholder: '', content: $t('Enter a Scene Collection Name') },
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
    <ModalLayout onCancel={close}>
      <Layout style={{ height: '100%' }}>
        <Sider width={300}>
          <div>{$t('Your Scene Collections:')}</div>
          <Search placeholder={$t('Search Scene Collections')} onSearch={setQuery} allowClear />
          <Scrollable style={{ height: '100%' }}>
            {filteredCollections().map((collection, i) => (
              <CollectionNode collection={collection} recentlyUpdated={i < 2} key={collection.id} />
            ))}
          </Scrollable>
        </Sider>
        <Content style={{ paddingLeft: '24px' }}>
          <div>{$t('Add New Scene Collection:')}</div>
          <div className={styles.buttonContainer}>
            <button onClick={create} className={cx('button', styles.button)}>
              <i className="icon-stream-labels" />
              <strong>{$t('New')}</strong>
              <p>{$t('Start fresh and build from scratch')}</p>
            </button>
            <button onClick={importFromObs} className={cx('button', styles.button)}>
              <i className="icon-cloud-backup" />
              <strong>{$t('Import')}</strong>
              <p>{$t('Load existing scenes from OBS')}</p>
            </button>
            <button onClick={goToThemes} className={cx('button', styles.button, styles.lg)}>
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

function CollectionNode(p: {
  collection: ISceneCollectionsManifestEntry;
  recentlyUpdated: boolean;
}) {
  const { SceneCollectionsService } = Services;
  const [duplicating, setDuplicating] = useState(false);
  const modified = moment(p.collection.modified).fromNow();
  const isActive = p.collection.id === SceneCollectionsService.activeCollection?.id;

  useEffect(onNeedsRenamedChanged, [p.collection.needsRename]);

  function onNeedsRenamedChanged() {
    if (p.collection.needsRename) rename();
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

  function rename() {
    promptAsync(
      { placeholder: '', content: $t('Enter a Scene Collection Name'), onOk: submitRename },
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
    <div
      onDoubleClick={makeActive}
      className={cx(styles.collectionNode, { [styles.active]: isActive })}
    >
      <span>
        <i className={cx('fab', byOS({ [OS.Windows]: 'fa-windows', [OS.Mac]: 'fa-apple' }))} />
        {p.collection.name}
      </span>
      {p.recentlyUpdated && <span className={styles.whisper}>Updated {modified}</span>}
      <div className={styles.editIcons}>
        <Tooltip title={$t('Rename')}>
          <i className="icon-edit" onClick={rename} />
        </Tooltip>
        {!duplicating && (
          <Tooltip title={$t('Duplicate')}>
            <i className="icon-copy" onClick={duplicate} />
          </Tooltip>
        )}
        {duplicating && <i className="fa fa-spinner fa-pulse" />}
        <Tooltip title={$t('Delete')}>
          <i className="icon-trash" onClick={remove} />
        </Tooltip>
      </div>
    </div>
  );
}
