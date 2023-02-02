import React, { useEffect, useState } from 'react';
import { Layout, Tooltip } from 'antd';
import Fuse from 'fuse.js';
import moment from 'moment';
import cx from 'classnames';
import { ModalLayout } from 'components-react/shared/ModalLayout';
import { Services } from 'components-react/service-provider';
import { confirmAsync, promptAsync } from 'components-react/modals';
import Scrollable from 'components-react/shared/Scrollable';
import { $t } from 'services/i18n';
import { $i } from 'services/utils';
import { ISceneCollectionsManifestEntry } from 'services/scene-collections';
import { getOS, OS } from 'util/operating-systems';
import styles from './ManageSceneCollections.m.less';
import { TextInput } from 'components-react/shared/inputs';
import { useVuex } from 'components-react/hooks';

const { Sider, Content } = Layout;

export default function ManageSceneCollections() {
  const {
    WindowsService,
    SceneCollectionsService,
    ObsImporterService,
    NavigationService,
  } = Services;
  const [query, setQuery] = useState('');

  const { collections } = useVuex(() => ({ collections: SceneCollectionsService.collections }));

  function close() {
    SceneCollectionsService.stateService.flushManifestFile();
    WindowsService.actions.closeChildWindow();
  }

  async function create() {
    const name = await promptAsync(
      { title: $t('Enter a Scene Collection Name'), closable: true },
      SceneCollectionsService.suggestName('Scenes'),
    );
    SceneCollectionsService.actions.create({ name });
  }

  function importFromObs() {
    ObsImporterService.actions.import();
  }

  function filteredCollections() {
    const list = collections.sort((a, b) => (a.modified > b.modified ? -1 : 1));

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
          <div style={{ width: '96%', marginTop: '8px', marginBottom: '8px' }}>
            <TextInput
              placeholder={$t('Search Scene Collections')}
              onChange={setQuery}
              uncontrolled={false}
              prefix={<i className="icon-search" />}
              nowrap
            />
          </div>
          <Scrollable style={{ height: 'calc(100% - 48px)' }}>
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
              <img src={$i('images/prime-themes.png')} />
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
    if (p.collection.operatingSystem !== getOS()) return;
    SceneCollectionsService.actions.load(p.collection.id);
  }

  function duplicate() {
    setDuplicating(true);

    setTimeout(() => {
      SceneCollectionsService.actions.return
        .duplicate(p.collection.name, p.collection.id)
        .finally(() => setDuplicating(false));
    }, 500);
  }

  async function rename() {
    const newName = await promptAsync(
      { title: $t('Enter a Scene Collection Name'), closable: true },
      p.collection.name,
    );
    SceneCollectionsService.actions.rename(newName, p.collection.id);
  }

  async function remove() {
    const deleteConfirmed = await confirmAsync(
      $t('Are you sure you want to remove %{collectionName}?', {
        collectionName: p.collection.name,
      }),
    );
    if (deleteConfirmed) SceneCollectionsService.actions.delete(p.collection.id);
  }

  return (
    <div
      onDoubleClick={makeActive}
      className={cx(styles.collectionNode, { [styles.active]: isActive })}
    >
      <span>
        <i
          className={cx(
            'fab',
            p.collection.operatingSystem === OS.Windows ? 'fa-windows' : 'fa-apple',
          )}
        />
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
