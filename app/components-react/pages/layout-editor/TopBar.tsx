import React from 'react';
import cx from 'classnames';
import { Tooltip } from 'antd';
import { Services } from 'components-react/service-provider';
import { useVuex } from 'components-react/hooks';
import { ListInput } from 'components-react/shared/inputs';
import { ELayoutElement } from 'services/layout';
import { $t } from 'services/i18n';
import styles from './LayoutEditor.m.less';
import { useLayoutEditor } from './hooks';

export default function TopBar() {
  const { LayoutService, NavigationService } = Services;
  const { slottedElements, browserUrl, currentLayout, setShowModal } = useLayoutEditor();

  const { tabOptions, currentTab } = useVuex(() => ({
    tabOptions: Object.keys(LayoutService.state.tabs).map(tab => ({
      value: tab,
      label: LayoutService.state.tabs[tab].name,
    })),
    currentTab: LayoutService.state.currentTab,
  }));

  function removeCurrentTab() {
    if (currentTab === 'default') return;
    LayoutService.actions.removeCurrentTab();
  }

  async function save() {
    if (currentLayout !== LayoutService.views.currentTab.currentLayout) {
      await LayoutService.actions.return.changeLayout(currentLayout);
    }
    await LayoutService.actions.return.setSlots(slottedElements);
    if (browserUrl && slottedElements[ELayoutElement.Browser]) {
      await LayoutService.actions.return.setUrl(browserUrl);
    }
    NavigationService.actions.navigate('Studio');
  }

  return (
    <div className={styles.topBar}>
      <img className={styles.arrow} src={require('../../../../media/images/chalk-arrow.png')} />
      <button
        className="button button--action"
        style={{ margin: '0 16px' }}
        onClick={() => setShowModal(true)}
      >
        {$t('Add Tab')}
      </button>
      <ListInput
        label=""
        style={{ width: '150px', marginBottom: 0 }}
        value={currentTab}
        defaultValue="default"
        onChange={(tab: string) => LayoutService.actions.setCurrentTab(tab)}
        options={tabOptions}
        tooltip={{ title: $t('Current Tab'), placement: 'bottom' }}
      />
      {currentTab !== 'default' && (
        <Tooltip title={$t('Delete Current Tab')} placement="bottom">
          <button
            className={cx('button button--warn', styles.removeButton)}
            onClick={removeCurrentTab}
          >
            <i className="icon-trash" />
          </button>
        </Tooltip>
      )}
      <button className="button button--action" onClick={save}>
        {$t('Save Changes')}
      </button>
    </div>
  );
}
