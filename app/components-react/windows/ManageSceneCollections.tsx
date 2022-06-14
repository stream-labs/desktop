import React, { useState } from 'react';
import Fuse from 'fuse.js';
import { Layout, Input } from 'antd';
import { ModalLayout } from 'components-react/shared/ModalLayout';
import { Services } from 'components-react/service-provider';
import { $t } from 'services/i18n';
import { promptAsync } from 'components-react/modals';
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
