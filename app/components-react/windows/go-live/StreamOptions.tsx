import React from 'react';
import styles from './StreamOptions.m.less';
import { Services } from 'components-react/service-provider';
import { $t } from 'services/i18n';
import { Row } from 'antd';
import { SwitchInput } from 'components-react/shared/inputs';
import { useVuex } from 'components-react/hooks';

/**
 * Renders options for the stream
 * - Vertical Recording Settings
 **/
export default function StreamOptions() {
  const { DualOutputService } = Services;

  const v = useVuex(() => ({
    recordVertical: DualOutputService.views.recordVertical,
    setRecordVertical: DualOutputService.actions.setRecordVertical,
  }));

  return (
    <Row gutter={16} className={styles.settingsRow}>
      <div className={styles.switcherLabel}>{$t('Vertical Recording Only')}</div>
      <SwitchInput
        value={v.recordVertical}
        name={'record-vertical'}
        onChange={v.setRecordVertical}
        uncontrolled
        className={styles.recordingSwitcher}
        checkedChildren={<i className="icon-check-mark" />}
      />
    </Row>
  );
}
