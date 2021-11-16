import React from 'react';
import { Col } from 'antd';
import cx from 'classnames';
import { Services } from 'components-react/service-provider';
import { useSourceShowcaseSettings } from './useSourceShowcase';
import styles from './SourceShowcase.m.less';

export default function SourceTag(p: {
  name: string;
  type: string;
  appId?: string;
  appSourceId?: string;
}) {
  const {
    inspectSource,
    selectInspectedSource,
    inspectedSource,
    inspectedAppId,
    inspectedAppSourceId,
  } = useSourceShowcaseSettings();

  function active() {
    if (!p.appId) return inspectedSource === p.type;
    return p.appSourceId === inspectedAppSourceId && p.appId === inspectedAppId;
  }

  return (
    <Col span={8}>
      <div
        className={cx(styles.sourceTag, { [styles.active]: active() })}
        onClick={() => inspectSource(p.type, p.appId, p.appSourceId)}
        onDoubleClick={() => selectInspectedSource()}
      >
        {p.name}
      </div>
    </Col>
  );
}
